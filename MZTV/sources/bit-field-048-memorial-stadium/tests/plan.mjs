// Generates docs/plan.svg (plan) and docs/section.svg (section) from js/geometry.js, so the diagrams
// can never drift from the model.   usage: node tests/plan.mjs   (from the piece folder)
import { writeFileSync, mkdirSync } from 'node:fs';
import { DIM as D, pol, STATIONS, softUnder } from '../js/geometry.js';
mkdirSync('docs', { recursive: true });
const D2R = Math.PI / 180, f = v => v.toFixed(1);
const S = 3.2, OX = 560, OZ = 720;               // px per metre; origin (home plate) on the page
const X = x => OX + x * S, Y = z => OZ - z * S;   // north up
const arc = (r, a0, a1, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + (a1 - a0) * i / n, p = pol(t, r, 0); return `${f(X(p[0]))},${f(Y(p[2]))}`; }).join(' ');
const C = { doc: '#8fd694', apx: '#f0b54a', cre: '#e2664f', ink: '#f3f1ea', dim: '#9aa3b8', bg: '#181c2e' };
const T = (x, y, s, c = C.ink, a = 'start', sz = 11) => `<text x="${f(x)}" y="${f(y)}" fill="${c}" font-size="${sz}" text-anchor="${a}">${s}</text>`;
let g = [];
// bowl: lower deck front, lower back, upper front/back (1954), 1964 extension ghost
g.push(`<polyline points="${arc(D.R0, -D.thPole, D.thPole)}" fill="none" stroke="${C.apx}" stroke-width="2"/>`);
g.push(`<polyline points="${arc(D.lowBackR, -D.thPole, D.thPole)}" fill="none" stroke="${C.apx}" stroke-width="1"/>`);
g.push(`<polyline points="${arc(D.upFrontR, -D.thUp, D.thUp)}" fill="none" stroke="${C.apx}" stroke-width="1.4" stroke-dasharray="6 3"/>`);
g.push(`<polyline points="${arc(D.upBackR, -D.thUp, D.thUp)}" fill="none" stroke="${C.apx}" stroke-width="1.4" stroke-dasharray="6 3"/>`);
for (const s of [-1, 1]) g.push(`<polyline points="${arc(D.upBackR + 2, s * D.thUp, s * D.thPole, 12)}" fill="none" stroke="${C.dim}" stroke-width="3" opacity=".5"/>`);
// field
const hx = D.fieldW / 2;
g.push(`<rect x="${f(X(-hx))}" y="${f(Y(D.endN))}" width="${f(D.fieldW * S)}" height="${f(D.fieldL * S)}" fill="none" stroke="${C.doc}" stroke-width="1.5"/>`);
for (const z of [D.goalS, D.goalN, D.fifty]) g.push(`<line x1="${f(X(-hx))}" y1="${f(Y(z))}" x2="${f(X(hx))}" y2="${f(Y(z))}" stroke="${C.doc}" stroke-width="${z === D.fifty ? 1 : 1.5}"/>`);
const far40 = D.goalN - 40 * .9144;
g.push(`<line x1="${f(X(-hx - 30))}" y1="${f(Y(far40))}" x2="${f(X(hx + 30))}" y2="${f(Y(far40))}" stroke="${C.apx}" stroke-dasharray="2 3"/>`);
// diamond, foul lines, poles, outfield wall
g.push(`<polygon points="${[[0, 0], [19.4, 19.4], [0, 38.8], [-19.4, 19.4]].map(([x, z]) => `${f(X(x))},${f(Y(z))}`).join(' ')}" fill="none" stroke="${C.dim}"/>`);
for (const s of [-1, 1]) {
  g.push(`<line x1="${X(0)}" y1="${Y(0)}" x2="${f(X(s * D.pole))}" y2="${f(Y(D.pole))}" stroke="${C.dim}" stroke-dasharray="4 3"/>`);
  g.push(`<circle cx="${f(X(s * D.pole))}" cy="${f(Y(D.pole))}" r="4" fill="${C.doc}"/>`);
  const rc = [s * Math.sin(22.5 * D2R) * D.rcf, Math.cos(22.5 * D2R) * D.rcf];
  g.push(`<polyline points="${[[s * D.pole, D.pole], [s * D.pole, 108], rc, [s * 26, D.cf - 2], [0, D.cf]].map(([x, z]) => `${f(X(x))},${f(Y(z))}`).join(' ')}" fill="none" stroke="${C.apx}" stroke-width="1.4"/>`);
  g.push(`<rect x="${f(X(s > 0 ? D.pole : -D.pole - 16))}" y="${f(Y(108))}" width="${f(16 * S)}" height="${f((108 - D.pole - 2) * S)}" fill="${C.apx}" opacity=".18" stroke="${C.apx}"/>`);
}
// exterior: brick shell, memorial façade, streets
g.push(`<polyline points="${arc(D.upBackR + .4, -D.thUp, D.thUp)}" fill="none" stroke="#b5654a" stroke-width="3"/>`);
const Fd = D.facade; g.push(`<rect x="${f(X(-Fd.w / 2))}" y="${f(Y(Fd.z + Fd.depth))}" width="${f(Fd.w * S)}" height="${f(Fd.depth * S)}" fill="${C.apx}" stroke="${C.doc}" stroke-width="1.5"/>`);
const St = D.streets;
for (const [z0, z1] of [[St.n33, St.n33 - 10], [St.n33 - 18, St.n33 - 28]]) g.push(`<rect x="${f(X(-170))}" y="${f(Y(z0))}" width="${f(340 * S)}" height="${f((z0 - z1) * S)}" fill="${C.dim}" opacity=".18"/>`);
g.push(T(X(0), Y(St.n33 - 14) + 4, `33rd Street (divided boulevard; widths assumed)`, C.dim, 'middle'));
g.push(T(X(0), Y(Fd.z) + 14, `memorial façade · 116 ft · 44 m panel (width assumed)`, C.doc, 'middle'));
// scoreboard, columns, stations
g.push(`<rect x="${f(X(D.sbX - D.sbW / 2))}" y="${f(Y(D.sbZ + 2.4))}" width="${f(D.sbW * S)}" height="${f(2.4 * S)}" fill="${C.apx}"/>`);
for (let th = -D.thUp + 3 * D2R; th < D.thUp - 2 * D2R; th += D.colStep * D2R) { const p = pol(th, D.R0 + D.colR, 0); g.push(`<rect x="${f(X(p[0]) - 1.5)}" y="${f(Y(p[2]) - 1.5)}" width="3" height="3" fill="${C.apx}"/>`); }
STATIONS.forEach((s, i) => { const a = s.at(), dx = a.look[0] - a.pos[0], dz = a.look[2] - a.pos[2], l = Math.hypot(dx, dz), h = a.fov / 2 * D2R, yaw = Math.atan2(dx, dz), R = 60;
  const p1 = [a.pos[0] + Math.sin(yaw - h) * R, a.pos[2] + Math.cos(yaw - h) * R], p2 = [a.pos[0] + Math.sin(yaw + h) * R, a.pos[2] + Math.cos(yaw + h) * R];
  g.push(`<polygon points="${f(X(a.pos[0]))},${f(Y(a.pos[2]))} ${f(X(p1[0]))},${f(Y(p1[1]))} ${f(X(p2[0]))},${f(Y(p2[1]))}" fill="${i ? C.dim : C.ink}" opacity="${i ? .12 : .22}"/>`);
  g.push(`<circle cx="${f(X(a.pos[0]))}" cy="${f(Y(a.pos[2]))}" r="5" fill="${i ? C.dim : C.ink}"/>`, T(X(a.pos[0]) - 8, Y(a.pos[2]) + 18, `cam${i}`, i ? C.dim : C.ink, 'end')); });
