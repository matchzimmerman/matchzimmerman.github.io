# McDonogh Ground Survey — source bundle (MZ.Claude, 2026-11-02)

Public page: https://www.matchzimmerman.com/MCDONOGH/ground-survey/
Data tiles live in ./data (USGS public domain).

## Pipeline
1. DEM: USGS 3DEP MD_4County_D24 bare-earth GeoTIFFs (0.5 m, 1 km tiles, EPSG:6347 + NAVD88)
   https://prd-tnm.s3.amazonaws.com/index.html?prefix=StagedProducts/Elevation/OPR/Projects/MD_4County_D24/
   Tile name 18SUJ<ee>0<nn>0 (e.g. 18SUJ460610) -> lower-left E = 300000 + ee*1000, N = 4300000 + nn*1000.
   mosaic.py -> dem.npy (6x6 km float32).
2. Point cloud (optional layers): LAZ from rockyweb.usgs.gov (rate-limited; see laz_urls.txt).
   dl.sh downloads sequentially and resumes. CHECK every file starts with "LASF":
   a 429 page can get resumed-into and corrupt the first 259 bytes (fix: re-fetch -r 0-258, dd conv=notrunc).
   surface.py -> surface.npy (B-channel code) + intensity.npy (first-return mean, percentile stretch).
   No building class in this delivery: buildings = nDSM>2.2 m AND no ground returns within 2.5 m AND smooth DSM.
3. encode.py -> data/ : 512 m tiles (1024 px + 2 px border) as lossless WebP.
   R,G = (h-100 m) in cm (uint16 big-endian); B = 128*building + round(nDSM/0.4).
   ov.webp 2 m overview; s0/s1/s2 = Gaussian-smoothed DEM (3/8/20 m) for local relief; i/*.jpg intensity.
4. viewer.html: three.js r160 (jsDelivr). Decodes heights on GPU (texelFetch + manual bilinear),
   shades per fragment at 0.5 m (relief/hillshade/multi/slope/elevation/intensity, contours, surface hatch),
   ortho plan camera + MapControls 3D, tile streaming by view, ray-marched picking,
   pins, profiles, model/image import (GLB/OBJ/STL/DAE/PNG/JPG), 2-point similarity alignment,
   localStorage + IndexedDB persistence, copy/paste scene JSON.

## Re-pointing to a new site
Change E0/NTOP/COLS/ROWS in encode.py and the mosaic frame in surface.py / mosaic.py;
pick the 3DEP project covering the site (TNM / NOAA Digital Coast); keep 0.5 m DEM if available.
Viewer reads everything from data/meta.json; only BOOKMARKS in viewer.html are site-specific.
