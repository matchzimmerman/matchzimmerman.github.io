/* =====================================================================
   MZCAM · MZTV drone camera crew  (v1.0.0)
   ---------------------------------------------------------------------
   Extracted from 48 PLANT (crew / director / surveillance bay) as a
   module any MZTV piece can attach to. The crew is presentation only:
   it never changes the system it films.

   The host supplies:
     - shots: what each drone should do (where to fly, what to aim at,
       when it is ready, how much the director wants it)
     - renderView(ctx, w, h, P, viewer, thumb): draw the world through a
       projector P (used for the program feed and the bay monitors)
     - optional avoid(pos, d) to keep drones out of the subject
     - optional gate(t) to allow cuts only on certain moments (e.g. on
       the beat)

   The crew does:
     - flight: drones fly to marks off air (climb to cruise altitude,
       travel, descend), slide out of the live lens, never cut mid-move
     - aim: a critically damped spring on the look point and lens angle,
       so a stiff spring gives quick whip pans and a soft one slow drift
     - direction: cuts only to drones that are on their mark and ready,
       holds a shot between minHold and maxHold, and lets an urgent shot
       interrupt
     - the bay: one live monitor per drone and a plan of the studio
     - drawing drones as small cubes with a lens, so each one appears in
       the others' shots

   Usage:
     const crew = new MZCam.Crew({ drones: [{ name, col }, ...], ... });
     crew.assign(drone, shot);  crew.update(dt, t);  crew.renderProgram(...)
   ===================================================================== */
