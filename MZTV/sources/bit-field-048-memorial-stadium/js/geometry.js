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
    fasciaLow: 17.6, upY0: 19.6,
    upRows: 33, upTread: 0.80, upRise: 0.46,            // 33 rows (S02, lifetime); rise set so the rim meets the 116 ft façade (S12)
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
    facade: { h: 116 * FT, w: 44, depth: 5.5, z: -62.5, pylon: 7, sealY: 26.2 },
    // streets (S05: which side; positions and widths assumed)
    streets: { n33: -72, ellerslie: -150, ednor: 150, z36: 200 },
    // Baltimore City College, ~400 m WSW across 33rd St (S23; from its address; footprint and hill assumed)
    cityCollege: { x0: -470, x1: -330, z0: -300, z1: -230, hill: 7 }
  };
  d.lowBackR = R0 + d.lowRows * d.lowTread;
  d.lowBackY = d.wallH + (d.lowRows - 1) * d.lowRise;
  d.upFrontR = R0 + d.over;
  d.upBackR = d.upFrontR + d.upRows * d.upTread;
  d.upTopY = d.upY0 + (d.upRows - 1) * d.upRise;
  d.thUp = d.thPole - d.upShort / (R0 + d.over + 14);
  d.goalS = d.endS + d.endZ; d.goalN = d.endS + d.fieldL - d.endZ; d.endN = d.endS + d.fieldL;
  d.fifty = (d.goalS + d.goalN) / 2;
  return d;
})();

/* point on the horseshoe: angle th from south toward east, radius r from the fitted centre */
export const pol = (th, r, y) => [Math.sin(th) * r, y, DIM.cz - Math.cos(th) * r];
export const softUnder = r => DIM.fasciaLow + (r - DIM.upFrontR) * (DIM.upRise / DIM.upTread);

