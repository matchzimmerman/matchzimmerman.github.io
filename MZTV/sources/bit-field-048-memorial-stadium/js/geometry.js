/* MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · geometry (Phase 01, provisional 1959)
   Pure module: no DOM. Builds the stadium as triangles in metres.
   Frame: origin = home plate at field level; +x east, +z north, +y up.
   Every triangle carries a material and a CLAIM id (see evidence.js), so the
   EVIDENCE view shows what each surface rests on.                               */
import { claimByKey as K } from './evidence.js';

const FT = 0.3048, D2R = Math.PI / 180;

/* ---------- dimensions: each one names where it comes from ---------- */
export const DIM = (() => {
  const back = 72 * FT;                  // backstop 72 ft (1957, S10) → front of the stands behind home
  const pole = 309 * FT / Math.SQRT2;    // foul pole at 309 ft (S01) → x = z = 66.6 m
  // fit one circle through (0,-back) and (±pole, pole): the lower-deck front wall (claim 'bowl')
  const cz = (2 * pole * pole - back * back) / (2 * (back + pole));
  const R0 = cz + back;
  const thPole = Math.atan2(pole, cz - pole);           // angle from south, toward east
  const d = {
    back, pole, cz, R0, thPole,
    wallH: 8 * FT,                        // 8 ft field wall, lowered in 1961 (S01)
    lowRows: 36, lowTread: 0.84, lowRise: 0.38,         // 46 lifetime rows − ~10 rows of 1961 boxes (S02)
    over: 11,                              // upper deck front 11 m out over the lower deck ("shaded most of it", S02)
    fasciaLow: 16.8, upY0: 18.6,
    upRows: 33, upTread: 0.80, upRise: 0.40,            // 33 rows (S02); rim measured ~32.6 m, about 3 m under the façade top (HABS MD-1111-3, -15)
    upShort: 50 * FT,                      // 1954 deck ended ~50 ft short of the poles each side (1964 extension, S02)
    colR: 19, colStep: 6,                  // columns: radius from front wall, every 6°  (assumed)
    // football (S15): 120 yd × 160 ft
    fieldW: 160 * FT, fieldL: 120 * 0.9144, endZ: 10 * 0.9144,
    endS: -8.0,                            // south end line z (claim 'gridiron', fitted: see GEOMETRY.md)
    hashIn: 20 * 0.9144,                   // hash marks 20 yd in from each sideline (pre-1972)
    postGap: 18.5 * FT, barH: 10 * FT, postH: 25 * FT,
    // outfield (S01, S02)
    cornerWall: 14 * FT, cf: 445 * FT, rcf: 446 * FT,
    // scoreboard (S01): 65 ft tall; width and offset assumed
    sbH: 65 * FT, sbW: 28, sbZ: 152, sbX: 0,
    poleH: 20,
    // exterior (S12: 116 ft; width, depth, pylons assumed)
    // memorial façade, measured from HABS MD-1111-15 (scale: 116 ft height; check: the 10-ft name letters measure 3.1 m)
    facade: { h: 116 * FT, z: -62.5, depth: 7.5, panelW: 19.3, infill: 5.1, pylon: 3.9, panelY0: 4.0, panelY1: 30.5, bandY1: 34.8, sealY: 26.7, sealR: 3.0 },
    // the 1954 entrance canopy and planter (HABS MD-1111-16, -18, -19, -20; plan approximated from oblique views)
    canopy: { y: 3.9, t: .45, hx: 26, z0: -62.5, z1: -74, holeZ: -68.5, hrx: 5.5, hrz: 3.2 },
    // brick concourse ring under the open upper tier (HABS MD-1111-3, -11, -12): height measured ~18.5 m
    ringOut: 34, ringH: 18.5,
    // streets (S05: which side; positions and widths assumed)
    streets: { n33: -100, ellerslie: -150, ednor: 150, z36: 200 },   // 33rd St ~37 m south of the façade (forecourt lawn, HABS MD-1111-3)
    // Baltimore City College, ~400 m WSW across 33rd St (S23; from its address; footprint and hill assumed)
    cityCollege: { x0: -470, x1: -330, z0: -300, z1: -230, hill: 7 }
  };
  d.lowBackR = R0 + d.lowRows * d.lowTread;
  d.lowBackY = d.wallH + (d.lowRows - 1) * d.lowRise;
  d.upFrontR = R0 + d.over;
  d.upBackR = d.upFrontR + d.upRows * d.upTread;
  d.upTopY = d.upY0 + (d.upRows - 1) * d.upRise;
  d.thUp = d.thPole - d.upShort / (R0 + d.over + 14);
  d.ringR = R0 + d.ringOut;
  d.goalS = d.endS + d.endZ; d.goalN = d.endS + d.fieldL - d.endZ; d.endN = d.endS + d.fieldL;
  d.fifty = (d.goalS + d.goalN) / 2;
  return d;
})();

/* point on the horseshoe: angle th from south toward east, radius r from the fitted centre */
export const pol = (th, r, y) => [Math.sin(th) * r, y, DIM.cz - Math.cos(th) * r];
export const softUnder = r => DIM.fasciaLow + (r - DIM.upFrontR) * (DIM.upRise / DIM.upTread);

export const MAT = { GROUND:1, FIELD:2, WALL:3, CONCRETE:4, CROWD_L:5, CROWD_U:6, SOFFIT:7, COLUMN:8, FASCIA:9,
  EXTERIOR:10, SCOREBOARD:11, SB_FACE:12, POST:13, HOUSE:14, ROOF:15, TREE:16, BLEACHER:17, FENCE:18, PRESSBOX:19, CLOCK:20, FACADE:21, FACADE_FACE:22, ROAD:23, PAVING:24, GRASS:25, CAR:26, STONE:27, PORCH:28, LAMP:29, GRANITE:30, LAMPBANK:31, HEDGE:32, CANOPY:33, PLAYER:34 };
export const MAT_NAME = Object.fromEntries(Object.entries(MAT).map(([k, v]) => [v, k]));

