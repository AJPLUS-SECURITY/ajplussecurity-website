/*! AJ Plus AI Assistant - chatbot + kujaza fomu ya quote
 *  Weka kwenye ukurasa wa /contacts kabla ya </body>:
 *    <script>window.AJPLUS_AI_ENDPOINT = "https://NAME.workers.dev";</script>
 *    <script src="/assets/ai-assistant.js" defer></script>
 */
(function () {
  "use strict";
  var ENDPOINT = window.AJPLUS_AI_ENDPOINT;
  if (!ENDPOINT) { console.warn("AJPLUS_AI_ENDPOINT haijawekwa"); return; }

  var history = [];
  var busy = false;

  /* ---------- Styles ---------- */
  var css = [
    "#ajai-btn{position:fixed;left:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;background:#0b1f3a;color:#fff;font:600 14px/1 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer}",
    "#ajai-btn:hover{background:#12305a}",
    "#ajai-panel{position:fixed;left:18px;bottom:78px;z-index:9999;width:min(380px,calc(100vw - 36px));height:min(540px,calc(100vh - 110px));display:none;flex-direction:column;background:#fff;color:#1a1a1a;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;font:14px/1.45 system-ui,sans-serif}",
    "#ajai-panel.open{display:flex}",
    "#ajai-head{background:#0b1f3a;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}",
    "#ajai-head b{font-size:15px}#ajai-head small{display:block;opacity:.75;font-size:12px}",
    "#ajai-x{background:none;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1}",
    "#ajai-msgs{flex:1;overflow-y:auto;padding:14px;background:#f4f6f9;display:flex;flex-direction:column;gap:8px}",
    ".ajai-m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}",
    ".ajai-bot{background:#fff;align-self:flex-start;border-bottom-left-radius:4px}",
    ".ajai-me{background:#0b1f3a;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}",
    ".ajai-note{align-self:center;font-size:12px;color:#2a7a3b;background:#e6f4ea;padding:5px 10px;border-radius:999px}",
    "#ajai-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px;background:#f4f6f9}",
    "#ajai-chips button{border:1px solid #c9d2de;background:#fff;border-radius:999px;padding:6px 10px;font-size:12.5px;cursor:pointer}",
    "#ajai-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e3e7ee;background:#fff}",
    "#ajai-in{flex:1;border:1px solid #c9d2de;border-radius:10px;padding:10px;font:inherit;outline:none}",
    "#ajai-send{border:0;background:#0b1f3a;color:#fff;border-radius:10px;padding:0 16px;font-weight:600;cursor:pointer}",
    "#ajai-send:disabled{opacity:.5}"
  ].join("");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- UI ---------- */
  var btn = el("button", { id: "ajai-btn", type: "button" }, "💬 Msaidizi wa AI");
  var panel = el("div", { id: "ajai-panel", role: "dialog", "aria-label": "Msaidizi wa AJ Plus" });
  panel.innerHTML =
    '<div id="ajai-head"><div><b>AJ Plus AI</b><small>Jibu la haraka · Quote · Kiswahili/English</small></div>' +
    '<button id="ajai-x" type="button" aria-label="Funga">×</button></div>' +
    '<div id="ajai-msgs" aria-live="polite"></div>' +
    '<div id="ajai-chips"></div>' +
    '<form id="ajai-form"><input id="ajai-in" autocomplete="off" maxlength="500" placeholder="Andika ujumbe wako..."/>' +
    '<button id="ajai-send" type="submit">Tuma</button></form>';
  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgs = panel.querySelector("#ajai-msgs");
  var input = panel.querySelector("#ajai-in");
  var sendBtn = panel.querySelector("#ajai-send");
  var chips = panel.querySelector("#ajai-chips");

  ["Nahitaji walinzi", "Huduma zenu ni zipi?", "Ninataka quote ya CCTV"].forEach(function (t) {
    var b = el("button", { type: "button" }, t);
    b.onclick = function () { send(t); };
    chips.appendChild(b);
  });

  bot("Karibu AJ Plus Security! 👋 Naweza kujibu maswali kuhusu huduma zetu na kukusaidia kujaza fomu ya quote. Unahitaji ulinzi wa aina gani?\n\nWelcome! I can also help in English.");

  btn.onclick = function () { panel.classList.toggle("open"); if (panel.classList.contains("open")) input.focus(); };
  panel.querySelector("#ajai-x").onclick = function () { panel.classList.remove("open"); };
  panel.querySelector("#ajai-form").onsubmit = function (e) {
    e.preventDefault();
    var t = input.value.trim();
    if (t) send(t);
  };

  /* ---------- Chat ---------- */
  function send(text) {
    if (busy) return;
    busy = true; sendBtn.disabled = true; input.value = ""; chips.style.display = "none";
    me(text);
    history.push({ role: "user", content: text });
    var typing = bot("…");

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        typing.textContent = d.reply || "Samahani, jaribu tena.";
        history.push({ role: "assistant", content: typing.textContent });
        if (d.form) {
          var n = fillForm(d.form);
          if (n) note("✓ Fomu imejazwa (" + n + " sehemu). Ikague kisha bonyeza Send via WhatsApp.");
        }
      })
      .catch(function () {
        typing.textContent = "Samahani, mtandao una tatizo. Tutumie WhatsApp: +255 762 307 647.";
        history.pop();
      })
      .then(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }

  function me(t) { return add("ajai-m ajai-me", t); }
  function bot(t) { return add("ajai-m ajai-bot", t); }
  function note(t) { return add("ajai-note", t); }
  function add(cls, t) {
    var d = el("div", { class: cls }, t);
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }

  /* ---------- Kujaza fomu ya ukurasa ---------- */
  function controls() {
    return Array.prototype.slice.call(
      document.querySelectorAll("form input, form select, form textarea")
    ).filter(function (e) { return e.id.indexOf("ajai") !== 0 && ["hidden", "submit", "button"].indexOf(e.type) < 0; });
  }
  function hint(e) {
    var parts = [e.name, e.id, e.placeholder, e.getAttribute("aria-label")];
    if (e.id) { var l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(e.id) : e.id) + '"]'); if (l) parts.push(l.textContent); }
    var w = e.closest("label"); if (w) parts.push(w.textContent);
    var p = e.previousElementSibling; if (p && p.tagName === "LABEL") parts.push(p.textContent);
    return parts.filter(Boolean).join(" ").toLowerCase();
  }
  function find(inc, exc, tag) {
    var list = controls();
    for (var i = 0; i < list.length; i++) {
      var e = list[i], h = hint(e);
      if (tag && e.tagName.toLowerCase() !== tag) continue;
      if (exc && exc.some(function (x) { return h.indexOf(x) >= 0; })) continue;
      if (inc.some(function (x) { return h.indexOf(x) >= 0; })) return e;
    }
    return null;
  }
  function setVal(e, v) {
    if (!e) return false;
    if (e.tagName === "SELECT") {
      var want = String(v).toLowerCase(), hit = null;
      Array.prototype.forEach.call(e.options, function (o) {
        var t = (o.text + " " + o.value).toLowerCase();
        if (!hit && (t.indexOf(want) >= 0 || want.indexOf(o.text.toLowerCase()) >= 0) && o.text.trim()) hit = o;
      });
      if (!hit) return false;
      e.value = hit.value;
    } else {
      var proto = e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(e, String(v));
    }
    e.dispatchEvent(new Event("input", { bubbles: true }));
    e.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  function fillForm(f) {
    var n = 0;
    function put(v, el) { if (v !== undefined && v !== null && v !== "" && setVal(el, v)) n++; }
    put(f.full_name, find(["full name", "name", "jina"], ["company", "business", "kampuni"]));
    put(f.company, find(["company", "business", "kampuni"]));
    put(f.phone, find(["phone", "tel", "simu"]));
    put(f.location, find(["location", "eneo", "address"]));
    put(f.service, find(["service", "huduma"], null, "select"));
    put(f.guards, find(["guard", "walinzi"]));
    put(f.details, find(["site", "detail", "message", "tell", "maelezo"], null, "textarea") || (controls().filter(function (e) { return e.tagName === "TEXTAREA"; })[0] || null));
    return n;
  }
})();
