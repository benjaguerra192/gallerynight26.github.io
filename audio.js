// Un solo reproductor: nunca se superponen canciones.
const previewAudio = new Audio();
previewAudio.preload = 'none';
let previewSong = null, previewRequest = 0, previewState = 'paused';
const player = document.querySelector('#preview-player');
const playerHome = document.querySelector('#preview-home');
const playButton = document.querySelector('#preview-toggle');
const playerStatus = document.querySelector('#preview-status');
function updatePreview(message) {
  player.hidden = !previewSong;
  document.querySelector('#preview-title').textContent = previewSong ? previewSong.artist+' — '+previewSong.title : '';
  playButton.textContent = previewState === 'playing' || previewState === 'loading' ? '⏸ Pausar' : '▶ Reproducir';
  playerStatus.textContent = message || (previewState === 'playing' ? 'FRAGMENTO · 30 SEGUNDOS' : 'EN PAUSA');
}
function pausePreview(clear = false) {
  previewRequest++;
  previewAudio.pause();
  previewState = 'paused';
  if (clear) previewSong = null;
  updatePreview();
}
async function playPreview(song, manual = false) {
  if (!song) { pausePreview(true); return; }
  if (!manual && previewSong?.id === song.id) return;
  const changed = previewSong?.id !== song.id;
  pausePreview();
  previewSong = song;
  if (changed) previewAudio.src = 'assets/audio/'+song.id+'.mp3';
  else if (previewAudio.ended) previewAudio.currentTime = 0;
  const request = ++previewRequest;
  previewState = 'loading';
  updatePreview('CARGANDO FRAGMENTO…');
  try {
    await previewAudio.play();
    if (request !== previewRequest) return;
    previewState = 'playing';
    updatePreview();
  } catch (error) {
    if (request !== previewRequest) return;
    previewState = 'paused';
    updatePreview(error.name === 'NotAllowedError' ? 'TOCÁ REPRODUCIR PARA ESCUCHAR' : 'NO SE PUDO CARGAR. TOCÁ REPRODUCIR PARA REINTENTAR.');
  }
}
playButton.addEventListener('click', () => {
  if (previewState === 'playing' || previewState === 'loading') pausePreview();
  else if (previewSong) playPreview(previewSong, true);
});
previewAudio.addEventListener('ended', () => { previewState = 'paused'; updatePreview('FRAGMENTO TERMINADO · PODÉS VOLVER A ESCUCHAR'); });
previewAudio.addEventListener('pause', () => { if (previewState === 'playing') { previewState = 'paused'; updatePreview(); } });
previewAudio.addEventListener('error', () => { previewState = 'paused'; updatePreview('AUDIO NO DISPONIBLE. TOCÁ REPRODUCIR PARA REINTENTAR.'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pausePreview(); });
window.addEventListener('pagehide', () => pausePreview());