export const MAT = { GROUND:1, FIELD:2, WALL:3, CONCRETE:4, CROWD_L:5, CROWD_U:6, SOFFIT:7, COLUMN:8, FASCIA:9,
  EXTERIOR:10, SCOREBOARD:11, SB_FACE:12, POST:13, HOUSE:14, ROOF:15, TREE:16, BLEACHER:17, FENCE:18, PRESSBOX:19, CLOCK:20, FACADE:21, FACADE_FACE:22, ROAD:23, PAVING:24, GRASS:25, CAR:26, STONE:27, PORCH:28, LAMP:29 };
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
      quad(pol(a, r, y + 1.4), pol(b, r, y + 1.4), pol(b, r + 1.5, y + 1.4), pol(a, r + 1.5, y + 1.4), MAT.CONCRETE, K.lowerdeck.id, .9);
      quad(pol(b, r + 1.5, 0), pol(a, r + 1.5, 0), pol(a, r + 1.5, y + 1.4), pol(b, r + 1.5, y + 1.4), MAT.EXTERIOR, K.exterior.id, .8, 0);
    }
  }
  // rails: field wall and upper-deck fascia (claim 'railings', creative)
  for (let s2 = 0; s2 < lowTh.length - 1; s2++) line(pol(lowTh[s2], D.R0 + .15, D.wallH + .95), pol(lowTh[s2 + 1], D.R0 + .15, D.wallH + .95), MAT.FENCE, K.railings.id, .05);
  // lower-deck end caps at the foul poles
  for (const sgn of [-1, 1]) {
    const th = sgn * D.thPole;
    quad(pol(th, D.R0, 0), pol(th, D.R0, D.wallH), pol(th, D.lowBackR, D.lowBackY + 1.4), pol(th, D.lowBackR + 1.5, 0), MAT.CONCRETE, K.lowerdeck.id, .8, 1);
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
    quad(pol(b, rb + .4, 0), pol(a, rb + .4, 0), pol(a, rb + .4, yt + 1.2), pol(b, rb + .4, yt + 1.2), MAT.EXTERIOR, K.exterior.id, .8, 0);
    // underside and the concourse wall behind the lower deck (invented section: claim 'soffit')
    quad(pol(b, D.upFrontR, D.fasciaLow), pol(a, D.upFrontR, D.fasciaLow), pol(a, D.lowBackR, softUnder(D.lowBackR)), pol(b, D.lowBackR, softUnder(D.lowBackR)), MAT.SOFFIT, K.soffit.id, .3, 1);
    quad(pol(a, D.lowBackR, D.lowBackY), pol(b, D.lowBackR, D.lowBackY), pol(b, D.lowBackR, softUnder(D.lowBackR)), pol(a, D.lowBackR, softUnder(D.lowBackR)), MAT.SOFFIT, K.soffit.id, .2, 1);
  }
  for (let s2 = 0; s2 < upTh.length - 1; s2++) line(pol(upTh[s2], D.upFrontR + .15, D.upY0 + .95), pol(upTh[s2 + 1], D.upFrontR + .15, D.upY0 + .95), MAT.FENCE, K.railings.id, .05);
  // upper-deck end caps
  for (const sgn of [-1, 1]) {
    const th = sgn * D.thUp, rf = D.upFrontR, rb = D.upBackR + .4, rl = D.lowBackR;
    quad(pol(th, rf, D.fasciaLow), pol(th, rf, D.upY0), pol(th, D.upBackR, D.upTopY + 1.2), pol(th, D.upBackR, softUnder(D.upBackR)), MAT.CONCRETE, K.upperdeck.id, .75, 1);
    const F = pol(th, rl, 0), E = pol(th, rb, 0), Dd = pol(th, rb, D.upTopY + 1.2), H = pol(th, D.upBackR, softUnder(D.upBackR)), G = pol(th, rl, softUnder(rl));
    tri(F, E, Dd, MAT.CONCRETE, K.upperdeck.id, .7, 1); tri(F, Dd, H, MAT.CONCRETE, K.upperdeck.id, .7, 1); tri(F, H, G, MAT.CONCRETE, K.upperdeck.id, .7, 1);
  }
  // columns: square, from the lower-deck tread at colR up to the underside
  const row = Math.floor(D.colR / D.lowTread), cy0 = D.wallH + row * D.lowRise, cy1 = softUnder(D.R0 + D.colR);
  for (let th = -D.thUp + 3 * D2R; th < D.thUp - 2 * D2R; th += D.colStep * D2R) {
    const c = pol(th, D.R0 + D.colR, 0), h = .45;
    box(c[0] - h, cy0, c[2] - h, c[0] + h, cy1, c[2] + h, MAT.COLUMN, K.columns.id, .4, 0, false);
  }
  // press box placeholder on the rim behind home plate (claim 'pressbox': creative)
  {
    const t0 = -9 * D2R, t1 = 9 * D2R, r0 = D.upBackR - 4.5, r1 = D.upBackR + .4, y0 = D.upTopY + 1.2, y1 = y0 + 3.6;
    const ts = steps(t0, t1);
    for (let i = 0; i < ts.length - 1; i++) {
      const a = ts[i], b = ts[i + 1];
      quad(pol(a, r0, y0), pol(b, r0, y0), pol(b, r0, y1), pol(a, r0, y1), MAT.PRESSBOX, K.pressbox.id, .8, 1);
      quad(pol(a, r0, y1), pol(b, r0, y1), pol(b, r1, y1), pol(a, r1, y1), MAT.PRESSBOX, K.pressbox.id, .9, 1);
    }
  }

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

  /* ---- the memorial façade on 33rd Street (S03, S12, S18): 116 ft, concrete panel framed in brick ---- */
  {
    const F = DIM.facade, x0 = -F.w / 2, x1 = F.w / 2, zf = F.z, zb = F.z + F.depth, H = F.h;
    box(x0, 0, zf, x1, H, zb, MAT.FACADE, K.facade.id, .9, 0);
    quad([x0, 0, zf - .03], [x1, 0, zf - .03], [x1, H, zf - .03], [x0, H, zf - .03], MAT.FACADE_FACE, K.facade.id, .95, 0);
    // brick pylons either side (composition assumed: "brick and stone façade")
    for (const sx of [-1, 1]) { const a = sx > 0 ? x1 : x0 - F.pylon, b = sx > 0 ? x1 + F.pylon : x0;
      box(a, 0, zf + .6, b, H - .8, zb + 1.5, MAT.EXTERIOR, K.facade.id, .85, 0); }
    // entrance plaza (finished 1954, S05) and 33rd Street as a divided boulevard (widths assumed)
    const S = DIM.streets;
    quad([-70, .03, zf], [70, .03, zf], [70, .03, S.n33], [-70, .03, S.n33], MAT.PAVING, K.facade.id, 1, 0);
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
  { id: '33rd-street', label: 'Exterior: south sidewalk of 33rd Street, looking up at the memorial façade',
    at: () => ({ pos: [-12, 1.6, DIM.streets.n33 - 40], look: [0, 17, DIM.facade.z], fov: 70 }) },
  { id: 'ellerslie', label: 'Exterior: corner of 33rd Street and Ellerslie Avenue, looking east along the façade and the brick shell',
    at: () => ({ pos: [DIM.streets.ellerslie - 8, 1.6, DIM.streets.n33 - 12], look: [-20, 16, -32], fov: 64 }) },
  { id: 'overview-se', label: 'Exterior overview from the south-east (a model view, not a 1959 vantage)',
    at: () => ({ pos: [270, 175, -240], look: [0, 4, 36], fov: 46 }) },
  { id: 'north-lawn', label: 'Exterior: the open ground inside the block near 36th Street, looking south-west into the open end',
    at: () => ({ pos: [95, 1.6, 186], look: [8, 12, 112], fov: 68 }) }
];
