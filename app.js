// --- Variáveis Globais ---
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
let teamNameNos = "Nós";
let teamNameEles = "Eles";
let currentTheme = 'dark';
let wakeLock = null;
let isSoundOn = true;

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_scoreNos', SCORE_ELES: 'truco_scoreEles',
    PREV_SCORE_NOS: 'truco_prevScoreNos', PREV_SCORE_ELES: 'truco_prevScoreEles',
    IS_INITIAL: 'truco_isInitial', MATCHES_NOS: 'truco_matchesNos',
    MATCHES_ELES: 'truco_matchesEles', PLAYER_NAMES: 'truco_playerNames',
    DEALER_INDEX: 'truco_dealerIndex', TEAM_NAME_NOS: 'truco_teamNameNos',
    TEAM_NAME_ELES: 'truco_teamNameEles', DURATION_HISTORY: 'truco_durationHistory',
    THEME: 'truco_theme', SOUND_ON: 'truco_soundOn'
};

// --- Elementos do DOM ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta;

// --- Funções de Armazenamento Local ---
function saveData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error("Erro ao salvar:", key, e); }
}
function loadData(key, defaultValue = null) {
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : defaultValue;
    } catch (e) {
        console.error("Erro ao carregar:", key, e);
        return defaultValue;
    }
}
function saveGameState() {
    Object.keys(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON) {
            const varName = key.split('_')[1];
            const value = window[varName.charAt(0).toLowerCase() + varName.slice(1)];
            if (typeof value !== 'undefined') saveData(key, value);
        }
    });
}
function loadGameSettings() {
    const savedTheme = loadData(STORAGE_KEYS.THEME);
    currentTheme = savedTheme ? savedTheme : 'dark';
    const savedSound = loadData(STORAGE_KEYS.SOUND_ON);
    isSoundOn = savedSound !== null ? savedSound : true;
}
function loadGameData() {
    scoreNos = loadData(STORAGE_KEYS.SCORE_NOS, 0);
    scoreEles = loadData(STORAGE_KEYS.SCORE_ELES, 0);
    prevScoreNos = loadData(STORAGE_KEYS.PREV_SCORE_NOS, 0);
    prevScoreEles = loadData(STORAGE_KEYS.PREV_SCORE_ELES, 0);
    isInitialState = loadData(STORAGE_KEYS.IS_INITIAL, true);
    matchesWonNos = loadData(STORAGE_KEYS.MATCHES_NOS, 0);
    matchesWonEles = loadData(STORAGE_KEYS.MATCHES_ELES, 0);
    playerNames = loadData(STORAGE_KEYS.PLAYER_NAMES, []);
    currentDealerIndex = loadData(STORAGE_KEYS.DEALER_INDEX, 0);
    teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
    teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
    matchDurationHistory = loadData(STORAGE_KEYS.DURATION_HISTORY, []);
}
function clearSavedGameData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON)
            localStorage.removeItem(key);
    });
}

