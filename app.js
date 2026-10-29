const songs = [
  {id:'billie-jean',title:'Billie Jean',artist:'Michael Jackson',album:'Thriller',year:1982,cover:'billie-jean.jpg',deezer:'https://www.deezer.com/track/831313',spotify:'https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5'},
  {id:'take-on-me',title:'Take on Me',artist:'a-ha',album:'Hunting High and Low',year:1985,cover:'take-on-me.jpg',deezer:'https://www.deezer.com/track/664107',spotify:'https://open.spotify.com/track/2WfaOiMkCvy7F5fcp2zZ8L'},
  {id:'with-or-without-you',title:'With or Without You',artist:'U2',album:'The Joshua Tree',year:1987,cover:'with-or-without-you.jpg',deezer:'https://www.deezer.com/track/912486',spotify:'https://open.spotify.com/track/6ADSaE87h8Y3lccZlBJdXH'},
  {id:'sweet-dreams',title:'Sweet Dreams (Are Made of This)',artist:'Eurythmics',album:'Sweet Dreams (Are Made of This)',year:1983,cover:'sweet-dreams.jpg',deezer:'https://www.deezer.com/track/561836',spotify:'https://open.spotify.com/track/46ATBhpbFmNLQKcwjQu15P'},
  {id:'every-breath-you-take',title:'Every Breath You Take',artist:'The Police',album:'Synchronicity',year:1983,cover:'every-breath-you-take.jpg',deezer:'https://www.deezer.com/track/665714262',spotify:'https://open.spotify.com/track/1JSTJqkT5qHq8MDJnJbRE1'},
  {id:'bohemian-rhapsody',title:'Bohemian Rhapsody',artist:'Queen',album:'A Night at the Opera',year:1975,cover:'bohemian-rhapsody.jpg',deezer:'https://www.deezer.com/track/4091937401',spotify:'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J'},
  {id:'sweet-child',title:'Sweet Child o’ Mine',artist:'Guns N’ Roses',album:'Appetite for Destruction',year:1987,cover:'sweet-child.jpg',deezer:'https://www.deezer.com/track/518458172',spotify:'https://open.spotify.com/track/2sTBBvprdXH4eGOOT41fhw'},
  {id:'la-isla-bonita',title:'La Isla Bonita',artist:'Madonna',album:'True Blue',year:1986,cover:'la-isla-bonita.jpg',deezer:'https://www.deezer.com/track/678372',spotify:'https://open.spotify.com/track/6r8k1vznHrzlEKYxL4dZEe'}
];
// Las etiquetas ya grabadas conservan una canción asignada; el avance viejo no desbloquea las nuevas.
const legacyNfc={'war-pigs':'billie-jean','tratame-suavemente':'with-or-without-you','te-para-tres':'sweet-dreams','ruta-66':'every-breath-you-take','post-crucifixion':'bohemian-rhapsody','kiss':'la-isla-bonita'};
const cloud=window.galleryCloud;
const key='en-frecuencia:v1';
const $=s=>document.querySelector(s);
let unlocked=new Set(),filter='all',toastTimer,albumIndex=0,adminUnlocked=false;
let participantRecord=null;
function answeredSongs(person) { return person?.attempts?.length ?? person?.unlocks?.length ?? 0; }
function failedSong(id) { return cloud && participantRecord?.attempts?.some(a=>a.song_id===id&&!a.correct); }
const viewKey='gallery-night:album-view';
let albumView='carousel';
try{if(localStorage.getItem(viewKey)==='grid')albumView='grid'}catch{}
function setAlbumView(view){
 if(!['carousel','grid'].includes(view))return;
 albumView=view;
 try{localStorage.setItem(viewKey,view)}catch{}
 render();
 animateUI($('#songs'),[{opacity:.4},{opacity:1}],200);
}
$('#view-carousel').addEventListener('click',()=>setAlbumView('carousel'));
$('#view-grid').addEventListener('click',()=>setAlbumView('grid'));
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const activeMotion=new Map();
function animateUI(element,frames,duration=280){
 if(!element)return;
 activeMotion.get(element)?.cancel();activeMotion.delete(element);
 if(reducedMotion.matches||typeof element.animate!=='function')return;
 const animation=element.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)'});
 activeMotion.set(element,animation);
 animation.finished.then(()=>{if(activeMotion.get(element)===animation)activeMotion.delete(element)}).catch(()=>{});
}
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){activeMotion.forEach(animation=>animation.cancel());activeMotion.clear()}});
function revealAlbum(direction=1){animateUI($('#songs'),[{opacity:.25,transform:'translateX('+direction*32+'px) scale(.985)'},{opacity:1,transform:'translateX(0) scale(1)'}],300)}
function openDialog(dialog){if(!dialog.open)dialog.showModal();animateUI(dialog,[{opacity:0,transform:'translateY(16px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],260)}
function readProgress(){try{const saved=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(saved)?saved.filter(id=>songs.some(s=>s.id===id)):[])}catch{return new Set()}}
function save(){try{localStorage.setItem(key,JSON.stringify([...unlocked]));return true}catch{notify('No se pudo guardar. El avance durará mientras esta página siga abierta.');return false}}
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500)}
const lockIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/><path d="M12 14v3"/></svg>';
function coverUrl(song){return 'assets/albums/'+encodeURIComponent(song.cover)}
function render(){
 const n=unlocked.size,total=songs.length;
 $('#count').textContent=String(n).padStart(2,'0');
 $('#filter-count').textContent=String(n).padStart(2,'0');
 $('#total-count').textContent='/ '+String(total).padStart(2,'0');
 $('#all-count').textContent=String(total).padStart(2,'0');
 $('#progress').style.width=(n/total*100)+'%';
 $('#progress-copy').textContent=n===total?'Colección completa. ¡Gracias por compartir este recorrido!':n?'Ya encontraron '+n+' de '+total+' canciones. ¡A buscar la próxima!':total+' canciones por descubrir. Su colección empieza con un escaneo.';
 if(cloud&&participantRecord)$('#progress-copy').textContent=n+' aciertos · '+answeredSongs(participantRecord)+'/8 respondidas. '+(participantRecord.completed_at?'¡Recorrido terminado! Mirá el ranking.':'Escuchá y adiviná la próxima.');
 const visible=visibleSongs();$('#empty').hidden=visible.length>0;
 albumIndex=visible.length?Math.min(albumIndex,visible.length-1):0;
 $('#album-carousel').hidden=visible.length===0;
 const grid=albumView==='grid';
 $('#album-carousel').classList.toggle('grid-view',grid);
 $('#album-carousel').setAttribute('aria-roledescription',grid?'galería':'carrusel');
 $('#album-carousel').setAttribute('tabindex',grid?'-1':'0');
 $('#album-prev').hidden=grid;$('#album-next').hidden=grid;
 $('#album-position').hidden=grid;
 $('#view-carousel').setAttribute('aria-pressed',String(!grid));
 $('#view-grid').setAttribute('aria-pressed',String(grid));
 $('#album-prev').disabled=visible.length<2;$('#album-next').disabled=visible.length<2;
 $('#album-position').textContent=visible.length?'ÁLBUM '+(albumIndex+1)+' / '+visible.length+' · '+(unlocked.has(visible[albumIndex].id)?visible[albumIndex].title:'Por descubrir'):'';
 $('#songs').innerHTML=(grid?visible:visible.slice(albumIndex,albumIndex+1)).map(s=>{
  const open=unlocked.has(s.id),number=String(songs.indexOf(s)+1).padStart(2,'0');
  const missed=failedSong(s.id);
  const art=open?(s.cover?'<img class="album-cover" src="'+coverUrl(s)+'" alt="Portada: '+s.album+'" width="640" height="640" decoding="async">':'<div class="art-type" aria-hidden="true">'+s.type.replace('\n','<br>')+'</div>'):'<div class="locked-cover">'+lockIcon+'<strong>'+(missed?'INTENTO PERDIDO':'POR DESCUBRIR')+'</strong><span>'+(missed?'Seguí buscando las demás':'Escaneá su NFC')+'</span></div>';
  return '<article '+(open?'data-preview="'+s.id+'" tabindex="0" aria-label="Escuchar '+s.title+'" ':'')+'class="card '+(open?'unlocked':missed?'locked missed':'locked')+'"><div class="art" style="--art:'+(s.color||'#145530')+'">'+art+'<span class="card-number">TRACK '+number+'</span></div><div class="card-body"><div class="card-meta"><span>MUSICAL HUNT</span><img class="school-logo mini-logo" src="assets/logo-sanlucas.png" alt="" width="28" height="28"></div><h3>'+(open?s.title:'Canción misteriosa')+'</h3><p class="artist">'+(open?s.artist:'Un nuevo encuentro')+'</p><div class="card-bottom">'+(open?'<button data-song="'+s.id+'">Escuchar ↗</button>':missed?'<span>✕ Respuesta incorrecta</span>':'<span>🔒 Bloqueada</span>')+'</div></div></article>';
 }).join('');
 syncAlbumAudio();
}
function showSong(song,already=false){
 playerHome.append(player);
 $('#song-dialog .eyebrow').textContent=already?'EN TU COLECCIÓN':'NUEVO EN TU COLECCIÓN';
 $('#song-detail').innerHTML=(song.cover?'<img class="detail-cover" src="'+coverUrl(song)+'" alt="Portada: '+song.album+'" width="320" height="320">':'')+'<div class="song-art">'+song.artist.toUpperCase()+'</div><h2>'+song.title+'</h2><p>'+song.album+(song.year?' · '+song.year:'')+'</p><a class="primary" href="'+song.spotify+'" target="_blank" rel="noopener noreferrer">Abrir Spotify ↗</a><p class="caption">TU CANCIÓN YA ESTÁ GUARDADA. ESCUCHÁ EL FRAGMENTO O ABRÍ SPOTIFY.</p><p class="caption"><a href="'+song.deezer+'" target="_blank" rel="noopener noreferrer">Preview de 30 segundos · Deezer ↗</a></p>';
 openDialog($('#song-dialog'));
 $('#song-detail').append(player);
 playPreview(song);
 if(!already)animateUI($('#song-detail .detail-cover'),[{opacity:.2,transform:'scale(.9) rotate(-3deg)'},{opacity:1,transform:'scale(1.025) rotate(1deg)',offset:.75},{opacity:1,transform:'scale(1) rotate(0)'}],460);
}
function unlock(id){id=Object.hasOwn(legacyNfc,id)?legacyNfc[id]:id;if(cloud)return unlockRemote(id);if(!familyName){openDialog($('#family-dialog'));return false}const song=songs.find(s=>s.id===id);if(!song){notify('Este NFC no corresponde a una canción del recorrido.');return false}const already=unlocked.has(id);unlocked.add(id);save();albumIndex=visibleSongs().findIndex(s=>s.id===id);navigateTo('albumes');render();revealAlbum();showSong(song,already);return true}
function consumeLink(){if(cloud){consumeRemoteLink();return}if(!familyName)return;const params=new URLSearchParams(location.search);if(!params.has('nfc'))return;const id=params.get('nfc');params.delete('nfc');try{history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash)}catch{}unlock(id)}
function linkBase(){const custom=$('#base-url').value.trim();try{const url=new URL(custom||location.href);if(custom&&url.protocol!=='https:')return null;url.search='';url.hash='';return url}catch{return null}}
function renderLinks(){if(!adminUnlocked){$('#nfc-links').replaceChildren();return}const base=linkBase();$('#nfc-links').replaceChildren();if(!base){$('#nfc-links').textContent='Ingresá una dirección HTTPS válida.';return}songs.forEach(s=>{const url=new URL(base);url.searchParams.set('nfc',s.id);const row=document.createElement('div');row.className='nfc-row';const info=document.createElement('div');const name=document.createElement('strong');name.textContent=s.artist+' — '+s.title;const link=document.createElement('a');link.href=url.href;link.textContent=url.href;info.append(name,link);const button=document.createElement('button');button.className='quiet';button.textContent='Copiar';button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url.href);notify('Enlace copiado.')}catch{const range=document.createRange();range.selectNodeContents(link);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);notify('Enlace seleccionado. Copialo manualmente.')}});row.append(info,button);$('#nfc-links').append(row)})}
$('#songs').addEventListener('click',e=>{const button=e.target.closest('[data-song]');if(button&&unlocked.has(button.dataset.song))showSong(songs.find(s=>s.id===button.dataset.song),true)});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#reset').addEventListener('click',()=>openDialog($('#reset-dialog')));
$('#confirm-reset').addEventListener('click',()=>{if(cloud){notify('Los reinicios de la competencia se gestionan desde Organización.');return}pausePreview(true);unlocked.clear();const saved=save();filter='all';albumIndex=0;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});$('#reset-dialog').close();render();if(saved)notify('Recorrido reiniciado. Volvé a descubrir las canciones.');});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;albumIndex=0;document.querySelectorAll('[data-filter]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});render()}));
$('#base-url').addEventListener('input',renderLinks);
window.addEventListener('storage',e=>{if(cloud){refreshCompetition();return}if(e.key===key||e.key===null){unlocked=readProgress();render();if($('#song-dialog').open)$('#song-dialog').close()}});
window.addEventListener('popstate',consumeLink);

function visibleSongs(){return songs.filter(s=>filter==='all'||unlocked.has(s.id))}
function moveAlbum(direction){if(albumView==='grid')return;const total=visibleSongs().length;if(total<2)return;albumIndex=(albumIndex+direction+total)%total;render();revealAlbum(direction)}
$('#album-prev').addEventListener('click',()=>moveAlbum(-1));
$('#album-next').addEventListener('click',()=>moveAlbum(1));
$('#album-carousel').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveAlbum(e.key==='ArrowLeft'?-1:1)}});
let touchStart=null;
$('#album-carousel').addEventListener('touchstart',e=>{touchStart=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
$('#album-carousel').addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)moveAlbum(dx<0?1:-1)},{passive:true});
$('#album-carousel').addEventListener('touchcancel',()=>{touchStart=null});
const sectionIds=['inicio','albumes','guia','ranking','etiquetas'];
function setMenu(open){document.body.classList.toggle('menu-open',open);$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-backdrop').hidden=!open;$('#site-navigation').inert=portraitMedia.matches&&!open;if(open){animateUI($('#menu-backdrop'),[{opacity:0},{opacity:1}],220);$('#site-navigation a').focus()}}
let currentSection='';
function selectSection(id){if(!sectionIds.includes(id))id='inicio';if(id==='etiquetas'&&!adminUnlocked){id='inicio';openDialog($('#admin-dialog'));}const changed=currentSection!==id;currentSection=id;if(id!=='albumes')pausePreview(true);else if(changed)syncAlbumAudio();document.querySelectorAll('.page-section').forEach(panel=>{panel.hidden=panel.id!==id;if(!panel.hidden&&changed)animateUI(panel,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],320)});document.querySelectorAll('[data-section]').forEach(link=>{if(link.dataset.section===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});setMenu(false);return id}
function navigateTo(id){id=selectSection(id);if(location.hash!=='#'+id){try{history.pushState(null,'',location.pathname+location.search+'#'+id)}catch{}}const panel=$('#'+id);panel.setAttribute('tabindex','-1');panel.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}
document.querySelectorAll('[data-section]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();navigateTo(link.dataset.section)}));
$('.brand').addEventListener('click',e=>{e.preventDefault();navigateTo('inicio')});
$('#browse-albums').addEventListener('click',()=>navigateTo('albumes'));
$('#menu-toggle').addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
$('#menu-close').addEventListener('click',()=>{setMenu(false);$('#menu-toggle').focus()});
$('#menu-backdrop').addEventListener('click',()=>setMenu(false));
document.addEventListener('keydown',e=>{if(!document.body.classList.contains('menu-open'))return;if(e.key==='Escape'){setMenu(false);$('#menu-toggle').focus()}if(e.key==='Tab'){const links=$('#site-navigation').querySelectorAll('a,button');const first=links[0],last=links[links.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
window.addEventListener('hashchange',()=>selectSection(location.hash.slice(1)));
window.addEventListener('popstate',()=>selectSection(location.hash.slice(1)));
const portraitMedia=window.matchMedia('(max-width: 1000px) and (orientation: portrait)');
portraitMedia.addEventListener('change',()=>setMenu(false));
selectSection(location.hash.slice(1));

const familyKey='gallery-night:family:v1';
const instructionsKey='gallery-night:instructions:v1';
function needsInstructions(){try{return localStorage.getItem(instructionsKey)!=='seen'}catch{return true}}
function rememberInstructions(){try{localStorage.setItem(instructionsKey,'seen')}catch{}}
function readFamily(){try{return (localStorage.getItem(familyKey)||'').trim().slice(0,40)}catch{return ''}}
let familyName=cloud?'':readFamily();
function isGenericFamily(name){return ['','tu familia','familia','mi familia'].includes(name.trim().replace(/\s+/g,' ').toLocaleLowerCase('es'))}
function renderFamily(){const generic=isGenericFamily(familyName),label=generic?'Ingresar nombre de la familia':'Cambiar nombre de la familia '+familyName;$('#family-display').textContent=generic?'Ingresá tu familia':familyName;$('#header-family-display').textContent=generic?'Tu familia':familyName;$('#family-hint').textContent=generic?'Tocá acá para agregar el nombre':'Tocá acá para cambiar el nombre';$('#family-button').setAttribute('aria-label',label);$('#family-header-button').setAttribute('aria-label',label);$('#family-header-button').title=generic?'Ingresá el nombre de tu familia':familyName;$('#participant-logout').hidden=!familyName}
function setFamily(value){if(cloud)return registerFamily(value);const name=value.trim().replace(/\s+/g,' ');if(isGenericFamily(name)||name.length>40){$('#family-error').textContent='Escribí el nombre de tu familia, hasta 40 caracteres.';return false}familyName=name;try{localStorage.setItem(familyKey,name)}catch{notify('El nombre se conservará solo mientras esta página esté abierta.')}renderFamily();rememberInstructions();$('#family-error').textContent='';$('#family-dialog').close();consumeLink();return true}
$('#family-form').addEventListener('submit',e=>{e.preventDefault();setFamily($('#family-name').value)});
$('#family-dialog').addEventListener('cancel',e=>{if(!familyName&&!cloud)e.preventDefault()});
$('#family-dialog').addEventListener('close',()=>{if(!$('#family-instructions').hidden)rememberInstructions()});
function askFamilyName(){setMenu(false);const first=needsInstructions();$('#family-instructions').hidden=!first;$('#family-name').value=isGenericFamily(familyName)?'':familyName;$('#family-error').textContent='';openDialog($('#family-dialog'));if(first){$('#family-title').focus();$('#family-dialog').scrollTop=0}else $('#family-name').focus()}
$('#family-button').addEventListener('click',askFamilyName);
$('#family-header-button').addEventListener('click',askFamilyName);
$('#family-guide-link').addEventListener('click',event=>{event.preventDefault();$('#family-dialog').close();navigateTo('guia')});
renderFamily();
unlocked=cloud?new Set():readProgress();render();renderLinks();if(!cloud){if(!isGenericFamily(familyName)&&!needsInstructions())consumeLink();else askFamilyName()}

// Acceso de cortesía del sitio estático; no es autenticación de servidor.
function authorizeAdmin(password){if(cloud)return loginOrganizer(password);if(password!=='nadielaadivina'){$('#admin-error').textContent='Contraseña incorrecta.';return false}adminUnlocked=true;$('#admin-password').value='';$('#admin-error').textContent='';$('#admin-dialog').close();renderLinks();navigateTo('etiquetas');return true}
$('#admin-open').addEventListener('click',()=>{if(adminUnlocked){navigateTo('etiquetas');return}$('#admin-error').textContent='';$('#admin-password').value='';openDialog($('#admin-dialog'))});
$('#admin-form').addEventListener('submit',e=>{e.preventDefault();authorizeAdmin($('#admin-password').value)});
$('#admin-lock').addEventListener('click',()=>{if(cloud){logoutOrganizer();return}adminUnlocked=false;renderLinks();navigateTo('inicio')});
$('#admin-unlock-all').addEventListener('click',()=>{if(!adminUnlocked)return;if(cloud){unlockAllRemote();return}unlocked=new Set(songs.map(s=>s.id));const saved=save();render();if(saved)notify('Las 8 canciones están desbloqueadas en este navegador.');});

function syncAlbumAudio(){
 if($('#song-dialog').open||$('#quiz-dialog').open)return;
 const song=visibleSongs()[albumIndex];
 if(currentSection==='albumes' && albumView==='carousel' && song && unlocked.has(song.id))playPreview(song);
 else pausePreview(true);
}
$('#song-dialog').addEventListener('close',()=>{playerHome.append(player);if(albumView==='carousel')syncAlbumAudio();else pausePreview(true)});
$('#songs').addEventListener('pointerover',e=>{
 if(albumView!=='grid'||e.pointerType==='touch'||$('#song-dialog').open)return;
 const card=e.target.closest('[data-preview]');
 if(card&&!card.contains(e.relatedTarget))playPreview(songs.find(s=>s.id===card.dataset.preview));
});
$('#songs').addEventListener('pointerout',e=>{
 if(albumView!=='grid'||e.pointerType==='touch'||$('#song-dialog').open)return;
 const card=e.target.closest('[data-preview]');
 if(card&&!card.contains(e.relatedTarget))pausePreview(true);
});
$('#songs').addEventListener('click',e=>{
 if(e.target.closest('button'))return;
 const card=e.target.closest('[data-preview]');
 if(card)playPreview(songs.find(s=>s.id===card.dataset.preview),true);
});
$('#songs').addEventListener('focusin',e=>{
 if(albumView!=='grid')return;
 const card=e.target.closest('[data-preview]');
 if(card)playPreview(songs.find(s=>s.id===card.dataset.preview));
});
$('#songs').addEventListener('keydown',e=>{
 if(e.target.closest('button')||!['Enter',' '].includes(e.key))return;
 const card=e.target.closest('[data-preview]');
 if(card){e.preventDefault();playPreview(songs.find(s=>s.id===card.dataset.preview),true)}
});
