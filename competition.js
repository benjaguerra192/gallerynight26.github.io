let participantRecord = null, eventStatus = null, serverOffset = 0, syncingCloud = false, cloudError = '', cloudRevision = 0, leavingParticipant = false;

function serverTime() { return Date.now() + serverOffset; }
function elapsedText(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map(n => String(n).padStart(2, '0')).join('.');
}
function applyCloudState(state) {
  const hadName=!isGenericFamily(familyName);
  cloudRevision++;
  eventStatus = state.event;
  const time = state.server_now || state.event?.server_now;
  if (time) serverOffset = Date.parse(time) - Date.now();
  participantRecord = state.participant;
  familyName = participantRecord?.name || '';
  unlocked = new Set((participantRecord?.unlocks || []).map(item => item.song_id));
  renderFamily(); render(); renderCompetition();
  if(hadName&&isGenericFamily(familyName)&&!leavingParticipant&&!document.querySelector('dialog[open]'))askFamilyName();
}
function renderCompetition() {
  if (!cloud) return;
  const status = $('#event-status');
  status.hidden = false;
  status.textContent = cloudError || (eventStatus?.is_open ? 'RECORRIDO ABIERTO' : 'RECORRIDO CERRADO · Podés escuchar lo que ya conseguiste.');
  const clock = $('#participant-clock');
  clock.hidden = !participantRecord;
  if (participantRecord) {
    const end = participantRecord.completed_at ? Date.parse(participantRecord.completed_at) : serverTime();
    const elapsed = elapsedText(end - Date.parse(participantRecord.registered_at));
    $('#clock-label').textContent = participantRecord.is_test ? 'PRUEBA · FUERA DEL PREMIO' : participantRecord.completed_at ? 'COMPLETADO EN' : 'TU TIEMPO';
    $('#clock-digits').textContent = elapsed;
    clock.classList.toggle('completed',!!participantRecord.completed_at);
  }
  $('#reset').hidden = true;
  $('#reset').parentElement.querySelector('p').textContent = 'El tiempo cuenta desde el registro. Los reinicios los gestiona Organización.';
  const submit = $('#family-form button');
  submit.disabled = syncingCloud || leavingParticipant || (!participantRecord && !eventStatus?.is_open);
  $('#family-name').disabled = syncingCloud;
  if (!participantRecord && eventStatus && !eventStatus.is_open) $('#family-error').textContent = 'El recorrido está cerrado. Esperá la apertura para registrarte.';
  else if ($('#family-error').textContent === 'El recorrido está cerrado. Esperá la apertura para registrarte.') $('#family-error').textContent = '';
}
async function registerFamily(name) {
  name = name.trim().replace(/\s+/g, ' ');
  if (isGenericFamily(name) || name.length > 40) { $('#family-error').textContent = 'Escribí el nombre de tu familia, hasta 40 caracteres.'; return false; }
  if (syncingCloud || leavingParticipant) return false;
  $('#family-error').textContent = '';
  syncingCloud = true; setRegistrationBusy(true); renderCompetition();
  try {
    const state = await cloud.register(name);
    applyCloudState(state);
    rememberInstructions();
    $('#family-error').textContent = '';
    $('#family-dialog').close();
    consumeRemoteLink();
    return true;
  } catch (error) { $('#family-error').textContent = error.message; return false; }
  finally { syncingCloud = false; setRegistrationBusy(false); renderCompetition(); }
}
function setRegistrationBusy(busy) {
  $('#family-form').setAttribute('aria-busy',String(busy));
  $('#family-registration').hidden = !busy;
  $('#family-form button').textContent = busy ? 'Guardando familia…' : 'Empezar el recorrido ↗';
  $('#family-later').disabled = busy;
}
async function unlockRemote(id) {
  if(leavingParticipant) return false;
  if (!participantRecord || isGenericFamily(familyName)) { askFamilyName(); return false; }
  const song = songs.find(item => item.id === id);
  if (!song) { notify('Este NFC no corresponde a una canción del recorrido.'); return false; }
  const already = unlocked.has(id);
  try {
    applyCloudState(await cloud.unlock(id));
    albumIndex = visibleSongs().findIndex(item => item.id === id);
    navigateTo('albumes'); render(); revealAlbum(); showSong(song, already);
    return true;
  } catch (error) { notify(error.message); return false; }
}
let consumingNfc = false;
async function consumeRemoteLink() {
  if (!participantRecord || leavingParticipant || consumingNfc || isGenericFamily(familyName) || $('#family-dialog').open) return;
  const params = new URLSearchParams(location.search);
  if (!params.has('nfc')) return;
  consumingNfc = true;
  const raw = params.get('nfc');
  const id = Object.hasOwn(legacyNfc, raw) ? legacyNfc[raw] : raw;
  try {
    if (await unlockRemote(id)) {
      params.delete('nfc');
      history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
    }
  } finally { consumingNfc = false; }
}
async function refreshCompetition() {
  if (!cloud || syncingCloud || leavingParticipant || document.hidden) return;
  syncingCloud = true;
  const revision = cloudRevision;
  // A polling response must not replace a newer successful unlock.
  try { const state=await cloud.me(); if (revision === cloudRevision) { cloudError=''; applyCloudState(state); } }
  catch { if (revision === cloudRevision) cloudError='SIN CONEXIÓN · Los nuevos desbloqueos necesitan Internet.'; }
  finally { syncingCloud = false; renderCompetition(); }
}
async function startCompetition() {
  $('#demo-notice').hidden = true;
  $('#admin-email-label').hidden = false;
  $('#admin-email').required = true;
  $('#admin-session-copy').hidden = false;
  $('#family-later').hidden = false;
  $('#progress-storage-label').textContent = 'Guardado en la base de datos';
  $('#competition-admin').hidden = false;
  $('#reset').hidden = true;
  await refreshCompetition();
  await restoreOrganizer();
  refreshPublicLeaderboard();
  const firstWelcome = !adminUnlocked && currentSection !== 'ranking' && needsInstructions();
  const needsName = isGenericFamily(familyName);
  if ((firstWelcome || needsName) && !$('#admin-dialog').open) askFamilyName();
  await consumeRemoteLink();
  setInterval(refreshCompetition, 15000);
  setInterval(() => { renderCompetition(); updateLeaderboardTimes(); }, 1000);
}