// labels and dimensions
g.push(T(X(0), Y(-D.back) + 16, `backstop 72 ft (1957) · front wall`, C.apx, 'middle'));
g.push(T(X(D.pole) + 8, Y(D.pole) + 4, `foul pole 309 ft`, C.doc));
g.push(T(X(-D.pole) - 8, Y(D.pole) + 4, `foul pole 309 ft`, C.doc, 'end'));
g.push(T(X(hx + 34), Y(far40) - 4, `far 40 · 1954 upper deck ends z=${f(Math.sin(D.thUp) * 0 + D.cz - Math.cos(D.thUp) * D.upFrontR)} m`, C.apx));
g.push(T(X(0), Y(D.sbZ + 2.4) - 8, `Gunther scoreboard 1954 · 65 ft · position/width assumed`, C.apx, 'middle'));
g.push(T(X(0), Y(D.cf) + 16, `CF 445 ft · wire fence`, C.apx, 'middle'));
g.push(T(24, 178, `grey arcs = 1964 upper-deck extensions (not in 1959)`, C.dim));
g.push(T(X(0), Y(D.goalS) - 6, `S goal line`, C.doc, 'middle'), T(X(0), Y(D.goalN) + 14, `N goal line`, C.doc, 'middle'));

g.push(`<line x1="${f(X(-150))}" y1="${f(Y(-80))}" x2="${f(X(-150))}" y2="${f(Y(-50))}" stroke="${C.ink}" stroke-width="2" marker-end="url(#a)"/>`, T(X(-150), Y(-86), 'N', C.ink, 'middle', 13));
g.push(`<line x1="${f(X(100))}" y1="${f(Y(-90))}" x2="${f(X(150))}" y2="${f(Y(-90))}" stroke="${C.ink}" stroke-width="2"/>`, T(X(125), Y(-90) - 6, '50 m', C.ink, 'middle'));
const legend = [[C.doc, 'documented for 1959'], [C.apx, 'approximation fitted to sources'], [C.cre, 'creative'], [C.ink, 'review camera (cam0) and its field of view'], ['#b5654a', 'brick shell (1954 extent)']]
  .map(([c, s], i) => `<rect x="24" y="${70 + i * 18}" width="10" height="10" fill="${c}"/>` + T(42, 79 + i * 18, s));
