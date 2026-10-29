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
   navigateTo('albumes');render();showSong(song);
  } else showQuizResult(song);
  refreshPublicLeaderboard();
  if(adminUnlocked)refreshOrganizer();
 } catch(error) { $('#quiz-error').textContent=error.message; }
 finally {
  answeringQuiz=false;$('#quiz-close').disabled=false;
  $('#quiz-options').querySelectorAll('button').forEach(b=>b.disabled=false);
 }
}
function showQuizResult(song) {
 pausePreview(true);activeQuiz=null;
 $('#quiz-title').textContent='Esta canción se perdió';
 $('#quiz-copy').textContent='La respuesta era «'+song.title+'» de '+song.artist+'. No se puede volver a intentar esta canción. Sigan buscando las demás: todavía participan por el premio. Ganan más aciertos; en empate, menor tiempo al responder las ocho.';
 $('#quiz-options').replaceChildren();$('#quiz-error').textContent='';
 $('#quiz-player').hidden=true;$('#quiz-continue').hidden=false;
 openDialog($('#quiz-dialog'));
 $('#quiz-continue').focus();
}
$('#quiz-dialog').addEventListener('cancel',event=>{if(answeringQuiz)event.preventDefault();});
$('#quiz-dialog').addEventListener('close',()=>{
 activeQuiz=null;pausePreview(true);playerHome.append(player);
});