if (cloud) startCompetition();

$('#participant-logout').addEventListener('click',()=>{
  setMenu(false);
  $('#leave-summary').textContent='Se eliminará «'+familyName+'» del ranking junto con todos sus desbloqueos y su tiempo. No se puede deshacer. Para volver a jugar tendrás que registrarte desde cero.';
  $('#leave-error').textContent='';
  openDialog($('#leave-dialog'));
});
$('#leave-confirm').addEventListener('click',async()=>{
  if($('#leave-confirm').disabled) return;
  $('#leave-confirm').disabled=true;
  $('#leave-cancel').disabled=true;
  $('#leave-confirm').textContent='Cerrando sesión…';
  leavingParticipant=true;syncingCloud=true;cloudRevision++;
  try {
    const state=cloud?await cloud.leave():null;
    pausePreview(true);
    try {localStorage.removeItem(key);localStorage.removeItem(familyKey);}catch{}
    const url=new URL(location.href);url.searchParams.delete('nfc');history.replaceState(null,'',url.pathname+url.search+url.hash);
    if(cloud) applyCloudState(state);else {familyName='';unlocked.clear();renderFamily();render();}
    publicSnapshot=null;$('#public-list').replaceChildren();$('#public-grid').replaceChildren();$('#public-total').textContent='';
    $('#leave-dialog').close();navigateTo('inicio');
    if(cloud&&adminUnlocked)refreshOrganizer();
    notify('Sesión cerrada. Tu participante y tu avance fueron eliminados.');
    askFamilyName();
  } catch(error) {
    if(error.deletedState)applyCloudState(error.deletedState);
    $('#leave-error').textContent=error.message;
  } finally {
    leavingParticipant=false;syncingCloud=false;$('#leave-confirm').disabled=false;$('#leave-cancel').disabled=false;$('#leave-confirm').textContent='Sí, borrar y cerrar sesión';
    if(cloud)renderCompetition();
  }
});
$('#leave-dialog').addEventListener('cancel',event=>{if(leavingParticipant)event.preventDefault();});
