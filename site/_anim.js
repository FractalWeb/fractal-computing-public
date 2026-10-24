/* How It Works page: the four animated diagrams, from the Enterprise AI technical
   overview (fractal-computing.docs apps/docs/Fractal_Enterprise_AI_v1.html).
   Loaded with defer at the end of how.html, so the diagrams' markup exists. */

/* Shared by the diagram animations below.
   animCaptions adds a hidden copy of every caption of a loop to its caption box,
   so the box reserves the height of the longest one (see .anim-cap in the CSS).
   animOnScreen reports whether a diagram is in view; each loop holds its frame
   while its diagram is off-screen, so nothing changes where the reader can't see
   it, and the loop picks up where it left off when it scrolls back into view. */
function animCaptions (prefix, phases) {
  var cap = document.getElementById(prefix + '-text').closest('.anim-cap');
  phases.forEach(function(p, i){
    var g = document.createElement('span'), s = document.createElement('span');
    g.className = 'anim-ghost'; g.setAttribute('aria-hidden', 'true');
    s.className = 'anim-ghost-step'; s.textContent = 'Step ' + (i + 1) + ' of ' + phases.length;
    g.appendChild(s); g.appendChild(document.createTextNode(p.text));
    cap.appendChild(g);
  });
}
function animOnScreen (prefix) {
  var view = {on: true}, box = document.getElementById(prefix + '-play').closest('.diagram');
  if (window.IntersectionObserver)
    new IntersectionObserver(function(es){ view.on = es[es.length - 1].isIntersecting }).observe(box);
  return view;
}

/* Architecture diagram animation.
   The 5 x 6 grid of Fractal instances is generated (each is a box for the
   instance, a green bar for its local data shard, and an accent bar that fills
   while the App runs on it). The animation is a single 14 s loop; render(t)
   draws the whole diagram for any time t, so pausing, restarting and jumping
   to a step all work the same way. */
