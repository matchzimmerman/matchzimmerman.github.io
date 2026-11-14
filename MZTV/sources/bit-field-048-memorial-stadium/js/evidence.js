/* MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · evidence register (Phase 01)
   One source of truth for what the reconstruction claims and why.
   The prototype's EVIDENCE view, its info box and docs/EVIDENCE-REGISTER.md all read this file.

   status:  'documented'  a source states it for 1959 (or for a span that contains 1959)
            'approx'      evidence-supported approximation: sources constrain it, the numbers are fitted
            'creative'    creative/generative: needed to make a picture, not claimed as fact
   confidence: high | medium | low
   rights: what a source may be used for in public material (text facts are not copyrightable;
           images are listed only as references and are NOT copied into this build).          */

export const SCENE = {
  date: '1959-12-27',
  event: 'NFL Championship Game · New York Giants at Baltimore Colts',
  result: 'Colts 31 – Giants 16',
  attendance: 57545,
  kickoff: '14:05 EST',
  sceneTime: '15:10 EST (provisional: third quarter, exact moment not chosen)',
  lat: 39.3294, lon: -76.6014,
  status: 'PROVISIONAL · awaiting MZ.Human approval of the moment and the baseline'
};

export const SOURCES = [
  { id: 'S01', title: 'Memorial Stadium (Baltimore), SABR BioProject ballpark essay', creator: 'David Stinson / SABR',
    url: 'https://sabr.org/bioproj/park/memorial-stadium-baltimore/', date: 'n.d. (online essay)', era: '1922–2002, with dated stages',
    supports: 'construction stages (lower deck 1949–50; upper deck Apr 1953–Apr 1954); 1954 centre-field scoreboard (Spencer Display, paid for by Gunther, 65 ft, Longines clock, two operators); memorial wall on 33rd St dedicated Memorial Day 1956; 8 ft field wall lowered 1961; 1961 field boxes; 1964 upper-deck extensions; 1958 capacity 47,778 (baseball)',
    confidence: 'high (footnoted to NYT 1954, Bready, Sun)', rights: 'facts only; essay text and its photographs not reused',
    discrepancy: 'pre-1961 outfield wall: NYT says 14 ft, Bready says 8 ft; scoreboard cost $172k vs $152k' },
  { id: 'S02', title: 'Memorial Stadium (diagrams and history)', creator: 'Andrew G. Clem, Clem\'s Baseball',
    url: 'https://www.andrewclem.com/Baseball/MemorialStadium.html', date: 'n.d. (hobbyist site, updated over years)', era: 'lifetime, with 1950/1954/1964/1986 diagrams',
    supports: 'CF orientation N; lifetime rows (lower 46, upper 33); upper deck on reinforced-concrete columns that obstructed lower-deck views; upper deck shaded most of the lower deck; mostly bench seats in the upper deck; 1964 upper deck extended ~50 ft at both ends near the foul poles; 1961 ~10 rows of boxes added, cutting 20 ft behind home; gridiron position shifted over years; light towers built later in the 1950s',
    confidence: 'medium (careful but unfootnoted; rows are lifetime figures)', rights: 'facts only; diagrams not copied',
    discrepancy: 'row counts are for the stadium\'s later life, not 1959' },
  { id: 'S03', title: 'Memorial Stadium', creator: 'Ballparks of Baseball',
    url: 'https://www.ballparksofbaseball.com/?p=226', date: 'n.d.', era: 'lifetime; football note undated',
    supports: 'for football the upper deck ran ~60 yd from the horseshoe\'s end zone to about the far 40 on both sides; 1964 upper deck lengthened; Gunther scoreboard replaced 1970',
    confidence: 'medium-low', rights: 'facts only',
    discrepancy: 'puts the Gunther scoreboard in right-centre; S01 (NYT) says centre field. The 60-yard football note is undated and may describe the post-1964 deck' },
  { id: 'S04', title: 'Memorial Stadium', creator: 'Stadiums of Pro Football',
    url: 'https://stadiumsofprofootball.com/?p=2583', date: 'n.d.', era: '1953–1997',
    supports: 'the original Gunther scoreboard sat beyond the end zone (football configuration); roofless upper deck spanning the inside of the horseshoe; 1953 opener ~46,000',
    confidence: 'medium-low', rights: 'facts only', discrepancy: '' },
  { id: 'S05', title: 'Memorial Stadium (Baltimore)', creator: 'Wikipedia contributors',
    url: 'https://en.wikipedia.org/wiki/Memorial_Stadium_(Baltimore)', date: 'accessed 2026-11-12', era: 'lifetime',
    supports: 'horseshoe open to the north; site bounded by 33rd St (S), Ellerslie Ave (W), 36th St (N), Ednor Rd (E); coordinates 39.3294 N, 76.6014 W; diamond moved to the south end for 1950',
    confidence: 'medium (tertiary; cross-checked with S01/S02)', rights: 'CC BY-SA text; facts only used', discrepancy: '' },
  { id: 'S06', title: 'Championship – New York Giants at Baltimore Colts – December 27th, 1959', creator: 'Pro-Football-Reference',
    url: 'https://www.pro-football-reference.com/boxscores/195912270clt.htm', date: 'database', era: '1959-12-27',
    supports: 'score by quarter (NYG 3-3-3-7, BAL 7-0-0-24) and scoring plays', confidence: 'high', rights: 'facts only', discrepancy: '' },
  { id: 'S07', title: '1959 NFL League Championship box score', creator: 'Pro Football Archives',
    url: 'https://profootballarchives.com/nflboxscores1/1959nfl073.html', date: 'database', era: '1959-12-27',
    supports: 'weather: drizzle, 49 °F, humidity 80 %, wind 6 mph; attendance 57,545',
    confidence: 'medium (weather source not named on the page)', rights: 'facts only',
    discrepancy: 'conflicts with S09 ("cool and crisp"); a contemporary newspaper should settle it' },
  { id: 'S08', title: '1959 NFL Championship Game', creator: 'Wikipedia contributors',
    url: 'https://en.wikipedia.org/wiki/1959_NFL_Championship_Game', date: 'accessed 2026-11-12', era: '1959-12-27',
    supports: 'kickoff 2:05 pm EST; attendance 57,545; NBC; five officials; cites Chicago Tribune, Pittsburgh Post-Gazette, Milwaukee Sentinel (28 Dec 1959)',
    confidence: 'medium (cites contemporary papers, not yet read)', rights: 'CC BY-SA text; facts only', discrepancy: '' },
  { id: 'S09', title: '1959: Colts Defeat Giants to Repeat as NFL Champions', creator: 'fs64sports blog',
    url: 'https://fs64sports.blogspot.com/2011/12/', date: '2011-12-27', era: '1959-12-27',
    supports: 'describes the weather as cool and crisp', confidence: 'low (retrospective blog, no source)', rights: 'not reused',
    discrepancy: 'conflicts with S07 (drizzle)' },
  { id: 'S10', title: 'Total Baseball (1994 CD-ROM): Ballparks, Part 2 (Philip J. Lowry, Green Cathedrals data)', creator: 'Philip J. Lowry',
    url: 'https://discmaster.textfiles.com/view/17238/Total_Baseball_1994_Edition_Creative_Multimedia_1994.iso/dp/0001/00015.txt', date: '1994', era: 'dated measurements',
    supports: 'Memorial Stadium backstop 70.5 ft (1954), 72 ft (1957); home plate moved from the north to the south',
    confidence: 'medium-high (standard reference)', rights: 'facts only', discrepancy: '' },
  { id: 'S11', title: 'Memorial Stadium, 900 East 33rd Street, Baltimore (HABS survey)', creator: 'Historic American Buildings Survey; James W. Rosenthal, photographer; Martin Perschler, historian',
    url: 'https://www.loc.gov/pictures/item/md1542/', date: 'photographed 2000–2001 (pre-demolition)', era: 'RETROSPECTIVE: shows the 1964+ stadium, empty, c.2000',
    supports: 'not yet inspected in this session (the Library of Congress page could not be fetched from the build environment). Expected: architecture, façade, deck structure, column rhythm',
    confidence: 'n/a until read', rights: 'HABS photos are generally US Government work with no known restrictions; confirm on the item record before any reuse',
    discrepancy: 'must not be presented as 1959 evidence: upper deck was extended in 1964, seats replaced, boxes added 1961, scoreboards replaced 1970/1985' },
  { id: 'S12', title: 'Forgotten Stadiums: Baltimore\'s Memorial Stadium', creator: 'Stadium Journey',
    url: 'https://www.stadiumjourney.com/stadiums/forgotten-stadiums-baltimores-memorial-stadium', date: 'n.d.', era: 'lifetime',
    supports: 'the 33rd Street façade and memorial wall stood 116 ft tall (brick and stone)', confidence: 'medium-low (unsourced figure)', rights: 'facts only; its HABS photo credits noted', discrepancy: '' },
  { id: 'S13', title: '1963 Baltimore Colts media guide (PDF)', creator: 'Baltimore Colts / NFL',
    url: 'https://static.clubs.nfl.com/image/upload/colts/drzp8anyx4wdwuwsbgtq.pdf', date: '1963', era: '1963 (four seasons after the scene)',
    supports: 'not yet inspected (not reachable from the build environment). May hold a seating chart; any chart must be checked against 1959 (no 1961 boxes, no 1964 deck extensions)',
    confidence: 'n/a', rights: 'team publication; reference only', discrepancy: 'chronology: later than the scene' },
  { id: 'S14', title: '1959 Baltimore Colts season', creator: 'Wikipedia contributors',
    url: 'https://en.wikipedia.org/wiki/1959_Baltimore_Colts_season', date: 'accessed 2026-11-12', era: '1959',
    supports: 'home attendances of 57,557 (sell-outs) through 1959; ticket tiers included "field seats", "field boxes" and "upper grandstand"',
    confidence: 'medium', rights: 'facts only',
    discrepancy: '"field seats" suggests temporary field-level seating for football in 1959 that is not yet modelled' },
  { id: 'S15', title: 'NFL field rules of the period (goalposts on the goal line 1933–1973; hash marks 20 yd from the sidelines until 1972)', creator: 'general football reference (to be cited to the NFL rulebook of 1959)',
    url: '', date: '', era: 'rule in force in 1959',
    supports: 'H-shaped goalposts standing on the goal line; inbounds lines 20 yd in from each sideline; 100-yd field with 10-yd end zones, 160 ft wide',
    confidence: 'medium (well known; primary citation still to add)', rights: 'n/a', discrepancy: '' }
];

