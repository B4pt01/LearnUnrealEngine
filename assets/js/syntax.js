/* Coloration syntaxique légère : C++ (avec les macros et types Unreal),
   C#, INI, JSON et console. Renvoie une liste de lignes HTML. */
(function () {
  "use strict";

  function words(list) {
    return new RegExp("\\b(?:" + list.trim().split(/\s+/).join("|") + ")\\b", "y");
  }

  const CPP_CTRL = words("if else for while do switch case default break continue return goto try catch throw co_return co_await");
  const CPP_KW = words(
    "alignas alignof auto class const constexpr consteval const_cast decltype delete dynamic_cast enum explicit export extern " +
    "false final friend inline mutable namespace new noexcept nullptr operator override private protected public " +
    "reinterpret_cast sizeof static static_assert static_cast struct template this true typedef typeid typename union " +
    "using virtual volatile FORCEINLINE"
  );
  const CPP_TYPES = words(
    "void bool char wchar_t short int long float double signed unsigned size_t " +
    "int8 int16 int32 int64 uint8 uint16 uint32 uint64 TCHAR UTF8CHAR ANSICHAR"
  );
  const UE_MACROS = new RegExp(
    "\\b(?:UCLASS|UPROPERTY|UFUNCTION|USTRUCT|UENUM|UMETA|UINTERFACE|UPARAM|GENERATED_BODY|GENERATED_UCLASS_BODY|GENERATED_USTRUCT_BODY|" +
    "UE_LOG|UE_LOGFMT|UE_CLOG|TEXT|DECLARE_[A-Z0-9_]+|DEFINE_[A-Z0-9_]+|IMPLEMENT_[A-Z0-9_]+|DOREPLIFETIME[A-Z_]*|" +
    "UE_DEFINE_GAMEPLAY_TAG[A-Z_]*|UE_DECLARE_GAMEPLAY_TAG[A-Z_]*|ATTRIBUTE_ACCESSORS|GAMEPLAYATTRIBUTE_[A-Z_]+|" +
    "check|checkf|checkNoEntry|ensure|ensureMsgf|ensureAlways|verify|verifyf|LOCTEXT|NSLOCTEXT|" +
    "SCOPE_CYCLE_COUNTER|QUICK_SCOPE_CYCLE_COUNTER|TRACE_CPUPROFILER_EVENT_SCOPE|TRACE_CPUPROFILER_EVENT_SCOPE_STR|" +
    "WITH_EDITOR|WITH_EDITORONLY_DATA|UE_BUILD_SHIPPING|UE_BUILD_DEVELOPMENT|[A-Z][A-Z0-9]*_API)\\b",
    "y"
  );
  const UE_TYPE = /\b[AUFTEIS][A-Z][A-Za-z0-9_]*\b/y;

  const LANGS = {
    cpp: [
      [/\/\/[^\n]*/y, "com"],
      [/\/\*[\s\S]*?\*\//y, "com"],
      [/#\s*include\b/y, "pp", "include"],
      [/#\s*(?:pragma|define|undef|if|ifdef|ifndef|elif|else|endif|error)\b/y, "pp"],
      [/(?:u8|[uUL])?"(?:[^"\\\n]|\\.)*"/y, "str"],
      [/'(?:[^'\\\n]|\\.)+'/y, "str"],
      [UE_MACROS, "macro"],
      [CPP_CTRL, "ctrl"],
      [CPP_KW, "kw"],
      [CPP_TYPES, "type"],
      [/(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[fFuUlL]*\b/y, "num"],
      [/0x[0-9a-fA-F]+\b/y, "num"],
      [UE_TYPE, "ue"],
      [/[A-Za-z_]\w*(?=\s*(?:<[^<>;()]*>)?\s*\()/y, "fn"],
      [/[A-Za-z_]\w*/y, null],
      [/\s+/y, null],
      [/./y, null]
    ],
    csharp: [
      [/\/\/[^\n]*/y, "com"],
      [/\/\*[\s\S]*?\*\//y, "com"],
      [/@?"(?:[^"\\\n]|\\.)*"/y, "str"],
      [words("if else for foreach while do switch case default break continue return try catch throw"), "ctrl"],
      [words("using namespace public private protected internal class struct new base this override virtual static readonly const true false null var get set partial sealed abstract enum"), "kw"],
      [words("string int bool float double void object"), "type"],
      [/\d+(?:\.\d+)?[fFdDmM]?\b/y, "num"],
      [/[A-Z]\w*/y, "ue"],
      [/[A-Za-z_]\w*(?=\s*\()/y, "fn"],
      [/[A-Za-z_]\w*/y, null],
      [/\s+/y, null],
      [/./y, null]
    ],
    json: [
      [/"(?:[^"\\\n]|\\.)*"(?=\s*:)/y, "key"],
      [/"(?:[^"\\\n]|\\.)*"/y, "str"],
      [words("true false null"), "kw"],
      [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, "num"],
      [/\s+/y, null],
      [/./y, null]
    ]
  };

  function tokenize(src, rules) {
    const out = [];
    let pos = 0;
    let afterInclude = false;
    while (pos < src.length) {
      if (afterInclude) {
        const m = /\s*(<[^>\n]*>|"[^"\n]*")/y;
        m.lastIndex = pos;
        const r = m.exec(src);
        afterInclude = false;
        if (r) { out.push({ c: "str", v: r[0] }); pos = m.lastIndex; continue; }
      }
      let matched = false;
      for (const rule of rules) {
        const re = rule[0];
        re.lastIndex = pos;
        const r = re.exec(src);
        if (r && r[0].length) {
          out.push({ c: rule[1], v: r[0] });
          pos = re.lastIndex;
          if (rule[2] === "include") afterInclude = true;
          matched = true;
          break;
        }
      }
      if (!matched) { out.push({ c: null, v: src[pos] }); pos++; }
    }
    return out;
  }

  function lineTokens(src, lineFn) {
    const out = [];
    src.split("\n").forEach((line, i, arr) => {
      lineFn(line).forEach(t => out.push(t));
      if (i < arr.length - 1) out.push({ c: null, v: "\n" });
    });
    return out;
  }

  function iniLine(line) {
    let m;
    if (/^\s*[;#]/.test(line)) return [{ c: "com", v: line }];
    if ((m = /^(\s*)(\[[^\]]*\])(.*)$/.exec(line))) return [{ c: null, v: m[1] }, { c: "sec", v: m[2] }, { c: null, v: m[3] }];
    if ((m = /^(\s*)([+\-.!]?[\w.]+)(\s*=\s*)(.*)$/.exec(line))) {
      return [{ c: null, v: m[1] }, { c: "key", v: m[2] }, { c: null, v: m[3] }, { c: /^-?[\d.]+$/.test(m[4]) ? "num" : /^(True|False|true|false)$/.test(m[4]) ? "kw" : "str", v: m[4] }];
    }
    return [{ c: null, v: line }];
  }

  function consoleLine(line) {
    const m = /^(\s*)(.*)$/.exec(line);
    const lead = m[1];
    const rest = m[2];
    if (!rest) return [{ c: null, v: line }];
    if (/^(#|\/\/)/.test(rest)) return [{ c: null, v: lead }, { c: "com", v: rest }];
    const toks = [{ c: null, v: lead }];
    const parts = rest.split(/(\s+)/);
    let first = true;
    parts.forEach(p => {
      if (!p) return;
      if (/^\s+$/.test(p)) { toks.push({ c: null, v: p }); return; }
      if (first) { toks.push({ c: "fn", v: p }); first = false; return; }
      if (/^(#|\/\/)/.test(p)) { toks.push({ c: "com", v: p }); return; }
      if (/^--?[\w-]+(=.*)?$/.test(p)) { toks.push({ c: "flag", v: p }); return; }
      if (/^-?\d+(\.\d+)?$/.test(p)) { toks.push({ c: "num", v: p }); return; }
      if (/^["'].*["']$/.test(p)) { toks.push({ c: "str", v: p }); return; }
      toks.push({ c: null, v: p });
    });
    // Commentaire en fin de ligne : on recolle tout ce qui suit '#'
    const idx = toks.findIndex(t => t.c === "com");
    if (idx > 0) {
      const tail = toks.slice(idx).map(t => t.v).join("");
      toks.splice(idx, toks.length - idx, { c: "com", v: tail });
    }
    return toks;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Renvoie un tableau de chaînes HTML, une par ligne. */
  function highlightLines(src, lang) {
    lang = (lang || "text").toLowerCase();
    if (lang === "c++" || lang === "h" || lang === "hpp") lang = "cpp";
    if (lang === "cs" || lang === "c#") lang = "csharp";
    if (lang === "bash" || lang === "shell" || lang === "sh") lang = "console";

    let tokens;
    if (LANGS[lang]) tokens = tokenize(src, LANGS[lang]);
    else if (lang === "ini") tokens = lineTokens(src, iniLine);
    else if (lang === "console") tokens = lineTokens(src, consoleLine);
    else tokens = [{ c: null, v: src }];

    const lines = [""];
    tokens.forEach(t => {
      const pieces = t.v.split("\n");
      pieces.forEach((piece, i) => {
        if (i > 0) lines.push("");
        if (!piece) return;
        const html = escapeHtml(piece);
        lines[lines.length - 1] += t.c ? '<span class="tok-' + t.c + '">' + html + "</span>" : html;
      });
    });
    return lines;
  }

  window.UE5Syntax = { highlightLines, escapeHtml };
})();
