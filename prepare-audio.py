"""Genera fragmentos; conserva los MP3 originales. Inicio editable en segundos."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
CLIPS = [
    ('war-pigs', 'Black Sabbath', 50),
    ('tratame-suavemente', 'Soda Stereo - Trátame', 65),
    ('te-para-tres', 'Soda Stereo - Té', 45),
    ('sweet-child', 'Guns', 0),
    ('ruta-66', 'Ruta 66', 0),
    ('post-crucifixion', 'Pescado', 0),
    ('kiss', 'Kiss', 50),
    ('take-on-me', 'a-ha', 45),
]
if __name__ == '__main__':
    target = ROOT / 'assets' / 'audio'
    target.mkdir(parents=True, exist_ok=True)
    for song_id, prefix, start in CLIPS:
        source, = [p for p in (ROOT / 'Audios').glob('*.mp3') if p.name.startswith(prefix)]
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                        '-ss', str(start), '-i', str(source), '-t', '30',
                        '-vn', '-af', 'afade=t=in:d=0.15,afade=t=out:st=28.5:d=1.5',
                        '-codec:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1',
                        str(target / (song_id+'.mp3'))], check=True)
        print(song_id, f'{start}s–{start+30}s')