// --- Funções de Display ---
function updateCurrentGameDisplay() {
    if (scoreNosElement) scoreNosElement.textContent = scoreNos;
    if (scoreElesElement) scoreElesElement.textContent = scoreEles;
    if (prevScoreNosElement)
        prevScoreNosElement.textContent = isInitialState ? '-' : prevScoreNos;
    if (prevScoreElesElement)
        prevScoreElesElement.textContent = isInitialState ? '-' : prevScoreEles;
}
function updateMatchWinsDisplay() {
    if (matchWinsNosElement) matchWinsNosElement.textContent = matchesWonNos;
    if (matchWinsElesElement) matchWinsElesElement.textContent = matchesWonEles;
}
function updateDealerDisplay() {
    if (dealerNameElement)
        dealerNameElement.textContent = (playerNames.length === 4)
            ? playerNames[currentDealerIndex]
            : "-- Digite os nomes --";
}
function updateDurationHistoryDisplay() {
    if (!durationHistoryListElement) return;
    durationHistoryListElement.innerHTML = '';
    if (matchDurationHistory.length === 0) {
        durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída.</li>';
        durationHistoryListElement.style.textAlign = 'center';
        durationHistoryListElement.style.color = 'var(--text-color-muted)';
        return;
    }
    durationHistoryListElement.style.textAlign = 'left';
    durationHistoryListElement.style.color = 'var(--text-color-light)';
    for (let i = matchDurationHistory.length - 1; i >= 0; i--) {
        const entry = matchDurationHistory[i];
        const formattedTime = formatTime(entry.duration);
        const listItem = document.createElement('li');
        const textNode = document.createTextNode(`Partida ${i + 1}: ${formattedTime} `);
        listItem.appendChild(textNode);
        const winnerIcon = document.createElement('span');
        winnerIcon.classList.add('winner-icon', entry.winner);
        winnerIcon.textContent = 'V';
        winnerIcon.setAttribute('aria-label',
            `Vencedor: ${entry.winner === 'nos' ? teamNameNos : teamNameEles}`);
        listItem.appendChild(winnerIcon);
        durationHistoryListElement.appendChild(listItem);
    }
}
function updateTeamNameDisplay() {
    if (teamNameNosElement) teamNameNosElement.textContent = teamNameNos;
    if (teamNameElesElement) teamNameElesElement.textContent = teamNameEles;
}
function updateSoundButtonIcon() {
    if (soundToggleButton)
        soundToggleButton.textContent = isSoundOn ? '🔊' : '🔇';
}

// --- Síntese de Voz ---
function speakText(text, cancelPrevious = true) {
    if (!isSoundOn) return;
    if ('speechSynthesis' in window) {
        if (cancelPrevious && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setTimeout(() => {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0;
                u.onerror = (e) => console.error("Erro na síntese de voz:", e);
                window.speechSynthesis.speak(u);
            }, 50);
        } else {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0;
            u.onerror = (e) => console.error("Erro na síntese de voz:", e);
            window.speechSynthesis.speak(u);
        }
    } else console.warn("Síntese de Voz não suportada.");
}

// --- Cronômetro ---
function formatTime(ms) {
    if (ms === null || ms < 0) return "--:--";
    let tS = Math.floor(ms / 1000);
    let h = Math.floor(tS / 3600);
    let m = Math.floor((tS % 3600) / 60);
    let s = tS % 60;
    m = String(m).padStart(2, '0');
    s = String(s).padStart(2, '0');
    return (h > 0)
        ? `${String(h).padStart(2, '0')}:${m}:${s}`
        : `${m}:${s}`;
}
function startTimer() {
    stopTimer();
    gameStartTime = Date.now();
    if (currentTimerElement) currentTimerElement.textContent = "00:00";
    timerIntervalId = setInterval(() => {
        if (gameStartTime && currentTimerElement) {
            const elapsed = Date.now() - gameStartTime;
            currentTimerElement.textContent = formatTime(elapsed);
        } else {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }, 1000);
    requestWakeLock();
}
function stopTimer() {
    let dMs = null;
    if (gameStartTime) dMs = Date.now() - gameStartTime;
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    gameStartTime = null;
    releaseWakeLock();
    return dMs;
}
function resetCurrentTimerDisplay() {
    stopTimer();
    if (currentTimerElement) currentTimerElement.textContent = "00:00";
}

// --- Wake Lock API ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            if (wakeLock === null) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => { wakeLock = null; });
            }
        } catch (err) {
            console.error(`Wake Lock falhou: ${err.name}, ${err.message}`);
            wakeLock = null;
        }
    }
}
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try { await wakeLock.release(); }
        catch (err) { console.error("Erro ao liberar Wake Lock:", err); }
        finally { wakeLock = null; }
    }
}
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') await releaseWakeLock();
    else if (document.visibilityState === 'visible' && gameStartTime)
        await requestWakeLock();
});

