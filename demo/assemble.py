#!/usr/bin/env python3
"""Assemble the demo: title card → console clip → terminal clip → end card, captions burned in. Output demo/stockcurve-demo.mp4"""
import subprocess, os
from PIL import Image, ImageDraw, ImageFont
W, H = 1920, 1080
BG, RED, FG, MUTE = (10, 10, 11), (229, 9, 20), (255, 255, 255), (140, 140, 150)
F = lambda s, b=False: ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", s, index=1 if b else 0)
MONO = lambda s: ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", s)
os.makedirs("demo/raw", exist_ok=True)

def card(path, title, lines, foot=None):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 8), fill=RED)
    d.text((120, 120), "STOCKCURVE", font=F(28, True), fill=RED)
    d.text((120, 210), title, font=F(84, True), fill=FG)
    y = 360
    for l in lines: d.text((120, y), l, font=F(40), fill=(214, 214, 220)); y += 66
    if foot: d.text((120, H - 120), foot, font=MONO(26), fill=MUTE)
    im.save(path)

card("demo/raw/card-title.png", "Launch curves for tokenized stocks",
     ["Meteora DBC pools quoted in the stock token itself", "Curve anchored to a live reference (Pyth · xStocks · Backpack · Ondo twins)",
      "Ten pools on Solana mainnet · keeper-operated · atomic launch · fees claimed on-chain"],
     "stockcurve.purplesquirrelnetworks.workers.dev · github.com/ExpertVagabond/stockcurve")
card("demo/raw/card-end.png", "What's real",
     ["10 mainnet pools, 3 fee profiles, 1 Clawpump launch, 1 DLMM band", "Every step re-read from chain after sending",
      "95% of tokenized stocks on Solana have no venue. This is the venue."],
     "Stocklana 2026 · Matthew Karsten · stockcurve.purplesquirrelnetworks.workers.dev")

_cap = 0
def caption_png(text):  # this ffmpeg has no drawtext: render the caption bar with PIL, overlay it
    global _cap; _cap += 1
    im = Image.new("RGBA", (W, 120), (0, 0, 0, 158)); d = ImageDraw.Draw(im)
    f = F(36); tw = d.textlength(text, font=f); d.text(((W - tw) / 2, 38), text, font=f, fill=(255, 255, 255, 255))
    path = f"demo/raw/cap{_cap}.png"; im.save(path); return path

run = lambda *a: subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)
VO = "demo/raw/vo"
def dur(path): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip() or 0)
def vo_audio(name): return [f"[{name}]adelay=600|600,loudnorm=I=-16:TP=-1.5:LRA=11[a]"]
t0 = dur(f"{VO}/00-title.wav") + 1.6
run("-loop", "1", "-i", "demo/raw/card-title.png", "-i", f"{VO}/00-title.wav", "-t", f"{t0:.2f}", "-r", "30", "-pix_fmt", "yuv420p",
    "-filter_complex", f"[0:v]fade=t=in:st=0:d=0.6,fade=t=out:st={t0 - 0.6:.2f}:d=0.6[v];[1:a]adelay=600|600,apad,loudnorm=I=-16:TP=-1.5:LRA=11[a]", "-map", "[v]", "-map", "[a]", "-c:a", "aac", "-shortest", "demo/raw/seg0.mp4")
# console: two caption windows
def with_captions(src, out, caps, scale=False):
    # caps: [(text, start, end)] → overlay chain
    pngs = [caption_png(t) for t, _, _ in caps]
    inputs = ["-i", src]; [inputs.extend(["-i", p]) for p in pngs]
    chain = f"[0:v]scale={W}:{H}[v0]" if scale else "[0:v]null[v0]"
    for i, (_, a, b) in enumerate(caps):
        chain += f";[v{i}][{i + 1}:v]overlay=0:{H - 120}:enable='between(t,{a},{b})'[v{i + 1}]"
    vo = {"demo/raw/seg1.mp4": f"{VO}/01-console.wav", "demo/raw/seg2.mp4": f"{VO}/02-terminal.wav"}.get(out)
    if vo:
        n = len(caps) + 1; inputs.extend(["-i", vo])
        need = dur(vo) + 1.4; have = dur(src)
        pad = f";[v{len(caps)}]tpad=stop_mode=clone:stop_duration={max(0, need - have):.2f}[vp]" if need > have else f";[v{len(caps)}]null[vp]"
        chain += pad + f";[{n}:a]adelay=600|600,apad,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
        trim = ["-t", f"{need:.2f}"] if have > need else []  # cut dead tail when the clip outlasts the VO
        run(*inputs, "-filter_complex", chain, "-map", "[vp]", "-map", "[a]", *trim, "-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", out)
    else:
        run(*inputs, "-filter_complex", chain, "-map", f"[v{len(caps)}]", "-r", "30", "-pix_fmt", "yuv420p", out)
with_captions("demo/raw/console.webm", "demo/raw/seg1.mp4", [("The console: every pool, its reference, basis and lifecycle", 0, 12), ("Title page: curve band, graduation, fees claimed, provenance", 12, 60)], scale=True)
import json as _j
m = {x["cmd"]: x["t"] for x in _j.load(open("demo/raw/marks.json"))}
with_captions("demo/raw/term.mp4", "demo/raw/seg2.mp4", [("plan: median-of-twins reference, TWAP, USD-sized graduation", 0, m[2]), ("keeper: discovers the pool, buys the discount, graduates, migrates, exits at target", m[2], m[4]), ("status: pool vs reference, basis, fees", m[4], m[6]), ("fee sweep across every config we own", m[6], 999)])
t3 = dur(f"{VO}/03-end.wav") + 1.8
run("-loop", "1", "-i", "demo/raw/card-end.png", "-i", f"{VO}/03-end.wav", "-t", f"{t3:.2f}", "-r", "30", "-pix_fmt", "yuv420p",
    "-filter_complex", "[0:v]fade=t=in:st=0:d=0.6[v];[1:a]adelay=600|600,apad,loudnorm=I=-16:TP=-1.5:LRA=11[a]", "-map", "[v]", "-map", "[a]", "-c:a", "aac", "-shortest", "demo/raw/seg3.mp4")
open("demo/raw/concat.txt", "w").write("".join(f"file 'seg{i}.mp4'\n" for i in range(4)))
run("-f", "concat", "-safe", "0", "-i", "demo/raw/concat.txt", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "demo/stockcurve-demo.mp4")
print(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size", "-of", "csv=p=0", "demo/stockcurve-demo.mp4"], capture_output=True, text=True).stdout.strip())
