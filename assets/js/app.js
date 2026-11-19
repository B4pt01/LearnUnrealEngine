/* UE5 Academy — construit l'interface autour de <article class="doc"> :
   barre supérieure, menu des chapitres, sommaire, blocs de code, onglets,
   graphes Blueprint, schémas Mermaid, quiz et suivi de progression. */
(function () {
  "use strict";

  const NAV = window.UE5_NAV || [];
  const root = document.documentElement;
  const body = document.body;
  const ROOT = body.dataset.root || "";
  const PAGE = body.dataset.page || "";
  const KEY_PROGRESS = "ue5academy:progress";
  const KEY_THEME = "ue5academy:theme";
  const KEY_TAB = "ue5academy:tab";

  const ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ue5lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5aa9ff"/><stop offset="1" stop-color="#b195ff"/></linearGradient></defs><path d="M6.5 4.5v8.2a5.5 5.5 0 0 0 11 0V4.5" stroke="url(#ue5lg)" stroke-width="2.6" stroke-linecap="round"/><path d="M12 4.5v9" stroke="url(#ue5lg)" stroke-width="2.6" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    checkSmall: '<svg class="nav-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    level: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20v-5M12 20V9M19 20V4"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7M5 10v10h14V10"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
  };

  const flat = [];
  NAV.forEach(g => g.items.forEach(it => flat.push(Object.assign({ group: g.group }, it))));
  flat.forEach((it, i) => { it.num = i; it.href = ROOT + it.file; });
  const chapters = flat.filter(it => it.id !== "accueil");
  const current = flat.find(it => it.id === PAGE) || null;
  const curIndex = current ? flat.indexOf(current) : -1;

  const pad2 = n => String(n).padStart(2, "0");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "section";

  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  }

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(KEY_PROGRESS)) || {}; } catch (e) { return {}; }
  }
  function setDone(id, done) {
    const p = getProgress();
    if (done) p[id] = Date.now(); else delete p[id];
    try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(p)); } catch (e) { /* stockage indisponible */ }
    refreshProgress();
  }

  const article = document.querySelector("article.doc");
  if (!article) { body.classList.add("ready"); return; }

  /* ---------- Thème ---------- */
  function currentTheme() { return root.dataset.theme === "light" ? "light" : "dark"; }
  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY_THEME, t); } catch (e) { /* ignore */ }
    const btn = document.querySelector(".theme-btn");
    if (btn) {
      btn.innerHTML = t === "dark" ? ICONS.sun : ICONS.moon;
      btn.title = t === "dark" ? "Passer au thème clair" : "Passer au thème sombre";
    }
  }

  /* ---------- Structure ---------- */
  let topbar, sidebar, main, toc, readingBar, toTop;

  function buildLayout() {
    readingBar = h("div", "reading-bar");
    topbar = h("header", "topbar");
    topbar.innerHTML =
      '<button class="icon-btn menu-btn" type="button" aria-label="Ouvrir le menu">' + ICONS.menu + "</button>" +
      '<a class="brand" href="' + ROOT + 'index.html"><span class="brand-logo">' + ICONS.logo + '</span><span class="brand-text">UE5 <b>Academy</b></span></a>' +
      '<div class="search">' + ICONS.search +
      '<input type="search" placeholder="Rechercher une notion (ex : replication, cast, timer)…" aria-label="Rechercher" autocomplete="off">' +
      '<span class="kbd-hint"><kbd>Ctrl</kbd> <kbd>K</kbd></span><div class="search-results" role="listbox"></div></div>' +
      '<div class="topbar-right">' +
      '<div class="progress-chip" title="Chapitres terminés"><svg class="progress-ring" viewBox="0 0 20 20"><circle class="bg" cx="10" cy="10" r="8"/><circle class="fg" cx="10" cy="10" r="8" transform="rotate(-90 10 10)"/></svg>' +
      '<span><b class="pc-count">0</b>/<span class="pc-total">0</span> <span class="pc-label">chapitres</span></span></div>' +
      '<button class="icon-btn theme-btn" type="button" aria-label="Changer de thème"></button></div>';

    const layout = h("div", "layout");
    sidebar = h("aside", "sidebar");
    sidebar.setAttribute("aria-label", "Chapitres");
    main = h("main", "main");
    toc = h("aside", "toc");
    toc.setAttribute("aria-label", "Sur cette page");

    article.parentNode.insertBefore(layout, article);
    main.appendChild(article);
    layout.append(sidebar, main, toc);
    body.insertBefore(topbar, layout);
    body.insertBefore(readingBar, topbar);

    const backdrop = h("div", "sidebar-backdrop");
    toTop = h("button", "to-top", ICONS.up);
    toTop.type = "button";
    toTop.setAttribute("aria-label", "Revenir en haut");
    body.append(backdrop, toTop);

    topbar.querySelector(".menu-btn").addEventListener("click", () => body.classList.toggle("nav-open"));
    backdrop.addEventListener("click", () => body.classList.remove("nav-open"));
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    topbar.querySelector(".theme-btn").addEventListener("click", () => {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
      renderMermaid();
    });
  }

  function buildSidebar() {
    let html = "";
    NAV.forEach(g => {
      html += '<div class="nav-group"><p class="nav-group-title">' + esc(g.group) + "</p>";
      g.items.forEach(it => {
        const f = flat.find(x => x.id === it.id);
        html += '<a class="nav-item' + (it.id === PAGE ? " active" : "") + '" data-id="' + it.id + '" href="' + f.href + '">' +
          '<span class="nav-num">' + (f.num === 0 ? ICONS.home : pad2(f.num)) + '</span><span class="nav-title">' + esc(it.title) + "</span>" +
          ICONS.checkSmall + "</a>";
      });
      html += "</div>";
    });
    html += '<div class="sidebar-footer">Votre progression est enregistrée dans ce navigateur.<br><button type="button" class="reset-progress">Réinitialiser la progression</button></div>';
    sidebar.innerHTML = html;
    sidebar.querySelector(".reset-progress").addEventListener("click", () => {
      if (confirm("Réinitialiser la progression de tous les chapitres ?")) {
        try { localStorage.removeItem(KEY_PROGRESS); } catch (e) { /* ignore */ }
        refreshProgress();
        const btn = document.querySelector(".complete-btn");
        if (btn) btn.dispatchEvent(new Event("refresh"));
      }
    });
    sidebar.querySelectorAll(".nav-item").forEach(a => a.addEventListener("click", () => body.classList.remove("nav-open")));
    const active = sidebar.querySelector(".nav-item.active");
    if (active) requestAnimationFrame(() => { sidebar.scrollTop = active.offsetTop - sidebar.clientHeight / 2; });
  }

  function decorateHeader() {
    if (!current || current.id === "accueil") return;
    const h1 = article.querySelector("h1");
    if (!h1) return;
    h1.before(h("div", "kicker", "Chapitre " + pad2(current.num) + " · " + esc(current.group)));
    const meta = h("div", "chapter-meta",
      '<span class="meta-pill">' + ICONS.clock + esc(current.time) + " de lecture</span>" +
      '<span class="meta-pill">' + ICONS.level + esc(current.level) + "</span>");
    const lead = article.querySelector(".lead");
    (lead || h1).after(meta);
    document.title = current.title + " — UE5 Academy";
  }

  /* ---------- Blocs de code ---------- */
  const LANG_LABEL = { cpp: "C++", csharp: "C#", ini: "INI", json: "JSON", console: "Console", bash: "Shell", text: "Texte" };

  function dedent(s) {
    const lines = s.replace(/\t/g, "    ").replace(/\r/g, "").split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const indents = lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length);
    const ind = indents.length ? Math.min.apply(null, indents) : 0;
    return lines.map(l => l.slice(ind)).join("\n");
  }

  function parseRanges(str) {
    const set = new Set();
    (str || "").split(",").forEach(part => {
      const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return;
      const a = +m[1], b = m[2] ? +m[2] : a;
      for (let i = a; i <= b; i++) set.add(i);
    });
    return set;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  function buildCode() {
    document.querySelectorAll('script[type="text/plain"][data-lang]').forEach(s => {
      const lang = (s.dataset.lang || "text").toLowerCase();
      const code = dedent(s.textContent);
      const lines = window.UE5Syntax.highlightLines(code, lang);
      const hl = parseRanges(s.dataset.highlight);
      const block = h("div", "code-block");
      if (s.dataset.lines === "false" || lines.length <= 2) block.classList.add("no-lines");
      const head = h("div", "code-head",
        '<span class="code-dots"><i></i><i></i><i></i></span>' +
        '<span class="code-lang">' + esc(LANG_LABEL[lang] || lang) + "</span>" +
        (s.dataset.file ? '<span class="code-file">' + esc(s.dataset.file) + "</span>" : "") +
        '<button class="copy-btn" type="button">Copier</button>');
      const pre = h("pre");
      const codeEl = h("code", "lang-" + lang);
      codeEl.innerHTML = lines.map((l, i) => '<span class="line' + (hl.has(i + 1) ? " hl" : "") + '">' + (l || " ") + "</span>").join("");
      pre.appendChild(codeEl);
      block.append(head, pre);
      s.replaceWith(block);
      const btn = head.querySelector(".copy-btn");
      btn.addEventListener("click", () => {
        copyText(code).then(() => {
          btn.textContent = "Copié !";
          btn.classList.add("ok");
          setTimeout(() => { btn.textContent = "Copier"; btn.classList.remove("ok"); }, 1600);
        }).catch(() => { btn.textContent = "Échec"; });
      });
    });
  }

  /* ---------- Onglets ---------- */
  function activateTab(group, label) {
    const tabs = Array.from(group.children).filter(c => c.classList.contains("tab"));
    if (!tabs.some(t => t.dataset.label === label)) label = tabs[0] && tabs[0].dataset.label;
    tabs.forEach(t => t.classList.toggle("active", t.dataset.label === label));
    group.querySelectorAll(":scope > .tab-list > .tab-btn").forEach(b => {
      const on = b.dataset.label === label;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function buildTabs() {
    let pref = null;
    try { pref = localStorage.getItem(KEY_TAB); } catch (e) { /* ignore */ }
    document.querySelectorAll(".tabs").forEach(group => {
      const tabs = Array.from(group.children).filter(c => c.classList.contains("tab"));
      const list = h("div", "tab-list");
      list.setAttribute("role", "tablist");
      tabs.forEach((t, i) => {
        if (!t.dataset.label) t.dataset.label = "Onglet " + (i + 1);
        const b = h("button", "tab-btn", esc(t.dataset.label));
        b.type = "button";
        b.setAttribute("role", "tab");
        b.dataset.label = t.dataset.label;
        b.addEventListener("click", () => selectTab(t.dataset.label, group));
        list.appendChild(b);
      });
      group.prepend(list);
      activateTab(group, pref);
    });
  }

  function selectTab(label, origin) {
    try { localStorage.setItem(KEY_TAB, label); } catch (e) { /* ignore */ }
    const before = origin.getBoundingClientRect().top;
    document.querySelectorAll(".tabs").forEach(g => {
      const has = Array.from(g.children).some(c => c.classList.contains("tab") && c.dataset.label === label);
      if (g === origin || has) activateTab(g, label);
    });
    const delta = origin.getBoundingClientRect().top - before;
    if (delta) window.scrollBy(0, delta);
  }

  /* ---------- Graphes Blueprint ---------- */
  function buildBlueprints() {
    document.querySelectorAll('script[type="application/json"].bp-graph').forEach(s => {
      let data;
      try { data = JSON.parse(s.textContent); } catch (e) {
        console.error("Graphe Blueprint invalide :", e.message, s);
        s.replaceWith(h("pre", "mermaid-failed bp-error", "Graphe Blueprint invalide : " + esc(e.message)));
        return;
      }
      const fig = h("figure", "bp-wrap");
      const canvas = h("div", "bp-canvas");
      fig.appendChild(canvas);
      if (s.dataset.caption) fig.appendChild(h("figcaption", null, s.dataset.caption));
      s.replaceWith(fig);
      try {
        window.UE5Blueprint.render(canvas, data);
        canvas.appendChild(h("span", "bp-label", "Blueprint"));
      } catch (e) {
        console.error("Erreur de rendu Blueprint :", e);
        canvas.innerHTML = '<pre class="mermaid-failed bp-error">Erreur de rendu : ' + esc(e.message) + "</pre>";
      }
    });
  }

  /* ---------- Schémas Mermaid ---------- */
  function mermaidConfig() {
    const dark = currentTheme() === "dark";
    const v = dark ? {
      darkMode: true, background: "#141823", fontFamily: "Inter, system-ui, sans-serif", fontSize: "15px",
      primaryColor: "#1c2b47", primaryBorderColor: "#5aa9ff", primaryTextColor: "#e8edf7",
      secondaryColor: "#2a2145", secondaryBorderColor: "#b195ff", secondaryTextColor: "#e8edf7",
      tertiaryColor: "#1a1f2d", tertiaryBorderColor: "#353e56", tertiaryTextColor: "#e8edf7",
      lineColor: "#8290b0", textColor: "#dfe4ee", mainBkg: "#1c2b47", nodeBorder: "#5aa9ff",
      clusterBkg: "#10141e", clusterBorder: "#353e56", titleColor: "#e8edf7", edgeLabelBackground: "#1a1f2d",
      actorBkg: "#1c2b47", actorBorder: "#5aa9ff", actorTextColor: "#e8edf7", actorLineColor: "#55607d",
      signalColor: "#c9d1e3", signalTextColor: "#e8edf7", labelBoxBkgColor: "#1a1f2d", labelBoxBorderColor: "#5aa9ff",
      labelTextColor: "#e8edf7", loopTextColor: "#e8edf7", noteBkgColor: "#3b3020", noteTextColor: "#ffe2b8",
      noteBorderColor: "#ffb15c", activationBkgColor: "#25385e", activationBorderColor: "#5aa9ff",
      sequenceNumberColor: "#0b0d12", classText: "#e8edf7", altBackground: "#1a1f2d"
    } : {
      darkMode: false, background: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", fontSize: "15px",
      primaryColor: "#e8f1ff", primaryBorderColor: "#1f6fe0", primaryTextColor: "#14213d",
      secondaryColor: "#f1eaff", secondaryBorderColor: "#7c3aed", secondaryTextColor: "#14213d",
      tertiaryColor: "#f4f6fb", tertiaryBorderColor: "#cbd2e1", tertiaryTextColor: "#14213d",
      lineColor: "#6b7790", textColor: "#1d2433", mainBkg: "#e8f1ff", nodeBorder: "#1f6fe0",
      clusterBkg: "#f7f9fd", clusterBorder: "#cbd2e1", titleColor: "#14213d", edgeLabelBackground: "#ffffff",
      actorBkg: "#e8f1ff", actorBorder: "#1f6fe0", actorTextColor: "#14213d", actorLineColor: "#9aa5bd",
      signalColor: "#334155", signalTextColor: "#14213d", labelBoxBkgColor: "#f4f6fb", labelBoxBorderColor: "#1f6fe0",
      labelTextColor: "#14213d", loopTextColor: "#14213d", noteBkgColor: "#fff4dc", noteTextColor: "#5b3b00",
      noteBorderColor: "#e0a040", activationBkgColor: "#dbe8ff", activationBorderColor: "#1f6fe0",
      sequenceNumberColor: "#ffffff", classText: "#14213d", altBackground: "#f4f6fb"
    };
    return {
      startOnLoad: false, theme: "base", themeVariables: v, securityLevel: "strict", fontFamily: v.fontFamily,
      flowchart: { curve: "basis", padding: 14, nodeSpacing: 42, rankSpacing: 52, htmlLabels: true },
      sequence: { mirrorActors: false, actorMargin: 60, messageMargin: 34, boxMargin: 8 },
      state: { padding: 10 }
    };
  }

  let mermaidRun = 0;
  async function renderMermaid() {
    const els = Array.from(document.querySelectorAll("pre.mermaid"));
    if (!els.length) return;
    els.forEach(el => {
      if (el.dataset.src !== undefined) return;
      el.querySelectorAll("br").forEach(b => b.replaceWith("<br>"));
      el.dataset.src = el.textContent;
    });
    if (!window.mermaid) {
      els.forEach(el => { el.textContent = el.dataset.src; el.classList.add("mermaid-failed"); });
      return;
    }
    const run = ++mermaidRun;
    window.mermaid.initialize(mermaidConfig());
    for (const el of els) {
      if (run !== mermaidRun) return;
      const id = "mmd-" + Math.random().toString(36).slice(2, 10);
      try {
        const res = await window.mermaid.render(id, el.dataset.src.trim());
        el.innerHTML = res.svg;
        el.classList.add("rendered");
        el.classList.remove("mermaid-failed");
        if (res.bindFunctions) res.bindFunctions(el);
      } catch (e) {
        console.error("Erreur Mermaid :", e && e.message ? e.message : e, el.dataset.src);
        el.textContent = "Schéma invalide :\n" + el.dataset.src;
        el.classList.add("mermaid-failed");
        ["d" + id, id].forEach(x => { const n = document.getElementById(x); if (n && !el.contains(n)) n.remove(); });
      }
    }
    spy();
  }

  /* ---------- Quiz, tableaux ---------- */
  function buildQuiz() {
    document.querySelectorAll(".quiz").forEach(q => {
      const items = Array.from(q.querySelectorAll("li"));
      let explain = q.querySelector(".explain");
      if (!explain) { explain = h("p", "explain"); q.appendChild(explain); }
      const verdict = h("span", "verdict");
      explain.prepend(verdict);
      const retry = h("button", "retry", "Réessayer");
      retry.type = "button";
      explain.appendChild(retry);
      items.forEach(li => {
        li.tabIndex = 0;
        li.setAttribute("role", "button");
        li.addEventListener("click", () => {
          if (q.classList.contains("answered")) return;
          const ok = li.hasAttribute("data-correct");
          q.classList.add("answered", ok ? "is-right" : "is-wrong");
          li.classList.add(ok ? "correct" : "wrong");
          items.forEach(x => { if (x.hasAttribute("data-correct")) x.classList.add("correct"); });
          verdict.textContent = ok ? "Bonne réponse !" : "Pas tout à fait.";
        });
        li.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
        });
      });
      retry.addEventListener("click", () => {
        q.classList.remove("answered", "is-right", "is-wrong");
        items.forEach(x => x.classList.remove("correct", "wrong"));
      });
    });
  }

  function wrapTables() {
    article.querySelectorAll("table").forEach(t => {
      if (t.parentElement.classList.contains("table-wrap")) return;
      const w = h("div", "table-wrap");
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });
  }

  /* ---------- Sommaire ---------- */
  let tocItems = [];
  let tocLinks = [];

  function buildToc() {
    const skip = ".quiz, .exercise, .summary, .tabs, details, .callout, .card, .compare, .objectives, .roadmap, .hero";
    const used = new Set();
    article.querySelectorAll("h2, h3").forEach(hd => {
      if (hd.closest(skip)) return;
      const text = hd.textContent.trim();
      let id = hd.id || slug(text);
      const base = id;
      let k = 2;
      while (used.has(id) || (document.getElementById(id) && document.getElementById(id) !== hd)) id = base + "-" + k++;
      used.add(id);
      hd.id = id;
      const a = h("a", "anchor", "#");
      a.href = "#" + id;
      a.setAttribute("aria-hidden", "true");
      a.tabIndex = -1;
      hd.appendChild(a);
      tocItems.push({ id: id, text: text, level: hd.tagName.toLowerCase(), el: hd });
    });
    if (!tocItems.length) { toc.innerHTML = ""; return; }
    toc.innerHTML = '<p class="toc-title">Sur cette page</p><ul>' +
      tocItems.map(it => '<li class="' + it.level + '"><a href="#' + it.id + '">' + esc(it.text) + "</a></li>").join("") + "</ul>";
    tocLinks = Array.from(toc.querySelectorAll("a"));
  }

  function spy() {
    if (!tocItems.length) return;
    const y = 130;
    let active = 0;
    tocItems.forEach((it, i) => { if (it.el.getBoundingClientRect().top <= y) active = i; });
    tocLinks.forEach((l, i) => l.classList.toggle("active", i === active));
  }

  /* ---------- Accueil ---------- */
  function buildHome() {
    const host = document.getElementById("roadmap");
    if (host) {
      let html = "";
      NAV.forEach(g => {
        const items = g.items.filter(it => it.id !== "accueil");
        if (!items.length) return;
        html += '<div class="roadmap-group"><h3>' + esc(g.group) + '</h3><div class="roadmap-items">';
        items.forEach(it => {
          const f = flat.find(x => x.id === it.id);
          html += '<a class="rm-card" data-id="' + it.id + '" href="' + f.href + '"><div class="rm-top"><span class="rm-num">' + pad2(f.num) +
            "</span><span>" + esc(it.time) + " · " + esc(it.level) + '</span><span class="rm-done">Terminé</span></div>' +
            '<div class="rm-title">' + esc(it.title) + '</div><div class="rm-desc">' + esc(it.desc) + "</div></a>";
        });
        html += "</div></div>";
      });
      host.classList.add("roadmap");
      host.innerHTML = html;
    }
    document.querySelectorAll("[data-stat]").forEach(n => {
      const s = n.dataset.stat;
      if (s === "chapters") n.textContent = chapters.length;
      if (s === "blueprints") n.textContent = String(chapters.length) + "+";
    });
  }

  /* ---------- Fin de chapitre ---------- */
  function buildChapterEnd() {
    if (!current) return;
    const end = h("div", "chapter-end");
    let html = "";
    if (current.id !== "accueil") {
      html += '<div class="complete-row"><p>Lecture terminée ? Marquez ce chapitre pour suivre votre progression.</p><button class="complete-btn" type="button"></button></div>';
    }
    const prev = flat[curIndex - 1], next = flat[curIndex + 1];
    html += '<nav class="pager">' +
      (prev ? '<a class="prev" href="' + prev.href + '">← Précédent<b>' + esc(prev.title) + "</b></a>" : "") +
      (next ? '<a class="next" href="' + next.href + '">Suivant →<b>' + esc(next.title) + "</b></a>" : "") + "</nav>";
    end.innerHTML = html;
    main.appendChild(end);
    const btn = end.querySelector(".complete-btn");
    if (btn) {
      const upd = () => {
        const d = !!getProgress()[current.id];
        btn.classList.toggle("done", d);
        btn.innerHTML = ICONS.check + (d ? "Chapitre terminé" : "Marquer comme terminé");
      };
      upd();
      btn.addEventListener("refresh", upd);
      btn.addEventListener("click", () => { setDone(current.id, !getProgress()[current.id]); upd(); });
    }
  }

  function refreshProgress() {
    const p = getProgress();
    const done = chapters.filter(c => p[c.id]).length;
    document.querySelectorAll(".nav-item").forEach(a => a.classList.toggle("done", !!p[a.dataset.id]));
    document.querySelectorAll(".rm-card").forEach(a => a.classList.toggle("done", !!p[a.dataset.id]));
    const count = document.querySelector(".pc-count"), total = document.querySelector(".pc-total");
    if (count) count.textContent = done;
    if (total) total.textContent = chapters.length;
    const fg = document.querySelector(".progress-ring .fg");
    if (fg) {
      const c = 2 * Math.PI * 8;
      fg.style.strokeDasharray = c;
      fg.style.strokeDashoffset = c * (1 - (chapters.length ? done / chapters.length : 0));
    }
  }

  /* ---------- Recherche ---------- */
  function buildSearch() {
    const input = topbar.querySelector(".search input");
    const box = topbar.querySelector(".search-results");
    let sel = 0;
    let count = 0;

    function mark() { box.querySelectorAll("a").forEach((a, i) => a.classList.toggle("sel", i === sel)); }

    function run() {
      const q = norm(input.value.trim());
      if (!q) { box.classList.remove("open"); count = 0; return; }
      const terms = q.split(/\s+/);
      const score = (hay, title) => {
        if (!terms.every(t => hay.includes(t))) return 0;
        return norm(title).includes(terms[0]) ? 2 : 1;
      };
      const chap = flat
        .map(it => ({ it: it, s: score(norm([it.title, it.keywords, it.desc, it.group].join(" ")), it.title) }))
        .filter(r => r.s).sort((a, b) => b.s - a.s).slice(0, 7);
      const heads = tocItems.map(hd => ({ hd: hd, s: score(norm(hd.text), hd.text) })).filter(r => r.s).slice(0, 6);
      let html = "";
      count = 0;
      if (heads.length) {
        html += '<div class="sr-group">Sur cette page</div>';
        heads.forEach(r => { count++; html += '<a href="#' + r.hd.id + '">' + esc(r.hd.text) + "</a>"; });
      }
      if (chap.length) {
        html += '<div class="sr-group">Chapitres</div>';
        chap.forEach(r => {
          count++;
          html += '<a href="' + r.it.href + '">' + (r.it.num ? pad2(r.it.num) + " · " : "") + esc(r.it.title) + "<small>" + esc(r.it.desc) + "</small></a>";
        });
      }
      if (!count) html = '<div class="empty">Aucun résultat pour « ' + esc(input.value.trim()) + " »</div>";
      box.innerHTML = html;
      box.classList.add("open");
      sel = 0;
      mark();
    }

    input.addEventListener("input", run);
    input.addEventListener("focus", () => { if (input.value.trim()) run(); });
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" && count) { e.preventDefault(); sel = (sel + 1) % count; mark(); }
      else if (e.key === "ArrowUp" && count) { e.preventDefault(); sel = (sel - 1 + count) % count; mark(); }
      else if (e.key === "Enter" && count) {
        e.preventDefault();
        const a = box.querySelectorAll("a")[sel];
        box.classList.remove("open");
        input.blur();
        if (a) window.location.href = a.href;
      } else if (e.key === "Escape") { box.classList.remove("open"); input.blur(); }
    });
    box.addEventListener("click", e => { if (e.target.closest("a")) { box.classList.remove("open"); input.blur(); } });
    document.addEventListener("click", e => { if (!e.target.closest(".search")) box.classList.remove("open"); });
    document.addEventListener("keydown", e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "");
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* ---------- Défilement ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      readingBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      toTop.classList.toggle("show", window.scrollY > 700);
      spy();
      ticking = false;
    });
  }

  /* ---------- Initialisation ---------- */
  buildLayout();
  applyTheme(currentTheme());
  buildSidebar();
  decorateHeader();
  buildCode();
  buildTabs();
  buildBlueprints();
  wrapTables();
  buildQuiz();
  buildToc();
  buildHome();
  buildChapterEnd();
  buildSearch();
  refreshProgress();
  body.classList.add("ready");
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const jumpToHash = () => {
    if (!location.hash) return;
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) t.scrollIntoView();
  };
  jumpToHash();
  renderMermaid().then(jumpToHash);
})();
