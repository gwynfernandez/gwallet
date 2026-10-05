/* GWallet — tiny inline-SVG charts. No libraries. */
(function () {
  'use strict';
  var GW = (window.GW = window.GW || {});

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Round the axis max so 4 grid steps land on friendly numbers (1, 2, 2.5, 5 x 10^k).
  function niceMax(v) {
    if (v <= 0) return 4;
    var step = v / 4, p = Math.pow(10, Math.floor(Math.log10(step))), n = step / p;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return m * p * 4;
  }
  function short(v, sym) {
    var a = Math.abs(v), s;
    if (a >= 1e6) s = (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
    else if (a >= 1e3) s = (Math.round(a / 100) / 10) + 'K';
    else s = String(Math.round(a));
    return (v < 0 ? '-' : '') + (sym || '') + s.replace('.0', '');
  }
  // Smooth path through points: horizontal-tangent cubic segments (no overshoot on flat steps).
  function smoothPath(pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i], mx = (p0[0] + p1[0]) / 2;
      d += ' C' + mx.toFixed(1) + ',' + p0[1].toFixed(1) + ' ' + mx.toFixed(1) + ',' + p1[1].toFixed(1) + ' ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1);
    }
    return d;
  }

  /* series: [{name, color, values:[...], fill}] ; opts: {sym, height, xLabel(i), tipTitle(i), format(v)} */
  function line(container, series, opts) {
    opts = opts || {};
    var W = Math.max(Math.round(container.clientWidth || 640), 260), H = opts.height || 240, L = 46, R = 12, T = 14, B = 26;
    var n = series[0] ? series[0].values.length : 0;
    var max = niceMax(Math.max.apply(null, [1].concat(series.map(function (s) { return Math.max.apply(null, s.values); }))));
    var x = function (i) { return L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R)); };
    var y = function (v) { return T + (1 - v / max) * (H - T - B); };
    var uid = 'g' + Math.random().toString(36).slice(2, 7);
    var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" class="chart-svg" role="img" aria-label="' + (opts.label || 'Chart') + '">';
    h += '<defs>';
    series.forEach(function (s, si) {
      h += '<linearGradient id="' + uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + s.color + '" stop-opacity="0.32"/><stop offset="100%" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient>';
    });
    h += '</defs>';
    for (var g = 0; g <= 4; g++) {
      var gv = (max / 4) * g, gy = y(gv);
      h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" class="grid"/>';
      h += '<text x="' + (L - 8) + '" y="' + (gy + 4) + '" class="axis" text-anchor="end">' + short(gv, opts.sym) + '</text>';
    }
    var every = opts.labelsEvery || (W < 420 ? 10 : 7);
    for (var i = 0; i < n; i += every) h += '<text x="' + x(i) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + (opts.xLabel ? opts.xLabel(i) : i + 1) + '</text>';
    series.forEach(function (s, si) {
      var pts = s.values.map(function (v, i) { return [x(i), y(v)]; });
      var p = smoothPath(pts);
      if (s.fill) h += '<path d="' + p + ' L' + x(n - 1) + ',' + y(0) + ' L' + x(0) + ',' + y(0) + ' Z" fill="url(#' + uid + si + ')" stroke="none"/>';
      h += '<path d="' + p + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linecap="round" class="line"/>';
    });
    h += '<g class="hover" style="display:none"><line class="hover-line" y1="' + T + '" y2="' + (H - B) + '"/>';
    series.forEach(function (s) { h += '<circle r="4.5" fill="' + s.color + '" stroke="var(--card)" stroke-width="2"/>'; });
    h += '</g><rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="transparent" class="hit"/></svg>';
    h += '<div class="chart-tip" style="display:none"></div>';
    container.innerHTML = h;

    var svg = container.querySelector('svg'), hover = svg.querySelector('.hover'), tip = container.querySelector('.chart-tip');
    var hl = hover.querySelector('line'), dots = hover.querySelectorAll('circle');
    function move(ev) {
      var r = svg.getBoundingClientRect();
      var cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * W;
      var i = Math.round(((cx - L) / (W - L - R)) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      hover.style.display = '';
      hl.setAttribute('x1', x(i)); hl.setAttribute('x2', x(i));
      var rows = '';
      series.forEach(function (s, si) {
        dots[si].setAttribute('cx', x(i)); dots[si].setAttribute('cy', y(s.values[i]));
        rows += '<div><i style="background:' + s.color + '"></i>' + s.name + '<b>' + (opts.format ? opts.format(s.values[i]) : s.values[i]) + '</b></div>';
      });
      tip.innerHTML = '<div class="tip-title">' + (opts.tipTitle ? opts.tipTitle(i) : 'Day ' + (i + 1)) + '</div>' + rows;
      tip.style.display = '';
      var px = (x(i) / W) * r.width;
      tip.style.left = Math.min(Math.max(px - tip.offsetWidth / 2, 0), r.width - tip.offsetWidth) + 'px';
    }
    function leave() { hover.style.display = 'none'; tip.style.display = 'none'; }
    var hit = svg.querySelector('.hit');
    hit.addEventListener('mousemove', move);
    hit.addEventListener('touchstart', move, { passive: true });
    hit.addEventListener('touchmove', move, { passive: true });
    hit.addEventListener('mouseleave', leave);
    return { show: function (i) { var r = svg.getBoundingClientRect(); move({ clientX: r.left + (x(i) / W) * r.width }); } };
  }

  /* slices: [{name, value, color}] */
  function donut(container, slices, opts) {
    opts = opts || {};
    var total = slices.reduce(function (a, s) { return a + s.value; }, 0);
    var R = 70, C = 2 * Math.PI * R, off = 0;
    var h = '<svg viewBox="0 0 200 200" class="donut-svg" role="img" aria-label="' + (opts.label || 'Breakdown') + '">';
    h += '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="var(--raised)" stroke-width="30"/>';
    if (total > 0) {
      slices.forEach(function (s) {
        var len = (s.value / total) * C;
        var gap = slices.length > 1 ? Math.min(2, len / 3) : 0;
        h += '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="' + s.color + '" stroke-width="30" stroke-dasharray="' + Math.max(len - gap, 0).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 100 100)"><title>' + s.name + '</title></circle>';
        off += len;
      });
    }
    h += '<text x="100" y="98" text-anchor="middle" class="donut-total">' + esc(opts.center || '') + '</text>';
    h += '<text x="100" y="118" text-anchor="middle" class="donut-sub">' + esc(opts.sub || '') + '</text></svg>';
    container.innerHTML = h;
  }

  GW.charts = { line: line, donut: donut, short: short };
})();
