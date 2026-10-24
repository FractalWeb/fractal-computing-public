/* Working with Fractal page: its three animated diagrams. Loaded with defer at the
   end of working.html, so the diagrams' markup exists. They follow the How It Works
   diagrams (_anim.js): each is one loop, render(t) draws the whole diagram for any
   time t, and pausing, restarting and jumping to a step all work the same way. */

/* Shared by the three diagrams. animLoop runs one loop: the caption, step number,
   progress bar, Play/Pause and Restart buttons (ids <prefix>-text, -step, -fill,
   -play, -restart, as in _anim.js) and the clickable steps list under the diagram,
   if any (clicking a step shows it, paused). Like _anim.js it adds hidden copies of
   every caption so the caption box keeps one height, holds the frame while the
   diagram is off-screen, and starts paused for readers who ask for reduced motion.
   phases: [{t0, t1, show, text}], show being the frame a paused jump displays. */
var NS = 'http://www.w3.org/2000/svg';
function $ (id)        { return document.getElementById(id) }
function el (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e }
function between (t, a, b) { return t >= a && t < b }
function clamp01 (v)   { return v < 0 ? 0 : v > 1 ? 1 : v }
function ease (v)      { return v < .5 ? 2*v*v : 1 - Math.pow(-2*v + 2, 2)/2 }
function cls (id, name, on) { $(id).classList.toggle(name, !!on) }

/* trips: [token id, route id, start, end, hold]. A token travels its route (any
   SVG shape with a length) between start and end, then stays at the end of it
   until hold, if given. Tokens not on a trip at time t are hidden. */
function moveTokens (t, trips, toks) {
  var shown = {};
  trips.forEach(function(tr){
    if (!between(t, tr[2], tr[4] || tr[3])) return;
    var path = $(tr[1]), k = t < tr[3] ? ease((t - tr[2]) / (tr[3] - tr[2])) : 1;
    var pt   = path.getPointAtLength(path.getTotalLength() * k);
    $(tr[0]).setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
    shown[tr[0]] = true;
  });
  toks.forEach(function(id){ cls(id, 'anim-off', !shown[id]) });
}

function animLoop (prefix, T, phases, render, stepLis) {
  var cap = $(prefix + '-text').closest('.anim-cap');
  phases.forEach(function(p, i){
    var g = document.createElement('span'), s = document.createElement('span');
    g.className = 'anim-ghost'; g.setAttribute('aria-hidden', 'true');
    s.className = 'anim-ghost-step'; s.textContent = 'Step ' + (i + 1) + ' of ' + phases.length;
    g.appendChild(s); g.appendChild(document.createTextNode(p.text));
    cap.appendChild(g);
  });
  var view = {on: true}, box = $(prefix + '-play').closest('.diagram');
  if (window.IntersectionObserver)
    new IntersectionObserver(function(es){ view.on = es[es.length - 1].isIntersecting }).observe(box);

  function draw (t) {
    var i = 0; while (i < phases.length - 1 && t >= phases[i].t1) i++;
    render(t, i);
    if (stepLis) stepLis.forEach(function(li){ li.classList.toggle('active', +li.dataset.step === i + 1) });
    $(prefix + '-step').textContent = 'Step ' + (i + 1) + ' of ' + phases.length;
    $(prefix + '-text').textContent = phases[i].text;
    $(prefix + '-fill').style.width = (100 * t / T) + '%';
  }
  var reduce  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce, t = reduce ? phases[0].show : 0, last = null;
  function frame (now) {
    if (playing && view.on) { if (last !== null) t = (t + (now - last)) % T; last = now; draw(t) }
    else last = null;                                                  // off-screen or paused: hold the frame
    requestAnimationFrame(frame);
  }
  function setPlaying (on) {
    playing = on; last = null;
    $(prefix + '-play').textContent = on ? 'Pause' : 'Play';
    $(prefix + '-play').setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' animation');
  }
  $(prefix + '-play').addEventListener('click', function(){ setPlaying(!playing) });
  $(prefix + '-restart').addEventListener('click', function(){ t = 0; draw(t); setPlaying(true) });
  if (stepLis) stepLis.forEach(function(li){
    function go () { t = phases[+li.dataset.step - 1].show; setPlaying(false); draw(t) }
    li.addEventListener('click', go);
    li.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } });
  });
  setPlaying(playing); draw(t); requestAnimationFrame(frame);
}

