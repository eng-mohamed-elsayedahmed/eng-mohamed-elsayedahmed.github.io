/* Runtime shared by the games: a thumb stick, and a fit pass that keeps a
 * board inside whatever screen it is actually on.
 *
 * Games.mountStick(host, onDirection) -> onDirection('up'|'down'|'left'|'right')
 */
(function () {
  window.Games = window.Games || {};

  /* ---------------------------------------------------------------------
   * Real screen height.
   *
   * 100dvh is not trustworthy inside an in-app browser — the ones inside
   * LinkedIn, Instagram and the rest report a viewport taller than the part
   * you can see, so the page lays out correctly and then its bottom sits
   * under the edge of the screen. visualViewport reports what is genuinely
   * visible, so that is what the layout is given.
   * ------------------------------------------------------------------- */
  function measureViewport() {
    var vv = window.visualViewport;
    var h = vv ? vv.height : window.innerHeight;
    if (h) document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px');
  }

  /* ---------------------------------------------------------------------
   * Thumb stick.
   *
   * It floats: press anywhere in its zone and the stick comes to the thumb
   * rather than asking the thumb to find it. Direction is reported once per
   * quarter entered, with a margin near the diagonal so a wobbling thumb
   * does not flicker between two of them.
   * ------------------------------------------------------------------- */
  window.Games.mountStick = function (host, onDirection) {
    if (!host) return;

    host.innerHTML = '<div class="stick-base"><div class="stick-knob"></div></div>';
    var base = host.querySelector('.stick-base');
    var knob = host.querySelector('.stick-knob');

    var active = false, ox = 0, oy = 0, reach = 40, last = null;
    var DEAD = 14;   // px of travel before a push counts at all

    function direction(dx, dy) {
      if (Math.hypot(dx, dy) < DEAD) return null;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      var margin = last ? 1.35 : 1.12;
      if (ax > ay * margin) return dx > 0 ? 'right' : 'left';
      if (ay > ax * margin) return dy > 0 ? 'down' : 'up';
      return last;                       // too close to call, hold the current one
    }

    function place(dx, dy) {
      var d = Math.hypot(dx, dy);
      if (d > reach) { dx = dx / d * reach; dy = dy / d * reach; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }

    function begin(x, y) {
      var zone = host.getBoundingClientRect();
      var size = base.offsetWidth || 120;
      reach = size * 0.3;

      // the stick comes to the thumb, kept far enough inside the zone to stay whole
      var half = size / 2;
      var px = Math.min(Math.max(x - zone.left, half), Math.max(half, zone.width - half));
      var py = Math.min(Math.max(y - zone.top, half), Math.max(half, zone.height - half));
      base.style.left = px + 'px';
      base.style.top = py + 'px';

      ox = zone.left + px;
      oy = zone.top + py;
      active = true;
      last = null;
      base.classList.add('on');
      knob.style.transform = '';
    }

    function move(x, y) {
      if (!active) return;
      var dx = x - ox, dy = y - oy;
      place(dx, dy);
      var dir = direction(dx, dy);
      if (dir && dir !== last) { last = dir; onDirection(dir); }
      if (!dir) last = null;
    }

    function end() {
      if (!active) return;
      active = false;
      last = null;
      knob.style.transform = '';
      base.style.left = '';
      base.style.top = '';
      base.classList.remove('on');
    }

    host.addEventListener('touchstart', function (e) {
      e.preventDefault();
      begin(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    host.addEventListener('touchmove', function (e) {
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    ['touchend', 'touchcancel'].forEach(function (ev) {
      host.addEventListener(ev, function (e) { e.preventDefault(); end(); }, { passive: false });
    });

    host.addEventListener('mousedown', function (e) { e.preventDefault(); begin(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { if (active) move(e.clientX, e.clientY); });
    window.addEventListener('mouseup', end);
    window.addEventListener('blur', end);

    host.setAttribute('role', 'application');
    host.setAttribute('aria-label', 'Direction control');
  };

  /* ---------------------------------------------------------------------
   * Fit the board to the space left over.
   *
   * CSS cannot do this alone: deriving the width of a fixed-ratio box from
   * the height of a flexible parent needs that height to exist first, and it
   * only exists once the rest of the column has been laid out.
   * ------------------------------------------------------------------- */
  var reentry = false;

  window.Games.fitStage = function () {
    if (reentry) return;
    measureViewport();
    if (!document.body.classList.contains('fit')) return;

    var wide = window.matchMedia('(min-width:760px)').matches;
    Array.prototype.forEach.call(document.querySelectorAll('.stage'), function (stage) {
      var el = stage.querySelector('[data-fit]') || stage.firstElementChild;
      if (!el) return;
      if (wide) { el.style.width = ''; el.style.height = ''; return; }

      var ratio = parseFloat(el.dataset.ar || '0');
      if (!ratio) {
        var m = (getComputedStyle(el).aspectRatio || '').match(/([\d.]+)\s*\/\s*([\d.]+)/);
        ratio = m ? parseFloat(m[1]) / parseFloat(m[2]) : (el.offsetWidth / (el.offsetHeight || 1)) || 1;
      }
      var box = stage.getBoundingClientRect();
      var w = Math.max(80, Math.min(box.width, box.height * ratio));
      el.style.width = Math.floor(w) + 'px';
      el.style.height = Math.floor(w / ratio) + 'px';
    });

    // the games size their canvases from the box they are handed, so tell them
    // it changed; the guard stops that bouncing straight back in here
    reentry = true;
    window.dispatchEvent(new Event('resize'));
    reentry = false;
  };

  measureViewport();
  window.addEventListener('resize', function () { window.Games.fitStage(); });
  window.addEventListener('orientationchange', function () { setTimeout(window.Games.fitStage, 120); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () { window.Games.fitStage(); });
  }
  document.addEventListener('DOMContentLoaded', function () {
    window.Games.fitStage();
    // in-app browsers settle their chrome a moment after the page loads
    setTimeout(window.Games.fitStage, 250);
    setTimeout(window.Games.fitStage, 800);
  });
})();
