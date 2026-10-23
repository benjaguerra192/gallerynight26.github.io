let publicSnapshot = null, publicOffset = 0, refreshingPublic = false;

function participantGrid(participants, admin = false) {
  if (!participants.length) return '<p>Todavía no hay participantes registrados.</p>';
  let rank = 0;
  return '<table class="standings-table"><caption>Familias y canciones desbloqueadas'+(admin ? ' · Horarios de Argentina' : '')+'</caption><thead><tr><th scope="col">Puesto</th><th scope="col">Familia</th><th scope="col">Tiempo</th>'+songs.map(s=>'<th scope="col">'+escapeHtml(s.title)+'</th>').join('')+'</tr></thead><tbody>'+sortLeaderboard(participants).map(p=>{
    const place = p.completed_at && !p.is_test ? '#'+(++rank) : '—';
    const time = p.completed_at ? elapsedText(p.elapsed_ms) : '<span '+(admin?'data-running-since="'+p.registered_at+'"':'data-elapsed-ms="'+p.elapsed_ms+'"')+'>'+elapsedText(p.elapsed_ms)+'</span>';
    return '<tr><td>'+place+'</td><th scope="row">'+escapeHtml(p.name)+'<small>'+(p.is_test?'PRUEBA · SIN PREMIO':p.unlocks.length+'/8')+'</small></th><td>'+time+'</td>'+songs.map(s=>{
      const unlock = p.unlocks.find(u=>u.song_id===s.id);
      return '<td class="'+(unlock?'song-found':'song-missing')+'">'+(unlock ? '<span aria-label="Desbloqueada">✓</span>'+(admin?'<small>'+dateText(unlock.unlocked_at)+'</small>':'') : '<span aria-label="Bloqueada">—</span>')+'</td>';
    }).join('')+'</tr>';
  }).join('')+'</tbody></table>';
}
function updatePublicTimes() {
  if (!publicSnapshot) return;
  const delta = Math.max(0, Date.now() + publicOffset - Date.parse(publicSnapshot.server_now));
  $('#public-results').querySelectorAll('[data-elapsed-ms]').forEach(node=>{node.textContent=elapsedText(Number(node.dataset.elapsedMs)+delta);});
}
function renderPublicLeaderboard(snapshot) {
  publicSnapshot = snapshot;
  publicOffset = Date.parse(snapshot.server_now)-Date.now();
  const participants = sortLeaderboard(snapshot.participants);
  $('#public-total').textContent = participants.length+' familias · '+participants.filter(p=>p.completed_at&&!p.is_test).length+' completaron';
  $('#public-updated').textContent = 'Actualizado '+dateText(snapshot.server_now)+' · Se actualiza cada 10 segundos';
  $('#public-grid').innerHTML = participantGrid(participants);
  let rank=0;
  $('#public-list').innerHTML = participants.length ? participants.map(p=>'<article class="public-standing"><span class="rank">'+(p.completed_at&&!p.is_test?'#'+(++rank):'—')+'</span><h3>'+escapeHtml(p.name)+'<small>'+(p.is_test?'PRUEBA · SIN PREMIO':p.completed_at?'COMPLETADO':'EN CURSO')+'</small></h3><p>'+p.unlocks.length+'/8<strong>'+(p.completed_at?elapsedText(p.elapsed_ms):'<span data-elapsed-ms="'+p.elapsed_ms+'">'+elapsedText(p.elapsed_ms)+'</span>')+'</strong></p></article>').join('') : '<p>Todavía no hay participantes registrados.</p>';
  updatePublicTimes();
}
async function refreshPublicLeaderboard() {
  if (currentSection!=='ranking' || refreshingPublic || document.hidden) return;
  if (!cloud) { $('#public-error').textContent='El leaderboard requiere conexión a la competencia.'; return; }
  refreshingPublic=true;
  try { renderPublicLeaderboard(await cloud.leaderboard()); $('#public-error').textContent=''; }
  catch { $('#public-error').textContent='No se pudo actualizar. Revisá tu conexión y volvé a intentar.'; }
  finally { refreshingPublic=false; }
}
document.querySelectorAll('[data-results-view]').forEach(button=>button.addEventListener('click',()=>{
  const area=button.closest('[data-results-area]');
  area.querySelectorAll('[data-results-view]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  area.querySelectorAll('[data-results-panel]').forEach(panel=>{panel.hidden=panel.dataset.resultsPanel!==button.dataset.resultsView;});
}));
$('#public-refresh').addEventListener('click',refreshPublicLeaderboard);
document.addEventListener('click',event=>{if(event.target.closest('[data-section="ranking"]'))refreshPublicLeaderboard();});
window.addEventListener('hashchange',refreshPublicLeaderboard);
window.addEventListener('popstate',refreshPublicLeaderboard);
setInterval(refreshPublicLeaderboard,10000);
setInterval(updatePublicTimes,1000);
