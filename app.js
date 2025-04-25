/* ===  Marcador Truco Pro  –  lógicas centrais  ========================== */

/* ---------- VARIÁVEIS GLOBAIS ---------- */
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0;
let isInitialState = true;
const maxScore = 12;

let matchesWonNos = 0, matchesWonEles = 0;
let playerNames = [];
let currentDealerIndex = 0;

let timerIntervalId = null;
let gameStartTime    = null;   // carimbo inicial
let matchDurationHistory = [];

let undoState = null;
let teamNameNos = 'Nós', teamNameEles = 'Eles';

let currentTheme = 'dark';
let wakeLock     = null;
let isSoundOn    = true;

/* ---------- LOCAL-STORAGE KEYS ---------- */
const STORAGE_KEYS = {
  SCORE_NOS:'t_sNos',         SCORE_ELES:'t_sEles',
  PREV_NOS:'t_pNos',          PREV_ELES:'t_pEles',
  IS_INITIAL:'t_init',
  MATCHES_NOS:'t_mNos',       MATCHES_ELES:'t_mEles',
  PLAYER_NAMES:'t_pNames',    DEALER_IDX:'t_dIdx',
  TEAM_NOS:'t_tNos',          TEAM_ELES:'t_tEles',
  DUR_HISTORY:'t_dHist',
  THEME:'t_theme'
};

/* ---------- ELEMENTOS DOM (preencher depois) ---------- */
let scoreNosEl, scoreElesEl,   prevNosEl, prevElesEl;
let winsNosEl, winsElesEl,     dealerNameEl;
let timerEl,   durationListEl, undoBtn;
let teamNosEl, teamElesEl;
let themeBtn,  bodyEl, metaTheme;

/* ---------- FUNÇÕES UTILITÁRIAS DE STORAGE ---------- */
const save = (k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch(e){console.error('LS save',k,e);} };
const load = (k,dv=null)=>{ try{const v=localStorage.getItem(k); return v?JSON.parse(v):dv;} catch(e){return dv;} };
function saveGameState(){
  save(STORAGE_KEYS.SCORE_NOS,scoreNos);
  save(STORAGE_KEYS.SCORE_ELES,scoreEles);
  save(STORAGE_KEYS.PREV_NOS ,prevScoreNos);
  save(STORAGE_KEYS.PREV_ELES,prevScoreEles);
  save(STORAGE_KEYS.IS_INITIAL,isInitialState);
  save(STORAGE_KEYS.MATCHES_NOS,matchesWonNos);
  save(STORAGE_KEYS.MATCHES_ELES,matchesWonEles);
  save(STORAGE_KEYS.PLAYER_NAMES,playerNames);
  save(STORAGE_KEYS.DEALER_IDX,currentDealerIndex);
  save(STORAGE_KEYS.TEAM_NOS,teamNameNos);
  save(STORAGE_KEYS.TEAM_ELES,teamNameEles);
  save(STORAGE_KEYS.DUR_HISTORY,matchDurationHistory);
}
function loadGameState(){
  scoreNos   = load(STORAGE_KEYS.SCORE_NOS,0);
  scoreEles  = load(STORAGE_KEYS.SCORE_ELES,0);
  prevScoreNos=load(STORAGE_KEYS.PREV_NOS,0);
  prevScoreEles=load(STORAGE_KEYS.PREV_ELES,0);
  isInitialState=load(STORAGE_KEYS.IS_INITIAL,true);
  matchesWonNos= load(STORAGE_KEYS.MATCHES_NOS,0);
  matchesWonEles=load(STORAGE_KEYS.MATCHES_ELES,0);
  playerNames = load(STORAGE_KEYS.PLAYER_NAMES,[]);
  currentDealerIndex = load(STORAGE_KEYS.DEALER_IDX,0);
  teamNameNos = load(STORAGE_KEYS.TEAM_NOS,'Nós');
  teamNameEles= load(STORAGE_KEYS.TEAM_ELES,'Eles');
  matchDurationHistory = load(STORAGE_KEYS.DUR_HISTORY,[]);
  currentTheme = load(STORAGE_KEYS.THEME) ||
      (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light':'dark');
}
const clearStorage = ()=>Object.values(STORAGE_KEYS).forEach(k=>localStorage.removeItem(k));

/* ---------- DISPLAY ---------- */
const updateCurrentDisplay = ()=>{
  scoreNosEl.textContent = scoreNos;
  scoreElesEl.textContent= scoreEles;
  prevNosEl.textContent  = isInitialState?'-':prevScoreNos;
  prevElesEl.textContent = isInitialState?'-':prevScoreEles;
};
const updateWinsDisplay = ()=>{
  winsNosEl.textContent  = matchesWonNos;
  winsElesEl.textContent = matchesWonEles;
};
const updateDealerDisplay = ()=>{
  dealerNameEl.textContent = playerNames.length===4 ? playerNames[currentDealerIndex] : '-- Digite os nomes --';
};
const updateDurations = ()=>{
  durationListEl.innerHTML = '';
  if(matchDurationHistory.length===0){
    durationListEl.innerHTML='<li>Nenhuma partida concluída.</li>';
    durationListEl.style.textAlign='center';
    return;
  }
  durationListEl.style.textAlign='left';
  for(let i=matchDurationHistory.length-1;i>=0;i--){
    const li=document.createElement('li');
    li.textContent=`Partida ${i+1}: ${formatTime(matchDurationHistory[i].duration)}`;
    durationListEl.appendChild(li);
  }
};
const updateTeamNames = ()=>{
  teamNosEl.textContent  = teamNameNos;
  teamElesEl.textContent = teamNameEles;
};

/* ---------- FALA / VOZ ---------- */
function speakText(text,cancelPrevious=true){
  if(!isSoundOn) return;
  if(!('speechSynthesis' in window)) return console.warn('Sem speechSynthesis');
  if(cancelPrevious && window.speechSynthesis.speaking){
    window.speechSynthesis.cancel();
    setTimeout(()=>_speak(text),50);
  }else _speak(text);
}
function _speak(txt){
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='pt-BR'; u.rate=1; u.pitch=1;
  u.onerror=e=>console.error('TTS erro',e);
  window.speechSynthesis.speak(u);
}

/* ---------- TIMER ---------- */
const formatTime = ms=>{
  if(!ms||ms<0) return '--:--';
  const s=Math.floor(ms/1000);
  const h=Math.floor(s/3600);
  const m=Math.floor((s%3600)/60).toString().padStart(2,'0');
  const sec=(s%60).toString().padStart(2,'0');
  return h>0?`${h.toString().padStart(2,'0')}:${m}:${sec}`:`${m}:${sec}`;
};
function startTimer(){
  stopTimer();                     // garante limpeza
  gameStartTime=Date.now();
  timerEl.textContent='00:00';
  timerIntervalId=setInterval(()=>{
    if(gameStartTime) timerEl.textContent=formatTime(Date.now()-gameStartTime);
  },1000);
  requestWakeLock();
}
function stopTimer(){
  let d=null;
  if(gameStartTime) d=Date.now()-gameStartTime;
  if(timerIntervalId){clearInterval(timerIntervalId);timerIntervalId=null;}
  gameStartTime=null;
  releaseWakeLock();
  return d;
}

/* ---------- WAKE LOCK ---------- */
async function requestWakeLock(){
  if('wakeLock' in navigator){
    try{wakeLock=await navigator.wakeLock.request('screen');}
    catch(e){console.warn('WakeLock falhou',e);}
  }
}
const releaseWakeLock=async()=>{try{await wakeLock?.release();}catch{} wakeLock=null;};
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && gameStartTime) requestWakeLock();
  else releaseWakeLock();
});