writeFileSync('docs/plan.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="1140" viewBox="0 0 1120 1140" font-family="JetBrains Mono, DejaVu Sans Mono, monospace">
<defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink}"/></marker></defs>
<rect width="100%" height="100%" fill="${C.bg}"/>
${T(24, 34, 'MEMORIAL STADIUM · 1959 · PLAN (Phase 01 model, provisional)', C.ink, 'start', 15)}
${T(24, 54, 'generated from js/geometry.js · origin = home plate · metres · lower deck solid, 1954 upper deck dashed', C.dim)}
${legend.join('')}
${g.join('\n')}
</svg>`);

// section through the stands at the 50 (west side), showing the rake, overhang and columns
const sx = 6, sy = 6, ox = 60, oy = 330, Xr = r => ox + (r - D.R0 + 12) * sx, Yy = y => oy - y * sy;
const s = [];
s.push(`<line x1="${Xr(D.R0 - 12)}" y1="${Yy(0)}" x2="${Xr(D.upBackR + 6)}" y2="${Yy(0)}" stroke="${C.dim}"/>`);
let lp = [[D.R0, 0], [D.R0, D.wallH]]; for (let i = 0; i < D.lowRows; i++) { const r0 = D.R0 + i * D.lowTread, y = D.wallH + i * D.lowRise; lp.push([r0, y], [r0 + D.lowTread, y]); }
s.push(`<polyline points="${lp.map(([r, y]) => `${f(Xr(r))},${f(Yy(y))}`).join(' ')}" fill="none" stroke="${C.apx}" stroke-width="1.5"/>`);
let up = [[D.upFrontR, D.fasciaLow], [D.upFrontR, D.upY0]]; for (let i = 0; i < D.upRows; i++) { const r0 = D.upFrontR + i * D.upTread, y = D.upY0 + i * D.upRise; up.push([r0, y], [r0 + D.upTread, y]); }
up.push([D.upBackR, D.upTopY + 1.2]);
s.push(`<polyline points="${up.map(([r, y]) => `${f(Xr(r))},${f(Yy(y))}`).join(' ')}" fill="none" stroke="${C.apx}" stroke-width="1.5"/>`);
s.push(`<line x1="${Xr(D.upFrontR)}" y1="${Yy(D.fasciaLow)}" x2="${Xr(D.lowBackR)}" y2="${Yy(softUnder(D.lowBackR))}" stroke="${C.cre}" stroke-width="1.5"/>`);
s.push(`<line x1="${Xr(D.lowBackR)}" y1="${Yy(D.lowBackY)}" x2="${Xr(D.lowBackR)}" y2="${Yy(softUnder(D.lowBackR))}" stroke="${C.cre}" stroke-width="1.5"/>`);
const cr = D.R0 + D.colR, cy0 = D.wallH + Math.floor(D.colR / D.lowTread) * D.lowRise;
s.push(`<rect x="${f(Xr(cr) - 2.5)}" y="${f(Yy(softUnder(cr)))}" width="5" height="${f((softUnder(cr) - cy0) * sy)}" fill="${C.apx}"/>`);
// sightline from the cam1 seat to the near sideline
const seatR = D.upFrontR + 14 * D.upTread + .4, seatY = D.upY0 + 14 * D.upRise + 1.15, side = D.R0 + 0 - (D.R0 - (Math.abs(pol(-86 * D2R, D.R0, 0)[0]) - D.fieldW / 2));
s.push(`<line x1="${Xr(seatR)}" y1="${Yy(seatY)}" x2="${Xr(D.R0 - 12)}" y2="${Yy(seatY - (seatR - D.R0 + 12) * Math.tan(Math.atan2(seatY, seatR - D.R0 + 45)))}" stroke="${C.ink}" stroke-dasharray="3 3" opacity=".6"/>`);
s.push(`<circle cx="${Xr(seatR)}" cy="${Yy(seatY)}" r="4" fill="${C.ink}"/>`);
const lab = [[D.R0, D.wallH, '8 ft field wall (to 1961)', C.doc], [D.R0 + 6, D.wallH + 9, `lower deck: ${D.lowRows} rows, ${D.lowTread}/${D.lowRise} m (assumed)`, C.apx],
  [D.upFrontR - 1, D.upY0 + 3, `upper deck: ${D.upRows} rows, ${D.upTread}/${D.upRise} m (assumed)`, C.apx], [cr + 1.5, (cy0 + softUnder(cr)) / 2, 'column (spacing assumed)', C.apx],
  [D.lowBackR - 9, softUnder(D.lowBackR) - 3, 'underside + concourse wall: invented', C.cre], [D.upBackR - 8, D.upTopY + 4, `rim ≈ ${f(D.upTopY + 1.2)} m (façade 116 ft = 35.4 m, S12)`, C.apx], [seatR + 1, seatY + 1.5, 'seat, row 14', C.ink]];
for (const [r, y, t, c] of lab) s.push(T(Xr(r) + 4, Yy(y), t, c));
s.push(T(Xr(D.R0 - 12), Yy(0) + 16, 'field', C.dim), T(Xr(D.R0) - 4, Yy(0) + 16, `front wall R0=${f(D.R0)} m from bowl centre`, C.dim));
writeFileSync('docs/section.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="380" viewBox="0 0 900 380" font-family="JetBrains Mono, DejaVu Sans Mono, monospace">
<rect width="100%" height="100%" fill="${C.bg}"/>${T(24, 28, 'SECTION THROUGH THE STANDS (west side) · Phase 01 model · 1 m = 6 px', C.ink, 'start', 13)}
${s.join('\n')}</svg>`);
console.log('wrote docs/plan.svg docs/section.svg');
