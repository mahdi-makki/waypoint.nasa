# MVP: "Marswalk Map: Jezero Crater"

A web page that shows a map of Jezero Crater with layers, a walking route, safety info, rover photos and a 3D view of the walk area.

## What's in it

1. **Map with 4 layers** you can switch between:
   - HiRISE photos (sharpest view, small area only)
   - CTX photos (sharp view of the wider area)
   - MOLA (height colors)
   - THEMIS (heat/infrared view)
2. **Route:** Perseverance's real driving path drawn as a line. We treat a ~3–5 km piece of it as the astronaut's walk.
3. **Route info box:** walk distance, highest and lowest point, and steep parts colored red.
4. **Slope map:** HiRISE and CTX height data show steep ground around the route, not just on it.
5. **3–5 science stops:** pins on the route where the rover stayed a long time, meaning scientists found something there.
6. **Rover photos:** real Perseverance ground photos shown when you click a science stop.
7. **3D view:** a small 3D landscape of the walk area, made from HiRISE height data.
8. **Mars clock:** current Mars time at Jezero, and whether the Sun is up.

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

**Coverage checked:** the walk (rover stops 154–260, about 4 km up the delta front) is inside HiRISE height data `DTEEC_045994_1985_046060_1985_U01`. Several CTX height datasets also cover it.

## Build steps

1. Show a blank Mars map centered on Jezero (~30 min)
2. Add the MOLA, THEMIS and CTX layers and a switcher (~30 min)
3. Draw the rover path (~30 min)
4. Pick the walk section and show distance/height/steep parts (~1 hr)
5. Add science stop pins (~30 min)
6. Add the Mars clock (~30 min)
7. Add rover photos to the science stops (~1.5 hrs)
8. Check height data coverage and download the HiRISE and CTX files (~1 hr)
9. Add the HiRISE photo layer (~1 hr)
10. Add the slope map from the height data (~2 hrs)
11. Add the 3D view (~3 hrs)

**Total:** about 12–14 hours. Steps 1–6 give a working map, so build those first.

## Left out for later

- Weather (there's no working live Mars weather feed)
- Drawing your own custom route
