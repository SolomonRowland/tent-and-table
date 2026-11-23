# Narration for the quick tour: one line per scene, a young, clear male voice (Kokoro).
# Writes narration.wav (the voice over a very faint room tone, 1 s longer than the scenes) and
# durations.json (seconds per scene, sized to the voice plus a breath).
import sys, json, numpy as np, wave, os
from kokoro_onnx import Kokoro
D = os.path.dirname(os.path.abspath(__file__))
M = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, 'tts')
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'am_puck'
SPEED = float(sys.argv[3]) if len(sys.argv) > 3 else 1.12
LINES = ['Welcome to Tent and Table.', 'Ministry events take more than a calendar. Volunteers, meals, tasks and money end up scattered across texts and spreadsheets. Tent and Table brings it all into one place.', "Home shows what's coming up, what needs attention, and this week's tasks.", 'Tap New Event. A short walkthrough asks for the basics, then a few yes or no questions, so each event only shows what you need.', 'Every event gets its own workspace, with the heart of it right on top: the theme, the purpose, and the key verse.', 'Tasks run from prep to teardown. Assign them to anyone on your team, and say how many hands each one needs.', 'The Prayer area keeps your intercession list, declarations, and scripture together, and remembers what God did.', 'Your contacts live in one place. Bring them in from a spreadsheet or your phone.', 'Then pull them into any event, without retyping a thing.', 'My Stuff, right next to Home, shows everything on your plate, across every event. Your tasks, what you lead, and who to follow up with.', 'The day before, reminders are already written. Text or email each volunteer in one tap.', "When you're ready to invite people, every list has its own link and QR code.", 'Guests and volunteers sign up for a shift, or RSVP, right from their phone. No account needed.', "Then watch your volunteer goal fill up, and see exactly who's coming.", 'On event day, the schedule, check-in, and phone list are one tap away.', 'Volunteers and guests can even check themselves in, with a QR code at the door.', 'Afterward, the Event Recap puts attendance, decisions, money, and answered prayer on one page.', 'It works on a phone or a laptop, even without signal. Plan it once, and share it everywhere.']
k = Kokoro(os.path.join(M, 'kokoro-v1.0.onnx'), os.path.join(M, 'voices-v1.0.bin'))
SR = 24000; LEAD = 0.45; TAIL = 0.55
clips, durs = [], []
for i, line in enumerate(LINES):
    a, sr = k.create(line, voice=VOICE, speed=SPEED, lang='en-us'); SR = sr
    a = np.asarray(a, dtype=np.float32)
    nz = np.where(np.abs(a) > 0.004)[0]
    if len(nz): a = a[max(0, nz[0] - 200): nz[-1] + 1200]
    d = max(3.8 if i else 3.0, LEAD + len(a) / sr + TAIL)
    durs.append(round(d, 2)); clips.append(a)
total = sum(durs)
out = np.zeros(int(SR * (total + 1)), np.float32); t = 0.0
for a, d in zip(clips, durs):
    i = int((t + LEAD) * SR); out[i:i + len(a)] += a; t += d
out = out[:int(SR * total)]
out = out / max(1e-6, np.abs(out).max()) * 0.85
out = np.concatenate([out, np.zeros(SR, np.float32)])
rng = np.random.default_rng(7); tone = np.cumsum(rng.standard_normal(len(out))).astype(np.float32); tone -= np.convolve(tone, np.ones(2400) / 2400, 'same')
out = out + tone / max(1e-6, np.sqrt(np.mean(tone ** 2))) * 10 ** (-44 / 20)
w = wave.open(os.path.join(D, 'narration.wav'), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
json.dump(durs, open(os.path.join(D, 'durations.json'), 'w'))
print('voice', VOICE, 'total', round(total, 1), 's', durs)
