#!/usr/bin/env python3
"""Drive real commands in a tmux pane, capture it every 100 ms (with colours), render frames to PNG, encode mp4.
Usage: python3 demo/record-term.py demo/raw/term.mp4"""
import json, os, re, subprocess, sys, time
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else "demo/raw/term.mp4"
COLS, ROWS, FPS = 118, 32, 10
CWD = os.path.abspath(".")
SESSION = "sc-demo"
COMMANDS = [
    ("node scripts/plan.mjs --base GME --quote SOL --unit 0.1 --raise-usd 50 --curve lean --profile issuer --twap 10 2>&1 | grep -v \"bigint\\|429\"", 16),
    ("clear", 0.9),
    ("node demo/replay-keeper.mjs docs/keeper-pool4.log", 26),
    ("clear", 0.9),
    ("node scripts/status.mjs --pool ERBiYKkLF15Uqgx3vpPpDw4kgWhnYzz5ADR1YWJWhm1b 2>&1 | grep -v \"bigint\\|429\"", 9),
    ("clear", 0.9),
    ("node scripts/sweep.mjs --dry --pretty 2>&1 | grep -v \"bigint\\|429\"", 12),
]

RENDER_ONLY = "--render-only" in sys.argv
def tmux(*a): return subprocess.run(["tmux", *a], capture_output=True, text=True)
env = {k: v for k, v in os.environ.items() if not k.startswith("CLAUDE") or k == "CLAUDE_CONFIG_DIR"}
env.update({"PS1": r"\[\e[1;31m\]stockcurve\[\e[0m\] $ ", "TERM": "xterm-256color", "PROMPT_COMMAND": ""})
if RENDER_ONLY:
    frames = [tuple(x) for x in json.load(open("demo/raw/frames.json"))]
else:
  tmux("kill-session", "-t", SESSION)
  subprocess.run(["tmux", "new-session", "-d", "-s", SESSION, "-x", str(COLS), "-y", str(ROWS), "-c", CWD, "bash --norc --noprofile"], env=env)
  time.sleep(0.4)
  tmux("send-keys", "-t", SESSION, "-l", 'export PS1="\\[\\e[1;31m\\]stockcurve\\[\\e[0m\\] $ "; clear'); tmux("send-keys", "-t", SESSION, "Enter")
  time.sleep(0.5)

  frames = []
  t0 = time.time()
  def capture():
      p = tmux("capture-pane", "-t", SESSION, "-p", "-e")
      frames.append((time.time() - t0, p.stdout))

  def type_cmd(cmd):
      for ch in cmd:
          tmux("send-keys", "-t", SESSION, "-l", ch); capture(); time.sleep(0.012 if len(cmd) > 80 else 0.03)
      tmux("send-keys", "-t", SESSION, "Enter")

  for cmd, wait in COMMANDS:
      type_cmd(cmd)
      end = time.time() + wait
      while time.time() < end: capture(); time.sleep(1 / FPS)
  capture()
  tmux("kill-session", "-t", SESSION)
  print(f"captured {len(frames)} frames over {frames[-1][0]:.1f}s")
  json.dump(frames, open("demo/raw/frames.json", "w"))

# ---- render
ANSI = re.compile(r"\x1b\[([0-9;]*)m")
PAL = {30: (60, 60, 66), 31: (229, 9, 20), 32: (141, 224, 141), 33: (245, 179, 66), 34: (122, 162, 255), 35: (200, 130, 255), 36: (80, 200, 220), 37: (210, 210, 214), 90: (120, 120, 130), 91: (255, 100, 100), 92: (160, 240, 160), 93: (255, 210, 120), 94: (150, 180, 255), 95: (220, 160, 255), 96: (120, 230, 240), 97: (255, 255, 255)}
FG, BG = (214, 214, 220), (10, 10, 11)
font = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 22)
fontb = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 22)
CW = font.getlength("M"); CH = 30
W, H = 1920, 1080
PX, PY = int((W - COLS * CW) // 2), (H - ROWS * CH) // 2

def parse(line):
    out, fg, bold, dim, i = [], FG, False, False, 0
    for m in ANSI.finditer(line):
        out.append((line[i:m.start()], fg, bold, dim)); i = m.end()
        for code in (m.group(1) or "0").split(";"):
            n = int(code or 0)
            if n == 0: fg, bold, dim = FG, False, False
            elif n == 1: bold = True
            elif n == 2: dim = True
            elif n == 22: bold = dim = False
            elif n in PAL: fg = PAL[n]
            elif n == 39: fg = FG
    out.append((line[i:], fg, bold, dim))
    return out

def render(text):
    img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img)
    d.rounded_rectangle((PX - 24, PY - 44, PX + COLS * CW + 24, PY + ROWS * CH + 24), radius=14, fill=(16, 17, 20), outline=(38, 38, 42), width=2)
    for k, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]): d.ellipse((PX - 10 + k * 22, PY - 32, PX + 4 + k * 22, PY - 18), fill=col)
    d.text((PX + 80, PY - 34), "stockcurve — mainnet", font=ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 14), fill=(140, 140, 150))
    for r, line in enumerate(text.split("\n")[:ROWS]):
        x = PX
        for seg, fg, bold, dim in parse(line):
            if not seg: continue
            col = tuple(int(c * 0.55) for c in fg) if dim else fg
            d.text((x, PY + r * CH), seg, font=fontb if bold else font, fill=col)
            x += font.getlength(seg)
    return img

os.makedirs("demo/raw/frames", exist_ok=True)
# time-compress: cap gaps at 0.15s so typing/wait loops don't pad; emit at FPS
last_txt, idx, t_prev, t_out = None, 0, 0, 0.0
marks, seen = [], set()
for t, txt in frames:
    if txt == last_txt and t - t_prev < 1.0: continue
    for ci, (cmd, _) in enumerate(COMMANDS):
        key = cmd[:40]
        if ci not in seen and key in txt and cmd != "clear": seen.add(ci); marks.append({"cmd": ci, "frame": idx, "t": idx / FPS})
    render(txt).save(f"demo/raw/frames/f{idx:05d}.png"); idx += 1; last_txt, t_prev = txt, t
json.dump(marks, open("demo/raw/marks.json", "w")); print("marks", marks)
print("rendered", idx, "frames")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", "demo/raw/frames/f%05d.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", OUT], check=True)
print("wrote", OUT)
