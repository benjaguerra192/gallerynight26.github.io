async page => {
  const fixture = `(() => {
    const tracks=['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita'];
    const now=Date.now();
    const entry=(id,name,elapsed,count=8,test=false)=>({id,name,registered_at:new Date(now-60000).toISOString(),is_test:test,elapsed_ms:elapsed,completed_at:count===8?new Date(now-60000+elapsed).toISOString():null,unlocks:tracks.slice(0,count).map((song_id,i)=>({song_id,unlocked_at:new Date(now-59000+i*1000).toISOString()}))});
    const state=JSON.parse(sessionStorage.getItem('cloud-test-state')||'null')||{participants:[entry('a','Familia lenta',30000),entry('b','Familia rápida',20000),entry('c','<img src=x onerror=alert(1)>',0,2),entry('d','Prueba manual',1000,8,true)],event:{mode:'open',is_open:true,opens_at:null,closes_at:null},admin:false,actions:0};
    const save=()=>sessionStorage.setItem('cloud-test-state',JSON.stringify(state));
    const snapshot=()=>({participants:state.participants,event:state.event,server_now:new Date().toISOString()});
    const me=()=>({participant:state.participants.find(p=>p.id==='c')||null,event:state.event,server_now:new Date().toISOString()});
    window.__cloudTest=state;window.confirm=message=>{state.lastConfirmation=message;return !!state.confirmAnswer;};
    window.galleryCloud={me:async()=>me(),restoreAdmin:async()=>state.admin?snapshot():null,
      register:async name=>{if(!state.event.is_open)throw new Error('El recorrido está cerrado.'); const p=state.participants.find(p=>p.id==='c');p.name=name;save();return me()},
      unlock:async id=>{if(!state.event.is_open)throw new Error('El recorrido está cerrado.');const p=me().participant;if(!p.unlocks.some(u=>u.song_id===id))p.unlocks.push({song_id:id,unlocked_at:new Date().toISOString()});save();return me()},
      leaderboard:async()=>({server_now:new Date().toISOString(),participants:state.participants.map(({id,registered_at,...p})=>({...p,unlocks:p.unlocks.map(({song_id})=>({song_id}))}))}),
      login:async()=>{state.admin=true;save();return snapshot()},logout:async()=>{state.admin=false;save()},snapshot:async()=>snapshot(),
      event:async(mode,opens_at,closes_at)=>{state.event={mode,opens_at,closes_at,is_open:mode==='open'};save();return snapshot()},
      action:async(action,target,track,confirmed)=>{state.actions++;const p=state.participants.find(p=>p.id===target);if(action!=='unlock_all'&&!confirmed)throw new Error('Missing confirmation');if(action==='delete_unlock'){p.unlocks=p.unlocks.filter(u=>u.song_id!==track);p.completed_at=null;}else if(action==='clear_unlocks'){p.unlocks=[];p.completed_at=null;}else if(action==='delete_participant'){state.participants=state.participants.filter(p=>p.id!==target);}else if(action==='delete_all'){state.participants=[];}else if(action==='restart'){p.unlocks=[];p.registered_at=new Date().toISOString();p.completed_at=null;p.is_test=false;}else if(action==='unlock_all'){p.unlocks=tracks.map(song_id=>({song_id,unlocked_at:new Date().toISOString()}));p.is_test=true;p.completed_at=new Date().toISOString();}save();return snapshot();}
    };save();
  })();`;
  await page.route('**/database.js', route => route.fulfill({contentType:'application/javascript',body:fixture}));
  await page.goto('http://127.0.0.1:8770/');
  await page.evaluate(()=>{sessionStorage.removeItem('cloud-test-state');localStorage.removeItem('gallery-night:theme');});
  await page.reload();
  await page.getByRole('button',{name:'Organización',exact:true}).click();
  await page.getByLabel('Email de organización').fill('organizer@example.test');
  await page.getByLabel('Contraseña',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.getByText('Leaderboard en vivo',{exact:true}).waitFor({state:'visible'});
  const ranks=await page.locator('.participant-row summary').allTextContents();
  if(!ranks[0].includes('Familia rápida')||!ranks[0].includes('#1')||!ranks.at(-1).includes('SIN PREMIO'))throw new Error('Incorrect leaderboard order');
  if(await page.locator('#leaderboard img').count())throw new Error('Participant name rendered as HTML');
  await page.getByRole('group',{name:'Vista de participantes',exact:true}).getByRole('button',{name:'Grilla',exact:true}).click();
  if(await page.locator('#organizer-grid tbody tr').count()!==4)throw new Error('Missing admin grid participants');
  if(await page.locator('#organizer-grid tbody tr').first().locator('td.song-found').count()!==8)throw new Error('Missing grid unlocks');
  await page.getByRole('group',{name:'Vista de participantes',exact:true}).getByRole('button',{name:'Leaderboard',exact:true}).click();
  await page.locator('.participant-row[data-participant="c"] summary').click();
  await page.evaluate(()=>window.__cloudTest.confirmAnswer=false);
  await page.locator('[data-admin-action="delete_unlock"][data-target="c"]').first().click();
  if(await page.evaluate(()=>window.__cloudTest.actions)!==0)throw new Error('Cancelled deletion mutated data');
  await page.evaluate(()=>window.__cloudTest.confirmAnswer=true);
  await page.locator('[data-admin-action="delete_unlock"][data-target="c"]').first().click();
  await page.waitForFunction(()=>window.__cloudTest.actions===1);
  if(await page.evaluate(()=>window.__cloudTest.participants.find(p=>p.id==='c').unlocks.length)!==1)throw new Error('Individual unlock was not deleted');
  await page.evaluate(async()=>{
    const originalMe=cloud.me, oldState=structuredClone(await originalMe());
    let finish;cloud.me=()=>new Promise(resolve=>{finish=resolve});
    const polling=refreshCompetition();
    await unlockRemote('with-or-without-you');
    finish(oldState);await polling;cloud.me=originalMe;
    if(!unlocked.has('with-or-without-you'))throw new Error('Stale poll replaced a successful unlock');
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    navigateTo('etiquetas');
  });
  await page.locator('#event-mode').selectOption('closed');
  await page.getByRole('button',{name:'Guardar estado y horario',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#admin-event-current').textContent==='CERRADO');
  await page.reload();
  await page.getByText('Leaderboard en vivo',{exact:true}).waitFor({state:'visible'});
  if(await page.locator('dialog[open]').count())throw new Error('Remembered admin was asked to sign in');
  const widths=[];
  for(const width of [320,390,844,1024,1280]){
    await page.setViewportSize({width,height:width===844?390:844});
    widths.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  }
  if(widths.some(w=>w.overflow))throw new Error('Mobile overflow: '+JSON.stringify(widths));
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#site-navigation')).visibility==='hidden');
  await page.screenshot({path:'output/playwright/competition-admin.png',fullPage:true});
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await page.goto('http://127.0.0.1:8770/#ranking');
  await page.locator('#public-list .public-standing').first().waitFor();
  if(await page.locator('#public-results [data-admin-action]').count())throw new Error('Public ranking contains admin actions');
  if(await page.locator('#public-list img').count())throw new Error('Public name rendered as HTML');
  if(!(await page.locator('#public-list .public-standing').first().textContent()).includes('Familia rápida'))throw new Error('Public order differs');
  await page.getByRole('group',{name:'Vista del ranking público',exact:true}).getByRole('button',{name:'Grilla',exact:true}).click();
  if(await page.locator('#public-grid tbody tr').count()!==4)throw new Error('Missing public grid');
  for(const width of [320,390,844]){
    await page.setViewportSize({width,height:width===844?390:844});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Grid causes page overflow');
  }
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  const light=await page.locator('#public-results').evaluate(node=>getComputedStyle(node).backgroundColor);
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  const dark=await page.locator('#public-results').evaluate(node=>getComputedStyle(node).backgroundColor);
  if(light===dark)throw new Error('Device theme did not change panel');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#site-navigation')).visibility==='hidden');
  await page.screenshot({path:'output/playwright/ranking-dark.png',fullPage:true});
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  if(await page.locator('#public-results').evaluate(node=>getComputedStyle(node).backgroundColor)!==light)throw new Error('Theme did not return to light');
  await page.getByRole('button',{name:'Modo oscuro',exact:true}).click();
  if(await page.locator('#public-results').evaluate(node=>getComputedStyle(node).backgroundColor)!==dark)throw new Error('Manual dark toggle failed');
  await page.reload();
  if(await page.locator('#theme-toggle').getAttribute('aria-pressed')!=='true')throw new Error('Manual theme not remembered');
  await page.getByRole('button',{name:'Modo oscuro',exact:true}).click();
  await page.emulateMedia({colorScheme:'dark'});
  if(await page.locator('#public-results').evaluate(node=>getComputedStyle(node).backgroundColor)!==light)throw new Error('Device overrode manual light choice');
  await page.reload();
  if(await page.locator('#theme-toggle').getAttribute('aria-pressed')!=='false')throw new Error('Manual light theme not remembered');
  await page.getByRole('button',{name:'Organización',exact:true}).click();
  await page.getByRole('heading',{name:'Acceso a etiquetas NFC',exact:true}).waitFor({state:'visible'});
  return {leaderboard:'public read-only; admin protected',grid:'public and admin verified',theme:'light, dark and live changes verified',names:'escaped',delete:'cancel and confirm verified',session:'remembered after reload; logout verified',event:'close verified',widths};
}