(function(){
  var NS = 'http://www.w3.org/2000/svg', $ = function(id){ return document.getElementById(id) };
  var T  = 14000;                                                      // loop length, ms

  // ---- instances
  var grid = $('mesh-grid'), conv = $('converge'), insts = [];
  for (var r = 0; r < 6; r++) for (var c = 0; c < 5; c++) {
    var x = 742 + c*48, y = 104 + r*42;
    var box  = el('rect', {'class':'d-inst',      x:x,   y:y,    width:36, height:30, rx:4});
    var bar  = el('rect', {'class':'d-inst-bar',  x:x+6, y:y+19, width:24, height:5,  rx:1.5});
    var prog = el('rect', {'class':'d-inst-prog', x:x+6, y:y+8,  width:0,  height:5,  rx:1.5});
    grid.appendChild(box); grid.appendChild(bar); grid.appendChild(prog);
    var dot = el('circle', {'class':'d-conv anim-off', r:3.5});
    conv.appendChild(dot);
    insts.push({box:box, prog:prog, dot:dot, cx:x+18, cy:y+15,
                litAt: 4600 + c*170 + r*45,                            // wave spreads from the App's entry point
                jitter: ((c*7 + r*13) % 5) * 90});                     // instances finish at slightly different times
  }
  function el (tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e }

  // ---- phases (step, start, end, caption, representative frame for a paused jump)
  var phases = [
    {step:1, t0:0,     t1:1500,  show:800,   text:'The user states what they want, in plain language.'},
    {step:2, t0:1500,  t1:3500,  show:3000,  text:'The AI language model captures the intent and writes a Fractal App.'},
    {step:3, t0:3500,  t1:5900,  show:5300,  text:'The App is deployed to every instance in the Fractal Computing mesh.'},
    {step:4, t0:5900,  t1:9000,  show:7000,  text:'Every instance runs the App in parallel on its own local shard; results are aggregated.'},
    {step:5, t0:9000,  t1:11000, show:9600,  text:'The compact results, not the data, go back to the language model.'},
    {step:6, t0:11000, t1:T,     show:13000, text:'The model summarizes the results and presents them to the user.'}];

  // ---- moving tokens: [token id, arrow id, start, end]
  var trips = [['tok-intent','a1',200,1400], ['tok-app','a2',2500,3400], ['tok-app','a3',3500,4600],
               ['tok-res','a4',8150,9000],   ['tok-res','a5',9100,10100], ['tok-sum','a6',11100,12100]];
  var toks  = ['tok-intent','tok-app','tok-res','tok-sum'];
  var stepLis = document.querySelectorAll('.steps li[data-step]');
  var MESH_EXIT = {x:720, y:345};                                      // where results leave the mesh (arrow 4)

  function between (t, a, b) { return t >= a && t < b }
  function clamp01 (v)       { return v < 0 ? 0 : v > 1 ? 1 : v }
  function ease (v)          { return v < .5 ? 2*v*v : 1 - Math.pow(-2*v + 2, 2)/2 }
  function cls (id, name, on){ $(id).classList.toggle(name, !!on) }

  function render (t) {
    var ph = phases.filter(function(p){ return between(t, p.t0, p.t1) })[0] || phases[5];

    // tokens
    var shown = {};
    trips.forEach(function(tr){
      if (!between(t, tr[2], tr[3])) return;
      var path = $(tr[1]), pt = path.getPointAtLength(path.getTotalLength() * ease((t - tr[2]) / (tr[3] - tr[2])));
      $(tr[0]).setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
      shown[tr[0]] = true;
    });
    toks.forEach(function(id){ cls(id, 'anim-off', !shown[id]) });

    // nodes
    cls('n-user', 'hl',      between(t, 0, 400) || t >= 12100);
    cls('n-lm',   'glow',    between(t, 1400, 2500) || between(t, 10100, 11100));
    cls('n-app',  'hl',      between(t, 3300, 4700));
    cls('n-mesh', 'hl',      between(t, 4600, 8150));
    cls('n-res',  'hl-back', between(t, 8900, 10100));
    cls('bubble', 'anim-off', t < 12100);

    // instances: light up as the App arrives, fill a progress bar while it runs, then send results to the exit
    insts.forEach(function(it){
      it.box.classList.toggle('lit', between(t, it.litAt, 8150));
      it.prog.setAttribute('width', t >= 8150 ? 0 : 24 * clamp01((t - 5900 - it.jitter) / 1400));
      var k = (t - 7650) / 500;
      if (k >= 0 && k < 1) {
        var e = ease(k);
        it.dot.setAttribute('cx', it.cx + (MESH_EXIT.x - it.cx) * e);
        it.dot.setAttribute('cy', it.cy + (MESH_EXIT.y - it.cy) * e);
        it.dot.classList.remove('anim-off');
      } else it.dot.classList.add('anim-off');
    });

    // step numbers, steps list, caption, progress
    for (var i = 1; i <= 6; i++) cls('s' + i, 'active', i === ph.step);
    stepLis.forEach(function(li){ li.classList.toggle('active', +li.dataset.step === ph.step) });
    $('anim-step').textContent = 'Step ' + ph.step + ' of 6';
    $('anim-text').textContent = ph.text;
    $('anim-fill').style.width = (100 * t / T) + '%';
  }

  // ---- clock
  animCaptions('anim', phases); var view = animOnScreen('anim');
  var reduce  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce, t = reduce ? phases[0].show : 0, last = null;
  function frame (now) {
    if (playing && view.on) { if (last !== null) t = (t + (now - last)) % T; last = now; render(t) }
    else last = null;                                                  // off-screen or paused: hold the frame
    requestAnimationFrame(frame);
  }
  function setPlaying (on) {
    playing = on; last = null;
    $('anim-play').textContent = on ? 'Pause' : 'Play';
    $('anim-play').setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' animation');
  }
  $('anim-play').addEventListener('click', function(){ setPlaying(!playing) });
  $('anim-restart').addEventListener('click', function(){ t = 0; render(t); setPlaying(true) });
  stepLis.forEach(function(li){                                        // clicking a step shows that step, paused
    function go () { t = phases[+li.dataset.step - 1].show; setPlaying(false); render(t) }
    li.addEventListener('click', go);
    li.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } });
  });
  setPlaying(playing); render(t); requestAnimationFrame(frame);
})();

