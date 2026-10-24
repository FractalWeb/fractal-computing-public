/* Site-wide browser behavior, loaded by partials/_head.ejs on every page.
   Theme: the page follows the OS light/dark setting until the reader picks one
   with the toggle; the choice is kept in localStorage (applied before first paint
   by an inline script in _head.ejs). Menu: on narrow screens the navigation
   links move into a drawer opened by the menu button. Videos marked
   data-play-visible play (muted) only while on screen and pause when scrolled
   away; a reader who pauses one keeps it paused. Timelines marked data-animate draw
   their line down to each milestone in turn the first time they come into view
   (see .timeline[data-animate] in style_site.css); readers who ask for reduced
   motion see them complete at once. */
(function(){
  var root = document.documentElement;
  function isDark () {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  document.addEventListener('DOMContentLoaded', function(){
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', function(){
      var t = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t) } catch (e) {}
    });

    var menuBtn = document.getElementById('menuBtn'), drawer = document.getElementById('navDrawer');
    function setMenu (open) {
      drawer.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', function(){ setMenu(!drawer.classList.contains('open')) });
      drawer.addEventListener('click', function(e){ if (e.target.closest('a')) setMenu(false) });
      window.addEventListener('resize', function(){ if (window.innerWidth > 900) setMenu(false) });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false) });
    }

    var vids = document.querySelectorAll('video[data-play-visible]');
    if (vids.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          var v = en.target;
          if (en.isIntersecting) { if (!v._userPaused && v.paused) { var p = v.play(); if (p) p.catch(function(){}) } }
          else if (!v.paused) { v._autoPause = true; v.pause() }
        });
      }, {threshold: 0.25});                                            // "visible" = at least a quarter of the video on screen
      vids.forEach(function(v){
        v.addEventListener('pause', function(){ if (v._autoPause) v._autoPause = false; else v._userPaused = true });   // a pause we didn't make is the reader's
        v.addEventListener('play',  function(){ v._userPaused = false });
        io.observe(v);
      });
    }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.timeline[data-animate]').forEach(function(tl){
      var lis = Array.prototype.slice.call(tl.children), done = false;
      function stops () { return lis.map(function(li){ return li.offsetTop + 12 }) }          // each dot's center, from the top of the track
      function finish () { var s = stops(); done = true; tl.style.setProperty('--tl-p', s[s.length - 1] + 'px'); lis.forEach(function(li){ li.classList.add('on') }) }
      function run () {
        var s = stops(), end = s[s.length - 1], D = 750 * lis.length, t0 = null;
        function step (now) {
          if (t0 === null) t0 = now;
          var k = Math.min(1, (now - t0) / D), h = end * (1 - Math.pow(1 - k, 2));            // ease out
          tl.style.setProperty('--tl-p', h + 'px');
          lis.forEach(function(li, i){ if (h >= s[i] - 1) li.classList.add('on') });
          if (k < 1) requestAnimationFrame(step); else done = true;
        }
        requestAnimationFrame(step);
      }
      window.addEventListener('resize', function(){ if (done) finish() });                      // text rewraps, so the dots move
      if (reduce || !('IntersectionObserver' in window)) return finish();
      var tio = new IntersectionObserver(function(entries){
        if (!entries.some(function(en){ return en.isIntersecting })) return;
        tio.disconnect(); run();
      }, {threshold: 0.35});
      tio.observe(tl);
    });
  });
})();
