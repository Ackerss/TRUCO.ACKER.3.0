// --- VARIÁVEIS GLOBAIS ---
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0;
let isInitialState = true;
const maxScore = 12;
let matchesWonNos = 0, matchesWonEles = 0;
let playerNames = [];
let currentDealerIndex = 0;
let timerIntervalId = null;
let gameStartTime = null;
let matchDurationHistory = [];
let undoState = null;
let teamNameNos = "Nós", teamNameEles = "Eles";
let currentTheme = 'dark', isSoundOn = true;

// --- ELEMENTOS DOM (preenchidos em initializeApp) ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta;

// --------- FUNÇÕES DE VOZ E UTILITÁRIOS ---------
function speakText(text, cancel = true) {
    if (!isSoundOn) return;
    if (!('speechSynthesis' in window)) return;
    if (cancel && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setTimeout(() => speakText(text, false), 50);
        return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    window.speechSynthesis.speak(u);
}
function formatTime(ms) {
    if (!ms) return "00:00";
    const s = Math.floor(ms / 1000);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    const h = Math.floor(s / 3600);
    return h ? `${String(h).padStart(2, '0')}:${m}:${ss}` : `${m}:${ss}`;
}

// --------- CRONÔMETRO ---------
function startTimer() {
    stopTimer();
    gameStartTime = Date.now();
    currentTimerElement.textContent = "00:00";
    timerIntervalId = setInterval(() => {
        currentTimerElement.textContent = formatTime(Date.now() - gameStartTime);
    }, 1000);
}
function stopTimer() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = null;
    const d = gameStartTime ? Date.now() - gameStartTime : null;
    gameStartTime = null;
    return d;
}

// --------- DEALER ---------
function advanceDealer(say = true) {
    if (playerNames.length !== 4) return false;
    currentDealerIndex = (currentDealerIndex + 1) % 4;
    dealerNameElement.textContent = playerNames[currentDealerIndex];
    if (say) speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true);
    return true;
}

// --------- DISPLAY BÁSICO (placar, histórico etc.) ---------
function updateCurrentGameDisplay() {
    scoreNosElement.textContent = scoreNos;
    scoreElesElement.textContent = scoreEles;
    prevScoreNosElement.textContent  = isInitialState ? '-' : prevScoreNos;
    prevScoreElesElement.textContent = isInitialState ? '-' : prevScoreEles;
}
function updateMatchWinsDisplay() {
    matchWinsNosElement.textContent = matchesWonNos;
    matchWinsElesElement.textContent = matchesWonEles;
}
function updateDealerDisplay() {
    dealerNameElement.textContent = (playerNames.length === 4)
        ? playerNames[currentDealerIndex]
        : "-- Digite os nomes --";
}

// --------- PONTUAÇÃO ---------
function changeScore(team, amount, speakPointText = null) {
    // Inicia timer no primeiro ponto
    if (isInitialState && amount > 0) startTimer();

    const cur = (team === 'nos') ? scoreNos : scoreEles;
    if ((amount > 0 && cur >= maxScore) || (amount < 0 && cur <= 0)) return false;

    // Salva para desfazer
    undoState = {
        sN: scoreNos, sE: scoreEles,
        psN: prevScoreNos, psE: prevScoreEles,
        dI: currentDealerIndex, isI: isInitialState
    };

    prevScoreNos = scoreNos;
    prevScoreEles = scoreEles;
    isInitialState = false;

    if (team === 'nos') scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount));
    else               scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount));

    updateCurrentGameDisplay();
    undoButton.disabled = false;            // <-- garante habilitar
    if (amount > 0 && speakPointText) speakText(speakPointText, true);
    if (amount > 0) setTimeout(() => advanceDealer(true), 800);
    return true;
}

// --------- DESFAZER ---------
function undoLastAction() {
    if (!undoState) { speakText("Nada para desfazer", true); return; }
    scoreNos = undoState.sN;  scoreEles = undoState.sE;
    prevScoreNos = undoState.psN; prevScoreEles = undoState.psE;
    currentDealerIndex = undoState.dI; isInitialState = undoState.isI;
    undoState = null;
    updateCurrentGameDisplay();  updateDealerDisplay();
    undoButton.disabled = true;  // <-- desabilita depois
    speakText("Ação desfeita", true);
}

// --------- LISTENERS ---------
function addEventListeners() {
    document.querySelector('.teams').addEventListener('click', e => {
        if (e.target.tagName !== 'BUTTON') return;
        const team  = e.target.dataset.team;
        const amt   = parseInt(e.target.dataset.amount, 10);
        const speak = e.target.dataset.speak || null;
        changeScore(team, amt, speak);
    });
    undoButton.addEventListener('click', undoLastAction);
    document.getElementById('next-dealer-btn')
        .addEventListener('click', () => advanceDealer(true));
    themeToggleButton.addEventListener('click',
        () => bodyElement.classList.toggle('light-theme'));
    soundToggleButton.addEventListener('click', () => {
        isSoundOn = !isSoundOn;
        soundToggleButton.textContent = isSoundOn ? '🔊' : '🔇';
        if (!isSoundOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        if (isSoundOn) speakText("Som ativado", true);
    });
}

// --------- INICIALIZAÇÃO ---------
function initializeApp() {
    // cache de elementos
    scoreNosElement   = document.getElementById('score-nos');
    scoreElesElement  = document.getElementById('score-eles');
    prevScoreNosElement  = document.getElementById('prev-score-nos');
    prevScoreElesElement = document.getElementById('prev-score-eles');
    matchWinsNosElement  = document.getElementById('match-wins-nos');
    matchWinsElesElement = document.getElementById('match-wins-eles');
    dealerNameElement    = document.getElementById('current-dealer-name');
    currentTimerElement  = document.getElementById('current-timer-display');
    durationHistoryListElement = document.getElementById('duration-history-list');
    undoButton          = document.getElementById('undo-button');
    teamNameNosElement  = document.getElementById('team-name-nos');
    teamNameElesElement = document.getElementById('team-name-eles');
    themeToggleButton   = document.getElementById('theme-toggle-btn');
    soundToggleButton   = document.getElementById('sound-toggle-btn');
    bodyElement         = document.body;
    themeMeta           = document.getElementById('theme-color-meta');

    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateDealerDisplay();
    undoButton.disabled = true;

    addEventListeners();
}

document.addEventListener('DOMContentLoaded', initializeApp);