/* "A single Fractal" diagram animation. Like the architecture diagram, one loop
   (13 s) with render(t) drawing the whole diagram for any time t. Stages:
   the general-purpose ecosystem fades as the Fractal stack builds up from the
   bottom; an AI-written App drops into the Application Code layer; the same
   stack then fills each platform row with instances; the scale-invariance
   caption holds. */
(function(){
  var NS = 'http://www.w3.org/2000/svg', $ = function(id){ return document.getElementById(id) };
  var T  = 13000;
  function el (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e }
  function clamp01 (v) { return v < 0 ? 0 : v > 1 ? 1 : v }
  function ease (v)    { return v < .5 ? 2*v*v : 1 - Math.pow(-2*v + 2, 2)/2 }

  // ---- ecosystem: 6 x 9 grid of general-purpose components (infra, data, apps)
  var labels = ['AWS','Azure','GCP','K8s','Docker','RHEL','VMw','Terra','Vault','Consul','Nginx','Istio','Prom','Grafna','Helm','Envoy','EKS','Ansibl',
                'Spark','Hadoop','Kafka','Flink','Hive','Presto','Druid','Pinot','RedShf','dbt','Airflw','Beam','Storm','Arrow','Trino','HDFS','Elastc','EMR',
                'React','Angulr','Vue','Node','Spring','Rails','Django','Nest','Next','Exprss','Flask','FstAPI','gRPC','REST','GQL','Redis','Mongo','PgSQL'];
  var eco = $('eco-grid'), ecoCells = [];
  for (var r = 0; r < 9; r++) for (var c = 0; c < 6; c++) {
    var x = 30 + c*36, y = 76 + r*28, g = el('g', {'class':'eco-g'}, eco);
    el('rect', {'class':'eco-cell', x:x, y:y, width:33, height:24, rx:3}, g);
    el('text', {'class':'eco-t', x:x+16.5, y:y+15, 'text-anchor':'middle'}, g).textContent = labels[r*6 + c];
    ecoCells.push({g:g, fadeAt: 300 + ((r*6 + c) * 37 % 54) * 40});    // fade in a scattered order
  }

  // ---- stack layers build bottom-up
  var layers = Array.prototype.slice.call(document.querySelectorAll('.stk-layer'));

  // ---- platform rows: label + illustrative instance glyphs (each glyph = App / processing / data bands)
  var plats = [['Smartphone','1 INSTANCE',1], ['Tablet','1–10 INSTANCES',10], ['Desktop PC','10–20 INSTANCES',20],
               ['Mac mini / NUC clone','100–400 INSTANCES',50], ['Large server','1,000+ INSTANCES',64]];
  var rowsEl = $('plat-rows'), glyphs = [], rowT0 = [5000, 5600, 6400, 7300, 8400], rowT1 = [5300, 6300, 7200, 8300, 9600];
  plats.forEach(function(p, i){
    var y = 76 + i*54;
    el('rect', {'class':'d-box', x:556, y:y, width:424, height:46, rx:6}, rowsEl);
    el('text', {'class':'plat-t', x:568, y:y+20}, rowsEl).textContent = p[0];
    el('text', {'class':'d-m',    x:568, y:y+36}, rowsEl).textContent = p[1];
    var n = p[2], perRow = 32, twoRows = n > perRow;
    for (var k = 0; k < n; k++) {
      var gx = 714 + (k % perRow) * 8, gy = twoRows ? y + 6 + Math.floor(k / perRow) * 18 : y + 15;
      var g = el('g', {'class':'gl'}, rowsEl);
      el('rect', {'class':'gl-a', x:gx, y:gy,    width:6, height:4}, g);
      el('rect', {'class':'gl-p', x:gx, y:gy+5,  width:6, height:4}, g);
      el('rect', {'class':'gl-d', x:gx, y:gy+10, width:6, height:4}, g);
      glyphs.push({g:g, at: rowT0[i] + (rowT1[i] - rowT0[i]) * k / n});
    }
  });

  var phases = [
    {t0:0,     t1:3000, show:2900,  text:'The general-purpose enterprise ecosystem is distilled to the essential 0.1%: one small, complete stack.'},
    {t0:3000,  t1:5000, show:4000,  text:'The AI language model writes a small App that plugs into the Application Code layer and uses the context libraries.'},
    {t0:5000,  t1:10000, show:9800, text:'The same stack, running the same App, scales by adding instances: from 1 on a smartphone to 1,000+ on a large server.'},
    {t0:10000, t1:T,     show:12000, text:'Scale invariant: an App that is correct on one instance is correct on all of them.'}];

  function render (t) {
    var step = phases.filter(function(p){ return t >= p.t0 && t < p.t1 })[0] || phases[3], si = phases.indexOf(step);
    ecoCells.forEach(function(c){ c.g.style.opacity = 1 - .7 * clamp01((t - c.fadeAt) / 500) });
    layers.forEach(function(l){                                         // bottom layer (data-i 7) first
      var at = 600 + (7 - +l.dataset.i) * 260;
      l.style.opacity = clamp01((t - at) / 300);
    });
    var k = clamp01((t - 3200) / 900);                                  // App token drops into Application Code
    $('tok2').classList.toggle('anim-off', !(t >= 3200 && t < 4100));
    $('tok2').setAttribute('transform', 'translate(400,' + (4 + 87 * ease(k)) + ')');
    $('stk-app').classList.toggle('hl', t >= 4100 && t < 5200);
    glyphs.forEach(function(g){ g.g.style.opacity = t >= g.at ? 1 : 0 });
    $('anim2-step').textContent = 'Step ' + (si + 1) + ' of 4';
    $('anim2-text').textContent = step.text;
    $('anim2-fill').style.width = (100 * t / T) + '%';
  }

  animCaptions('anim2', phases); var view = animOnScreen('anim2');
  var reduce  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce, t = reduce ? phases[3].show : 0, last = null;
  function frame (now) {
    if (playing && view.on) { if (last !== null) t = (t + (now - last)) % T; last = now; render(t) }
    else last = null;                                                  // off-screen or paused: hold the frame
    requestAnimationFrame(frame);
  }
  function setPlaying (on) {
    playing = on; last = null;
    $('anim2-play').textContent = on ? 'Pause' : 'Play';
    $('anim2-play').setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' animation');
  }
  $('anim2-play').addEventListener('click', function(){ setPlaying(!playing) });
  $('anim2-restart').addEventListener('click', function(){ t = 0; render(t); setPlaying(true) });
  setPlaying(playing); render(t); requestAnimationFrame(frame);
})();

