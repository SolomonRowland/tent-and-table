# Quick tour video

Builds `events/tour.mp4`, the under-two-minute narrated tour shown in Settings > Help. There is no music: a young, clear male voice reads one line per scene over a very faint room tone.

1. Serve the repo root: `python3 -m http.server 8765` (from the repo root).
2. Capture the screens from the demo: `mkdir -p tour && node tourcap.js` (needs Playwright).
3. Record the narration with Kokoro TTS (`pip install kokoro-onnx soundfile`, then put `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx releases in `tts/`): `python3 tournarrate.py tts am_puck 1.12`. This writes `narration.wav` and `durations.json`.
4. Render: `python3 tourvideo.py tour.mp4 narration.wav` (needs Pillow, numpy and ffmpeg).
5. Even out the loudness: `ffmpeg -i tour.mp4 -c:v copy -af loudnorm=I=-18:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 160k -movflags +faststart ../tour.mp4`

The spoken lines are in `LINES` in `tournarrate.py`, and the on-screen text is in `SCENES` in `tourvideo.py`, one entry per scene in the same order. Each scene lasts as long as its spoken line, so keep the total under two minutes.