/* "How applications are built" (15 s). The framework comes first; Fractal
   engineering builds two applications in-house; the Healthcare application is
   built with a partner, whose capability is licensed in for that application only;
   taking it into another application is blocked without the partner's permission;
   an enhancement goes into the framework, every application picks it up, and the
   next segment application appears. */
(function(){
  var T = 15000;
  var chips = ['Digital twin', 'Distributed computing', 'Multi-model database', 'Context libraries', 'AI integration'];
  var chipEls = chips.map(function(c, i){
    var g = el('g', {}, $('wb-chips')), x = 44 + i*182;
    var r = el('rect', {'class':'wk-chip', x:x, y:404, width:170, height:28, rx:5}, g);
    el('text', {'class':'d-s', x:x + 85, y:423, 'text-anchor':'middle'}, g).textContent = c;
    return {r:r, at: 300 + i*300};
  });
  var phases = [
    {t0:0,     t1:2500,  show:2000,  text:'Every Fractal application is built on the same Fractal Computing framework.'},
    {t0:2500,  t1:5500,  show:5400,  text:'Some applications are built completely in-house by Fractal engineering.'},
    {t0:5500,  t1:9000,  show:8700,  text:'Others are a collaboration: Fractal licenses a partner’s capability and builds it into the application.'},
    {t0:9000,  t1:11000, show:10500, text:'The license is for that application only. Using the capability anywhere else needs the partner’s permission.'},
    {t0:11000, t1:T,     show:14500, text:'Fractal keeps enhancing the framework: every application gets the improvements, and new segment applications follow.'}];
  var trips = [['tok-wb-app','wb-r1',2700,3700], ['tok-wb-app','wb-r3',4000,5100], ['tok-wb-app','wb-r2',5700,6600],
               ['tok-wb-cap','wb-r4',6900,8000], ['tok-wb-cap','wb-rb',9300,10100], ['tok-wb-up','wb-r5',11200,12200]];
  var toks  = ['tok-wb-app','tok-wb-cap','tok-wb-up'];
  var bands = [['wb-b1',3700], ['wb-b3',5100], ['wb-b2a',6600], ['wb-b2b',8000]];           // [band, arrives at]
  var tiles = [1,2,3].map(function(n){ return $('wb-tile' + n).querySelector('.wk-tile') });
  var UP    = [12200, 13000];                                                                   // the enhancement reaches every application

  function render (t) {
    moveTokens(t, trips, toks);
    var up = between(t, UP[0], UP[1]);
    cls('wb-fw',   'hl-back', t < 2500 || up);
    chipEls.forEach(function(c){ c.r.classList.toggle('on', between(t, c.at, 2500) || up) });
    cls('wb-eng',  'hl',      between(t, 2500, 6700) || between(t, 11000, 12200));
    cls('wb-part', 'hl-mid',  between(t, 6900, 8000) || between(t, 9000, 11000));
    bands.forEach(function(b){ $(b[0]).style.opacity = clamp01((t - b[1]) / 300) });
    tiles[0].classList.toggle('hl',     between(t, 3700, 4300) || up);
    tiles[2].classList.toggle('hl',     between(t, 5100, 5700) || up);
    tiles[1].classList.toggle('hl-mid', between(t, 8000, 9000) || between(t, 9000, 11000));
    tiles[1].classList.toggle('hl',     up);
    $('wb-block').style.opacity = between(t, 9000, 11000) ? clamp01((t - 9000) / 300) : 0;
    $('wb-ver').textContent     = t >= UP[0] ? 'RELEASE N+1' : 'RELEASE N';
    $('wb-tile4').style.opacity = clamp01((t - 12800) / 600);
  }
  animLoop('wb', T, phases, render, null);
})();

/* "Taking applications to market" (14 s): the service goes out directly to
   segment A and through a channel partner to segment B; subscription revenue comes
   back; Fractal pays the channel partner per role, then the collaboration partner
   as the revenue is collected. */