// --- Nomes dos Jogadores ---
function getPlayerNames() {
    playerNames = [];
    alert("Vamos definir os jogadores...");
    for (let i = 1; i <= 4; i++) {
        let n = prompt(`Jogador ${i}:`);
        while (!n?.trim()) { alert("Nome inválido..."); n = prompt(`Jogador ${i}:`); }
        playerNames.push(n.trim());
    }
    currentDealerIndex = 0;
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    speakText(`Iniciando. Embaralhador: ${playerNames[0]}`);
    startTimer();
}

// --- Editar Nomes das Equipes ---
function editTeamNames() {
    let nN = prompt("Nome Equipe 1:", teamNameNos);
    if (nN?.trim()) teamNameNos = nN.trim();
    let nE = prompt("Nome Equipe 2:", teamNameEles);
    if (nE?.trim()) teamNameEles = nE.trim();
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();
    speakText("Nomes das equipes atualizados.");
}

// --- Avançar Embaralhador ---
function advanceDealer(speakAnnounce = false) {
    if (playerNames.length !== 4) {
        if (speakAnnounce) alert("Defina os nomes...");
        return false;
    }
    currentDealerIndex = (currentDealerIndex + 1) % 4;
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    if (speakAnnounce) speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true);
    return true;
}

// --- Lógica Principal de Pontuação ---
function changeScore(team, amount, speakPointText = null) {
    // inicia o timer no primeiro ponto
    if (isInitialState && amount > 0) startTimer();

    // valida mudança possível
    let currentScore = (team === 'nos') ? scoreNos : scoreEles;
    if ((amount > 0 && currentScore >= maxScore) ||
        (amount < 0 && currentScore <= 0)) {
        return false;
    }

    // guarda estado para desfazer
    undoState = {
        sN: scoreNos, sE: scoreEles,
        psN: prevScoreNos, psE: prevScoreEles,
        dI: currentDealerIndex, isI: isInitialState
    };

    prevScoreNos = scoreNos;
    prevScoreEles = scoreEles;
    isInitialState = false;
    let winner = null;

    // atualiza placar
    if (team === 'nos') {
        scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount));
        if (scoreNos === maxScore) winner = 'nos';
    } else {
        scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount));
        if (scoreEles === maxScore) winner = 'eles';
    }

    updateCurrentGameDisplay();

    // fala ponto e avança dealer
    if (amount > 0) {
        if (speakPointText) speakText(speakPointText, true);
        const adv = advanceDealer(false);
        if (adv && playerNames.length === 4) {
            setTimeout(() => speakText(
                `Embaralhador: ${playerNames[currentDealerIndex]}`, true
            ), 800);
        }
    }

    if (winner) processMatchEnd(winner);

    saveGameState();
    if (undoButton) undoButton.disabled = false;

    return true;
}

// --- Desfazer ---
function undoLastAction() {
    if (undoState) {
        scoreNos = undoState.sN;
        scoreEles = undoState.sE;
        prevScoreNos = undoState.psN;
        prevScoreEles = undoState.psE;
        currentDealerIndex = undoState.dI;
        isInitialState = undoState.isI;

        updateCurrentGameDisplay();
        updateDealerDisplay();
        saveGameState();

        undoState = null;
        if (undoButton) undoButton.disabled = true;
        speakText("Ação desfeita", true);
    } else {
        speakText("Nada para desfazer", true);
    }
}

// --- Fim de Partida ---
function processMatchEnd(winnerTeam) {
    const durMs = stopTimer();
    if (durMs !== null) {
        matchDurationHistory.push({ duration: durMs, winner: winnerTeam });
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay();
    }
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();

    setTimeout(() => {
        let winnerName = (winnerTeam === 'nos') ? teamNameNos : teamNameEles;
        let durationString = formatTime(durMs);
        if (winnerTeam === 'nos') matchesWonNos++;
        else matchesWonEles++;

        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);

        setTimeout(() => {
            speakText(`${winnerName} ${winnerTeam === 'nos' ? 'ganhamos' : 'ganharam'} a partida`, true);
            alert(`${winnerName} venceu!\nDuração: ${durationString}\nPlacar de partidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`);
            updateMatchWinsDisplay();
            prepareNextGame();
        }, 300);
    }, 850);
}

