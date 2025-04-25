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
let matchDurationHistory = []; // [{duration: ms, winner:'nos'|'eles'}]

let undoState = null;
let teamNameNos = 'Nós', teamNameEles = 'Eles';

let currentTheme = 'dark';
let wakeLock     = null;
let isSoundOn    = true;

/* ---------- LOCAL-STORAGE KEYS ---------- */
const STORAGE_KEYS = {
  SCORE_NOS:'t_sNos', SCORE_ELES:'t_sEles',
  PREV_NOS :'t_pNos', PREV_ELES:'t_pEles',
  IS_INITIAL:'t_init',
  MATCHES_NOS:'t_mNos', MATCHES_ELES:'t_mEles',
  PLAYER_NAMES:'t_pNames', DEALER_IDX:'t_dIdx',
  TEAM_NOS:'t_tNos', TEAM_ELES:'t_tEles',
  DUR_HISTORY:'t_dHist',
  THEME:'t_theme'
};

/* ---------- ELEMENTOS DOM (preencher depois) ---------- */
let scoreNosEl, scoreElesEl,  prevNosEl, prevElesEl;
let winsNosEl,  winsElesEl,   dealerNameEl;
let timerEl,    durationListEl, undoBtn;
let teamNosEl,  teamElesEl;
let themeBtn,   bodyEl, metaTheme;

/* ---------- STORAGE UTIL ---------- */
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const load=(k,d=null)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
const clearStorage=()=>Object.values(STORAGE_KEYS).forEach(k=>localStorage.removeItem(k));

function saveGameState(){ /* ...mesmo conteúdo... */ }
/* (demais funções de storage e carregamento permanecem idênticas) */

/* ---------- DISPLAY ---------- */
const updateCurrentDisplay = ()=>{ /* ...mesmo conteúdo... */ };
const updateWinsDisplay    = ()=>{ /* ...mesmo conteúdo... */ };
const updateDealerDisplay  = ()=>{ /* ...mesmo conteúdo... */ };
const updateTeamNames      = ()=>{ /* ...mesmo conteúdo... */ };

/* >>> FUNÇÃO ALTERADA <<< */
const updateDurations = ()=>{
  durationListEl.innerHTML='';
  if (matchDurationHistory.length===0){
    durationListEl.innerHTML='<li>Nenhuma partida concluída.</li>';
    durationListEl.style.textAlign='center';
    return;
  }
  durationListEl.style.textAlign='left';
  matchDurationHistory.slice().reverse().forEach((item,idx)=>{
    const li=document.createElement('li');
    li.textContent=`Partida ${matchDurationHistory.length-idx}: ${formatTime(item.duration)}`;

    // Span "V" colorido e alinhado à direita
    const v=document.createElement('span');
    v.textContent='V';
    v.style.float='right';
    v.style.fontWeight='700';
    v.style.marginLeft='6px';
    v.style.color=(item.winner==='nos') ? 'var(--accent-nos)' : 'var(--accent-eles)';
    li.appendChild(v);

    durationListEl.appendChild(li);
  });
};

/* ---------- FALA, TIMER, WAKE-LOCK etc. permanecem iguais ---------- */
/* (TODO: todo o restante do arquivo já fornecido na versão anterior – nada mudou) */

/* ---------- INICIALIZAÇÃO ---------- */
function init(){
  /* ...mesmo bloco de inicialização... */
}
document.addEventListener('DOMContentLoaded',init);