(function(){
  var T = 14000;
  var phases = [
    {t0:0,     t1:2500,  show:1600,  text:'In segment A, Fractal sells the application as a service directly to customers.'},
    {t0:2500,  t1:5500,  show:4400,  text:'In segment B, the application reaches customers through a channel partner.'},
    {t0:5500,  t1:8500,  show:6800,  text:'Customers pay subscriptions to the service, and the revenue is collected.'},
    {t0:8500,  t1:11000, show:9600,  text:'Fractal pays the channel partner for each role it performed.'},
    {t0:11000, t1:T,     show:12000, text:'The collaboration partner is paid as revenue from its application is collected.'}];
  var trips = [['tok-wm-a','wm-a',300,1800],      ['tok-wm-b','wm-b1',2700,3600], ['tok-wm-b','wm-b2',3800,4800],
               ['tok-wm-r1','wm-ra',5700,7000],   ['tok-wm-r2','wm-rb2',5700,6400], ['tok-wm-r2','wm-rb1',6500,7300],
               ['tok-wm-p','wm-pc',8700,9900],    ['tok-wm-p','wm-po',11200,12300]];
  var toks  = ['tok-wm-a','tok-wm-b','tok-wm-r1','tok-wm-r2','tok-wm-p'];

  function render (t, i) {
    moveTokens(t, trips, toks);
    cls('wm-ca', 'hl',      between(t, 1800, 2500));
    cls('wm-ch', 'hl',      between(t, 3600, 3900));
    cls('wm-ch', 'hl-back', between(t, 9900, 11000));
    cls('wm-cb', 'hl',      between(t, 4800, 5500));
    cls('wm-fr', 'glow',    between(t, 7000, 8500));
    cls('wm-co', 'hl-back', t >= 12300);
    for (var n = 1; n <= 5; n++) cls('wm-s' + n, 'active', n === i + 1);
  }
  animLoop('wm', T, phases, render, document.querySelectorAll('#wm-steps li[data-step]'));
})();

/* "Channel roles" (13 s): the six roles light up one at a time and each adds a
   segment to the partner's portion of revenue. The segments are equal and the bar
   is illustrative: the real portion is set per partner agreement. */
(function(){
  var T = 13000, STEP = 1600;
  var roles = [['Referral',          'Introduces a decision-maker; attends the first meeting',    'Referral'],          // as in the Channel Partner Agreement, Schedule B
               ['Sales support',     'Takes an active part in the sale, through to the close',    'Sales support'],
               ['Reseller',          'Manages the account; Level 1 technical support',            'Reseller'],
               ['Distributor',       'Manages a country outside the US',                          'Distributor'],
               ['System integrator', 'Deploys, enhances and supports (Level 2) the app',          'Integrator'],
               ['OEM',               'Builds it into its own offering; Level 3 support',          'OEM']];
  var BOT = 370, H = 53;                                                                        // bar bottom, segment height
  var rows = roles.map(function(r, i){
    var y = 46 + i*56, g = el('g', {}, $('wr-rows'));
    var box = el('rect',  {'class':'d-box', x:20, y:y, width:690, height:46, rx:6}, g);
    var num = el('g',     {'class':'d-num'}, g);
    el('circle', {'class':'d-num-out', cx:50, cy:y + 23, r:11}, num);
    el('text',   {'class':'d-num-t', x:50, y:y + 27, 'text-anchor':'middle'}, num).textContent = i + 1;
    el('text',   {'class':'d-t', x:78,  y:y + 28}, g).textContent = r[0];
    el('text',   {'class':'d-s', x:260, y:y + 28}, g).textContent = r[1];
    var seg = el('rect',  {'class':'wr-seg', x:756, y:BOT, width:108, height:0, rx:3, 'fill-opacity': .5 + i*.1}, $('wr-bar'));
    var lab = el('text',  {'class':'d-tok-t', x:810, y:BOT - i*H - H/2 + 3, 'text-anchor':'middle'}, $('wr-bar'));
    lab.textContent = r[2];
    return {box:box, num:num, seg:seg, lab:lab, at: 300 + i*STEP, i:i};
  });
  var phases = [
    {text:'Referral: the partner introduces Fractal to a decision-maker, and is paid for it.'},
    {text:'Sales support: working the sale through to the close adds to the partner’s portion.'},
    {text:'Reseller: managing the account and taking first-line support adds more.'},
    {text:'Distributor: managing a country outside the US adds more again.'},
    {text:'System integrator: deploying, enhancing and supporting the application adds more.'},
    {text:'OEM: building the application into its own offering, with Level 3 support, adds more.'},
    {text:'Every role is paid for, in whatever combination fits the partner: the more roles, the greater the portion.'}];
  phases.forEach(function(p, i){ p.t0 = i*STEP; p.t1 = i < 6 ? (i + 1)*STEP : T; p.show = i < 6 ? p.t0 + 1200 : 12000 });

  function render (t, i) {
    rows.forEach(function(r){
      var k = ease(clamp01((t - r.at) / 500)), h = (H - 3) * k;
      r.box.classList.toggle('wr-on', t >= r.at);
      r.box.classList.toggle('hl',    i === r.i);
      r.num.classList.toggle('active', t >= r.at);
      r.seg.setAttribute('y', BOT - r.i*H - h);
      r.seg.setAttribute('height', h);
      r.lab.style.opacity = k;
    });
  }
  animLoop('wr', T, phases, render, document.querySelectorAll('#wr-steps li[data-step]'));
})();