/* claims: every modelled thing points to one of these, so the EVIDENCE view can colour it */
export const CLAIMS = [
  { id: 0,  key: 'sky',        label: 'Sky and air (overcast drizzle)',               status: 'approx',     src: ['S07'], note: 'drizzle 49 °F from S07; cloud form, haze amount and brightness are fitted, not recorded' },
  { id: 1,  key: 'orientation',label: 'Horseshoe open to the north, home plate at the south', status: 'documented', src: ['S02','S05','S10'], note: 'CF due north; diamond at the south end since 1950' },
  { id: 2,  key: 'bowl',       label: 'Lower-deck horseshoe plan (front wall curve)',   status: 'approx',     src: ['S01','S02','S10'], note: 'circle fitted through the 72 ft backstop (1957) and the 309 ft foul poles; real plan not traced' },
  { id: 3,  key: 'lowerdeck',  label: 'Lower deck rows and rake (36 rows, 8 ft front wall)', status: 'approx', src: ['S01','S02'], note: '46 lifetime rows minus ~10 rows of 1961 boxes; tread/riser assumed (0.84 / 0.38 m)' },
  { id: 4,  key: 'upperdeck',  label: 'Upper deck: 1954 extent, 33 rows, roofless',     status: 'approx',     src: ['S01','S02','S03','S04'], note: 'ends ~50 ft short of the foul poles (before the 1964 extensions); rake assumed (0.8 / 0.5 m); top ≈ 36 m checks against the 116 ft façade (S12)' },
  { id: 5,  key: 'columns',    label: 'Concrete columns under the upper deck',          status: 'approx',     src: ['S02'], note: 'documented that they existed and blocked views; spacing (6°) and radius are assumed' },
  { id: 6,  key: 'soffit',     label: 'Upper-deck underside, fascia and concourse wall',status: 'creative',   src: [], note: 'needed to close the section; shape invented' },
  { id: 7,  key: 'field',      label: 'Football field 1959 (lines, hash marks 20 yd in, end zones)', status: 'documented', src: ['S15'], note: 'rule dimensions; placement along the axis is approximate (see gridiron)' },
  { id: 8,  key: 'gridiron',   label: 'Gridiron position (south end line 6 m north of the backstop line)', status: 'approx', src: ['S02','S03'], note: 'chosen so the upper deck ends near the far 40, as S03 describes; S02 says the position changed over the years' },
  { id: 9,  key: 'goalposts',  label: 'Goalposts on the goal lines (H-shape)',          status: 'documented', src: ['S15'], note: 'position by rule; upright height and colour assumed' },
  { id: 10, key: 'infield',    label: 'Baseball infield dirt showing through the field', status: 'approx',    src: ['S05'], note: 'dual-use field; whether the skin was sodded over for December football is unverified' },
  { id: 11, key: 'turf',       label: 'Late-December grass, wear down the middle',      status: 'creative',   src: [], note: 'colour and wear invented to read as a winter field' },
  { id: 12, key: 'crowd',      label: 'Full house (57,545) as a texture of coats',      status: 'creative',   src: ['S08','S14'], note: 'sell-out documented; individual spectators not simulated, pattern is generated' },
  { id: 13, key: 'scoreboard', label: 'Gunther scoreboard (1954) beyond the north end zone, 65 ft, Longines clock', status: 'approx', src: ['S01','S03','S04'], note: 'existence, date, height, clock documented; width, exact position (centre vs right-centre) and face design are not' },
  { id: 14, key: 'outfield',   label: 'Outfield wings, wall and centre-field opening',  status: 'approx',     src: ['S01','S02'], note: '14 ft corner walls receding at 135°, wire fence and terrace in CF, LF/RF bleachers; plan fitted to 445/446 ft' },
  { id: 15, key: 'foulpoles',  label: 'Foul poles at 309 ft',                           status: 'documented', src: ['S01','S02'], note: 'height assumed' },
  { id: 16, key: 'pressbox',   label: 'Press box on the rim behind home plate',        status: 'creative',   src: [], note: 'placeholder; 1959 press box form and position not yet researched' },
  { id: 17, key: 'neighbour',  label: 'Waverly / Ednor Gardens rowhouses and bare trees to the north', status: 'creative', src: ['S05'], note: 'streets documented; houses are generic two-storey massing' },
  { id: 18, key: 'ground',     label: 'Ground outside the bowl',                        status: 'creative',   src: [], note: 'flat plane; real grades not modelled' },
  { id: 19, key: 'aisles',     label: 'Aisles and portals in the stands',               status: 'creative',   src: [], note: 'rhythm assumed (12° aisles, 24° portals)' },
  { id: 20, key: 'lighttowers',label: 'Light towers (late 1950s)',                      status: 'creative',   src: ['S02'], note: 'NOT MODELLED: S02 says big towers were added later in the 1950s; date and positions unknown, and it was a day game' }
];

export const STATUS = {
  documented: { label: 'DOCUMENTED', hint: 'a source states it for 1959' },
  approx:     { label: 'APPROXIMATION', hint: 'sources constrain it; numbers fitted' },
  creative:   { label: 'CREATIVE', hint: 'needed for the picture, not claimed' }
};
export const claimByKey = Object.fromEntries(CLAIMS.map(c => [c.key, c]));