/* 90-day proof-of-concept animation. A day cursor sweeps days 1-90 and then
   "after day 90"; the Fractal lane, the sync arrows, the daily metric bars and
   the milestones appear as it passes. The systems-of-record lane is drawn
   in full from the start because production never stops. render(t) draws the
   whole diagram for any time t, as in the other two diagrams. */
(function(){
  var NS = 'http://www.w3.org/2000/svg', $ = function(id){ return document.getElementById(id) };
  var T = 12000, MS_PER_DAY = 100, X0 = 210, X90 = 850, XEND = 980;
  function X (d) { return X0 + d * (X90 - X0) / 90 }
  function el (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e }

  // axis ticks
  [[1,'DAY 1'],[14,'14'],[60,'60'],[90,'90']].forEach(function(tk){
    el('line', {'class':'poc-axis', x1:X(tk[0]), y1:46, x2:X(tk[0]), y2:54}, $('poc-ticks'));
    el('text', {'class':'d-m', x:X(tk[0]), y:40, 'text-anchor': tk[0] === 1 ? 'start' : 'middle'}, $('poc-ticks')).textContent = tk[1];
  });
  el('text', {'class':'d-m', x:916, y:40, 'text-anchor':'middle'}, $('poc-ticks')).textContent = 'AFTER 90';

  // one-way sync arrows, systems of record -> twin, from day 3 onward
  var syncs = [];
  for (var d = 3; d <= 87; d += 7) syncs.push({d:d, e: el('line', {'class':'d-sync poc-fade', x1:X(d), y1:104, x2:X(d), y2:144, 'marker-end':'url(#ah-poc)'}, $('poc-sync'))});

  // daily metric samples, days 15-60 (illustrative heights, trending up)
  var bars = [];
  for (var d = 15; d <= 60; d++) {
    var h = 16 + (d - 15) * .45 + 8 * ((d * 37) % 7) / 7;
    bars.push({d:d, e: el('rect', {'class':'gl-a poc-fade', x:X(d) - 2.5, y:264 - h, width:5, height:h, rx:1}, $('poc-bars'))});
  }

  // milestones
  var ms = [[14,'Replica verified'], [40,'Promotion workflow tested'], [90,'Transition decision']].map(function(m){
    var g = el('g', {'class':'poc-fade'}, $('poc-ms')), x = X(m[0]);
    el('path', {'class':'poc-dia', d:'M' + x + ' 282 l9 9 l-9 9 l-9 -9 z'}, g);
    el('text', {'class':'d-s', x:x, y:316, 'text-anchor': m[0] === 90 ? 'middle' : 'middle'}, g).textContent = m[1];
    return {d:m[0], e:g};
  });

  var phases = [
    {t0:0,    t1:1450,  show:1000,  text:'Days 1–14: the twin is provisioned on commodity hardware, one-way sync is set up, and the replica is verified against production.'},
    {t0:1450, t1:6050,  show:4500,  text:'Days 15–60: AI-generated Fractal Apps run on the twin in parallel with production, and metrics accumulate daily.'},
    {t0:6050, t1:9050,  show:8000,  text:'Days 61–90: results are compared with the production baseline, and the client decides on the transition using measured data.'},
    {t0:9050, t1:T,     show:11000, text:'After day 90: workloads move on the client’s timeline. There is no hard cutover; legacy systems stay available.'}];
  var lis = document.querySelectorAll('#start li[data-phase]');

  function render (t) {
    var day = Math.min(t / MS_PER_DAY, 90), after = t > 9050;
    var cx = after ? X90 + (XEND - X90) * Math.min((t - 9050) / 1400, 1) : X(Math.max(day, 1));
    $('poc-cur').setAttribute('transform', 'translate(' + cx + ',0)');
    $('poc-cur-t').textContent = after ? 'Day 90+' : 'Day ' + Math.max(1, Math.floor(day));
    $('poc-clip-r').setAttribute('width', cx);
    $('poc-cur').style.opacity = t > 10450 ? 0 : 1;                       // sweep done: let the full timeline show
    syncs.forEach(function(s){ s.e.style.opacity = X(s.d) <= cx ? 1 : 0 });
    bars.forEach(function(b){ b.e.style.opacity = X(b.d) <= cx ? 1 : 0 });
    ms.forEach(function(m){ m.e.style.opacity = X(m.d) <= cx + .5 ? 1 : 0 });
    $('poc-base').style.opacity = $('poc-base-t').style.opacity = t >= 1450 ? 1 : 0;
    $('poc-cmp').style.opacity = t >= 6050 ? 1 : 0;

    var step = phases.filter(function(p){ return t >= p.t0 && t < p.t1 })[0] || phases[3], si = phases.indexOf(step);
    lis.forEach(function(li){ li.classList.toggle('active', +li.dataset.phase === si + 1) });
    $('anim3-step').textContent = 'Step ' + (si + 1) + ' of 4';
    $('anim3-text').textContent = step.text;
    $('anim3-fill').style.width = (100 * t / T) + '%';
  }

  animCaptions('anim3', phases); var view = animOnScreen('anim3');
  var reduce  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce, t = reduce ? phases[3].show : 0, last = null;
  function frame (now) {
    if (playing && view.on) { if (last !== null) t = (t + (now - last)) % T; last = now; render(t) }
    else last = null;                                                  // off-screen or paused: hold the frame
    requestAnimationFrame(frame);
  }
  function setPlaying (on) {
    playing = on; last = null;
    $('anim3-play').textContent = on ? 'Pause' : 'Play';
    $('anim3-play').setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' animation');
  }
  $('anim3-play').addEventListener('click', function(){ setPlaying(!playing) });
  $('anim3-restart').addEventListener('click', function(){ t = 0; render(t); setPlaying(true) });
  lis.forEach(function(li){                                            // clicking a phase shows it, paused
    function go () { t = phases[+li.dataset.phase - 1].show; setPlaying(false); render(t) }
    li.addEventListener('click', go);
    li.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } });
  });
  setPlaying(playing); render(t); requestAnimationFrame(frame);
})();