/* "Help spread the word" (14.5 s): a reference customer brings new customers one
   at a time; each purchase sends a -10% chip down to the price chart, and a new
   bar shows the reference customer's price, P x 0.9^n. The curve through the bar
   tops traces the geometric series. 12 customers fit the diagram; the series has
   no limit. */
(function(){
  if (!$('wc-cust')) return;                                                              // the customer section is held back (_working.html.IGNORE_cust_discount)
  var T = 14500, N = 12, BASE = 380, H = 180, STEP = 700, T1 = 2000;
  function xOf (n) { return n === 0 ? 120 : 280 + (n - 1)*58 }                          // bar 0 sits under the reference customer
  function top (n) { return BASE - H * Math.pow(0.9, n) }
  var custs = [], bars = [];
  for (var n = 0; n <= N; n++) {
    var x = xOf(n), at = T1 + (n - 1)*STEP;                                               // customer n appears at <at>
    if (n > 0) {
      var g = el('g', {'class':'wc-c'}, $('wc-cust'));
      el('circle', {'class':'wc-p', cx:x, cy:48, r:7}, g);
      el('path',   {'class':'wc-p', d:'M' + (x - 12) + ' 76 Q' + (x - 12) + ' 61 ' + x + ' 61 Q' + (x + 12) + ' 61 ' + (x + 12) + ' 76 Z'}, g);
      el('text',   {'class':'d-m', x:x, y:96, 'text-anchor':'middle'}, g).textContent = n;
      custs.push({g:g, at:at, x:x, n:n});
    }
    var b   = el('rect', {'class': n ? 'wc-bar' : 'wc-bar wc-bar0', x:x - 18, y:BASE, width:36, height:0, rx:3}, $('wc-bars'));
    var lab = el('text', {'class':'d-m wc-lab', x:x, y:top(n) - 6, 'text-anchor':'middle'}, $('wc-bars'));
    lab.textContent = Math.round(100 * Math.pow(0.9, n)) + '%';
    el('text', {'class':'d-m', x:x, y:396, 'text-anchor':'middle'}, $('wc-bars')).textContent = n;
    bars.push({r:b, lab:lab, x:x, n:n, at: n ? at + 600 : 0});                         // bar n grows once its chip lands
  }
  var phases = [
    {t0:0,      t1:T1,           show:1500,  text:'A reference customer helps spread the word about Fractal.'},
    {t0:T1,     t1:T1 + 1600,    show:3300,  text:'A customer it brings makes a purchase, and the price of its own system drops 10%, to 90%.'},
    {t0:T1 + 1600, t1:10600,     show:10400, text:'Every further customer takes another 10% off the price it is paying then: 81%, 73%, 66% …'},
    {t0:10600,  t1:T,            show:13500, text:'There is no limit: after 7 new customers the price is under half, and it keeps falling toward zero.'}];

  function render (t) {
    var shown = 0, tok = null;
    custs.forEach(function(c){
      c.g.style.opacity = clamp01((t - c.at) / 250);
      var k = (t - c.at - 100) / 500;                                                     // the -10% chip, customer to its bar
      if (k >= 0 && k < 1) tok = {x:c.x, y:84 + (top(c.n) - 28 - 84) * ease(k)};
    });
    bars.forEach(function(b){
      var k = b.n ? ease(clamp01((t - b.at) / 300)) : 1, h = H * Math.pow(0.9, b.n) * k;
      b.r.setAttribute('y', BASE - h); b.r.setAttribute('height', h);
      b.lab.style.opacity = k;
      if (k > 0) shown = b.n;
    });
    bars.forEach(function(b){ b.r.classList.toggle('cur', b.n === shown && t >= T1) });
    $('wc-curve').setAttribute('points', bars.slice(0, shown + 1).map(function(b){ return b.x + ',' + top(b.n) }).join(' '));
    if (tok) $('tok-wc').setAttribute('transform', 'translate(' + tok.x + ',' + tok.y + ')');
    cls('tok-wc', 'anim-off', !tok);
    cls('wc-you', 'hl', t < T1);
    cls('wc-formula', 'wc-hot', t >= 10600);
  }
  animLoop('wc', T, phases, render, null);
})();
