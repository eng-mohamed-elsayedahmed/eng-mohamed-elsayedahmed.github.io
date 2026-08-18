/* Shared language layer for the tools and games.
 *
 * Every page keeps its English markup as the source of truth and declares a
 * window.I18N_AR dictionary keyed by that English text, so no page needs its
 * structure rewritten to become bilingual. A key beginning with "re:" is a
 * regular expression whose captures come back as $1, $2 — that is what covers
 * the sentences games build at runtime, like a final score.
 *
 * The choice is stored under the same key the front door uses, so picking
 * Arabic once carries across the whole domain.
 */
(function () {
  var AR = window.I18N_AR || {};
  var exact = {};
  var patterns = [];

  Object.keys(AR).forEach(function (k) {
    if (k.indexOf('re:') === 0) {
      patterns.push({ re: new RegExp(k.slice(3)), to: AR[k] });
    } else {
      exact[k.replace(/\s+/g, ' ').trim()] = AR[k];
    }
  });

  // a hint reads as one sentence even though <kbd> chops it into many text
  // nodes, so those elements are matched and replaced whole
  var BLOCKS = '.hint';
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var originalHTML = new WeakMap();

  function walkBlocks(root, toArabic) {
    var els = root.querySelectorAll ? root.querySelectorAll(BLOCKS) : [];
    var done = [];
    Array.prototype.forEach.call(els, function (el) {
      if (toArabic) {
        if (!originalHTML.has(el)) originalHTML.set(el, el.innerHTML);
        var out = translate(el.textContent);
        if (out !== null) { el.textContent = out; done.push(el); }
      } else if (originalHTML.has(el)) {
        el.innerHTML = originalHTML.get(el);
      }
    });
    return done;
  }
  var original = new WeakMap();     // node -> its English text
  var originalAttr = new WeakMap(); // element -> { attr: english }
  var lang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
  var busy = false;

  function translate(text) {
    var key = text.replace(/\s+/g, ' ').trim();
    if (!key) return null;
    if (exact[key] !== undefined) return exact[key];
    for (var i = 0; i < patterns.length; i++) {
      var m = key.match(patterns[i].re);
      if (m) {
        return patterns[i].to.replace(/\$(\d)/g, function (_, d) { return m[+d] === undefined ? '' : m[+d]; });
      }
    }
    return null;
  }

  function walkText(root, toArabic) {
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest(BLOCKS)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = it.nextNode())) nodes.push(n);

    nodes.forEach(function (node) {
      if (toArabic) {
        if (!original.has(node)) original.set(node, node.nodeValue);
        var out = translate(original.get(node));
        if (out !== null) node.nodeValue = out;
      } else if (original.has(node)) {
        node.nodeValue = original.get(node);
      }
    });
  }

  function walkAttrs(root, toArabic) {
    var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
    Array.prototype.forEach.call(els, function (el) {
      ATTRS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        if (toArabic) {
          var store = originalAttr.get(el) || {};
          if (store[a] === undefined) { store[a] = el.getAttribute(a); originalAttr.set(el, store); }
          var out = translate(store[a]);
          if (out !== null) el.setAttribute(a, out);
        } else {
          var s = originalAttr.get(el);
          if (s && s[a] !== undefined) el.setAttribute(a, s[a]);
        }
      });
    });
  }

  function apply(next) {
    lang = next;
    busy = true;
    var ar = lang === 'ar';
    document.documentElement.lang = ar ? 'ar' : 'en';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    walkBlocks(document.body, ar);
    walkText(document.body, ar);
    walkAttrs(document.body, ar);
    var btn = document.getElementById('i18n-toggle');
    if (btn) btn.textContent = ar ? 'English' : 'العربية';
    localStorage.setItem('lang', lang);
    busy = false;
  }

  function mountToggle() {
    var host = document.querySelector('.top');
    if (!host) return;
    var btn = document.createElement('button');
    btn.id = 'i18n-toggle';
    btn.type = 'button';
    btn.className = 'langbtn';
    btn.textContent = lang === 'ar' ? 'English' : 'العربية';
    btn.addEventListener('click', function () { apply(lang === 'ar' ? 'en' : 'ar'); });
    host.appendChild(btn);
  }

  function start() {
    mountToggle();
    if (lang === 'ar') apply('ar');

    // games write their results into the page as they are played
    var obs = new MutationObserver(function (records) {
      if (busy || lang !== 'ar') return;
      busy = true;
      records.forEach(function (r) {
        if (r.type === 'characterData' && r.target.parentNode) {
          var out = translate(r.target.nodeValue);
          if (out !== null && out !== r.target.nodeValue) {
            original.set(r.target, r.target.nodeValue);
            r.target.nodeValue = out;
          }
        }
        Array.prototype.forEach.call(r.addedNodes || [], function (n) {
          if (n.nodeType === 1) { walkText(n, true); walkAttrs(n, true); }
          else if (n.nodeType === 3) {
            var o = translate(n.nodeValue);
            if (o !== null) { original.set(n, n.nodeValue); n.nodeValue = o; }
          }
        });
      });
      busy = false;
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
