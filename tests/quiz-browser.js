async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=`(()=>{
 const tracks=['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita'];
 const state=JSON.parse(sessionStorage.getItem('quiz-test')||'null')||{name:'Familia Quiz',id:'quiz',registered_at:new Date(Date.now()-60000).toISOString(),is_test:false,unlocks:[],attempts:[],completed_at:null};
 const pending={};let fail=false;
 const me=()=>({participant:structuredClone(state),event:{is_open:true,mode:'open'},server_now:new Date().toISOString()});
 const save=()=>sessionStorage.setItem('quiz-test',JSON.stringify(state));
 window.galleryCloud={me:async()=>me(),restoreAdmin:async()=>null,
 challenge:async track=>{if(state.attempts.some(a=>a.song_id===track))return me();pending[track]=[tracks.find(t=>t!==track),track,tracks.filter(t=>t!==track)[1]];return {...me(),challenge:{track,choices:pending[track]}};},
 answer:async(track,choice)=>{if(fail){fail=false;throw new Error('Error de conexión. Reintentá.');}await new Promise(r=>setTimeout(r,80));if(!state.attempts.some(a=>a.song_id===track)){const at=new Date().toISOString();state.attempts.push({song_id:track,correct:track===choice,answered_at:at,selected:choice});if(track===choice)state.unlocks.push({song_id:track,unlocked_at:at});if(state.attempts.length===8)state.completed_at=at;state.elapsed_ms=Date.parse(state.completed_at||at)-Date.parse(state.registered_at);save();}return me();},
 leaderboard:async()=>({participants:[{...structuredClone(state),id:undefined,registered_at:undefined}],server_now:new Date().toISOString()})};
 window.__failQuiz=()=>{fail=true;};
 })();`;
 await page.unroute('**/database.js');
 await page.route('**/database.js',route=>route.fulfill({contentType:'application/javascript',body:fixture}));
 await page.goto('http://127.0.0.1:8770/');
 await page.evaluate(()=>{sessionStorage.removeItem('quiz-test');localStorage.setItem('gallery-night:instructions:v1','seen');});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:8770/?nfc=billie-jean');
 await page.locator('#quiz-dialog').waitFor({state:'visible'});
 if(await page.locator('#quiz-options button').count()!==3)throw Error('Missing three choices');
 if(await page.locator('#quiz-dialog img').count())throw Error('Cover reveals answer');
 if((await page.locator('#preview-title').textContent()).includes('Billie Jean'))throw Error('Player reveals answer');
 await page.locator('#preview-toggle').click();
 await page.waitForFunction(()=>previewState==='playing'||document.querySelector('#preview-status').textContent.includes('REINTENTAR'));
 if(await page.evaluate(()=>previewState)!=='playing')throw Error('Local preview did not play');
 await page.locator('#preview-toggle').click();
 if(await page.evaluate(()=>previewState)!=='paused')throw Error('Quiz audio did not pause');
 await page.evaluate(()=>window.__failQuiz());
 await page.getByRole('button',{name:'B · Billie Jean',exact:true}).click();
 await page.getByText('Error de conexión. Reintentá.',{exact:true}).waitFor();
 if(await page.evaluate(()=>participantRecord.unlocks.length)!==0)throw Error('Failed save awarded a song');
 if(await page.locator('#quiz-options button:disabled').count())throw Error('Cannot retry after network failure');
 await page.screenshot({path:'output/playwright/song-quiz-mobile.png'});
 await page.getByRole('button',{name:'B · Billie Jean',exact:true}).click();
 await page.locator('#song-dialog').waitFor({state:'visible'});
 if(await page.evaluate(()=>unlocked.size)!==1)throw Error('Correct answer not unlocked');
 await page.locator('#song-dialog button[data-close]').first().click();
 await page.goto('http://127.0.0.1:8770/?nfc=take-on-me');
 await page.locator('#quiz-dialog').waitFor({state:'visible'});
 await page.locator('#quiz-options button').first().click();
 await page.getByRole('heading',{name:'Esta canción se perdió',exact:true}).waitFor();
 if(await page.evaluate(()=>unlocked.size)!==1)throw Error('Wrong answer unlocked song');
 await page.screenshot({path:'output/playwright/song-quiz-wrong.png'});
 await page.reload();
 await page.waitForFunction(()=>participantRecord?.attempts.length===2);
 await page.evaluate(()=>unlockRemote('take-on-me'));
 await page.getByRole('heading',{name:'Esta canción se perdió',exact:true}).waitFor();
 if(await page.locator('#quiz-options button').count())throw Error('Reload allowed second guess');
 await page.locator('#quiz-continue').click();
 await page.evaluate(()=>{navigateTo('albumes');albumIndex=1;render();});
 if(!await page.locator('.card.missed').count())throw Error('Lost song not marked');
 await page.evaluate(async()=>{
  for(const song of songs.slice(2)) {await unlockRemote(song.id);await answerQuiz(song.id);document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
 });
 if(await page.evaluate(()=>participantRecord.attempts.length)!==8||await page.evaluate(()=>unlocked.size)!==7)throw Error('Answers or score incorrect');
 if(!await page.evaluate(()=>participantRecord.completed_at))throw Error('Clock did not finish with a wrong answer');
 const clock=await page.locator('#clock-digits').textContent();
 await page.waitForTimeout(1100);
 if(await page.locator('#clock-digits').textContent()!==clock)throw Error('Finished clock keeps running');
 await page.evaluate(async()=>{navigateTo('ranking');await refreshPublicLeaderboard();});
 if(!(await page.locator('#public-list').textContent()).includes('#1'))throw Error('Wrong answer excluded family from prize');
 await page.getByRole('button',{name:'Grilla',exact:true}).click();
 if(await page.locator('#public-grid .song-failed').count()!==1)throw Error('Grid missing incorrect answer');
 await page.evaluate(()=>{
  const p={name:'7 fast',unlocks:Array(7).fill({}),completed_at:'2026-01-01',elapsed_ms:1000,is_test:false};
  const better={...p,name:'8 slow',unlocks:Array(8).fill({}),elapsed_ms:99999};
  const slower={...p,name:'7 slow',elapsed_ms:2000};
  const order=sortLeaderboard([slower,p,better]).map(x=>x.name).join(',');
  if(order!=='8 slow,7 fast,7 slow')throw Error('Score/time ordering wrong: '+order);
 });
 for(const width of [320,390,844,1280]){
  await page.setViewportSize({width,height:width===844?390:844});
  await page.evaluate(()=>showQuiz(songs[0],{choices:['take-on-me','billie-jean','sweet-dreams']}));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.querySelector('#quiz-dialog').scrollWidth>document.querySelector('#quiz-dialog').clientWidth))throw Error('Quiz overflows at '+width);
  await page.locator('#quiz-close').click();
 }
 if(errors.length)throw Error(errors.join('\n'));
 return {passed:true,checks:'audio play/pause, concealed metadata, three choices, retry, success, permanent failure, 7/8 completion, ranking, grid, responsive layout'};
}