/* ---------- FLUXO PRINCIPAL ---------- */
function changeScore(team,amount,pointSpeak=null){
  const current=(team==='nos')?scoreNos:scoreEles;
  if((amount>0 && current>=maxScore)||(amount<0 && current<=0)) return false;

  undoState={
    sN:scoreNos,sE:scoreEles,psN:prevScoreNos,psE:prevScoreEles,
    dI:currentDealerIndex,isI:isInitialState
  };

  prevScoreNos=scoreNos; prevScoreEles=scoreEles; isInitialState=false;

  if(team==='nos'){
    scoreNos=Math.min(maxScore,Math.max(0,scoreNos+amount));
    if(scoreNos===maxScore) finishGame('nos');
  }else{
    scoreEles=Math.min(maxScore,Math.max(0,scoreEles+amount));
    if(scoreEles===maxScore) finishGame('eles');
  }

  updateCurrentDisplay();

  /* --- Lógica de voz e dealer --- */
  if(amount>0){
    if(pointSpeak) speakText(pointSpeak,true);
    const advanced=advanceDealer(false);
    if(advanced && playerNames.length===4){
      setTimeout(()=>speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`,false),800);
    }
  }

  saveGameState();
  undoBtn.disabled=false;
  return true;
}

/* ---------- DEALER ---------- */
function advanceDealer(alertIfMissing){
  if(playerNames.length!==4){
    if(alertIfMissing) alert('Defina os nomes...');
    return false;
  }
  currentDealerIndex=(currentDealerIndex+1)%4;
  updateDealerDisplay();
  save(STORAGE_KEYS.DEALER_IDX,currentDealerIndex);
  return true;
}

/* ---------- DESFAZER ---------- */
function undoLastAction(){
  if(!undoState) return alert('Nada para desfazer');
  ({sN:scoreNos,sE:scoreEles,psN:prevScoreNos,psE:prevScoreEles,
    dI:currentDealerIndex,isI:isInitialState}=undoState);
  undoState=null;
  updateCurrentDisplay();
  updateDealerDisplay();
  undoBtn.disabled=true;
  saveGameState();
  speakText('Ação desfeita');
}

/* ---------- FIM DE PARTIDA ---------- */
function finishGame(winner){
  const dur=stopTimer();
  matchDurationHistory.push({duration:dur,winner});
  save(STORAGE_KEYS.DUR_HISTORY,matchDurationHistory);
  updateDurations();

  setTimeout(()=>{
    if(winner==='nos') matchesWonNos++; else matchesWonEles++;
    updateWinsDisplay();
    save(STORAGE_KEYS.MATCHES_NOS,matchesWonNos);
    save(STORAGE_KEYS.MATCHES_ELES,matchesWonEles);

    const winName=winner==='nos'?teamNameNos:teamNameEles;
    const msg=`${winName} ${winner==='nos'?'Ganhamos':'Ganharam'}!\nDuração: ${formatTime(dur)}`;
    setTimeout(()=>{speakText(msg); alert(msg); prepareNextGame();},300);
  },300);
}

/* ---------- NOVA PARTIDA ---------- */
function prepareNextGame(){
  stopTimer();
  scoreNos=scoreEles=prevScoreNos=prevScoreEles=0;
  isInitialState=true; undoState=null;
  undoBtn.disabled=true;
  updateCurrentDisplay();
  saveGameState();
  timerEl.textContent='00:00';
  if(playerNames.length===4) setTimeout(startTimer,100);
}

/* ---------- NOMES / EQUIPES ---------- */
function getPlayerNames(){
  playerNames=[];
  alert('Vamos definir os jogadores:');
  for(let i=1;i<=4;i++){
    let n=prompt(`Jogador ${i}:`);
    while(!n?.trim()) n=prompt(`Jogador ${i}:`);
    playerNames.push(n.trim());
  }
  currentDealerIndex=0;
  updateDealerDisplay();
  save(STORAGE_KEYS.PLAYER_NAMES,playerNames);
  save(STORAGE_KEYS.DEALER_IDX,currentDealerIndex);
  speakText(`Iniciando. Embaralhador: ${playerNames[0]}`);
  startTimer();
}
function editTeamNames(){
  const nN=prompt('Nome Equipe 1:',teamNameNos);
  if(nN?.trim()) teamNameNos=nN.trim();
  const nE=prompt('Nome Equipe 2:',teamNameEles);
  if(nE?.trim()) teamNameEles=nE.trim();
  updateTeamNames();
  save(STORAGE_KEYS.TEAM_NOS,teamNameNos);
  save(STORAGE_KEYS.TEAM_ELES,teamNameEles);
}

/* ---------- TEMA ---------- */
function setTheme(t){
  bodyEl.className=t+'-theme';
  themeBtn.textContent=t==='dark'?'☀️':'🌙';
  metaTheme.content=t==='dark'?'#222222':'#f0f0f0';
  currentTheme=t; save(STORAGE_KEYS.THEME,t);
}
const toggleTheme=()=>setTheme(currentTheme==='dark'?'light':'dark');

/* ---------- EVENT LISTENERS ---------- */
function addListeners(){
  // Controles de pontuação
  document.querySelector('.teams').addEventListener('click',ev=>{
    if(ev.target.tagName!=='BUTTON') return;
    const btn=ev.target;
    const team = btn.dataset.team;
    const amt  = parseInt(btn.dataset.amount,10);
    const sp   = btn.dataset.speak || null;
    changeScore(team,amt,sp);

    // efeito visual para -1
    if(btn.classList.contains('remove')){
      btn.classList.add('button-active');
      setTimeout(()=>btn.classList.remove('button-active'),150);
    }
  });

  document.getElementById('next-dealer-btn').onclick = ()=>advanceDealer(true);
  undoBtn.onclick      = undoLastAction;
  document.getElementById('edit-teams-btn').onclick = editTeamNames;
  document.getElementById('reset-game-btn').onclick = ()=>confirm('Reiniciar jogo?')&&prepareNextGame();
  document.getElementById('reset-all-btn').onclick  = ()=>{
    if(!confirm('!!! Zerar TUDO?')) return;
    clearStorage(); location.reload();
  };
  themeBtn.onclick = toggleTheme;
}

/* ---------- INICIALIZAÇÃO ---------- */
function init(){
  // pega elementos
  scoreNosEl = document.getElementById('score-nos');
  scoreElesEl= document.getElementById('score-eles');
  prevNosEl  = document.getElementById('prev-score-nos');
  prevElesEl = document.getElementById('prev-score-eles');
  winsNosEl  = document.getElementById('match-wins-nos');
  winsElesEl = document.getElementById('match-wins-eles');
  dealerNameEl = document.getElementById('current-dealer-name');
  timerEl    = document.getElementById('current-timer-display');
  durationListEl=document.getElementById('duration-history-list');
  undoBtn    = document.getElementById('undo-button');
  teamNosEl  = document.getElementById('team-name-nos');
  teamElesEl = document.getElementById('team-name-eles');
  themeBtn   = document.getElementById('theme-toggle-btn');
  bodyEl     = document.body;
  metaTheme  = document.getElementById('theme-color-meta');

  loadGameState();
  setTheme(currentTheme);

  updateCurrentDisplay();
  updateWinsDisplay();
  updateDealerDisplay();
  updateDurations();
  updateTeamNames();
  undoBtn.disabled=true;

  addListeners();

  if(playerNames.length!==4) setTimeout(getPlayerNames,300);
  else startTimer();
}
document.addEventListener('DOMContentLoaded',init);