/* Locality pipeline animation (14 s loop, render(t) draws any moment).
   Top row: one request stalls at each of the 7 abstraction boundaries, and a
   "×10" wait tag appears at each, compounding to ~10^7. Bottom row: data blocks
   stream through storage -> RAM -> L2 -> registers the whole time, several in
   flight at once, so the CPU is always busy. Step 1 highlights the top row
   while the request crawls; step 2 highlights the pipeline. */
(function(){
  var NS = 'http://www.w3.org/2000/svg', $ = function(id){ return document.getElementById(id) };
  var T = 14000;
  function el (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e }
  function ease (v) { return v < .5 ? 2*v*v : 1 - Math.pow(-2*v + 2, 2)/2 }

  // ---- top row: 7 boundaries, each with a ×10 wait tag
  var names = ['Application','ORM','Conn. pool','Network','DB server','Storage eng.','Disk I/O'], bounds = [];
  names.forEach(function(n, i){
    var x = 190 + i*113;
    var r = el('rect', {'class':'d-box', x:x, y:68, width:100, height:44, rx:6}, $('pipe-bounds'));
    el('text', {'class':'stk-t', x:x+50, y:95, 'text-anchor':'middle'}, $('pipe-bounds')).textContent = n;
    var tag = el('g', {'class':'pipe-tag'}, $('pipe-bounds'));
    el('rect', {'class':'pipe-wait', x:x+30, y:131, width:40, height:18, rx:9}, tag);
    el('text', {'class':'pipe-pill-t pipe-wait-t', x:x+50, y:144, 'text-anchor':'middle'}, tag).textContent = '×10';
    bounds.push({r:r, tag:tag, cx:x+50});
  });
  var MOVE = 300, STALL = 900;                                         // per boundary: travel, then wait

  // ---- bottom row: 4 tiers with arrows, and a stream of blocks
  var tiers = [['SOURCE','Persistent storage','stk-store'], ['STAGE 1','RAM','stk-data'], ['STAGE 2','L2 cache','stk-proc'], ['INFERENCE','CPU registers','stk-app']];
  var cpu;
  tiers.forEach(function(tr, i){
    var x = 190 + i*205;
    var r = el('rect', {'class':tr[2], x:x, y:214, width:160, height:56, rx:6}, $('pipe-tiers'));
    el('text', {'class':'d-m',   x:x+80, y:229, 'text-anchor':'middle'}, $('pipe-tiers')).textContent = tr[0];
    el('text', {'class':'stk-t', x:x+80, y:263, 'text-anchor':'middle'}, $('pipe-tiers')).textContent = tr[1];
    if (i < 3) el('line', {'class':'d-out', x1:x+162, y1:242, x2:x+203, y2:242, 'marker-end':'url(#ah-pipe)'}, $('pipe-tiers'));
    if (i === 3) cpu = r;
  });
  var P0 = 270, P1 = 885, SPACING = 41, SPEED = .16, blocks = [];      // px, px, px, px per ms
  for (var k = 0; k < Math.ceil((P1 - P0) / SPACING); k++)
    blocks.push(el('rect', {'class':'gl-a', y:237, width:14, height:10, rx:2}, $('pipe-blocks')));

  var phases = [
    {t0:0,    t1:8600, show:6000,  text:'Conventional stack: each abstraction boundary adds about 10 I/O wait states, so the CPU spends almost all its time waiting.'},
    {t0:8600, t1:T,    show:11000, text:'Fractal: the stream processor moves data through RAM and L2 cache into CPU registers ahead of time, so the model never waits.'}];

  function render (t) {
    // top row: which boundary is the request at, and is it moving or stalled?
    var seg = MOVE + STALL, i = Math.min(Math.floor(t / seg), 7), within = t - i*seg;
    var tok = $('pipe-tok');
    if (i < 7) {
      var from = i === 0 ? 168 : bounds[i-1].cx, to = bounds[i].cx;
      var x = within < MOVE ? from + (to - from) * ease(within / MOVE) : to;
      tok.setAttribute('transform', 'translate(' + x + ',122)');
      tok.classList.remove('anim-off');
    } else tok.classList.add('anim-off');
    bounds.forEach(function(b, j){
      var reached = t >= j*seg + MOVE;
      b.tag.style.opacity = reached ? 1 : 0;
      b.r.classList.toggle('hl-mid', j === i && within >= MOVE);
    });

    // bottom row: continuous pipelined stream; blocks fade in at the source and out as they are consumed
    var off = (t * SPEED) % SPACING;
    blocks.forEach(function(b, k){
      var x = P0 + off + k*SPACING;
      b.setAttribute('x', x - 7);
      b.style.opacity = Math.max(0, Math.min(1, (x - P0) / 20, (P1 - x) / 20));
    });
    cpu.style.strokeWidth = 1.5 + 1.5 * (1 + Math.sin(t / 110)) / 2;   // registers always busy

    var step = t < phases[1].t0 ? phases[0] : phases[1], si = phases.indexOf(step);
    $('pipe-row1').classList.toggle('on', si === 0);
    $('pipe-row2').classList.toggle('on', si === 1);
    $('anim4-step').textContent = 'Step ' + (si + 1) + ' of 2';
    $('anim4-text').textContent = step.text;
    $('anim4-fill').style.width = (100 * t / T) + '%';
  }

  animCaptions('anim4', phases); var view = animOnScreen('anim4');
  var reduce  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce, t = reduce ? phases[1].show : 0, last = null;
  function frame (now) {
    if (playing && view.on) { if (last !== null) t = (t + (now - last)) % T; last = now; render(t) }
    else last = null;                                                  // off-screen or paused: hold the frame
    requestAnimationFrame(frame);
  }
  function setPlaying (on) {
    playing = on; last = null;
    $('anim4-play').textContent = on ? 'Pause' : 'Play';
    $('anim4-play').setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' animation');
  }
  $('anim4-play').addEventListener('click', function(){ setPlaying(!playing) });
  $('anim4-restart').addEventListener('click', function(){ t = 0; render(t); setPlaying(true) });
  setPlaying(playing); render(t); requestAnimationFrame(frame);
})();