export function buildStadium(opt = {}) {
  const seg = opt.segDeg || 3, D = DIM;
  const P = [], M = [], C = [], A = [], U = [], V = [];   // positions(9/tri), material, claim, ambient occlusion, unfinished, variant
  const L = [];                                   // line primitives: [x1,y1,z1,x2,y2,z2,mat,claim,widthM]
  let VAR = 0;   // variant applied to triangles emitted while set (house style, car colour)
  const tri = (a, b, c, mat, cl, ao = 1, unf = 0) => { P.push(...a, ...b, ...c); M.push(mat); C.push(cl); A.push(ao); U.push(unf); V.push(VAR); };
  const quad = (a, b, c, d, mat, cl, ao, unf) => { tri(a, b, c, mat, cl, ao, unf); tri(a, c, d, mat, cl, ao, unf); };
  const line = (a, b, mat, cl, w) => L.push([...a, ...b, mat, cl, w]);
  const box = (x0, y0, z0, x1, y1, z1, mat, cl, ao = 1, unf = 0, top = true) => {
    const p = (x, y, z) => [x, y, z];
    quad(p(x0,y0,z0), p(x1,y0,z0), p(x1,y1,z0), p(x0,y1,z0), mat, cl, ao, unf); // south
    quad(p(x1,y0,z1), p(x0,y0,z1), p(x0,y1,z1), p(x1,y1,z1), mat, cl, ao, unf); // north
    quad(p(x0,y0,z1), p(x0,y0,z0), p(x0,y1,z0), p(x0,y1,z1), mat, cl, ao, unf); // west
    quad(p(x1,y0,z0), p(x1,y0,z1), p(x1,y1,z1), p(x1,y1,z0), mat, cl, ao, unf); // east
    if (top) quad(p(x0,y1,z0), p(x1,y1,z0), p(x1,y1,z1), p(x0,y1,z1), mat, cl, ao, unf);
  };
  const steps = (thA, thB) => { const n = Math.max(1, Math.ceil((thB - thA) / (seg * D2R))), o = []; for (let i = 0; i <= n; i++) o.push(thA + (thB - thA) * i / n); return o; };

  /* ---- ground and playing surface ---- */
  quad([-900, 0, -500], [900, 0, -500], [900, 0, 1000], [-900, 0, 1000], MAT.GROUND, K.ground.id, 1, 1);
  quad([-D.pole - 6, .02, -D.back - 2], [D.pole + 6, .02, -D.back - 2], [D.pole + 6, .02, D.cf + 30], [-D.pole - 6, .02, D.cf + 30], MAT.FIELD, K.field.id, 1, 0);

  /* ---- lower deck horseshoe: front wall, rows, back ---- */
  const lowTh = steps(-D.thPole, D.thPole);
  for (let s = 0; s < lowTh.length - 1; s++) {
    const a = lowTh[s], b = lowTh[s + 1];
    quad(pol(a, D.R0, 0), pol(b, D.R0, 0), pol(b, D.R0, D.wallH), pol(a, D.R0, D.wallH), MAT.WALL, K.lowerdeck.id, .9);
    const covered = Math.abs((a + b) / 2) <= D.thUp;
    for (let i = 0; i < D.lowRows; i++) {
      const r0 = D.R0 + i * D.lowTread, r1 = r0 + D.lowTread, y = D.wallH + i * D.lowRise;
      const under = covered && r0 > D.upFrontR ? Math.max(.18, .5 - (r0 - D.upFrontR) * .02) : covered ? .62 : .95;
      if (i > 0) quad(pol(a, r0, y - D.lowRise), pol(b, r0, y - D.lowRise), pol(b, r0, y), pol(a, r0, y), MAT.CROWD_L, K.lowerdeck.id, under * .85);
      quad(pol(a, r0, y), pol(b, r0, y), pol(b, r1, y), pol(a, r1, y), MAT.CROWD_L, K.lowerdeck.id, under);
    }
    if (!covered) { // open lower-deck ends near the poles: back rail and exterior
      const r = D.lowBackR, y = D.lowBackY;
      quad(pol(a, r, y), pol(b, r, y), pol(b, r, y + 1.4), pol(a, r, y + 1.4), MAT.CONCRETE, K.lowerdeck.id, .9);
      quad(pol(a, r, y + 1.4), pol(b, r, y + 1.4), pol(b, D.ringR, y + 1.4), pol(a, D.ringR, y + 1.4), MAT.CONCRETE, K.exterior.id, .9);
      quad(pol(b, D.ringR, 0), pol(a, D.ringR, 0), pol(a, D.ringR, y + 1.4), pol(b, D.ringR, y + 1.4), MAT.EXTERIOR, K.exterior.id, .8, 0);
    }
  }
  // rails: field wall and upper-deck fascia (claim 'railings', creative)
  for (let s2 = 0; s2 < lowTh.length - 1; s2++) line(pol(lowTh[s2], D.R0 + .15, D.wallH + .95), pol(lowTh[s2 + 1], D.R0 + .15, D.wallH + .95), MAT.FENCE, K.railings.id, .05);
  // lower-deck end caps at the foul poles
  for (const sgn of [-1, 1]) {
    const th = sgn * D.thPole;
    quad(pol(th, D.R0, 0), pol(th, D.R0, D.wallH), pol(th, D.lowBackR, D.lowBackY + 1.4), pol(th, D.lowBackR, 0), MAT.CONCRETE, K.lowerdeck.id, .8, 1);
    quad(pol(th, D.lowBackR, 0), pol(th, D.ringR, 0), pol(th, D.ringR, D.lowBackY + 1.4), pol(th, D.lowBackR, D.lowBackY + 1.4), MAT.EXTERIOR, K.exterior.id, .8, 0);
  }

  /* ---- upper deck (1954 extent), concourse wall, soffit, columns ---- */
  const upTh = steps(-D.thUp, D.thUp);
  for (let s = 0; s < upTh.length - 1; s++) {
    const a = upTh[s], b = upTh[s + 1];
    quad(pol(a, D.upFrontR, D.fasciaLow), pol(b, D.upFrontR, D.fasciaLow), pol(b, D.upFrontR, D.upY0), pol(a, D.upFrontR, D.upY0), MAT.FASCIA, K.soffit.id, .85);
    for (let i = 0; i < D.upRows; i++) {
      const r0 = D.upFrontR + i * D.upTread, r1 = r0 + D.upTread, y = D.upY0 + i * D.upRise;
      if (i > 0) quad(pol(a, r0, y - D.upRise), pol(b, r0, y - D.upRise), pol(b, r0, y), pol(a, r0, y), MAT.CROWD_U, K.upperdeck.id, .85);
      quad(pol(a, r0, y), pol(b, r0, y), pol(b, r1, y), pol(a, r1, y), MAT.CROWD_U, K.upperdeck.id, 1);
    }
    const rb = D.upBackR, yt = D.upTopY;
    quad(pol(a, rb, yt), pol(b, rb, yt), pol(b, rb, yt + 1.2), pol(a, rb, yt + 1.2), MAT.CONCRETE, K.upperdeck.id, 1);               // rear rail
    quad(pol(a, rb, yt + 1.2), pol(b, rb, yt + 1.2), pol(b, rb + .4, yt + 1.2), pol(a, rb + .4, yt + 1.2), MAT.CONCRETE, K.upperdeck.id, 1);
    // outer face of the rim: a concrete band over the exposed underside (HABS MD-1111-3, -12)
    quad(pol(b, rb + .4, softUnder(rb) - .3), pol(a, rb + .4, softUnder(rb) - .3), pol(a, rb + .4, yt + 1.2), pol(b, rb + .4, yt + 1.2), MAT.CONCRETE, K.exterior.id, .85, 0);
    // underside, now carried out to the rim: from outside it shows as the dark band above the brick ring
    quad(pol(b, D.upFrontR, D.fasciaLow), pol(a, D.upFrontR, D.fasciaLow), pol(a, D.lowBackR, softUnder(D.lowBackR)), pol(b, D.lowBackR, softUnder(D.lowBackR)), MAT.SOFFIT, K.soffit.id, .3, 0);
    quad(pol(b, D.lowBackR, softUnder(D.lowBackR)), pol(a, D.lowBackR, softUnder(D.lowBackR)), pol(a, rb + .4, softUnder(rb) - .3), pol(b, rb + .4, softUnder(rb) - .3), MAT.SOFFIT, K.exterior.id, .35, 0);
    // concourse: the back wall of the lower deck stops at the promenade floor; above it the upper promenade is open (HABS MD-1111-45)
    quad(pol(a, D.lowBackR, D.lowBackY), pol(b, D.lowBackR, D.lowBackY), pol(b, D.lowBackR, D.ringH), pol(a, D.lowBackR, D.ringH), MAT.SOFFIT, K.soffit.id, .3, 0);
    quad(pol(a, D.lowBackR, D.ringH), pol(b, D.lowBackR, D.ringH), pol(b, D.ringR, D.ringH), pol(a, D.ringR, D.ringH), MAT.CONCRETE, K.exterior.id, .5, 0);
    // the brick concourse ring with its glass-block window bands (HABS MD-1111-11)
    quad(pol(b, D.ringR, 0), pol(a, D.ringR, 0), pol(a, D.ringR, D.ringH), pol(b, D.ringR, D.ringH), MAT.EXTERIOR, K.exterior.id, .8, 0);
    // light lattice fence along the top of the rim (HABS MD-1111-64)
    line(pol(a, rb + .2, yt + 2.3), pol(b, rb + .2, yt + 2.3), MAT.FENCE, K.exterior.id, .04);
  }
  for (let s2 = 0; s2 < upTh.length - 1; s2++) line(pol(upTh[s2], D.upFrontR + .15, D.upY0 + .95), pol(upTh[s2 + 1], D.upFrontR + .15, D.upY0 + .95), MAT.FENCE, K.railings.id, .05);
  // upper-deck end caps
  for (const sgn of [-1, 1]) {
    const th = sgn * D.thUp, rf = D.upFrontR, rb = D.upBackR + .4, rl = D.lowBackR;
    quad(pol(th, rf, D.fasciaLow), pol(th, rf, D.upY0), pol(th, D.upBackR, D.upTopY + 1.2), pol(th, D.upBackR, softUnder(D.upBackR)), MAT.CONCRETE, K.upperdeck.id, .75, 1);
    quad(pol(th, rl, 0), pol(th, D.ringR, 0), pol(th, D.ringR, D.ringH), pol(th, rl, D.ringH), MAT.EXTERIOR, K.exterior.id, .7, 0);
  }
  // columns: square, from the lower-deck tread at colR up to the underside
  const row = Math.floor(D.colR / D.lowTread), cy0 = D.wallH + row * D.lowRise, cy1 = softUnder(D.R0 + D.colR);
  for (let th = -D.thUp + 3 * D2R; th < D.thUp - 2 * D2R; th += D.colStep * D2R) {
    const c = pol(th, D.R0 + D.colR, 0), h = .45;
    box(c[0] - h, cy0, c[2] - h, c[0] + h, cy1, c[2] + h, MAT.COLUMN, K.columns.id, .4, 0, false);
    // raking concrete frame from the brick ring up to the underside, seen from outside (HABS MD-1111-3, -6)
    line(pol(th, D.ringR - .2, D.ringH), pol(th, D.ringR + 1.6, softUnder(D.ringR + 1.6) - .2), MAT.COLUMN, K.exterior.id, .75);
    line(pol(th, D.lowBackR + .3, D.ringH), pol(th, D.lowBackR + .3, softUnder(D.lowBackR + .3) - .2), MAT.COLUMN, K.columns.id, .6);
  }
  // arched brackets springing between neighbouring columns under the deck (the arcade seen from the lower deck)
  for (let th = -D.thUp + 3 * D2R; th + D.colStep * D2R < D.thUp - 2 * D2R; th += D.colStep * D2R) {
    const tb = th + D.colStep * D2R, rr = D.R0 + D.colR; let prev = null;
    for (let k = 0; k <= 8; k++) { const t = k / 8, a = th + (tb - th) * t, y = cy1 - .15 - 3.4 * (1 - Math.sin(Math.PI * t)) ** 1.6, p = pol(a, rr, y);
      if (prev) line(prev, p, MAT.COLUMN, K.columns.id, .42); prev = p; }
  }
  // press box on the west mezzanine, hung under the upper-deck front (HABS MD-1111-48, -49 show it there in 2000)
  {
    const ts = steps(-97 * D2R, -78 * D2R), r0 = D.upFrontR - 2.8, r1 = D.upFrontR + .4, y0 = 13.6, y1 = D.fasciaLow;
    for (let i = 0; i < ts.length - 1; i++) { const a = ts[i], b = ts[i + 1];
      quad(pol(a, r0, y0), pol(b, r0, y0), pol(b, r0, y1), pol(a, r0, y1), MAT.PRESSBOX, K.pressbox.id, .8, 1);
      quad(pol(a, r0, y0), pol(b, r0, y0), pol(b, r1, y0), pol(a, r1, y0), MAT.PRESSBOX, K.pressbox.id, .6, 1); }
    for (const th of [ts[0], ts[ts.length - 1]]) quad(pol(th, r0, y0), pol(th, r1, y0), pol(th, r1, y1), pol(th, r0, y1), MAT.PRESSBOX, K.pressbox.id, .7, 1);
  }
  // flagpoles on the top row behind home plate (US, Maryland, Baltimore: HABS MD-1111-66)
  for (const d2 of [-3, 0, 3]) line(pol(d2 * D2R, D.upBackR + .2, D.upTopY + 1.2), pol(d2 * D2R, D.upBackR + .2, D.upTopY + 12.5), MAT.LAMP, K.flagpoles.id, .2);
  // light towers: twin-leg steel lattice with a lamp bank, on the rim and in the outfield
  // (HABS MD-1111-3, -7, -63..65; "big new light towers later in the 1950s", S02: present in 1959 is assumed)
  const tower = (bx, by, bz, fx, fz, H, legGap) => {
    const fl = Math.hypot(fx, fz), nx = fx / fl, nz = fz / fl, tx = -nz, tz = nx, g = legGap / 2;
    for (const sg of [-1, 1]) { const lx = bx + tx * g * sg, lz = bz + tz * g * sg;
      line([lx, by, lz], [lx, by + H, lz], MAT.LAMP, K.lighttowers.id, .45);
      for (let y = by; y + 3 < by + H; y += 3) line([lx - nx * .6, y, lz - nz * .6], [lx + nx * .6, y + 3, lz + nz * .6], MAT.LAMP, K.lighttowers.id, .08); }
    for (let y = by + 3; y < by + H; y += 4.5) line([bx - tx * g, y, bz - tz * g], [bx + tx * g, y + 2.2, bz + tz * g], MAT.LAMP, K.lighttowers.id, .1);
    const w = 4.4, y0 = by + H, y1 = y0 + 4.6, c = (u, v, o) => [bx + tx * u + nx * o, v, bz + tz * u + nz * o];
    quad(c(-w, y0, .4), c(w, y0, .4), c(w, y1, .4), c(-w, y1, .4), MAT.LAMPBANK, K.lighttowers.id, .9, 1);
    quad(c(-w, y0, -.4), c(w, y0, -.4), c(w, y1, -.4), c(-w, y1, -.4), MAT.LAMP, K.lighttowers.id, .9, 1);
  };
  for (const deg of [-82, -42, 42, 82]) { const th = deg * D2R, p = pol(th, D.upBackR - 1.6, D.upTopY + 1.2); tower(p[0], p[1], p[2], -p[0], D.cz - p[2], 22, 2.8); }
  for (const sx of [-1, 1]) tower(sx * 84, 0, 104, -sx * 84, 40 - 104, 46, 3.4);

  /* ---- outfield: corner walls, wings, wire fence across centre field ---- */
  const zWingEnd = 108, rcf = [Math.sin(22.5 * D2R) * D.rcf, Math.cos(22.5 * D2R) * D.rcf];
  for (const sx of [-1, 1]) {
    const x = sx * D.pole;
    // 14 ft corner wall running north from the pole (recedes 135° from the foul line, S02)
    quad([x, 0, D.pole], [x, 0, zWingEnd], [x, D.cornerWall, zWingEnd], [x, D.cornerWall, D.pole], MAT.WALL, K.outfield.id, .9);
    // single-deck wing bleachers behind it, rising outward (east/west)
    const rows = 20, tr = .8, rs = .42;
    for (let i = 0; i < rows; i++) {
      const xa = x + sx * i * tr, xb = xa + sx * tr, y = D.cornerWall + i * rs;
      if (i > 0) quad([xa, y - rs, D.pole + 2], [xa, y - rs, zWingEnd], [xa, y, zWingEnd], [xa, y, D.pole + 2], MAT.CROWD_L, K.outfield.id, .9);
      quad([xa, y, D.pole + 2], [xa, y, zWingEnd], [xb, y, zWingEnd], [xb, y, D.pole + 2], MAT.CROWD_L, K.outfield.id, 1);
    }
    const xo = x + sx * rows * tr, yt = D.cornerWall + rows * rs;
    quad([xo, 0, D.pole + 2], [xo, 0, zWingEnd], [xo, yt + 1.2, zWingEnd], [xo, yt + 1.2, D.pole + 2], MAT.EXTERIOR, K.exterior.id, .8, 0);
    // north end of the wing
    tri([x, 0, zWingEnd], [xo, 0, zWingEnd], [xo, yt + 1.2, zWingEnd], MAT.CONCRETE, K.outfield.id, .8, 1);
    tri([x, 0, zWingEnd], [xo, yt + 1.2, zWingEnd], [x, D.cornerWall, zWingEnd], MAT.CONCRETE, K.outfield.id, .8, 1);
    tri([x, D.cornerWall, D.pole + 2], [xo, yt + 1.2, D.pole + 2], [xo, 0, D.pole + 2], MAT.CONCRETE, K.outfield.id, .8, 1);
    // wire fence (6 ft) from the wing end round centre field
    const pts = [[x, zWingEnd], [sx * rcf[0], rcf[1]], [sx * 26, D.cf - 2], [0, D.cf]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
      line([x1, 1.83, z1], [x2, 1.83, z2], MAT.FENCE, K.outfield.id, .06);
      const n = Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 3);
      for (let k = 0; k <= n; k++) { const t = k / n; line([x1 + (x2 - x1) * t, 0, z1 + (z2 - z1) * t], [x1 + (x2 - x1) * t, 1.83, z1 + (z2 - z1) * t], MAT.FENCE, K.outfield.id, .05); }
    }
    // foul pole
    line([x, 0, D.pole], [x, D.poleH, D.pole], MAT.POST, K.foulpoles.id, .35);
  }

  /* ---- the Gunther scoreboard, beyond the north end zone ---- */
  {
    const x0 = D.sbX - D.sbW / 2, x1 = D.sbX + D.sbW / 2, z = D.sbZ, top = D.sbH - 2.6, yb = 6.2;
    for (const lx of [x0 + 3, D.sbX, x1 - 3]) box(lx - .5, 0, z - .5, lx + .5, yb, z + .5, MAT.SCOREBOARD, K.scoreboard.id, .6, 1, false);
    box(x0, yb, z, x1, top, z + 2.4, MAT.SCOREBOARD, K.scoreboard.id, .9, 1);
    quad([x0 + .8, yb + .8, z - .02], [x1 - .8, yb + .8, z - .02], [x1 - .8, top - .8, z - .02], [x0 + .8, top - .8, z - .02], MAT.SB_FACE, K.scoreboard.id, .9, 1);
    // the Longines clock: a disc above the board (position assumed)
    const cxm = D.sbX, cym = top + 1.3, cr = 2.1, n = 14;
    for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI;
      tri([cxm, cym, z - .1], [cxm + Math.cos(a0) * cr, cym + Math.sin(a0) * cr, z - .1], [cxm + Math.cos(a1) * cr, cym + Math.sin(a1) * cr, z - .1], MAT.CLOCK, K.scoreboard.id, 1, 1); }
    line([cxm, top, z + .3], [cxm, cym - cr, z + .3], MAT.SCOREBOARD, K.scoreboard.id, .5);
  }

  /* ---- goalposts on the goal lines (1959 rule: H-shape, on the line) ---- */
  for (const gz of [D.goalS, D.goalN]) {
    const g = D.postGap / 2;
    line([-g, 0, gz], [-g, D.postH, gz], MAT.POST, K.goalposts.id, .14);
    line([g, 0, gz], [g, D.postH, gz], MAT.POST, K.goalposts.id, .14);
    line([-g, D.barH, gz], [g, D.barH, gz], MAT.POST, K.goalposts.id, .14);
  }

  /* ---- THE MOMENT (claims 35, 36): early 4th quarter, Unitas has just scored from the 4 on a rollout
     toward Lindon Crow behind Lenny Moore's block (S27). Which end zone and every position are creative:
     here the Colts are driving north, toward the open end and the scoreboard.
     Figures are blocks at true scale (1.85 m): helmet, shoulders, arms, legs. VAR: 1 Colts, 2 Giants, 3 official; +10 lying. */
  {
    let ps = 1959 * 31 + 27; const rnd = () => (ps = (ps * 16807) % 2147483647) / 2147483647;   // own stream: the rest of the world stays put
    const fig = (x, z, team, pose = 'stand', cl = K.players.id) => {
      const s = .9 + rnd() * .2;
      if (pose === 'down') { VAR = team + 10; box(x - .9, 0, z - .28, x + .9, .42, z + .28, MAT.PLAYER, cl, .7, 0); VAR = 0; return; }
      VAR = team + (pose === 'crouch' ? 20 : 0);
      const h = pose === 'crouch' ? .72 : 1, hip = .9 * h * s, sh = 1.55 * h * s, top = 1.86 * h * s;
      box(x - .22, 0, z - .1, x - .04, hip, z + .1, MAT.PLAYER, cl, .75, 0);
      box(x + .04, 0, z - .1, x + .22, hip, z + .1, MAT.PLAYER, cl, .75, 0);
      box(x - .29, hip, z - .17, x + .29, sh, z + .17, MAT.PLAYER, cl, .85, 0);
      box(x - .13, sh, z - .14, x + .13, top, z + .14, MAT.PLAYER, cl, .9, 0);
      const ay0 = pose === 'arms' ? sh - .05 : hip + .05, ay1 = pose === 'arms' ? top + .55 : sh - .05;
      for (const sx of [-1, 1]) box(x + sx * .29, ay0, z - .06, x + sx * .4, ay1, z + .06, MAT.PLAYER, cl, .8, 0);
      VAR = 0;
    };
    const g = D.goalN, los = g - 4 * .9144;            // goal line; the play started from the 4
    // Colts (driving north)
    fig(7.6, g + 1.1, 1, 'arms');                          // Unitas, just over the line on the right
    fig(6.3, g - 1.4, 1, 'crouch'); fig(6.9, g - 1.1, 2, 'down');   // Moore's block on Crow
    fig(-15.5, g + 2.0, 1); fig(2.6, los + 1.0, 1, 'crouch'); fig(-6.2, g - 1.8, 1); fig(4.4, los - 1.6, 1);
    for (let k = -2; k <= 2; k++) fig(k * 1.05 + (rnd() - .5) * .4, los - .2 + rnd() * .6, 1, rnd() < .4 ? 'down' : 'crouch');
    // Giants (defending the north goal)
    for (let k = 0; k < 4; k++) fig(-1.6 + k * 1.1 + (rnd() - .5) * .3, los + .8 - rnd() * .5, 2, rnd() < .35 ? 'down' : 'crouch');
    fig(-3.6, g - 2.4, 2); fig(4.9, g - 2.6, 2); fig(.5, g - 1.2, 2);          // linebackers
    fig(10.2, g + .2, 2); fig(-13.4, g + 1.2, 2); fig(1.2, g + 4.2, 2);        // the secondary
    // the five officials (claim 36): back judge and field judge signal the touchdown
    fig(.4, g + 6.8, 3, 'arms', K.officials.id); fig(D.fieldW / 2 + .8, g, 3, 'arms', K.officials.id);
    fig(-D.fieldW / 2 - .8, los, 3, 'stand', K.officials.id); fig(-1.8, g - .9, 3, 'stand', K.officials.id); fig(2.4, los - 8.5, 3, 'stand', K.officials.id);
    // the benches between the 35s, teams in ranks along the sidelines (which side each team used: creative)
    for (const [team, sx] of [[1, -1], [2, 1]]) for (let k = 0; k < 34; k++) {
      const z = D.fifty - 14 + k * .85 + (rnd() - .5) * .3, x = sx * (D.fieldW / 2 + 3.4 + (k % 3) * .8 + rnd() * .5);
      fig(x, z, team);
    }
  }

  /* ---- the memorial façade on 33rd Street, measured from HABS MD-1111-15 ----
     a pale stone panel (19.3 m) between brick infills (5.1 m) and brick pylons (3.9 m) that rise to 116 ft;
     the name on a band above the panel; the 1954 entrance canopy on red cast-granite columns; the forecourt */
  {
    const F = DIM.facade, zf = F.z, zb = F.z + F.depth, H = F.h, pw = F.panelW / 2, iw = pw + F.infill, ow = iw + F.pylon;
    box(-pw, 0, zf + .25, pw, F.bandY1, zb, MAT.FACADE, K.facade.id, .9, 0);                 // panel block (face drawn below)
    quad([-pw, F.panelY0, zf + .22], [pw, F.panelY0, zf + .22], [pw, F.panelY1, zf + .22], [-pw, F.panelY1, zf + .22], MAT.FACADE_FACE, K.facade.id, .95, 0);
    quad([-iw, F.panelY1, zf - .03], [iw, F.panelY1, zf - .03], [iw, F.bandY1, zf - .03], [-iw, F.bandY1, zf - .03], MAT.FACADE_FACE, K.facade.id, .95, 0);  // name band
    box(-iw, F.panelY1, zf, iw, F.bandY1, zb, MAT.CONCRETE, K.facade.id, .9, 0);
    quad([-pw, 0, zf + .22], [pw, 0, zf + .22], [pw, F.panelY0, zf + .22], [-pw, F.panelY0, zf + .22], MAT.FACADE_FACE, K.facade.id, .7, 0); // entrance under the canopy
    for (const sx of [-1, 1]) {
      box(sx > 0 ? pw : -iw, 0, zf + .1, sx > 0 ? iw : -pw, F.panelY1, zb, MAT.EXTERIOR, K.facade.id, .85, 0);        // brick infill
      box(sx > 0 ? iw : -ow, 0, zf - .35, sx > 0 ? ow : -iw, H, zb + 1, MAT.EXTERIOR, K.facade.id, .85, 0);          // pylon
      box(sx > 0 ? iw + .5 : -ow + .5, H, zf - .1, sx > 0 ? ow - .5 : -iw - .5, H + .9, zb, MAT.EXTERIOR, K.facade.id, .85, 0); // stepped top
    }
    // the canopy: a thin slab with rounded ends and an oval opening over the planter
    const C = DIM.canopy, cz = (C.z0 + C.z1) / 2, hz = (C.z0 - C.z1) / 2, N = 48;
    const outer = t => { const c = Math.cos(t), s2 = Math.sin(t), e = 4; const k = Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(s2), e), -1 / e); return [C.hx * c * k, cz + hz * s2 * k]; };
    const inner = t => [C.hrx * Math.cos(t), C.holeZ + C.hrz * Math.sin(t)];
    for (let i = 0; i < N; i++) { const t0 = i / N * 2 * Math.PI, t1 = (i + 1) / N * 2 * Math.PI, o0 = outer(t0), o1 = outer(t1), i0 = inner(t0), i1 = inner(t1);
      for (const y of [C.y, C.y + C.t]) quad([o0[0], y, o0[1]], [o1[0], y, o1[1]], [i1[0], y, i1[1]], [i0[0], y, i0[1]], MAT.CANOPY, K.canopy.id, y === C.y ? .45 : .95, 0);
      quad([o0[0], C.y, o0[1]], [o1[0], C.y, o1[1]], [o1[0], C.y + C.t, o1[1]], [o0[0], C.y + C.t, o0[1]], MAT.CANOPY, K.canopy.id, .8, 0);
      quad([i0[0], C.y, i0[1]], [i1[0], C.y, i1[1]], [i1[0], C.y + C.t, i1[1]], [i0[0], C.y + C.t, i0[1]], MAT.CANOPY, K.canopy.id, .7, 0); }
    // red cast-granite columns (HABS MD-1111-20): along the front and round the opening (count and spacing assumed)
    const col = (x, z) => { const r2 = .32, n = 8; for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI;
      quad([x + Math.cos(a0) * r2, 0, z + Math.sin(a0) * r2], [x + Math.cos(a1) * r2, 0, z + Math.sin(a1) * r2], [x + Math.cos(a1) * r2, C.y, z + Math.sin(a1) * r2], [x + Math.cos(a0) * r2, C.y, z + Math.sin(a0) * r2], MAT.GRANITE, K.canopy.id, .8, 0); } };
    for (let x = -21; x <= 21; x += 7) col(x, C.z1 + 1.6);
    for (const t of [0, Math.PI]) col(Math.cos(t) * (C.hrx + 1.2), C.holeZ);
    // raised round planter with shrubs under the opening (HABS MD-1111-18)
    { const n = 24, r2 = 4.6, h = .95; for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI, p0 = [Math.cos(a0) * r2, Math.sin(a0) * r2 * .62], p1 = [Math.cos(a1) * r2, Math.sin(a1) * r2 * .62];
      quad([p0[0], 0, C.holeZ + p0[1]], [p1[0], 0, C.holeZ + p1[1]], [p1[0], h, C.holeZ + p1[1]], [p0[0], h, C.holeZ + p0[1]], MAT.CANOPY, K.canopy.id, .8, 0);
      tri([0, h + 1.4, C.holeZ], [p0[0] * .9, h, C.holeZ + p0[1] * .9], [p1[0] * .9, h, C.holeZ + p1[1] * .9], MAT.HEDGE, K.canopy.id, .9, 0); } }
    // forecourt: lawn, a straight walk to the entrance, hedges and the c.1922 wrought-iron fence on the south line (HABS MD-1111-3, -14)
    const S = DIM.streets, fz = S.n33 + 1.5;
    quad([-150, .03, zf], [150, .03, zf], [150, .03, S.n33], [-150, .03, S.n33], MAT.GRASS, K.forecourt.id, 1, 0);
    quad([-2.6, .05, C.z1 + .5], [2.6, .05, C.z1 + .5], [2.6, .05, S.n33], [-2.6, .05, S.n33], MAT.PAVING, K.forecourt.id, 1, 0);
    quad([-30, .045, zf], [30, .045, zf], [30, .045, C.z1 + .5], [-30, .045, C.z1 + .5], MAT.PAVING, K.forecourt.id, 1, 0);
    for (const [x0, x1] of [[-148, -3.4], [3.4, 148]]) {
      box(x0, 0, fz + .4, x1, 1.25, fz + 1.6, MAT.HEDGE, K.forecourt.id, .9, 0);
      line([x0, 1.5, fz], [x1, 1.5, fz], MAT.FENCE, K.forecourt.id, .04); line([x0, .15, fz], [x1, .15, fz], MAT.FENCE, K.forecourt.id, .04);
      for (let x = x0; x <= x1; x += .32) line([x, 0, fz], [x, 1.62, fz], MAT.FENCE, K.forecourt.id, .02);
    }
    // a second hedge line across the lawn, as in the 2000 photographs (layout assumed for 1959)
    for (const [x0, x1] of [[-60, -3.4], [3.4, 60]]) box(x0, 0, fz + 13, x1, 1.0, fz + 14, MAT.HEDGE, K.forecourt.id, .9, 0);
    quad([-620, .025, S.n33], [620, .025, S.n33], [620, .025, S.n33 - 10], [-620, .025, S.n33 - 10], MAT.ROAD, K.streets.id, 1, 0);
    quad([-620, .03, S.n33 - 10], [620, .03, S.n33 - 10], [620, .03, S.n33 - 18], [-620, .03, S.n33 - 18], MAT.GRASS, K.streets.id, 1, 0);
    quad([-620, .025, S.n33 - 18], [620, .025, S.n33 - 18], [620, .025, S.n33 - 28], [-620, .025, S.n33 - 28], MAT.ROAD, K.streets.id, 1, 0);
    quad([-620, .03, S.n33 - 28], [620, .03, S.n33 - 28], [620, .03, S.n33 - 32], [-620, .03, S.n33 - 32], MAT.PAVING, K.streets.id, 1, 0);
    for (const x of [S.ellerslie, S.ednor]) quad([x - 6, .02, S.n33], [x + 6, .02, S.n33], [x + 6, .02, 780], [x - 6, .02, 780], MAT.ROAD, K.streets.id, 1, 0);
    quad([-620, .02, S.z36], [620, .02, S.z36], [620, .02, S.z36 + 12], [-620, .02, S.z36 + 12], MAT.ROAD, K.streets.id, 1, 0);
  }

  /* ---- the neighbourhood (S22, S23, S24): Ednor Gardens Tudor rows north of 36th St,
          porch-front daylight rows elsewhere; bare winter trees; game-day cars; lamps; City College ---- */
  {
    let seed = (opt.seed || 48) * 9301 + 49297; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const S = DIM.streets, CC = DIM.cityCollege;
    const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l); };
    // a bare tree as branching line primitives (trunk + 3 limbs, recursive)
    const bareTree = (x, z, h, cl, depth) => {
      const tH = h * .36; line([x, 0, z], [x, tH, z], MAT.TREE, cl, .34);
      const grow = (p, d, len, w, k) => {
        const e = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len]; line(p, e, MAT.TREE, cl, w);
        if (!k) return; const nb = 2 + (rnd() > .55 ? 1 : 0);
        for (let i = 0; i < nb; i++) { const az = rnd() * 6.283, tl = .5 + rnd() * .45;
          grow(e, nrm([d[0] + Math.cos(az) * tl, d[1] + .28 + rnd() * .2, d[2] + Math.sin(az) * tl]), len * (.6 + rnd() * .14), Math.max(.03, w * .58), k - 1); }
      };
      const l0 = rnd() * 6.283;
      for (let i = 0; i < 3; i++) { const az = l0 + i * 2.094 + rnd() * .6; grow([x, tH, z], nrm([Math.cos(az) * .55, 1, Math.sin(az) * .55]), h * .3, .2, depth); }
    };
    const inCampus = (x0, z0, x1, z1) => x1 > CC.x0 - 20 && x0 < CC.x1 + 20 && z1 > CC.z0 - 20 && z0 < CC.z1 + 20;
    // a terrace of rowhouses. style 1 = daylight porch-front (flat roof, cornice, deep porch, white posts);
    // style 2 = Ednor Gardens Tudor (steep roof, front gables, terraced garden). front = -1 faces south, +1 faces north
    const terrace = (x, len, z, style, front) => {
      const dep = 10.5, h = style === 2 ? 6.6 + rnd() * .8 : 7.2 + rnd() * 1.1, fz = front < 0 ? z : z + dep, out = front < 0 ? -1 : 1;
      VAR = style;
      box(x, 0, z, x + len, h, z + dep, MAT.HOUSE, K.neighbour.id, .9, 1, style === 1);
      if (style === 2) {   // steep gable roof running along the row, with front-facing gables every other house
        const rh = 4.2;
        quad([x, h, z], [x + len, h, z], [x + len, h + rh, z + dep / 2], [x, h + rh, z + dep / 2], MAT.ROOF, K.neighbour.id, 1, 1);
        quad([x, h + rh, z + dep / 2], [x + len, h + rh, z + dep / 2], [x + len, h, z + dep], [x, h, z + dep], MAT.ROOF, K.neighbour.id, 1, 1);
        for (let gx = x + 1.5; gx + 4 < x + len; gx += 11) {
          const fz2 = fz + out * .25;
          tri([gx, h - .4, fz2], [gx + 4, h - .4, fz2], [gx + 2, h + 3.2, fz2], MAT.HOUSE, K.neighbour.id, .95, 1);
          quad([gx, h - .4, fz2], [gx + 2, h + 3.2, fz2], [gx + 2, h + 3.2, fz - out * 2.5], [gx, h - .4, fz - out * 2.5], MAT.ROOF, K.neighbour.id, 1, 1);
          quad([gx + 4, h - .4, fz2], [gx + 2, h + 3.2, fz2], [gx + 2, h + 3.2, fz - out * 2.5], [gx + 4, h - .4, fz - out * 2.5], MAT.ROOF, K.neighbour.id, 1, 1);
        }
        // terraced front garden (raised lawn with a low wall)
        const gz0 = fz + out * 1.2, gz1 = fz + out * 6;
        box(x, 0, Math.min(gz0, gz1), x + len, .7, Math.max(gz0, gz1), MAT.GRASS, K.neighbour.id, 1, 1);
      } else {              // deep front porch across the whole row, white-painted posts (S22)
        const pz0 = fz, pz1 = fz + out * 2.6;
        box(x, 2.85, Math.min(pz0, pz1), x + len, 3.1, Math.max(pz0, pz1), MAT.PORCH, K.neighbour.id, .9, 1);
        for (let px = x + .2; px < x + len; px += 2.75) line([px, 0, pz1], [px, 2.85, pz1], MAT.PORCH, K.neighbour.id, .16);
        box(x, 0, Math.min(pz0, pz1), x + len, .5, Math.max(pz0, pz1), MAT.PAVING, K.neighbour.id, 1, 1);     // porch floor
      }
      for (let cx = x + 2.7; cx < x + len; cx += 11) line([cx, h + (style === 2 ? 2.4 : 0), z + dep * .7], [cx, h + (style === 2 ? 5.4 : 1.4), z + dep * .7], MAT.HOUSE, K.neighbour.id, .7);   // chimneys
      VAR = 0;
    };
    const terraces = (X0, X1, Z0, Z1, treeStep, style, front) => {
      for (let z = Z0; z < Z1; z += 36 + rnd() * 8) {
        for (let x = X0; x < X1;) {
          const units = 4 + Math.floor(rnd() * 9), len = Math.min(X1 - x, units * 5.5);
          if (len > 16 && rnd() > .12 && !inCampus(x, z - 8, x + len, z + 18)) terrace(x, len, z, style, front);
          x += len + 5 + rnd() * 10;
        }
        const tz = front < 0 ? z - 9 : z + 19.5, far = Math.hypot(0, z - 40) > 360 ? 2 : 3;
        for (let x = X0; x < X1; x += treeStep + rnd() * treeStep) if (!inCampus(x - 4, tz - 4, x + 4, tz + 4)) bareTree(x, tz, 9 + rnd() * 7, K.neighbour.id, far);
      }
    };
    terraces(-520, 520, S.z36 + 26, 760, 12, 2, -1);                    // Ednor Gardens: Tudor rows facing south
    terraces(-560, 560, -580, S.n33 - 50, 20, 1, 1);                    // south of 33rd St: porch fronts facing north
    terraces(-540, S.ellerslie - 18, S.n33 + 10, S.z36 - 10, 22, 1, -1); // west of Ellerslie Ave
    terraces(S.ednor + 18, 540, S.n33 + 10, S.z36 - 10, 22, 1, -1);      // east of Ednor Rd

    // the tree-lined 33rd Street boulevard (S22): trees on the median and both outer verges (spacing assumed)
    for (const tz of [S.n33 - 14, S.n33 - 1.8, S.n33 - 30.2]) for (let x = -560; x < 560; x += 15 + rnd() * 5) {
      if ((tz === S.n33 - 1.8 && Math.abs(x) < 46) || Math.abs(x) < 26) continue;   // plaza clear; a gap on the façade axis (assumed, keeps the wall in view)
      bareTree(x, tz, 11 + rnd() * 5, K.streets.id, Math.abs(x) > 300 ? 2 : 3);
    }
    // street lamps on 33rd Street (creative, unlit)
    for (const [lz, dir] of [[S.n33 - .9, -1], [S.n33 - 27.1, 1]]) for (let x = -560; x < 560; x += 36) {
      line([x, 0, lz], [x, 7.6, lz], MAT.LAMP, K.streetlamps.id, .2); line([x, 7.6, lz], [x, 7.6, lz + dir * 1.7], MAT.LAMP, K.streetlamps.id, .14);
      line([x, 7.55, lz + dir * 1.7], [x, 7.25, lz + dir * 1.7], MAT.LAMP, K.streetlamps.id, .45);
    }
    // game-day parked cars along the modelled streets (creative). Variant = paint (1..9)
    const car = (cx, cz, alongX) => {
      VAR = 1 + Math.floor(rnd() * 9);
      const L = 5.2, W = 1.95, hl = alongX ? L / 2 : W / 2, hw = alongX ? W / 2 : L / 2, ox = alongX ? -.35 : 0, oz = alongX ? 0 : -.35;
      box(cx - hl, .34, cz - hw, cx + hl, .92, cz + hw, MAT.CAR, K.cars.id, .9, 1);
      const cl = alongX ? 1.3 : .78, cw = alongX ? .78 : 1.3;
      box(cx + ox - cl, .92, cz + oz - cw, cx + ox + cl, 1.42, cz + oz + cw, MAT.CAR, K.cars.id, .9, 1);
      VAR = 0;
    };
    for (const cz of [S.n33 - 1.2, S.n33 - 26.8]) for (let x = -420; x < 420; x += 6.4 + rnd() * 1.2) {
      if (rnd() < .14 || (cz === S.n33 - 1.2 && Math.abs(x) < 50) || Math.abs(Math.abs(x) - 150) < 24) continue; car(x, cz, true); }   // no parking near corners
    for (const sx of [S.ellerslie, S.ednor]) for (const off of [-4.9, 4.9]) for (let z = S.n33 + 6; z < 440; z += 6.4 + rnd() * 1.2) {
      if (rnd() < .14 || Math.abs(z - S.z36 - 6) < 24 || z < S.n33 + 18) continue; car(sx + off, z, false); }
    for (const cz of [S.z36 + 1.2, S.z36 + 10.8]) for (let x = -420; x < 420; x += 6.4 + rnd() * 1.2) {
      if (rnd() < .14 || Math.abs(Math.abs(x) - 150) < 24) continue; car(x, cz, true); }

    // Baltimore City College on its hill across 33rd Street (S23; placed from its address, massing generic)
    box(CC.x0 - 25, 0, CC.z0 - 25, CC.x1 + 25, CC.hill, CC.z1 + 20, MAT.GRASS, K.citycollege.id, 1, 1);
    box(CC.x0, CC.hill, CC.z0, CC.x1, CC.hill + 17, CC.z0 + 22, MAT.STONE, K.citycollege.id, .9, 1);
    box(CC.x0, CC.hill, CC.z0, CC.x0 + 22, CC.hill + 15, CC.z1, MAT.STONE, K.citycollege.id, .9, 1);
    box(CC.x1 - 22, CC.hill, CC.z0, CC.x1, CC.hill + 15, CC.z1, MAT.STONE, K.citycollege.id, .9, 1);
    const tx = (CC.x0 + CC.x1) / 2, tz2 = CC.z0 + 11;
    box(tx - 6, CC.hill + 17, tz2 - 6, tx + 6, CC.hill + 40, tz2 + 6, MAT.STONE, K.citycollege.id, .9, 1);
    for (const [px, pz] of [[-6, -6], [6, -6], [6, 6], [-6, 6]]) line([tx + px, CC.hill + 40, tz2 + pz], [tx + px, CC.hill + 44.5, tz2 + pz], MAT.STONE, K.citycollege.id, .9);   // pinnacles

    // trees on the terrace behind the centre-field fence (the 1954 "hedgeline", S02)
    for (let x = -60; x <= 60; x += 7) { quad([x - 3.5, 0, D.cf + 6], [x + 3.5, 0, D.cf + 6], [x + 3.5, 2.6, D.cf + 6], [x - 3.5, 2.6, D.cf + 6], MAT.TREE, K.outfield.id, 1, 1); }
  }

  const n = M.length, Pt = new Float32Array(P), N = new Float32Array(n * 3);
  for (let t = 0; t < n; t++) { // flat normals
    const o = t * 9, ux = Pt[o + 3] - Pt[o], uy = Pt[o + 4] - Pt[o + 1], uz = Pt[o + 5] - Pt[o + 2], vx = Pt[o + 6] - Pt[o], vy = Pt[o + 7] - Pt[o + 1], vz = Pt[o + 8] - Pt[o + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    N[t * 3] = nx / l; N[t * 3 + 1] = ny / l; N[t * 3 + 2] = nz / l;
  }
  return { n, P: Pt, N, mat: Uint8Array.from(M), claim: Uint8Array.from(C), ao: Float32Array.from(A), unf: Uint8Array.from(U), vari: Uint8Array.from(V), lines: L };
}

