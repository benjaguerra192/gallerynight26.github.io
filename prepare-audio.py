"""Actualiza los previews MP3 públicos de 30 s desde sus fuentes documentadas."""
import json
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent

if __name__ == '__main__':
    sources = json.loads((ROOT / 'assets/media-sources.json').read_text(encoding='utf-8'))
    for source in sources:
        with urlopen(source['metadata'], timeout=30) as response:
            track = json.load(response)
        if not track.get('preview'):
            raise ValueError('Preview no disponible: ' + source['id'])
        with urlopen(track['preview'], timeout=30) as response:
            audio = response.read()
        if len(audio) < 1000:
            raise ValueError('Audio vacío: ' + source['id'])
        target = ROOT / 'assets/audio' / (source['id'] + '.mp3')
        temporary = target.with_suffix('.mp3.tmp')
        temporary.write_bytes(audio)
        temporary.replace(target)
        print(source['id'])
