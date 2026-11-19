/* Rendu SVG de graphes Blueprint à partir d'une description JSON.
   Format :
   {
     "nodes": [
       { "id": "begin", "type": "event", "title": "Event BeginPlay", "x": 0, "y": 0,
         "out": [ { "type": "exec" } ] },
       { "id": "print", "type": "function", "title": "Print String", "x": 260, "y": 0,
         "in":  [ { "type": "exec" }, { "name": "In String", "type": "string", "value": "Hello" } ],
         "out": [ { "type": "exec" } ] }
     ],
     "links": [ ["begin", 0, "print", 0] ],
     "comments": [ { "x": -20, "y": -50, "w": 520, "h": 180, "text": "Commentaire" } ]
   }
   Types de nœud : event, custom, function, pure, flow, macro, cast, interface, set, var, op
   Types de pin  : exec, bool, byte, int, int64, float, double, string, name, text, vector,
                   rotator, transform, object, class, struct, interface, delegate, enum, wildcard */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  const PIN_COLORS = {
    exec: "#ffffff", bool: "#c4161c", byte: "#109a8a", enum: "#109a8a", int: "#1fe0a8", int64: "#a8e0b0",
    float: "#9ef24c", double: "#9ef24c", real: "#9ef24c", string: "#f13ad1", name: "#c88cff", text: "#e8749a",
    vector: "#ffc93c", rotator: "#a3b6ff", transform: "#ff7a1a", object: "#1ea7f5", class: "#8a4dff",
    struct: "#2a6fdb", interface: "#e6ff9a", delegate: "#ff4040", wildcard: "#8e8888"
  };

  const HEADERS = {
    event: ["#a51f1f", "#4f0e0e"], custom: ["#a51f1f", "#4f0e0e"],
    function: ["#2563ad", "#10325e"], interface: ["#6d45b8", "#33205a"],
    pure: ["#54842b", "#263f13"], cast: ["#1c8496", "#0d434d"],
    flow: ["#5e5e5e", "#2e2e2e"], macro: ["#5e5e5e", "#2e2e2e"], set: ["#4b4b4b", "#262626"]
  };

  const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const HEAD = 30, HEAD_SUB = 44, ROW = 26, PADV = 7, PIN_IN = 14;

  let measureCtx = null;
  function textW(str, size, weight) {
    if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
    measureCtx.font = (weight || 400) + " " + size + "px " + FONT;
    return Math.ceil(measureCtx.measureText(String(str)).width) + 2;
  }

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function txt(parent, x, y, str, opts) {
    opts = opts || {};
    const t = el("text", {
      x: x, y: y, "font-family": FONT, "font-size": opts.size || 12, fill: opts.fill || "#e6e6e6",
      "font-weight": opts.weight || 400, "dominant-baseline": "central"
    }, parent);
    if (opts.anchor) t.setAttribute("text-anchor", opts.anchor);
    if (opts.italic) t.setAttribute("font-style", "italic");
    if (opts.opacity) t.setAttribute("opacity", opts.opacity);
    t.textContent = str;
    return t;
  }

  function pinColor(p) { return PIN_COLORS[(p && p.type) || "wildcard"] || PIN_COLORS.wildcard; }

  function valueWidth(p) {
    if (p.value === undefined || p.value === null || p.value === "") return 0;
    if (p.type === "bool") return 20;
    return textW(p.value, 11) + 14 + 8;
  }

  function layoutNode(n) {
    n.in = n.in || [];
    n.out = n.out || [];
    const type = n.type || "function";
    n._type = type;

    if (type === "var") {
      n._w = Math.max(90, textW(n.title, 12.5, 600) + 52);
      n._h = 32;
      return;
    }
    if (type === "op") {
      const rows = Math.max(n.in.length, n.out.length, 1);
      const inW = Math.max(0, ...n.in.map(p => (p.name ? textW(p.name, 11.5) + 8 : 0) + valueWidth(p)));
      const outW = Math.max(0, ...n.out.map(p => (p.name ? textW(p.name, 11.5) + 8 : 0)));
      n._w = Math.max(n.w || 0, 96, inW + outW + textW(n.title, 22, 700) + 56);
      n._h = rows * ROW + 16;
      return;
    }

    const head = n.subtitle ? HEAD_SUB : HEAD;
    n._head = head;
    const iconW = (type === "flow" || type === "macro" || type === "set") ? 12 : 28;
    let titleW = textW(n.title, 12.5, 600) + iconW + 18;
    if (n.subtitle) titleW = Math.max(titleW, textW(n.subtitle, 10.5) + iconW + 18);
    const inW = Math.max(0, ...n.in.map(p => (p.name ? textW(p.name, 11.5) : 0) + valueWidth(p)));
    const outW = Math.max(0, ...n.out.map(p => (p.name ? textW(p.name, 11.5) : 0)));
    const rows = Math.max(n.in.length, n.out.length);
    n._w = Math.max(n.w || 0, 130, titleW, inW + outW + 74);
    n._h = head + PADV * 2 + rows * ROW;
  }

  function pinPos(n, side, i) {
    const list = side === "in" ? n.in : n.out;
    const x = side === "in" ? n.x + PIN_IN : n.x + n._w - PIN_IN;
    if (n._type === "var") return { x: n.x + n._w - PIN_IN, y: n.y + n._h / 2 };
    if (n._type === "op") {
      const top = n.y + (n._h - list.length * ROW) / 2;
      return { x: x, y: top + i * ROW + ROW / 2 };
    }
    return { x: x, y: n.y + n._head + PADV + i * ROW + ROW / 2 };
  }

  function drawPin(g, p, x, y, connected) {
    const c = pinColor(p);
    if (p.type === "exec") {
      const pts = [[x - 5, y - 6], [x + 1, y - 6], [x + 6, y], [x + 1, y + 6], [x - 5, y + 6]].map(a => a.join(",")).join(" ");
      el("polygon", { points: pts, fill: connected ? "#fff" : "none", stroke: "#fff", "stroke-width": 1.6, "stroke-linejoin": "round" }, g);
    } else if (p.array) {
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
        el("rect", { x: x - 5 + k * 3.6, y: y - 5 + r * 3.6, width: 2.6, height: 2.6, fill: c }, g);
      }
    } else if (p.type === "delegate") {
      el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, rx: 1.5, fill: connected ? c : "none", stroke: c, "stroke-width": 1.6 }, g);
    } else {
      el("circle", { cx: x, cy: y, r: 5, fill: connected ? c : "#141414", stroke: c, "stroke-width": 1.8 }, g);
      if (!connected) el("circle", { cx: x, cy: y, r: 1.6, fill: c, opacity: 0.0 }, g);
    }
  }

  function drawValue(g, p, x, y) {
    if (p.value === undefined || p.value === null || p.value === "") return;
    if (p.type === "bool") {
      el("rect", { x: x, y: y - 7, width: 14, height: 14, rx: 2.5, fill: "#0e0e0e", stroke: "#4a4a4a" }, g);
      if (p.value === true || p.value === "true") {
        el("path", { d: "M" + (x + 3) + " " + y + " l3 3.2 l5.2 -6.6", fill: "none", stroke: "#e8e8e8", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      }
      return;
    }
    const w = textW(p.value, 11) + 14;
    el("rect", { x: x, y: y - 9, width: w, height: 18, rx: 3, fill: "#0e0e0e", stroke: "#3c3c3c" }, g);
    txt(g, x + 7, y, p.value, { size: 11, fill: "#d2d2d2" });
  }

  function drawNode(svg, defs, n, uid, connected) {
    const g = el("g", { class: "bp-node" }, svg);
    const type = n._type;

    if (type === "var") {
      const c = pinColor(n.out[0] || { type: "wildcard" });
      const gid = uid + "-v-" + n.id;
      const lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      el("stop", { offset: "0", "stop-color": c, "stop-opacity": 0.35 }, lg);
      el("stop", { offset: "0.55", "stop-color": "#1a1a1a", "stop-opacity": 0.95 }, lg);
      el("rect", { x: n.x, y: n.y, width: n._w, height: n._h, rx: 15, fill: "#151515", stroke: "#050505", "stroke-width": 1.5 }, g);
      el("rect", { x: n.x, y: n.y, width: n._w, height: n._h, rx: 15, fill: "url(#" + gid + ")" }, g);
      txt(g, n.x + 14, n.y + n._h / 2, n.title, { size: 12.5, weight: 600, fill: "#f2f2f2" });
      const p = pinPos(n, "out", 0);
      drawPin(g, n.out[0] || { type: "wildcard" }, p.x, p.y, connected.has(n.id + ":out:0"));
      return;
    }

    // Corps
    el("rect", { x: n.x + 2, y: n.y + 3, width: n._w, height: n._h, rx: 8, fill: "#000", opacity: 0.35 }, g);
    el("rect", { x: n.x, y: n.y, width: n._w, height: n._h, rx: 8, fill: "rgba(16,16,16,0.94)", stroke: "#050505", "stroke-width": 1.5 }, g);

    if (type === "op") {
      txt(g, n.x + n._w / 2, n.y + n._h / 2, n.title, { size: 22, weight: 700, fill: "#ffffff", anchor: "middle", opacity: 0.32 });
    } else {
      const hc = HEADERS[type] || HEADERS.function;
      const gid = uid + "-h-" + type;
      if (!defs.querySelector("#" + CSS.escape(gid))) {
        const lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
        el("stop", { offset: "0", "stop-color": hc[0] }, lg);
        el("stop", { offset: "1", "stop-color": hc[1], "stop-opacity": 0.85 }, lg);
      }
      const clip = uid + "-c-" + n.id;
      const cp = el("clipPath", { id: clip }, defs);
      el("rect", { x: n.x, y: n.y, width: n._w, height: n._h, rx: 8 }, cp);
      el("rect", { x: n.x, y: n.y, width: n._w, height: n._head, fill: "url(#" + gid + ")", "clip-path": "url(#" + clip + ")" }, g);
      el("line", { x1: n.x + 1, y1: n.y + n._head, x2: n.x + n._w - 1, y2: n.y + n._head, stroke: "#000", "stroke-opacity": 0.6 }, g);

      let tx = n.x + 12;
      const cy = n.y + (n.subtitle ? 15 : n._head / 2);
      if (type === "event" || type === "custom") {
        const ix = n.x + 15;
        el("path", { d: "M" + ix + " " + (cy - 6) + " L" + (ix + 6) + " " + cy + " L" + ix + " " + (cy + 6) + " L" + (ix - 6) + " " + cy + " Z", fill: "#fff", opacity: 0.92 }, g);
        tx = n.x + 28;
      } else if (type === "function" || type === "pure" || type === "cast" || type === "interface") {
        txt(g, n.x + 15, cy, "f", { size: 14, weight: 700, fill: "#fff", anchor: "middle", italic: true, opacity: 0.9 });
        tx = n.x + 28;
      }
      txt(g, tx, cy, n.title, { size: 12.5, weight: 600, fill: "#ffffff" });
      if (n.subtitle) txt(g, tx, n.y + 31, n.subtitle, { size: 10.5, fill: "#d8d8d8", italic: true, opacity: 0.8 });
    }

    n.in.forEach((p, i) => {
      const pos = pinPos(n, "in", i);
      const isCon = connected.has(n.id + ":in:" + i);
      drawPin(g, p, pos.x, pos.y, isCon);
      let lx = pos.x + 12;
      if (p.name) { txt(g, lx, pos.y, p.name, { size: 11.5, fill: "#dcdcdc" }); lx += textW(p.name, 11.5) + 6; }
      if (!isCon) drawValue(g, p, lx, pos.y);
    });
    n.out.forEach((p, i) => {
      const pos = pinPos(n, "out", i);
      drawPin(g, p, pos.x, pos.y, connected.has(n.id + ":out:" + i));
      if (p.name) txt(g, pos.x - 12, pos.y, p.name, { size: 11.5, fill: "#dcdcdc", anchor: "end" });
    });
  }

  function render(container, data) {
    const uid = "bp" + Math.random().toString(36).slice(2, 8);
    const nodes = data.nodes || [];
    const byId = {};
    nodes.forEach(n => { layoutNode(n); byId[n.id] = n; });

    const connected = new Set();
    const links = (data.links || []).filter(l => byId[l[0]] && byId[l[2]]);
    links.forEach(l => { connected.add(l[0] + ":out:" + l[1]); connected.add(l[2] + ":in:" + l[3]); });

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x + n._w); maxY = Math.max(maxY, n.y + n._h); });
    (data.comments || []).forEach(c => { minX = Math.min(minX, c.x); minY = Math.min(minY, c.y); maxX = Math.max(maxX, c.x + c.w); maxY = Math.max(maxY, c.y + c.h); });
    const pad = 22;
    const W = Math.ceil(maxX - minX + pad * 2), H = Math.ceil(maxY - minY + pad * 2);

    const svg = el("svg", { viewBox: (minX - pad) + " " + (minY - pad) + " " + W + " " + H, width: W, height: H, role: "img" });
    svg.style.width = "100%";
    svg.style.maxWidth = W + "px";
    svg.style.minWidth = Math.round(W * 0.62) + "px";
    svg.style.height = "auto";
    if (data.title) el("title", {}, svg).textContent = data.title;
    const defs = el("defs", {}, svg);

    (data.comments || []).forEach(c => {
      const col = c.color || "#5a7fb0";
      const g = el("g", {}, svg);
      el("rect", { x: c.x, y: c.y, width: c.w, height: c.h, rx: 4, fill: col, "fill-opacity": 0.1, stroke: col, "stroke-opacity": 0.55 }, g);
      el("rect", { x: c.x, y: c.y, width: c.w, height: 26, rx: 4, fill: col, "fill-opacity": 0.45 }, g);
      txt(g, c.x + 10, c.y + 13, c.text, { size: 13, weight: 600, fill: "#ffffff" });
    });

    const wires = el("g", { fill: "none" }, svg);
    links.forEach(l => {
      const a = byId[l[0]], b = byId[l[2]];
      const pa = pinPos(a, "out", l[1]), pb = pinPos(b, "in", l[3]);
      const p = a.out[l[1]] || { type: "wildcard" };
      const dx = Math.max(36, Math.abs(pb.x - pa.x) * 0.5);
      const d = "M" + (pa.x + 5) + " " + pa.y + " C" + (pa.x + dx) + " " + pa.y + " " + (pb.x - dx) + " " + pb.y + " " + (pb.x - 5) + " " + pb.y;
      el("path", { d: d, stroke: pinColor(p), "stroke-width": p.type === "exec" ? 2.6 : 2.1, "stroke-opacity": 0.95, "stroke-linecap": "round" }, wires);
    });

    nodes.forEach(n => drawNode(svg, defs, n, uid, connected));

    container.innerHTML = "";
    container.appendChild(svg);
  }

  window.UE5Blueprint = { render: render };
})();
