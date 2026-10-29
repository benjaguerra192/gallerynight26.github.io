let activeQuiz=null,answeringQuiz=false;
function showQuiz(song,challenge) {
 pausePreview(true);
 activeQuiz=song;
 $('#quiz-title').textContent='¿Qué canción está sonando?';
 $('#quiz-copy').textContent='Escuchá el fragmento y elegí una opción. Tenés un solo intento para esta canción.';
 $('#quiz-error').textContent='';
 $('#quiz-options').replaceChildren();
 $('#quiz-player').hidden=false;
 $('#quiz-continue').hidden=true;
 $('#quiz-effectiveness').hidden=true;
 $('#quiz-dialog .quiz-disc').className='quiz-disc';
 $('#quiz-dialog .quiz-disc').textContent='♫';
 challenge.choices.forEach((id,index)=>{
  const title=songs.find(s=>s.id===id)?.title || id;
  const button=document.createElement('button');
  button.type='button';button.textContent=String.fromCharCode(65+index)+' · '+title;
  button.addEventListener('click',()=>answerQuiz(id));
  $('#quiz-options').append(button);
 });
 openDialog($('#quiz-dialog'));
 $('#quiz-player').append(player);
 // Conceal song metadata in the shared player until the answer is saved.
 previewSong={id:song.id,artist:'NFC',title:'Canción misteriosa'};
 previewAudio.src='assets/audio/'+song.id+'.mp3';previewAudio.currentTime=0;
 updatePreview('TOCÁ REPRODUCIR PARA ESCUCHAR');
 $('#preview-toggle').focus();
}
async function answerQuiz(choice) {
 if(answeringQuiz||!activeQuiz)return;
 answeringQuiz=true;
 const song=activeQuiz;
 $('#quiz-options').querySelectorAll('button').forEach(b=>b.disabled=true);
 $('#quiz-close').disabled=true;
 $('#quiz-error').textContent='Guardando respuesta…';
 try {
  const state=await cloud.answer(song.id,choice);
  applyCloudState(state);
  const attempt=state.participant?.attempts.find(a=>a.song_id===song.id);
  if(!attempt)throw new Error('No se pudo confirmar la respuesta. Volvé a intentar.');
  if(attempt.correct) {
   $('#quiz-dialog').close();
   albumIndex=visibleSongs().findIndex(s=>s.id===song.id);
   navigateTo('albumes');render();showSong(song);celebrateAnswer();
  } else showQuizResult(song,true);
  refreshPublicLeaderboard();
  if(adminUnlocked)refreshOrganizer();
 } catch(error) { $('#quiz-error').textContent=error.message; }
 finally {
  answeringQuiz=false;$('#quiz-close').disabled=false;
  $('#quiz-options').querySelectorAll('button').forEach(b=>b.disabled=false);
 }
}
function celebrateAnswer() {
 const won=!!participantRecord?.completed_at && unlocked.size===songs.length && !participantRecord.is_test;
 const banner=document.createElement('div');
 banner.className='answer-celebration';
 banner.setAttribute('role','status');
 banner.innerHTML=won?'<strong>★ ¡GANASTE!</strong><p>¡Adivinaste las ocho canciones!</p><p>Tu tiempo: '+elapsedText(participantRecord.elapsed_ms)+'. Mirá el ranking para conocer quién gana el premio.</p>':'<strong>✓ ¡ACERTASTE!</strong><p>Una canción más en tu colección.</p>';
 banner.insertAdjacentHTML('beforeend',effectivenessHtml());
 for(let i=0;i<18;i++){
  const confetti=document.createElement('span');
  confetti.setAttribute('aria-hidden','true');
  confetti.style.setProperty('--piece',i);
  banner.append(confetti);
 }
 $('#song-detail').prepend(banner);
 $('#song-dialog').scrollTop=0;
 animateUI(banner,[{transform:'scale(.88)',opacity:.2},{transform:'scale(1.04)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],450);
}
function showQuizResult(song,animate=false) {
 pausePreview(true);activeQuiz=null;
 $('#quiz-title').textContent='Esta canción se perdió';
 $('#quiz-copy').textContent='La respuesta era «'+song.title+'» de '+song.artist+'. Esta canción no se puede volver a intentar. Sigan buscando las demás: todavía participan por el premio.';
 const disc=$('#quiz-dialog .quiz-disc');
 disc.className='quiz-disc quiz-missed';disc.textContent='✕';
 $('#quiz-effectiveness').hidden=false;
 $('#quiz-effectiveness').innerHTML=effectivenessHtml();
 $('#quiz-options').replaceChildren();$('#quiz-error').textContent='';
 $('#quiz-player').hidden=true;$('#quiz-continue').hidden=false;
 openDialog($('#quiz-dialog'));
 if(animate)animateUI(disc,[{transform:'translateX(0) rotate(0)'},{transform:'translateX(-12px) rotate(-10deg)'},{transform:'translateX(12px) rotate(10deg)'},{transform:'translateX(-7px) rotate(-5deg)'},{transform:'translateX(7px) rotate(5deg)'},{transform:'translateX(0) rotate(0)'}],550);
 $('#quiz-continue').focus();
}
$('#quiz-dialog').addEventListener('cancel',event=>{if(answeringQuiz)event.preventDefault();});
$('#quiz-dialog').addEventListener('close',()=>{
 activeQuiz=null;pausePreview(true);playerHome.append(player);
});
