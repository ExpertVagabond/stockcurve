"""stockcurve demo voice-over in Matthew's cloned voice (local Qwen3-TTS on MLX).
Run from a cwd OFF the VS volume, with the TTS project's venv:
  cd ~ && "/Volumes/Virtual Server/projects/qwen3-tts-apple-silicon/.venv/bin/python" \
     "/Volumes/Virtual Server/projects/stockcurve/demo/generate-vo.py" > /tmp/stockcurve-vo.log 2>&1
Delivery: plain, first person, problem first, no superlatives. Numbers spelled out for TTS."""
import os, sys, shutil, gc, warnings, tempfile
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore")
from mlx_audio.tts.utils import load_model
from mlx_audio.tts.generate import generate_audio

PROJECT = "/Volumes/Virtual Server/projects/qwen3-tts-apple-silicon"
OUT = "/Volumes/Virtual Server/projects/stockcurve/demo/raw/vo"
REF_AUDIO = os.path.join(PROJECT, "voices", "matthew.wav")
REF_TEXT = open(os.path.join(PROJECT, "voices", "matthew.txt")).read().strip()
INSTRUCT = ("Speaking plainly and conversationally, like an engineer walking a colleague through "
            "something he built and measured. Even, unhurried pace. Factual and level. No salesmanship, "
            "no enthusiasm, no rising pitch on the numbers. Like Matthew Karsten: measured, grounded, quietly certain.")

SEGMENTS = [
    ("00-title",
     "Stockcurve. Launch curves for tokenized stocks on Solana, built on Meteora's dynamic bonding curve."),
    ("01-console",
     "Ninety five percent of tokenized stocks on Solana have no venue. Backpack alone has over eleven hundred "
     "mints, and only forty eight of them trade. A memecoin curve is the wrong tool for that, because a stock "
     "has a fair value. So the pool is quoted in the stock token itself, and the curve is anchored to a live "
     "reference. It opens five percent under, and graduates five percent over. This console shows every pool "
     "we ran, its reference, its basis, and whether it graduated."),
    ("02-terminal",
     "Planning a launch resolves the reference as a median across every live source. X stocks, Backpack, and "
     "Ondo twins, time averaged, and it sizes the float in dollars. Then the keeper takes over. It watches the "
     "program for the pool, buys only the discount, lets real demand fill the rest, migrates the pool to DAMM "
     "version two, and sells inventory at the reference, never below it. Every fee stream, the listing fee, "
     "the creation fee, the trading fees, is claimed on chain. Ten pools ran this way on mainnet in one day."),
    ("03-end",
     "Everything in this video is on mainnet, and every step was read back from chain before we called it done. "
     "The repo and the console are linked below."),
]

os.makedirs(OUT, exist_ok=True)
model = load_model(os.path.join(PROJECT, "models", "Qwen3-TTS-12Hz-1.7B-Base-8bit"))
for name, text in SEGMENTS:
    final = os.path.join(OUT, f"{name}.wav")
    if os.path.exists(final): print(f"{name}: exists, skip", flush=True); continue
    tmp = tempfile.mkdtemp(prefix="sc-vo-")
    print(f"{name}: generating {len(text.split())} words", flush=True)
    generate_audio(model=model, text=text, ref_audio=REF_AUDIO, ref_text=REF_TEXT, instruct=INSTRUCT, output_path=tmp)
    produced = os.path.join(tmp, "audio_000.wav")
    if not os.path.exists(produced): print(f"{name}: FAILED — no audio_000.wav in {tmp}", flush=True); continue
    shutil.move(produced, final); shutil.rmtree(tmp, ignore_errors=True); gc.collect()
    print(f"{name}: wrote {final}", flush=True)
print("done", flush=True)
