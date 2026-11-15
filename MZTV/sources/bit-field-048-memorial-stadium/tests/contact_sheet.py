#!/usr/bin/env python3
"""Contact sheet: neutral vs six-ink vs evidence, per station and weather. usage: python3 -I tests/contact_sheet.py [captures] [interior|exterior]"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'captures')
SETS = {
  'interior': [('cam0 · drizzle (S07) · REVIEW VIEW', 'clean-cam0-drizzle-{}'), ('cam0 · clear (alternate)', 'clean-cam0-clear-{}'),
               ('cam1 · west upper deck near the 50', 'cam1-drizzle-{}'), ('cam2 · upper deck behind home plate', 'cam2-drizzle-{}')],
  'exterior': [('cam3 · 33rd Street, the memorial façade', 'cam3-drizzle-{}'), ('cam4 · 33rd St & Ellerslie Ave', 'cam4-drizzle-{}'),
               ('cam5 · overview from the south-east (model view)', 'cam5-drizzle-{}'), ('cam6 · north lawn near 36th St, into the open end', 'cam6-drizzle-{}')]}
WHICH = sys.argv[2] if len(sys.argv) > 2 else 'interior'
rows = SETS[WHICH]
cols = [('NEUTRAL BASELINE 960×540', 'neutral'), ('SIX-INK PRINT 320×180 (HARBOUR LIGHT v3)', 'ink'), ('EVIDENCE MAP', 'evidence')]
cw, ch, pad, lab, head = 640, 360, 14, 22, 64
W = pad + len(cols) * (cw + pad); H = head + len(rows) * (ch + lab + pad) + 40
sheet = Image.new('RGB', (W, H), (24, 28, 46)); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 13); fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 16)
except OSError: f = fb = ImageFont.load_default()
d.text((pad, 14), f'MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · PHASE 01 · {WHICH.upper()} · 27 DEC 1959 · PROVISIONAL', fill=(243, 241, 234), font=fb)
d.text((pad, 38), 'same geometry, camera and light in every column; seed 48, t=12 s. Green = documented, amber = approximation, red = creative, hatched = unfinished.', fill=(170, 176, 196), font=f)
for r, (rl, pat) in enumerate(rows):
    y = head + r * (ch + lab + pad)
    for c, (cl, key) in enumerate(cols):
        x = pad + c * (cw + pad); p = os.path.join(D, pat.format(key) + '.png')
        d.text((x, y), f'{rl}  —  {cl}' if c == 0 else cl, fill=(230, 226, 214), font=f)
        if os.path.exists(p):
            im = Image.open(p).convert('RGB'); im = im.resize((cw, ch), Image.NEAREST if key == 'ink' else Image.LANCZOS); sheet.paste(im, (x, y + lab))
        else: d.rectangle([x, y + lab, x + cw, y + lab + ch], outline=(90, 90, 110)); d.text((x + 10, y + lab + 10), 'missing: ' + pat.format(key), fill=(200, 120, 100), font=f)
d.text((pad, H - 28), 'Not a photograph. A provisional reconstruction from documentary evidence; see docs/EVIDENCE-REGISTER.md.', fill=(170, 176, 196), font=f)
out = os.path.join(D, 'contact-sheet.png' if WHICH == 'interior' else f'contact-sheet-{WHICH}.png'); sheet.save(out); print(out, sheet.size)