(function (root) {
  'use strict';

  // ---------- vectors ----------
  const V = (x = 0, y = 0, z = 0) => ({ x, y, z });
  const add = (a, b) => V(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => V(a.x - b.x, a.y - b.y, a.z - b.z);
  const mul = (a, k) => V(a.x * k, a.y * k, a.z * k);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const len = a => Math.hypot(a.x, a.y, a.z);
  const norm = a => { const l = len(a) || 1; return V(a.x / l, a.y / l, a.z / l); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpV = (a, b, k) => V(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
  const finV = (p, d) => V(fin(p.x, d ? d.x : 0), fin(p.y, d ? d.y : 0), fin(p.z, d ? d.z : 0));
  const UP = V(0, 1, 0);

  // ---------- lens + projector ----------
  function lens(pos, look, fov) {
    const f = norm(sub(look, pos));
    let r = cross(f, UP); if (len(r) < 1e-4) r = V(1, 0, 0); r = norm(r);
    return { pos, look, f, r, u: cross(r, f), fov };
  }
  // A projector draws world points through one lens into a w×h target.
  function projector(cam, w, h, near = 0.5) {
    const focal = (h / 2) / Math.tan(cam.fov * Math.PI / 360);
    const toCam = p => { const vx = p.x - cam.pos.x, vy = p.y - cam.pos.y, vz = p.z - cam.pos.z;
      return [vx * cam.r.x + vy * cam.r.y + vz * cam.r.z, vx * cam.u.x + vy * cam.u.y + vz * cam.u.z, vx * cam.f.x + vy * cam.f.y + vz * cam.f.z]; };
    const scr = c => [w / 2 + c[0] * focal / c[2], h / 2 - c[1] * focal / c[2], c[2]];
    const P = {
      cam, w, h, focal, near,
      toCam,
      proj(p) { const c = toCam(p); return c[2] < near ? null : scr(c); },
      px(z) { return focal / z; }, // pixels per world unit at depth z
      // polygon clipped against the near plane; returns screen points or null
      poly(pts) {
        const C = pts.map(toCam), out = [];
        for (let i = 0; i < C.length; i++) {
          const a = C[i], b = C[(i + 1) % C.length], ain = a[2] >= near, bin = b[2] >= near;
          if (ain) out.push(a);
          if (ain !== bin) { const k = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), near]); }
        }
        return out.length >= 3 ? out.map(scr) : null;
      },
      // segment clipped against the near plane
      seg(a, b) {
        let A = toCam(a), B = toCam(b);
        if (A[2] < near && B[2] < near) return null;
        if (A[2] < near) { const k = (near - A[2]) / (B[2] - A[2]); A = [lerp(A[0], B[0], k), lerp(A[1], B[1], k), near]; }
        if (B[2] < near) { const k = (near - B[2]) / (A[2] - B[2]); B = [lerp(B[0], A[0], k), lerp(B[1], A[1], k), near]; }
        return [scr(A), scr(B)];
      },
      // screen y of the horizon (the ground plane at infinity straight ahead)
      horizon() {
        const fh = norm(V(cam.f.x, 0, cam.f.z)); const far = add(cam.pos, mul(fh, 1e6));
        const c = toCam(V(far.x, cam.pos.y, far.z));
        return c[2] > 0 ? scr(c)[1] : (cam.f.y < 0 ? -h * 4 : h * 5);
      },
    };
    return P;
  }

  // ---------- springs ----------
  // critically damped second-order follower; w = response in rad/s (higher = snappier pans)
  function springV(state, target, w, dt) {
    if (!state.v) state.v = V();
    const x = sub(state.p, target);
    const a = sub(mul(x, -w * w), mul(state.v, 2 * w));
    state.v = add(state.v, mul(a, dt)); state.p = add(state.p, mul(state.v, dt));
  }
  function springN(state, target, w, dt) {
    const a = -w * w * (state.p - target) - 2 * w * (state.v || 0);
    state.v = (state.v || 0) + a * dt; state.p += state.v * dt;
  }

  // ---------- the crew ----------
  const DEFAULTS = {
    speed: 90,        // max flight speed, world units / s
    accel: 70,        // max acceleration
    cruise: 30,       // altitude used to travel between marks
    minAlt: 1,        // never below this
    arrive: 1.5,      // within this distance of a mark = on mark
    tallyCol: '#ff3d8b',
    size: 1,          // cube size for drawing
    avoid: null,      // (pos, d) => pos
    gate: null,       // (t) => bool: may the director cut now?
    stepMax: 0.1,     // physics substep
    clearLive: true,  // slide out of the live lens
    clearDist: 60,    // how far in front of the live lens that matters
    onCut: null,      // (from, to, t)
  };

  class Crew {
    constructor(opts) {
      this.o = Object.assign({}, DEFAULTS, opts || {});
      this.drones = (this.o.drones || []).map((s, i) => ({
        id: i, name: s.name || 'CAM ' + (i + 1), col: s.col || '#f4dc2a', role: s.role || null,
        pos: s.pos ? V(s.pos.x, s.pos.y, s.pos.z) : V(Math.cos(i * 1.7) * 40, this.o.cruise, Math.sin(i * 1.7) * 40),
        vel: V(), aim: null, fov: { p: s.fov || 40, v: 0 },
        shot: null, moving: false, arrivedAt: -1, trail: [], cam: null, lastTrail: -1, status: 'IDLE',
      }));
      this.live = 0; this.liveSince = 0; this.now = 0; this.cuts = 0; this.log = [];
      this.pending = null; // a decided cut waiting for the gate
    }
    get liveDrone() { return this.drones[this.live]; }

    assign(d, shot) {
      if (d.shot && d.shot.release) d.shot.release(d);
      d.shot = shot; d.arrivedAt = -1; d.assignedAt = this.now;
      if (shot && shot.start) shot.start(d, this);
    }
    free() { return this.drones.filter(d => d.id !== this.live && (!d.shot || this._done(d))); }
    _done(d) { return !d.shot || (d.shot.done ? !!d.shot.done(this.now, d, this) : false); }

    // where the drone should be right now, and whether it follows (moves with) the pose on air
    _goal(d, t) {
      const s = d.shot; if (!s) return null;
      if (s.pose) { const p = s.pose(t, d, this); return p ? { pos: p.pos, follow: true } : null; }
      if (s.mark) { const m = typeof s.mark === 'function' ? s.mark(t, d, this) : s.mark; return m ? { pos: m.pos || m, follow: false } : null; }
      return null;
    }

    update(dt, t) {
      dt = clamp(fin(dt, 0), 0, 0.25); this.now = t;
      const n = Math.max(1, Math.ceil(dt / this.o.stepMax)), h = dt / n;
      for (let i = 0; i < n; i++) this._fly(h, t);
      for (const d of this.drones) this._aim(d, dt, t);
      this._direct(t);
    }

    _fly(dt, t) {
      const o = this.o, live = this.liveDrone;
      for (const d of this.drones) {
        const g = this._goal(d, t);
        const onAir = d.id === this.live;
        if (!g) { d.vel = mul(d.vel, Math.max(0, 1 - dt * 2)); d.pos = add(d.pos, mul(d.vel, dt)); d.moving = len(d.vel) > 0.5; continue; }
        if (g.follow) {
          // follow shots move with their pose; off air they fly to it first
          const to = sub(g.pos, d.pos), dist = len(to);
          if (d.arrivedAt >= 0 && dist < Math.max(8, o.arrive * 6)) { d.vel = mul(sub(g.pos, d.pos), 1 / Math.max(dt, 1e-3)); d.pos = g.pos; d.moving = false; }
          else this._travel(d, g.pos, dt, onAir ? 3 : 1.6, true);
          if (dist < o.arrive * 3 && d.arrivedAt < 0) d.arrivedAt = this.now;
        } else {
          if (onAir && d.arrivedAt >= 0) { d.vel = V(); d.moving = false; } // on air at a mark: hold still
          else this._travel(d, g.pos, dt, 1);
          if (len(sub(g.pos, d.pos)) < o.arrive && d.arrivedAt < 0) { d.arrivedAt = this.now; d.pos = g.pos; d.vel = V(); d.moving = false; }
        }
        // keep out of the live lens while travelling
        if (o.clearLive && d !== live && live.cam && d.moving) {
          const c = live.cam, v = sub(d.pos, c.pos), z = dot(v, c.f), x = dot(v, c.r), y = dot(v, c.u), tn = Math.tan(c.fov * Math.PI / 360) * 1.2;
          if (z > 0 && z < o.clearDist && Math.abs(y) < z * tn && Math.abs(x) < z * tn * 1.9) d.pos = add(d.pos, add(mul(c.r, (x >= 0 ? 1 : -1) * 40 * dt), V(0, 10 * dt, 0)));
        }
        if (o.avoid) d.pos = o.avoid(d.pos, d) || d.pos;
        d.pos = V(fin(d.pos.x), Math.max(o.minAlt, fin(d.pos.y, o.cruise)), fin(d.pos.z));
      }
    }
    // accelerate toward a point; climb to cruise altitude for long hops
    _travel(d, goal, dt, boost, direct) {
      const o = this.o;
      const hz = Math.hypot(goal.x - d.pos.x, goal.z - d.pos.z);
      const via = hz > 40 && !direct ? V(goal.x, Math.max(goal.y, o.cruise), goal.z) : goal;
      const to = sub(via, d.pos), dist = len(to);
      const vmax = Math.min(o.speed * boost, Math.sqrt(2 * o.accel * boost * Math.max(0, dist)) + 0.5);
      const want = dist > 1e-3 ? mul(to, vmax / dist) : V();
      const dv = sub(want, d.vel), dl = len(dv), amax = o.accel * boost * dt;
      d.vel = dl > amax ? add(d.vel, mul(dv, amax / dl)) : want;
      d.pos = add(d.pos, mul(d.vel, dt));
      d.moving = len(sub(goal, d.pos)) > o.arrive;
    }

    _aim(d, dt, t) {
      const s = d.shot;
      let want = s && s.aim ? s.aim(t, d, this) : null;
      if (!want) want = { look: d.aim ? d.aim.p : add(d.pos, V(0, -0.3, 1)), fov: d.fov.p };
      const w = s && s.pan ? s.pan : 4;
      if (!d.aim || !Number.isFinite(d.aim.p.x)) d.aim = { p: V(want.look.x, want.look.y, want.look.z), v: V() };
      // a fresh shot snaps its aim while off air, so it is framed before it is cut to
      if (d.id !== this.live && d.arrivedAt >= 0 && this.now - d.arrivedAt < 0.05) d.aim = { p: V(want.look.x, want.look.y, want.look.z), v: V() };
      const n = Math.max(1, Math.ceil(dt / 0.02)), h = dt / n;
      for (let i = 0; i < n; i++) { springV(d.aim, want.look, w, h); springN(d.fov, clamp(fin(want.fov, 40), 4, 110), w * 0.6, h); }
      d.aim.p = finV(d.aim.p, want.look); d.fov.p = clamp(fin(d.fov.p, 40), 4, 110);
      d.cam = lens(d.pos, len(sub(d.aim.p, d.pos)) < 0.01 ? add(d.pos, V(0, 0, 1)) : d.aim.p, d.fov.p);
      // status for the bay
      d.status = d.id === this.live ? 'ON AIR' : !d.shot ? 'IDLE' : d.arrivedAt >= 0 && !d.moving ? 'ON MARK' : 'MOVING';
      if (this.lastTrailT === undefined || t - (d.lastTrail || -1) > 0.5) { d.lastTrail = t; d.trail.push([d.pos.x, d.pos.z]); if (d.trail.length > 40) d.trail.shift(); }
    }

    ready(d) {
      if (!d.shot || d.arrivedAt < 0 || d.moving) return false;
      if (d.shot.minPrep && this.now - d.arrivedAt < d.shot.minPrep) return false;
      return d.shot.ready ? !!d.shot.ready(this.now, d, this) : true;
    }
    want(d) { return d.shot ? (d.shot.want ? fin(d.shot.want(this.now, d, this), 0) : 1) : 0; }

    _direct(t) {
      const live = this.liveDrone, held = t - this.liveSince, s = live.shot || {};
      const minHold = s.minHold != null ? s.minHold : 3, maxHold = s.maxHold != null ? s.maxHold : 20;
      const liveDone = this._done(live), liveWant = live.shot ? this.want(live) : 0;
      let best = null, bw = 0;
      for (const d of this.drones) {
        if (d.id === this.live || !this.ready(d)) continue;
        const w = this.want(d); if (w > bw) { bw = w; best = d; }
      }
      let cut = null;
      if (best && held >= minHold && (liveDone || held >= maxHold || bw >= liveWant + 1)) cut = best;
      else if (best && (!live.shot)) cut = best;
      if (cut) this.pending = cut; else if (this.pending && !this.ready(this.pending)) this.pending = null;
      if (this.pending && (!this.o.gate || this.o.gate(t))) { this.cutTo(this.pending); this.pending = null; }
    }
    cutTo(d) {
      if (!d || d.id === this.live) return;
      const from = this.liveDrone; this.live = d.id; this.liveSince = this.now; this.cuts++;
      if (d.shot && d.shot.onAir) d.shot.onAir(this.now, d, this);
      if (this.o.onCut) this.o.onCut(from, d, this.now);
    }

    // ---------- drawing a drone: a small cube with a lens ----------
    drawDrone(ctx, P, d, opts = {}) {
      if (!d.cam) return null;
      const s = (opts.size || this.o.size) * 0.5, f = norm(V(d.cam.f.x, 0, d.cam.f.z)), r = norm(cross(f, UP)), u = UP;
      const c = d.pos, corner = (a, b, e) => add(c, add(mul(f, a * s), add(mul(r, b * s), mul(u, e * s))));
      const faces = [
        { n: f, q: [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)], k: 1.0, front: true },
        { n: mul(f, -1), q: [corner(-1, 1, -1), corner(-1, -1, -1), corner(-1, -1, 1), corner(-1, 1, 1)], k: 0.55 },
        { n: r, q: [corner(1, 1, -1), corner(-1, 1, -1), corner(-1, 1, 1), corner(1, 1, 1)], k: 0.75 },
        { n: mul(r, -1), q: [corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)], k: 0.75 },
        { n: u, q: [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)], k: 1.15 },
        { n: mul(u, -1), q: [corner(-1, 1, -1), corner(1, 1, -1), corner(1, -1, -1), corner(-1, -1, -1)], k: 0.4 },
      ];
      const pc = P.proj(c); if (!pc) return null;
      const px = P.px(pc[2]) * s * 2;
      const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const ch = sh => clamp(Math.round(((n >> sh) & 255) * k), 0, 255); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
      if (px < 2.2) { // far away: a dot
        ctx.fillStyle = d.col; ctx.fillRect(Math.round(pc[0] - 1), Math.round(pc[1] - 1), 2, 2);
      } else {
        for (const F of faces) {
          if (dot(F.n, sub(P.cam.pos, add(c, mul(F.n, s)))) <= 0) continue;
          const q = P.poly(F.q); if (!q) continue;
          ctx.fillStyle = shade(d.col, F.k); ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
          if (F.front) { // lens
            const lc = P.proj(add(c, mul(f, s * 1.01))); if (lc) { const R = Math.max(1, P.px(lc[2]) * s * 0.55);
              ctx.fillStyle = opts.lensCol || '#141a3a'; ctx.beginPath(); ctx.arc(lc[0], lc[1], R, 0, 6.283); ctx.fill();
              if (R > 2.5) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(lc[0] - R * 0.3, lc[1] - R * 0.3, R * 0.3, 0, 6.283); ctx.fill(); } }
          }
        }
      }
      if (opts.live || d.id === this.live) { // tally light on top
        const tp = P.proj(add(c, V(0, s * 1.6, 0))); if (tp) { ctx.fillStyle = this.o.tallyCol; ctx.beginPath(); ctx.arc(tp[0], tp[1], Math.max(1.2, px * 0.12), 0, 6.283); ctx.fill(); }
      }
      return pc;
    }
  }

  // ---------- the surveillance bay: one monitor per drone + a plan ----------
  class Bay {
    constructor(crew, opts) {
      this.crew = crew; this.o = Object.assign({ w: 192, h: 108, planW: 300, planH: 300 }, opts);
      this.on = this.o.on !== false; this.i = 0; this.mons = [];
      const el = this.el = document.createElement('div'); el.className = 'mzcam-bay';
      const plan = document.createElement('canvas'); plan.width = this.o.planW; plan.height = this.o.planH; plan.className = 'mzcam-plan';
      el.appendChild(plan); this.plan = plan.getContext('2d');
      for (const d of crew.drones) {
        const wrap = document.createElement('div'); wrap.className = 'mzcam-mon';
        const c = document.createElement('canvas'); c.width = this.o.w; c.height = this.o.h; wrap.appendChild(c);
        const lab = document.createElement('div'); lab.className = 'mzcam-lab'; wrap.appendChild(lab);
        el.appendChild(wrap); this.mons.push({ c, g: c.getContext('2d'), lab, wrap });
      }
      (this.o.parent || document.body).appendChild(el);
      this.show(this.on);
    }
    show(on) { this.on = on; this.el.style.display = on ? '' : 'none'; }
    // call every frame; renders one monitor per call (round robin) to stay cheap
    tick(frame) {
      if (!this.on) return;
      const crew = this.crew;
      if (frame % (this.o.every || 2) === 0) {
        const i = (this.i++) % crew.drones.length, d = crew.drones[i], M = this.mons[i];
        if (d.cam) { const P = projector(d.cam, this.o.w, this.o.h); try { this.o.render(M.g, this.o.w, this.o.h, P, d, true); } catch (e) { console.warn('bay', e); } }
      }
      if (frame % 4 === 1) this.drawPlan();
      if (frame % 10 === 3) this.labels();
    }
    labels() {
      const crew = this.crew;
      this.mons.forEach((M, i) => { const d = crew.drones[i], live = crew.live === i;
        M.wrap.classList.toggle('live', live);
        M.lab.textContent = `${d.name} · ${d.shot && d.shot.label ? d.shot.label : 'IDLE'} · ${d.status}${live ? ' ' + Math.floor(crew.now - crew.liveSince) + 's' : ''}`;
        M.lab.style.borderLeftColor = d.col; });
    }
    drawPlan() {
      const g = this.plan, W = g.canvas.width, H = g.canvas.height, b = this.o.bounds; // {x0,x1,z0,z1}
      const sc = Math.min(W / (b.x1 - b.x0), H / (b.z1 - b.z0)) * 0.92;
      const ox = W / 2 - (b.x0 + b.x1) / 2 * sc, oz = H / 2 - (b.z0 + b.z1) / 2 * sc;
      const map = (x, z) => [ox + x * sc, oz + z * sc];
      if (this.o.planBg) this.o.planBg(g, W, H, map, sc); else { g.fillStyle = '#10163a'; g.fillRect(0, 0, W, H); }
      const ink = this.o.planInk || '#e9ecff';
      for (const d of this.crew.drones) {
        const live = this.crew.live === d.id;
        g.strokeStyle = 'rgba(233,236,255,0.18)'; g.lineWidth = 1; g.beginPath(); d.trail.forEach((q, i) => { const p = map(q[0], q[1]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();
        const p = map(d.pos.x, d.pos.z); const f = d.cam ? d.cam.f : V(1, 0, 0), a = Math.atan2(f.z, f.x), half = d.fov.p * Math.PI / 360;
        g.fillStyle = live ? 'rgba(255,61,139,0.28)' : 'rgba(233,236,255,0.07)';
        g.beginPath(); g.moveTo(p[0], p[1]); g.arc(p[0], p[1], live ? 46 : 30, a - half, a + half); g.closePath(); g.fill();
        g.fillStyle = d.col; g.fillRect(p[0] - 3, p[1] - 3, 6, 6); if (live) { g.strokeStyle = this.crew.o.tallyCol; g.lineWidth = 1.5; g.strokeRect(p[0] - 4.5, p[1] - 4.5, 9, 9); g.lineWidth = 1; }
        g.fillStyle = ink; g.font = '10px "JetBrains Mono", monospace'; g.fillText(String(d.id + 1), p[0] + 6, p[1] - 5);
      }
      if (this.o.planFg) this.o.planFg(g, W, H, map, sc);
    }
  }

  root.MZCam = { version: '1.0.0', V, add, sub, mul, dot, cross, len, norm, lerp, lerpV, clamp, fin, UP, lens, projector, springV, springN, Crew, Bay };
})(typeof window !== 'undefined' ? window : globalThis);