/* camera stations (all in the stands; Phase 01 reviews station 0) */
export const STATIONS = [
  { id: 'sw-upper', label: 'Upper deck, third-base curve, row 12 — looking NNE up the field to the open end',
    at: () => { const th = -35 * D2R, r = DIM.upFrontR + 12 * DIM.upTread + .4, y = DIM.upY0 + 12 * DIM.upRise + 1.15, p = pol(th, r, y);
      const yaw = 20 * D2R, pit = -15 * D2R; return { pos: p, look: [p[0] + Math.sin(yaw) * Math.cos(pit) * 100, p[1] + Math.sin(pit) * 100, p[2] + Math.cos(yaw) * Math.cos(pit) * 100], fov: 74 }; } },
  { id: 'w-upper-50', label: 'Upper deck, west side, row 14 near the 50 — looking east across the field',
    at: () => { const th = -86 * D2R, r = DIM.upFrontR + 14 * DIM.upTread + .4, y = DIM.upY0 + 14 * DIM.upRise + 1.15; return { pos: pol(th, r, y), look: [0, 0, DIM.fifty + 6], fov: 66 }; } },
  { id: 'home-rim', label: 'Upper deck behind home plate, top rows — the horseshoe and the open end',
    at: () => { const r = DIM.upFrontR + 26 * DIM.upTread + .4, y = DIM.upY0 + 26 * DIM.upRise + 1.15; return { pos: pol(0, r, y), look: [0, 0, 70], fov: 70 }; } },
  { id: '33rd-street', label: 'Exterior: the 33rd Street median, looking up at the memorial façade',
    at: () => ({ pos: [-8, 1.6, DIM.streets.n33 - 14], look: [0, 18, DIM.facade.z], fov: 64 }) },
  { id: 'ellerslie', label: 'Exterior: corner of 33rd Street and Ellerslie Avenue, looking east along the façade and the brick shell',
    at: () => ({ pos: [DIM.streets.ellerslie - 8, 1.6, DIM.streets.n33 - 12], look: [-20, 16, -32], fov: 64 }) },
  { id: 'overview-se', label: 'Exterior overview from the south-east (a model view, not a 1959 vantage)',
    at: () => ({ pos: [270, 175, -240], look: [0, 4, 36], fov: 46 }) },
  { id: 'north-lawn', label: 'Exterior: the open ground inside the block near 36th Street, looking south-west into the open end',
    at: () => ({ pos: [95, 1.6, 186], look: [8, 12, 112], fov: 68 }) }
];
