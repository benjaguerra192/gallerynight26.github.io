let organizerSnapshot = null, organizerOffset = 0, refreshingOrganizer = false, organizerBusy = false, organizerRevision = 0;
const argentinaDates = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'medium' });
function dateText(value) { return value ? argentinaDates.format(new Date(value)) : '—'; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function sortLeaderboard(participants) {
  return [...participants].sort((a, b) => {
    const aComplete = !!a.completed_at && !a.is_test, bComplete = !!b.completed_at && !b.is_test;
    if (aComplete !== bComplete) return aComplete ? -1 : 1;
    if (a.is_test !== b.is_test) return a.is_test ? 1 : -1;
    if (aComplete) return a.elapsed_ms - b.elapsed_ms || Date.parse(a.completed_at) - Date.parse(b.completed_at);
    return b.unlocks.length - a.unlocks.length || Date.parse(a.registered_at) - Date.parse(b.registered_at);
  });
}
function updateLeaderboardTimes() {
  if (!organizerSnapshot || !adminUnlocked) return;
  const now = Date.now() + organizerOffset;
  document.querySelectorAll('[data-running-since]').forEach(node => {
    node.textContent = elapsedText(now - Date.parse(node.dataset.runningSince));
  });
}
function renderOrganizer(snapshot) {
  organizerRevision++;
  const firstSnapshot = !organizerSnapshot;
  organizerSnapshot = snapshot;
  organizerOffset = Date.parse(snapshot.server_now) - Date.now();
  const expanded = new Set([...document.querySelectorAll('#leaderboard details[open]')].map(node => node.dataset.participant));
  const participants = sortLeaderboard(snapshot.participants);
  $('#leaderboard-total').textContent = participants.length + ' participantes · ' + participants.filter(p => p.completed_at && !p.is_test).length + ' completaron';
  $('#leaderboard-updated').textContent = 'Actualizado ' + dateText(snapshot.server_now) + ' · Hora de Argentina';
  $('#admin-event-current').textContent = snapshot.event.is_open ? 'ABIERTO' : 'CERRADO';
  $('#admin-event-times').textContent = 'Apertura: ' + dateText(snapshot.event.opens_at) + ' · Cierre: ' + dateText(snapshot.event.closes_at);
  if (firstSnapshot) {
    $('#event-mode').value = snapshot.event.mode;
    for (const [id,value] of [['#event-opens',snapshot.event.opens_at],['#event-closes',snapshot.event.closes_at]]) {
      $(id).value = value ? new Date(Date.parse(value)-3*3600000).toISOString().slice(0,16) : '';
    }
    eventInputs();
  }
  let rank = 0;
  $('#leaderboard').innerHTML = participants.length ? participants.map(p => {
    const place = p.completed_at && !p.is_test ? '#' + (++rank) : '—';
    const elapsed = p.completed_at ? elapsedText(p.elapsed_ms) : '<span data-running-since="' + p.registered_at + '">' + elapsedText(Date.now() + organizerOffset - Date.parse(p.registered_at)) + '</span>';
    const completed = p.is_test ? 'PRUEBA · SIN PREMIO' : p.completed_at ? 'COMPLETADO' : 'EN CURSO';
    const actions = '<div class="participant-actions"><button data-admin-action="clear_unlocks" data-target="'+p.id+'">Borrar desbloqueos</button><button data-admin-action="restart" data-target="'+p.id+'">Reiniciar tiempo y avance</button><button class="danger" data-admin-action="delete_participant" data-target="'+p.id+'">Eliminar participante</button></div>';
    const tracks = songs.map(song => {
      const unlock = p.unlocks.find(u => u.song_id === song.id);
      return '<li><div><strong>'+escapeHtml(song.title)+'</strong><span>'+ (unlock ? dateText(unlock.unlocked_at) : 'Sin desbloquear')+'</span></div>'+(unlock?'<button class="danger" data-admin-action="delete_unlock" data-target="'+p.id+'" data-track="'+song.id+'">Borrar</button>':'')+'</li>';
    }).join('');
    return '<details class="participant-row" data-participant="'+p.id+'" '+(expanded.has(p.id)?'open':'')+'><summary><span class="rank">'+place+'</span><span class="participant-name">'+escapeHtml(p.name)+'<small>'+completed+'</small></span><span class="participant-score">'+p.unlocks.length+'/8<small>'+elapsed+'</small></span></summary><div class="participant-detail"><p>Registro: '+dateText(p.registered_at)+'<br>Finalización: '+dateText(p.completed_at)+'</p><ul>'+tracks+'</ul>'+actions+'</div></details>';
  }).join('') : '<p class="empty-leaderboard">Todavía no hay participantes registrados.</p>';
  $('#organizer-grid').innerHTML = participantGrid(participants, true);
  updateLeaderboardTimes();
}
async function refreshOrganizer() {
  if (!cloud || !adminUnlocked || refreshingOrganizer || organizerBusy || document.hidden) return;
  refreshingOrganizer = true;
  const revision = organizerRevision;
  try { const snapshot=await cloud.snapshot(); if(revision===organizerRevision&&!organizerBusy&&adminUnlocked) { renderOrganizer(snapshot); $('#leaderboard-error').textContent = ''; } }
  catch (error) {
    $('#leaderboard-error').textContent = 'No se pudo actualizar: ' + error.message;
    if (error.code === '42501') { adminUnlocked = false; renderLinks(); navigateTo('inicio'); }
  } finally { refreshingOrganizer = false; }
}
async function restoreOrganizer() {
  try {
    const snapshot = await cloud.restoreAdmin();
    if (snapshot) { adminUnlocked = true; renderLinks(); renderOrganizer(snapshot); if (location.hash === '#etiquetas') { $('#admin-dialog').close(); navigateTo('etiquetas'); } }
  } catch (error) { $('#admin-error').textContent = error.message; }
}
async function loginOrganizer(password) {
  $('#admin-form button').disabled = true;
  try {
    const snapshot = await cloud.login($('#admin-email').value.trim(), password);
    adminUnlocked = true; $('#admin-password').value = ''; $('#admin-error').textContent = '';
    $('#admin-dialog').close(); renderLinks(); renderOrganizer(snapshot); navigateTo('etiquetas');
  } catch (error) { $('#admin-error').textContent = error.message; }
  finally { $('#admin-form button').disabled = false; }
}
async function logoutOrganizer() {
  try { await cloud.logout(); adminUnlocked = false; organizerSnapshot = null; $('#leaderboard').replaceChildren(); $('#organizer-grid').replaceChildren(); renderLinks(); navigateTo('inicio'); }
  catch (error) { notify('No se pudo cerrar la sesión: ' + error.message); }
}
async function unlockAllRemote() {
  if (!adminUnlocked || !participantRecord) { notify('Primero registrá una familia para probar.'); return; }
  try {
    renderOrganizer(await cloud.action('unlock_all', participantRecord.id));
    applyCloudState(await cloud.me());
    notify('Ocho canciones desbloqueadas. Esta familia queda fuera del premio por ser una prueba.');
  } catch (error) { notify(error.message); }
}
function deleteDescription(action, person, track) {
  const name = '«' + person.name + '»';
  if (action === 'delete_unlock') return 'Borrar el desbloqueo de «' + songs.find(s => s.id === track)?.title + '» de ' + name + '. Su posición se recalculará.';
  if (action === 'clear_unlocks') return 'Borrar los ' + person.unlocks.length + ' desbloqueos de ' + name + '. Conserva su hora de registro; el reloj sigue contando.';
  if (action === 'restart') return 'Borrar todos los desbloqueos de ' + name + ' y comenzar su tiempo desde cero ahora.';
  return 'Eliminar a ' + name + ', su registro y todos sus desbloqueos. No se puede deshacer.';
}
async function confirmAdminDelete(action, target = null, track = null) {
  if (!adminUnlocked || organizerBusy) return;
  organizerBusy = true;
  $('#leaderboard-error').textContent = '';
  try {
    // Refresh the leaderboard before describing what will be removed.
    renderOrganizer(await cloud.snapshot());
    let approved;
    if (action === 'delete_all') {
      approved = await confirmDeleteAll(organizerSnapshot);
    } else {
      const person = organizerSnapshot.participants.find(p => p.id === target);
      if (!person) throw new Error('Ese participante ya no existe.');
      approved = confirm(deleteDescription(action, person, track) + '\n\n¿Confirmás el borrado?');
    }
    if (!approved) return;
    $('#delete-all-participants').disabled = true;
    $('#delete-all-participants').textContent = action === 'delete_all' ? 'Borrando participantes…' : 'Actualizando…';
    const snapshot = await cloud.action(action, target, track, true);
    renderOrganizer(snapshot);
    applyCloudState({participant:snapshot.participants.find(p=>p.id===participantRecord?.id)||null,event:snapshot.event,server_now:snapshot.server_now});
    if(action==='delete_all') {
      const url=new URL(location.href);url.searchParams.delete('nfc');
      history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
    notify('Datos actualizados. El leaderboard ya refleja el cambio.');
  } catch (error) { $('#leaderboard-error').textContent = error.message; }
  finally { organizerBusy = false; $('#delete-all-participants').disabled = false; $('#delete-all-participants').textContent = 'Borrar todos los participantes y desbloqueos'; }
}
function confirmDeleteAll(snapshot) {
  const dialog = $('#delete-all-dialog');
  $('#delete-all-count').textContent = 'Se eliminarán '+snapshot.participants.length+' participantes, sus horarios y todos sus desbloqueos. No se puede deshacer. El estado de apertura del recorrido se conserva.';
  $('#delete-all-preview').innerHTML = sortLeaderboard(snapshot.participants).map(p=>'<li><strong>'+escapeHtml(p.name)+'</strong><span>'+p.unlocks.length+'/8 · '+elapsedText(p.elapsed_ms)+(p.is_test?' · PRUEBA':'')+'</span></li>').join('');
  $('#delete-all-word').value = '';
  $('#delete-all-confirm').disabled = true;
  dialog.returnValue = '';
  return new Promise(resolve=>{
    dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirmed'),{once:true});
    openDialog(dialog);
  });
}
function deleteAllWordMatches() { return $('#delete-all-word').value.trim().toUpperCase()==='BORRAR'; }
$('#delete-all-word').addEventListener('input',()=>{$('#delete-all-confirm').disabled=!deleteAllWordMatches();});
$('#delete-all-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(deleteAllWordMatches()) $('#delete-all-dialog').close('confirmed');
});
function eventInputs() {
  const mode = $('#event-mode').value;
  $('#event-opens-label').hidden = !['closed_until','scheduled'].includes(mode);
  $('#event-closes-label').hidden = mode !== 'scheduled';
  $('#event-opens').required = ['closed_until','scheduled'].includes(mode);
  $('#event-closes').required = mode === 'scheduled';
}
function argentinaInput(value) { return value ? new Date(value + ':00-03:00').toISOString() : null; }
$('#leaderboard').addEventListener('click', event => {
  const button = event.target.closest('[data-admin-action]');
  if (button) confirmAdminDelete(button.dataset.adminAction, button.dataset.target, button.dataset.track);
});
$('#leaderboard-refresh').addEventListener('click', refreshOrganizer);
$('#delete-all-participants').addEventListener('click', () => confirmAdminDelete('delete_all'));
$('#event-mode').addEventListener('change', eventInputs);
$('#event-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (organizerBusy || !adminUnlocked) return;
  organizerBusy = true;
  $('#event-save').disabled = true;
  try {
    const mode = $('#event-mode').value;
    renderOrganizer(await cloud.event(mode, ['closed_until','scheduled'].includes(mode) ? argentinaInput($('#event-opens').value) : null, mode === 'scheduled' ? argentinaInput($('#event-closes').value) : null));
    await refreshCompetition();
    notify('Horario actualizado. Los desbloqueos anteriores se conservan.');
  } catch (error) { $('#leaderboard-error').textContent = error.message; }
  finally { organizerBusy = false; $('#event-save').disabled = false; }
});
eventInputs();
setInterval(() => { if (currentSection === 'etiquetas') refreshOrganizer(); }, 10000);