// --- Prepara Próximo Jogo ---
function prepareNextGame() {
    scoreNos = 0; scoreEles = 0;
    prevScoreNos = 0; prevScoreEles = 0;
    isInitialState = true;
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();
    saveGameState();
    stopTimer();
    if (currentTimerElement) currentTimerElement.textContent = "00:00";
    if (playerNames.length === 4) {
        setTimeout(startTimer, 100);
    }
}

// --- Reset ---
function resetCurrentGame() {
    if (confirm("Reiniciar apenas o jogo atual (0 a 12)?")) {
        undoState = null;
        if (undoButton) undoButton.disabled = true;
        prepareNextGame();
        speakText("Jogo atual reiniciado");
    }
}
function resetAllScores() {
    if (confirm("!!! ZERAR TODO o placar (Partidas, jogo, NOMES, TEMPOS)?")) {
        clearSavedGameData();
        matchesWonNos = 0; matchesWonEles = 0;
        playerNames = []; currentDealerIndex = 0;
        stopTimer(); matchDurationHistory = [];
        teamNameNos = "Nós"; teamNameEles = "Eles";
        undoState = null; if (undoButton) undoButton.disabled = true;
        updateMatchWinsDisplay();
        updateDealerDisplay();
        updateDurationHistoryDisplay();
        resetCurrentTimerDisplay();
        updateTeamNameDisplay();
        getPlayerNames();
        speakText("Placar geral e nomes zerados");
    }
}

// --- Tema ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return;
    bodyElement.className = themeName + '-theme';
    currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName);
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}
function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// --- Som ---
function setSound(soundOn) {
    isSoundOn = soundOn;
    saveData(STORAGE_KEYS.SOUND_ON, isSoundOn);
    updateSoundButtonIcon();
}
function toggleSound() {
    setSound(!isSoundOn);
    if (isSoundOn) speakText("Som ativado", true);
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// --- Listeners ---
function addEventListeners() {
    document.querySelector('.teams').addEventListener('click', event => {
        if (event.target.tagName === 'BUTTON'
            && event.target.dataset.team
            && event.target.dataset.amount) {
            const team = event.target.dataset.team;
            const amount = parseInt(event.target.dataset.amount, 10);
            const speakPointText = event.target.dataset.speak;
            changeScore(team, amount, speakPointText);
        }
    });

    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true));
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('sound-toggle-btn')?.addEventListener('click', toggleSound);
}

// --- Inicialização ---
function initializeApp() {
    scoreNosElement = document.getElementById('score-nos');
    scoreElesElement = document.getElementById('score-eles');
    prevScoreNosElement = document.getElementById('prev-score-nos');
    prevScoreElesElement = document.getElementById('prev-score-eles');
    matchWinsNosElement = document.getElementById('match-wins-nos');
    matchWinsElesElement = document.getElementById('match-wins-eles');
    dealerNameElement = document.getElementById('current-dealer-name');
    currentTimerElement = document.getElementById('current-timer-display');
    durationHistoryListElement = document.getElementById('duration-history-list');
    undoButton = document.getElementById('undo-button');
    teamNameNosElement = document.getElementById('team-name-nos');
    teamNameElesElement = document.getElementById('team-name-eles');
    themeToggleButton = document.getElementById('theme-toggle-btn');
    soundToggleButton = document.getElementById('sound-toggle-btn');
    bodyElement = document.body;
    themeMeta = document.getElementById('theme-color-meta');

    loadGameSettings();
    loadGameData();
    setTheme(currentTheme);
    setSound(isSoundOn);

    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = true;

    addEventListeners();

    if (playerNames.length !== 4) {
        setTimeout(getPlayerNames, 300);
    } else {
        resetCurrentTimerDisplay();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
