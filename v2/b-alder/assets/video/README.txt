HERO VIDEOS (header video per segment): DEMO LOOPS
Pripremio ECHOSYSTEM-MOTHER AGENCY

These five files are placeholder loops made from the segment poster images (a slow zoom, 6 s, no sound, about 100 to 170 KB each). They only
show how the header video behaves. Replace them with real footage of the same name (muted, looping, H.264 mp4, about 1280x720, a few MB at most).
dermatologija-m.mp4 is the optional second file that phones get (data-video-m); here it is the same 1280x720 demo loop, the real one should be portrait 9:16. Other segments use one file for every screen.

To switch a segment back to the still poster: remove its line in CFG.heroVideos in _tools/b/build-pages.mjs and run
node _tools/b/build-pages.mjs  (the data-video attribute disappears from that page; the poster image stays).
The video is only requested on a good connection, never with reduced motion, and the poster always stays as the fallback (js/pages.js).
