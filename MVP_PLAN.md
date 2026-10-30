# MVP: "Marswalk Map: Jezero Crater"

A web page that shows a map of Jezero Crater with layers, a walking route, safety info, rover photos and a 3D view of the walk area.

**Status:** all 8 core features and all 11 build steps are complete. Of the 4 extra features, 1 is partly done and 3 are not started.

## What's in it

1. [x] **Map with 4 layers:**
   - [x] HiRISE photos (sharpest view, small area only; turned on and off with a checkbox)
   - [x] CTX photos (sharp view of the wider area)
   - [x] MOLA (height colors)
   - [x] THEMIS (heat/infrared view)
2. [x] **Route:** Perseverance's real driving path drawn as a line. We treat a ~4 km piece of it as the astronaut's walk.
3. [x] **Route info box:** walk distance, highest and lowest point, and steep parts colored red.
4. [x] **Slope map:** HiRISE and CTX height data show steep ground around the route, not just on it.
5. [x] **4 science stops:** pins on the route where the rover stayed a long time. All 4 are confirmed sampling sites in NASA's records.
6. [x] **Rover photos:** real Perseverance ground photos shown when you click a science stop.
7. [x] **3D view:** a small 3D landscape of the walk area, made from HiRISE height data.
8. [x] **Mars clock:** current Mars time at Jezero, and whether the Sun is up.

## Data used

| Source | Used for | Where it comes from |
|---|---|---|
| MOLA | Height colors | Mars Trek map tiles |
| HiRISE | Sharp photos, slopes, 3D view | PDS / USGS |
| CTX photos | Wider photo layer | Esri OnMars map tiles |
| CTX height data | Slopes outside the HiRISE area | USGS |
| Mars Trek | Supplies MOLA and THEMIS tiles | NASA |
| THEMIS | Heat/infrared layer | Mars Trek map tiles |
| Perseverance route | Path, heights, science stops | NASA Mars 2020 route file |
| Perseverance photos | Photos at science stops | NASA raw images feed |
| NASA reports and sample table | What the rover did at each stop | NASA / JPL (links in `science.js`) |

**Coverage checked:** the walk (rover stops 154–260, about 4 km up the delta front) is inside HiRISE height data `DTEEC_045994_1985_046060_1985_U01`. Several CTX height datasets also cover it.

**Downloaded to `data/`:** `hirise_dtm.tif`, `hirise_ortho.tif` and `ctx_dtm.tif` (the CTX pair is `J03_045994_1986_XN_18N282W__J03_046060_1986_XN_18N282W`). They are slightly misaligned with the rover's coordinates, so anything built from them must apply the shifts recorded in `terrain_shifts.py`.

## Build steps

1. [x] Show a blank Mars map centered on Jezero (~30 min)
2. [x] Add the MOLA, THEMIS and CTX layers and a switcher (~30 min)
3. [x] Draw the rover path (~30 min)
4. [x] Pick the walk section and show distance/height/steep parts (~1 hr)
5. [x] Add science stop pins (~30 min)
6. [x] Add the Mars clock (~30 min)
7. [x] Add rover photos to the science stops (~1.5 hrs)
8. [x] Check height data coverage and download the HiRISE and CTX files (~1 hr)
9. [x] Add the HiRISE photo layer (~1 hr)
10. [x] Add the slope map from the height data (~2 hrs)
11. [x] Add the 3D view (~3 hrs)

**Total:** about 12–14 hours. Steps 1–6 give a working map, so build those first.

## Left out for later

- Weather (there's no working live Mars weather feed)
- Drawing your own custom route

## Added after reading the challenge

Build these after steps 7 and 9–11. The challenge says existing tools are too regional, so the close-up HiRISE detail comes first.

1. [ ] **Radiation panel (~1 hr):** a dose estimate for the walk, based on walk time and Curiosity's RAD (radiation detector) reading of about 0.64 mSv per day. Perseverance has no radiation sensor, so label this as measured at Gale Crater, not Jezero.
2. [ ] **Science notes (~1 hr):** a short note at each science stop saying what the astronaut does there and why it matters. *Partly done: each stop says what the rover did and why it matters, but not yet what the astronaut does.*
3. [ ] **Rock and obstacle zones (~1.5 hrs):** mark rocky areas found in the HiRISE photos and slope map, so the route shows what to go around.
4. [ ] **Typical conditions (~1 hr):** typical temperature and dust values from Perseverance's MEDA weather station. Label them as typical, not live.

| Source | Used for | Where it comes from |
|---|---|---|
| Curiosity RAD | Radiation dose estimate | Published results / PDS |
| Perseverance MEDA | Typical temperature and dust | PDS |

**Added time:** about 4.5 hours.

## Known flaws

1. **Planning:** there's no walking time or daylight check.
2. **Route:** it copies the rover's back-and-forth driving, so 4.1 km is longer than an astronaut would need.
3. **Steepness:** 3 m detail can't show single rocks or small drop-offs, and the 12% assumes straight lines between stops.
4. **Alignment:** the HiRISE photo is lined up with the rover line, so it sits about 50 m off from the CTX photos.
5. **Coverage:** slope colors stop about 2 km from the rover's path.
6. **Sun angle:** it's an estimate that ignores crater walls and dust.
7. **Round hole at stop 4:** what made it is still unconfirmed.
8. **3D view:** the stops can't be clicked, and it needs internet (so does the map).
9. **Stop dates:** NASA's records were matched to the stops by sol, not by map position.

## Check before presenting

- [ ] Click every science stop, the 3D link and the 3D controls with a real mouse
- [ ] Check the photo credits against NASA's photo pages (they were written from memory)
- [ ] Be ready to say the 10° limit and slope colors are our own choices, not NASA safety rules
