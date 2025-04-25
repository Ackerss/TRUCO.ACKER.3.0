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
            // Constrói dinamicamente o nome da variável global a partir da chave
            const baseVarName = key.replace('truco_', ''); // Remove 'truco_'
            // Converte para camelCase (ex: SCORE_NOS -> scoreNos)
            const varName = baseVarName.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

            // Acessa a variável global correspondente e salva
            if (typeof window[varName] !== 'undefined') {
                saveData(key, window[varName]);
            } else {
                // Tenta lidar com nomes que não seguem o padrão direto (ex: IS_INITIAL -> isInitialState)
                // Adicione mapeamentos específicos se necessário, mas o padrão acima cobre a maioria.
                if (key === STORAGE_KEYS.IS_INITIAL) saveData(key, window.isInitialState);
                // Adicione outros casos especiais se houver.
            }
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
        listItem.textContent = `Partida ${i + 1}: ${formattedTime} `;
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
            // Pequeno delay para garantir que o cancelamento processe antes da nova fala
            setTimeout(() => {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0;
                window.speechSynthesis.speak(u);
            }, 50);
        } else {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0;
            window.speechSynthesis.speak(u);
        }
    }
}

// --- Cronômetro ---
function formatTime(ms) {
    if (ms === null || ms < 0) return "--:--";
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    return (hours > 0)
        ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`
        : `${minutes}:${seconds}`;
}
function startTimer() {
    stopTimer(); // Garante que qualquer timer anterior seja limpo
    gameStartTime = Date.now();
    if (currentTimerElement) currentTimerElement.textContent = "00:00"; // Reseta display
    timerIntervalId = setInterval(() => {
        if (gameStartTime && currentTimerElement) {
            const elapsed = Date.now() - gameStartTime;
            currentTimerElement.textContent = formatTime(elapsed);
        } else {
            // Se gameStartTime for null, para o intervalo (deveria ter sido parado por stopTimer)
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }, 1000); // Atualiza a cada segundo
    requestWakeLock(); // Tenta manter a tela acesa
}
function stopTimer() {
    let durationMs = null;
    if (gameStartTime) {
        durationMs = Date.now() - gameStartTime; // Calcula duração
    }
    if (timerIntervalId) {
        clearInterval(timerIntervalId); // Para o intervalo
        timerIntervalId = null;
    }
    gameStartTime = null; // Reseta a hora de início
    releaseWakeLock(); // Libera o bloqueio de tela
    return durationMs; // Retorna a duração calculada
}
function resetCurrentTimerDisplay() {
    stopTimer(); // Para o timer e reseta variáveis relacionadas
    if (currentTimerElement) currentTimerElement.textContent = "00:00"; // Reseta display
}

// --- Wake Lock API ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            if (wakeLock === null) { // Só pede se não tiver um ativo
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => { wakeLock = null; }); // Limpa a variável se for liberado
                // console.log('Wake Lock ativado.');
            }
        } catch (err) {
            console.error(`Wake Lock falhou: ${err.name}, ${err.message}`);
            wakeLock = null; // Garante que está null se falhar
        }
    }
}
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try { await wakeLock.release(); /* console.log('Wake Lock liberado.'); */ }
        catch { /* Ignora erros na liberação */ }
        finally { wakeLock = null; } // Garante que está null depois de tentar liberar
    }
}
// Lida com a visibilidade da aba/app
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await releaseWakeLock(); // Libera se ficar oculto
    } else if (document.visibilityState === 'visible' && gameStartTime) {
        // Se voltar a ficar visível e um jogo estava em andamento, tenta reativar
        await requestWakeLock();
    }
});

// --- Nomes dos Jogadores ---
function getPlayerNames() {
    playerNames = []; // Limpa array
    alert("Vamos definir os jogadores para o rodízio do embaralhador...");
    for (let i = 1; i <= 4; i++) {
        let playerName = prompt(`Nome do Jogador ${i}:`);
        while (!playerName?.trim()) { // Loop até ter um nome válido
            alert("Nome inválido. Por favor, digite um nome.");
            playerName = prompt(`Nome do Jogador ${i}:`);
        }
        playerNames.push(playerName.trim()); // Adiciona nome sem espaços extras
    }
    currentDealerIndex = 0; // Começa com o primeiro jogador
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay(); // Atualiza o nome na tela
    speakText(`Iniciando novo jogo. O primeiro a embaralhar é ${playerNames[0]}`);
    startTimer(); // Inicia o cronômetro do jogo
}

// --- Editar Nomes das Equipes ---
function editTeamNames() {
    let newNameNos = prompt("Novo nome para a Equipe 1:", teamNameNos);
    if (newNameNos?.trim()) { // Só atualiza se não for vazio/nulo
        teamNameNos = newNameNos.trim();
    }
    let newNameEles = prompt("Novo nome para a Equipe 2:", teamNameEles);
    if (newNameEles?.trim()) { // Só atualiza se não for vazio/nulo
        teamNameEles = newNameEles.trim();
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay(); // Atualiza os nomes na tela
    updateDurationHistoryDisplay(); // Atualiza histórico que pode conter nomes
    speakText("Nomes das equipes atualizados.");
}

// --- Avançar Embaralhador ---
function advanceDealer(speakAnnounce = false) {
    if (playerNames.length !== 4) {
        if (speakAnnounce) { // Só avisa se foi uma ação manual
            alert("Defina os 4 nomes dos jogadores primeiro para usar o rodízio.");
        }
        return false; // Não avança se não tem 4 jogadores
    }
    currentDealerIndex = (currentDealerIndex + 1) % 4; // Avança e volta pro 0 (circular)
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); // Salva o novo índice
    updateDealerDisplay(); // Atualiza nome na tela
    if (speakAnnounce) { // Se for ação manual, anuncia imediatamente
        speakText(`Próximo a embaralhar: ${playerNames[currentDealerIndex]}`, true);
    }
    return true; // Indica que avançou
}


// --- Lógica Principal de Pontuação (COM A CORREÇÃO DO BOTÃO DESFAZER) ---
function changeScore(team, amount, speakPointText = null) {
    // Se for a primeira pontuação do jogo, inicia o cronômetro
    if (isInitialState && amount > 0) startTimer();

    let currentScore = team === 'nos' ? scoreNos : scoreEles;
    // Verifica se a pontuação pode ser alterada (não ultrapassa 12 nem fica abaixo de 0)
    if ((amount > 0 && currentScore >= maxScore) || (amount < 0 && currentScore <= 0)) {
         // Opcional: Avisar que a pontuação não pode ser alterada
         return false; // Pontuação não pode mudar, não faz nada, mantém estado do botão desfazer.
    }

    // A pontuação PODE mudar. Salva o estado atual para um possível Desfazer.
    undoState = {
        sN: scoreNos, sE: scoreEles,         // Salva placares atuais
        psN: prevScoreNos, psE: prevScoreEles, // Salva placares anteriores
        dI: currentDealerIndex,             // Salva índice do embaralhador
        isI: isInitialState                 // Salva se era o estado inicial
    };
    // --- Habilita o botão Desfazer AQUI, pois uma ação válida está prestes a ocorrer ---
    if (undoButton) undoButton.disabled = false;

    // Atualiza os placares anteriores ANTES de mudar os placares atuais
    prevScoreNos = scoreNos;
    prevScoreEles = scoreEles;
    isInitialState = false; // Marca que uma ação já foi feita neste jogo
    let winner = null;      // Variável para verificar se houve vencedor

    // Aplica a mudança de pontuação
    if (team === 'nos') {
        scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount)); // Garante entre 0 e 12
        if (scoreNos === maxScore) winner = 'nos'; // Verifica vitória
    } else {
        scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount)); // Garante entre 0 e 12
        if (scoreEles === maxScore) winner = 'eles'; // Verifica vitória
    }

    // Atualiza a exibição do placar na tela
    updateCurrentGameDisplay();

    // Gira o embaralhador e anuncia por voz apenas se pontos foram ADICIONADOS
    if (amount > 0) {
        if (speakPointText) speakText(speakPointText, true); // Fala a pontuação (ex: "Truco!")
        const dealerAdvanced = advanceDealer(false); // Avança o embaralhador sem anunciar agora
        if (dealerAdvanced && playerNames.length === 4) {
            // Adiciona um pequeno atraso para anunciar o novo embaralhador, evitando sobreposição de falas
            setTimeout(() => speakText(
                `Embaralhador: ${playerNames[currentDealerIndex]}`, true
            ), 800); // Ajuste o tempo (ms) se necessário
        }
    } else if (amount < 0) { // Se removeu ponto, só atualiza o display (sem falar ou girar dealer)
        // Opcional: Falar algo ao remover pontos?
        // speakText("Ponto removido.", true);
    }

    // --- Verifica se houve vencedor DEPOIS da atualização do placar ---
    if (winner) {
        // O jogo acabou, processa o fim da partida (que vai desabilitar o botão Desfazer)
        processMatchEnd(winner);
        // Como o jogo acabou, o estado não precisa ser salvo aqui;
        // processMatchEnd cuida da lógica pós-vitória (zerar placar atual, etc.)
    } else {
        // O jogo continua, salva o novo estado no localStorage
        saveGameState();
    }

    // Retorna true para indicar que a pontuação foi (potencialmente) alterada
    return true;
}


// --- Desfazer ---
function undoLastAction() {
    if (undoState) { // Verifica se há um estado salvo para desfazer
        // Restaura todas as variáveis do estado salvo
        scoreNos = undoState.sN;
        scoreEles = undoState.sE;
        prevScoreNos = undoState.psN;
        prevScoreEles = undoState.psE;
        currentDealerIndex = undoState.dI;
        isInitialState = undoState.isI;

        // Atualiza a exibição na tela
        updateCurrentGameDisplay();
        updateDealerDisplay();
        // Salva o estado restaurado no localStorage
        saveGameState();

        // Limpa o estado de desfazer e desabilita o botão
        undoState = null;
        if (undoButton) undoButton.disabled = true;
        speakText("Última ação desfeita", true);
    } else {
        // Avisa se não há nada para desfazer
        speakText("Nada para desfazer", true);
        if (undoButton) undoButton.disabled = true; // Garante que está desabilitado
    }
}

// --- Fim de Partida ---
function processMatchEnd(winnerTeam) {
    const durationMs = stopTimer(); // Para o cronômetro e pega a duração
    if (durationMs !== null) {
        // Adiciona ao histórico de duração
        matchDurationHistory.push({ duration: durationMs, winner: winnerTeam });
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay(); // Atualiza a lista na tela
    }
    // Limpa o estado de desfazer e desabilita o botão, pois a partida acabou
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    // Atualiza o display final (mostrando 12 pontos)
    updateCurrentGameDisplay();

    // Atraso para permitir que o usuário veja o placar final antes do alerta/som
    setTimeout(() => {
        const winnerName = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
        // Incrementa as partidas ganhas
        if (winnerTeam === 'nos') matchesWonNos++;
        else matchesWonEles++;
        // Salva as partidas ganhas
        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);

        // Pequeno atraso antes do alerta para o som de vitória tocar primeiro
        setTimeout(() => {
            speakText(`${winnerName} ${winnerTeam === 'nos' ? 'ganhou' : 'ganharam'} a partida!`, true);
            alert(`${winnerName} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de partidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`);
            updateMatchWinsDisplay(); // Atualiza placar de partidas ganhas
            prepareNextGame(); // Prepara tudo para o próximo jogo
        }, 300); // Atraso antes do alerta
    }, 850); // Atraso após a pontuação final
}

// --- Prepara Próximo Jogo ---
function prepareNextGame() {
    // Zera placares do jogo atual
    scoreNos = 0; scoreEles = 0;
    prevScoreNos = 0; prevScoreEles = 0;
    isInitialState = true; // Marca como início de jogo
    // Limpa estado de desfazer e desabilita o botão
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    // Atualiza display do jogo atual (mostrando 0 a 0)
    updateCurrentGameDisplay();
    // Salva o estado zerado do jogo atual
    saveGameState();
    // Para o cronômetro e reseta o display de tempo
    stopTimer();
    if (currentTimerElement) currentTimerElement.textContent = "00:00";
    // Se os jogadores estão definidos, inicia o timer para o novo jogo automaticamente
    if (playerNames.length === 4) {
        setTimeout(startTimer, 100); // Pequeno delay para iniciar o timer
    }
}

// --- Reset ---
function resetCurrentGame() {
    if (confirm("Tem certeza que deseja reiniciar apenas o jogo atual (placar de 0 a 12)?")) {
        // Limpa estado de desfazer e desabilita botão
        undoState = null;
        if (undoButton) undoButton.disabled = true;
        // Zera placares e prepara para novo jogo (sem alterar partidas ganhas ou dealer)
        prepareNextGame();
        speakText("Jogo atual reiniciado.");
    }
}
function resetAllScores() {
    if (confirm("!!! ATENÇÃO !!!\n\nTem certeza que deseja ZERAR TODO o placar?\n\nIsso inclui:\n- Partidas ganhas\n- Jogo atual\n- Nomes dos jogadores\n- Histórico de tempos\n\nEsta ação não pode ser desfeita.")) {
        clearSavedGameData(); // Limpa tudo do localStorage (exceto tema/som)
        // Zera todas as variáveis de estado
        matchesWonNos = 0; matchesWonEles = 0;
        playerNames = []; currentDealerIndex = 0;
        stopTimer(); matchDurationHistory = [];
        teamNameNos = "Nós"; teamNameEles = "Eles"; // Volta nomes padrão
        // Limpa estado de desfazer e desabilita botão
        undoState = null;
        if (undoButton) undoButton.disabled = true;
        // Atualiza todos os displays relevantes
        updateMatchWinsDisplay();
        updateDealerDisplay();
        updateDurationHistoryDisplay();
        resetCurrentTimerDisplay();
        updateTeamNameDisplay();
        prepareNextGame(); // Zera o placar atual
        // Pede novamente os nomes dos jogadores
        getPlayerNames();
        speakText("Placar geral, nomes e histórico zerados. Começando de novo!");
    }
}

// --- Tema ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return; // Segurança
    bodyElement.className = themeName + '-theme'; // Aplica classe ao body
    currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName); // Salva preferência
    // Atualiza ícone do botão e cor da barra de status do navegador
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}
function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark'); // Alterna
}

// --- Som ---
function setSound(soundOn) {
    isSoundOn = soundOn;
    saveData(STORAGE_KEYS.SOUND_ON, isSoundOn); // Salva preferência
    updateSoundButtonIcon(); // Atualiza ícone
}
function toggleSound() {
    setSound(!isSoundOn); // Alterna
    if (isSoundOn) {
        speakText("Som ativado.", true); // Anuncia ativação
    } else {
        // Se desligou, cancela qualquer fala em andamento
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
}

// --- Listeners ---
function addEventListeners() {
    // Delegação de eventos para botões de pontuação (+1, -1, +3, +6...)
    document.querySelector('.teams').addEventListener('click', event => {
        const button = event.target.closest('button'); // Acha o botão clicado
        if (button && button.dataset.team && button.dataset.amount) { // Verifica se é botão de ponto
            const team = button.dataset.team;
            const amount = parseInt(button.dataset.amount, 10);
            const speakPointText = button.dataset.speak; // Pega texto para falar (se houver)
            changeScore(team, amount, speakPointText); // Chama função principal
        }
    });

    // Listeners para os outros botões
    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true)); // Avançar dealer manual
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('sound-toggle-btn')?.addEventListener('click', toggleSound);
}

// --- Inicialização ---
function initializeApp() {
    // Pega referências para os elementos do DOM uma vez
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

    // Carrega configurações e dados salvos
    loadGameSettings();
    loadGameData();
    // Aplica tema e estado do som carregados
    setTheme(currentTheme);
    setSound(isSoundOn);

    // Atualiza todos os displays com os dados carregados
    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    // Garante que o botão Desfazer comece desabilitado (a menos que haja estado de undo salvo - o que não deveria acontecer ao carregar)
    if (undoButton) undoButton.disabled = (undoState === null);

    // Adiciona os listeners aos botões
    addEventListeners();

    // Verifica se os nomes dos jogadores precisam ser definidos
    if (playerNames.length !== 4) {
        // Atraso para permitir que a página carregue completamente antes do prompt
        setTimeout(getPlayerNames, 300);
    } else {
        // Se já tem jogadores, apenas reseta o display do timer (sem iniciar)
        resetCurrentTimerDisplay();
        // O timer só começará na primeira pontuação > 0
    }
}

// Inicia tudo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);