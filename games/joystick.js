/* A thumb stick for the direction games.
 *
 * Arrow buttons ask a thumb to travel between four separate targets. A stick
 * stays under the thumb: press anywhere on it, push, and the direction comes
 * out. It reports a direction the moment the push passes a small dead zone,
 * and again whenever the push crosses into a different quarter, so holding it
 * over to one side does not spam the game with repeats.
 *
 * Games.mountStick(host, onDirection)  ->  onDirection('up'|'down'|'left'|'right')
 */
(function () {
  window.Games = window.Games || {};

  window.Games.mountStick = function (host, onDirection) {
    if (!host) return;

    host.innerHTML = '<div class="stick-base"><div class="stick-knob"></div></div>';
    var base = host.querySelector('.stick-base');
    var knob = host.querySelector('.stick-knob');

    var active = false, cx = 0, cy = 0, radius = 1, last = null;
    var DEAD = 0.28;   // fraction of the radius before a push counts

    function place(dx, dy) {
      var d = Math.hypot(dx, dy);
      var max = radius * 0.62;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }

    /* A thumb never pushes on a clean axis, so near the diagonal the dominant
       one keeps swapping and the direction flickers. The winning axis has to
       beat the other by a margin before it counts, and once a direction is
       held it takes a clearer push to leave it. */
    function direction(dx, dy) {
      var d = Math.hypot(dx, dy);
      if (d < radius * DEAD) return null;

      var ax = Math.abs(dx), ay = Math.abs(dy);
      var margin = last ? 1.35 : 1.12;
      var horizontal;
      if (ax > ay * margin) horizontal = true;
      else if (ay > ax * margin) horizontal = false;
      else return last;                      // too close to call, keep going

      return horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }

    function begin(x, y) {
      var r = base.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      radius = r.width / 2;
      active = true;
      last = null;
      base.classList.add('on');
      var dx = x - cx, dy = y - cy;
      place(dx, dy);
      var dir = direction(dx, dy);
      if (dir) { last = dir; onDirection(dir); }
    }

    function move(x, y) {
      if (!active) return;
      var dx = x - cx, dy = y - cy;
      place(dx, dy);
      var dir = direction(dx, dy);
      if (dir && dir !== last) { last = dir; onDirection(dir); }
      if (!dir) last = null;
    }

    function end() {
      active = false;
      last = null;
      base.classList.remove('on');
      knob.style.transform = '';
    }

    base.addEventListener('touchstart', function (e) {
      e.preventDefault();
      begin(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    base.addEventListener('touchmove', function (e) {
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    ['touchend', 'touchcancel'].forEach(function (ev) {
      base.addEventListener(ev, function (e) { e.preventDefault(); end(); }, { passive: false });
    });

    base.addEventListener('mousedown', function (e) { e.preventDefault(); begin(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { if (active) move(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function () { if (active) end(); });

    // keyboard users already have arrow keys, but the stick should not be a trap
    base.setAttribute('role', 'application');
    base.setAttribute('aria-label', 'Direction control');
  };

  /* Fit the board to whatever space is left, keeping its ratio. CSS cannot do
     this on its own: it would need the stage height to derive the width from,
     and that height only exists after the rest of the row has been laid out. */
  var reentry = false;
  window.Games.fitStage = function () {
    if (reentry) return;
    if (!document.body.classList.contains('fit')) return;
    var wide = window.matchMedia('(min-width:760px)').matches;
    document.querySelectorAll('.stage').forEach(function (stage) {
      var el = stage.querySelector('[data-fit]') || stage.firstElementChild;
      if (!el) return;
      if (wide) { el.style.width = ''; el.style.height = ''; return; }

      var ratio = parseFloat(el.dataset.ar || '0');
      if (!ratio) {
        var css = getComputedStyle(el).aspectRatio || '';
        var m = css.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        ratio = m ? parseFloat(m[1]) / parseFloat(m[2]) : (el.offsetWidth / (el.offsetHeight || 1)) || 1;
      }
      var box = stage.getBoundingClientRect();
      var w = Math.min(box.width, box.height * ratio);
      el.style.width = Math.floor(w) + 'px';
      el.style.height = Math.floor(w / ratio) + 'px';
    });
    // the games size their canvases from the box they are given, so tell them
    // the box just changed — the guard keeps that from bouncing back here
    reentry = true;
    window.dispatchEvent(new Event('resize'));
    reentry = false;
  };

  window.addEventListener('resize', function () { window.Games.fitStage(); });
  window.addEventListener('orientationchange', function () { setTimeout(window.Games.fitStage, 60); });
  document.addEventListener('DOMContentLoaded', function () { window.Games.fitStage(); });
})();