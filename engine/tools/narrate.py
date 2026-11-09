"""Narration for the day's story: Gemini voice (one take), Kokoro as the free local fallback.

  python tools/narrate.py [project=.]          script.json -> data/narration.wav (+ data/lines.json for Kokoro)
  python tools/narrate.py . --kokoro           skip Gemini

Gemini reads the whole story in one take (one API call, so the free quota lasts), then words.py --audio times every
word with Whisper and rebuilds the line times from what was actually said. If Gemini fails (no key, quota, outage),
Kokoro voices it locally (voice.py), which writes exact line times itself; words.py then only adds word times.
Prints the engine used on the last line: "ENGINE gemini" or "ENGINE kokoro".
"""
import base64, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

P = Path(next((a for a in sys.argv[1:] if not a.startswith('--')), '.'))
S = json.loads((P / 'script.json').read_text())
TOOLS = Path(__file__).parent
DATA = P / 'data'; DATA.mkdir(exist_ok=True)

GEMINI = {
    'endpoint': 'https://generativelanguage.googleapis.com/v1beta/interactions',
    'model': os.environ.get('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts'),
    'voice': S.get('geminiVoice', 'Charon'),
    'style': S.get('geminiStyle', 'A documentary storyteller: calm, curious and warm, with natural pace. A small pause and a '
                   'little suspense before a twist. Clear and confident, never theatrical, never salesy.'),
}
LEAD, OUTRO = float(S.get('lead', 0.35)), float(S.get('outro', 2.2))


def ff(*args): subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def gemini():
    key = os.environ.get('GEMINI_API_KEY')
    if not key: raise RuntimeError('GEMINI_API_KEY is not set')
    text = ' '.join(l['text'].strip() for l in S['lines'])
    body = json.dumps({
        'model': GEMINI['model'],
        'input': [{'type': 'user_input', 'content': [{'type': 'text', 'text': text, 'annotations': [{'type': 'speech_metadata', 'style': GEMINI['style']}]}]}],
        'response_format': {'type': 'audio'},
        'generation_config': {'speech_config': [{'voice': GEMINI['voice']}]},
    }).encode()
    for attempt in range(1, 4):
        req = urllib.request.Request(GEMINI['endpoint'], data=body, method='POST', headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=180) as r: out = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get('retry-after') or 30)
            if (e.code == 429 or e.code >= 500) and attempt < 3 and wait <= 120:
                print(f'gemini {e.code}, retrying in {wait}s', flush=True); time.sleep(wait); continue
            raise RuntimeError(f'gemini {e.code}: {e.read()[:200]!r}')
    audio = [c for s in out.get('steps', []) if s.get('type') == 'model_output' for c in s.get('content', []) if c.get('type') == 'audio']
    if not audio or not audio[-1].get('data'): raise RuntimeError('gemini returned no audio')
    raw = DATA / 'take.bin'; raw.write_bytes(base64.b64decode(audio[-1]['data']))
    take = DATA / 'take.wav'
    try: ff('-i', str(raw), str(take))                                        # a container ffmpeg recognises
    except subprocess.CalledProcessError: ff('-f', 's16le', '-ar', '24000', '-ac', '1', '-i', str(raw), str(take))   # bare PCM
    # trim the ends, even out loudness, pad the lead-in and the outro (the end card plays there)
    ff('-i', str(take), '-af', ','.join([
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05', 'areverse',
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08', 'areverse',
        'loudnorm=I=-16:TP=-1.5:LRA=11', 'aresample=24000',
        f'adelay={int(LEAD * 1000)}', f'apad=pad_dur={OUTRO}']), '-ac', '1', str(DATA / 'gemini.wav'))
    raw.unlink(); take.unlink()


def run(*cmd): subprocess.run([sys.executable, *cmd], check=True)


engine = 'kokoro'
if '--kokoro' not in sys.argv:
    try:
        gemini(); engine = 'gemini'
        (DATA / 'lines.json').unlink(missing_ok=True)
        run(str(TOOLS / 'words.py'), str(P), '--audio', str(DATA / 'gemini.wav'))
    except Exception as e:
        print(f'Gemini voice failed ({e}); using Kokoro', flush=True)
if engine == 'kokoro':
    run(str(TOOLS / 'voice.py'), str(P))
    run(str(TOOLS / 'words.py'), str(P))
print(f'ENGINE {engine}')
