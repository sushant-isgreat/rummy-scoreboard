/**
 * Rummy Scoreboard - Mobile-First UI Controller
 * Features:
 * - Dynamic 2 to 6 Player setup (quick chips & dynamic list)
 * - Scoreboard Grid with sticky headers & sticky round column
 * - Quick Score Type Selection:
 *     - Win (0 pts)
 *     - Drop (25 pts)
 *     - Middle Drop (40 pts)
 *     - Full Count (80 pts)
 *     - Custom Points (0 - 80)
 * - Strict 80 max score per round rejection
 * - Round validation (cannot end round if scores are pending)
 * - Running total score displayed after each round
 * - 250 Points Elimination Rule (OUT badge, auto-skip eliminated players)
 * - Game Management:
 *     - Save current game (localStorage)
 *     - Rename current game (or saved games)
 *     - Create a new game with confirmation
 *     - Saved Games Manager (resume, rename, delete)
 */

// Elimination Threshold & Round Score Limits
const ELIMINATION_SCORE = 250;
const THRESHOLD_NO_MID_DROP = 210; // Non-middle drop situation: more than or equal to 210 (Yellow warning)
const THRESHOLD_NO_DROP = 225;     // Non-drop situation: more than or equal to 225 (Red danger)
const MAX_ROUND_SCORE = 80;
const DROP_SCORE = 25;
const MID_DROP_SCORE = 40;
const STORAGE_KEY = 'rummy_saved_games';

// Playing card suits & avatar styles
const AVATAR_SUITS = ['♠', '♥', '♦', '♣', '★', '♛'];

const SCORE_TYPE_LABELS = {
  win: 'WIN (0)',
  drop: 'DROP',
  mid_drop: 'MID DROP',
  full_count: 'FULL 80',
  custom: 'PTS'
};

// Application State
let players = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
let currentRoundCount = 0;
let currentGameId = null;
let currentGameName = 'Rummy Game #1';
let targetRenameGameId = null;
let playerReentries = {}; // { [pIndex]: { round, score } }
let manualDealerOffset = 0;
let gameVictoryDeclared = false;
let currentRunningTotals = [0, 0, 0, 0];
let currentEliminatedState = [false, false, false, false];

let activeScoreTarget = {
  round: null,
  playerIndex: null,
  buttonElement: null
};

// DOM Elements - Home Screen
const screenHome = document.getElementById('screen-home');
const screenScoreboard = document.getElementById('screen-scoreboard');
const playerInputsContainer = document.getElementById('player-inputs-container');
const btnAddPlayer = document.getElementById('btn-add-player');
const btnStartGame = document.getElementById('btn-start-game');
const playerCountBadge = document.getElementById('player-count-badge');
const countChips = document.querySelectorAll('.count-chip');
const btnOpenSavedHome = document.getElementById('btn-open-saved-home');
const savedGamesCountBadge = document.getElementById('saved-games-count-badge');

// DOM Elements - Scoreboard Screen Header
const btnBackSetup = document.getElementById('btn-back-setup');
const scoreboardGameTitle = document.getElementById('scoreboard-game-title');
const gameTitleTrigger = document.getElementById('game-title-trigger');
const btnSaveGame = document.getElementById('btn-save-game');
const btnSavedGames = document.getElementById('btn-saved-games');
const btnNewGame = document.getElementById('btn-new-game');
const scoreboardPlayerSummary = document.getElementById('scoreboard-player-summary');
const scoreboardThead = document.getElementById('scoreboard-thead');
const scoreboardTbody = document.getElementById('scoreboard-tbody');
const fabAddRound = document.getElementById('fab-add-round');
const tableScrollArea = document.getElementById('table-scroll-area');

// DOM Elements - Score Modal (Bottom Sheet)
const scoreModalBackdrop = document.getElementById('score-modal-backdrop');
const modalPlayerAvatar = document.getElementById('modal-player-avatar');
const modalPlayerName = document.getElementById('modal-player-name');
const modalRoundTag = document.getElementById('modal-round-tag');
const modalPlayerTotalBadge = document.getElementById('modal-player-total-badge');
const modalWarningBanner = document.getElementById('modal-warning-banner');
const modalWarningIcon = document.getElementById('modal-warning-icon');
const modalWarningText = document.getElementById('modal-warning-text');
const cardDescWin = document.getElementById('card-desc-win');
const cardDescDrop = document.getElementById('card-desc-drop');
const cardDescMidDrop = document.getElementById('card-desc-mid-drop');
const cardDescFullCount = document.getElementById('card-desc-full-count');
const modalCloseBtn = document.getElementById('modal-close-btn');
const scoreTypeCards = document.querySelectorAll('.score-type-card');
const customScoreForm = document.getElementById('custom-score-form');
const customScoreInput = document.getElementById('custom-score-input');
const btnClearScore = document.getElementById('btn-clear-score');

// DOM Elements - Rename Modal
const modalRenameBackdrop = document.getElementById('modal-rename-backdrop');
const formRenameGame = document.getElementById('form-rename-game');
const inputGameName = document.getElementById('input-game-name');
const btnCancelRename = document.getElementById('btn-cancel-rename');
const btnCloseRenameModal = document.getElementById('btn-close-rename-modal');

// DOM Elements - Saved Games Modal
const modalSavedGamesBackdrop = document.getElementById('modal-saved-games-backdrop');
const savedGamesList = document.getElementById('saved-games-list');
const btnCloseSavedModal = document.getElementById('btn-close-saved-modal');
const btnStartNewFromSaved = document.getElementById('btn-start-new-from-saved');

// DOM Elements - Confirm New Game Modal
const modalConfirmNewBackdrop = document.getElementById('modal-confirm-new-backdrop');
const btnConfirmNewGame = document.getElementById('btn-confirm-new-game');
const btnCancelNewGame = document.getElementById('btn-cancel-new-game');
const btnCloseConfirmModal = document.getElementById('btn-close-confirm-modal');

// DOM Elements - Batch Score Modal (Score All at Once)
const modalBatchScoreBackdrop = document.getElementById('modal-batch-score-backdrop');
const batchModalTitle = document.getElementById('batch-modal-title');
const batchModalRoundTag = document.getElementById('batch-modal-round-tag');
const batchModalSubtitle = document.getElementById('batch-modal-subtitle');
const btnCloseBatchModal = document.getElementById('btn-close-batch-modal');
const batchStatusCounter = document.getElementById('batch-status-counter');
const btnBatchFillDrops = document.getElementById('btn-batch-fill-drops');
const batchPlayersContainer = document.getElementById('batch-players-container');
const btnCancelBatch = document.getElementById('btn-cancel-batch');
const btnSaveBatchScores = document.getElementById('btn-save-batch-scores');
const btnBatchRoundHeader = document.getElementById('btn-batch-round-header');
const fabScoreAll = document.getElementById('fab-score-all');

// DOM Elements - Feature 1: Undo Round Modal & Dealer
const btnUndoRound = document.getElementById('btn-undo-round');
const modalConfirmUndoBackdrop = document.getElementById('modal-confirm-undo-backdrop');
const undoModalTitle = document.getElementById('undo-modal-title');
const undoModalDesc = document.getElementById('undo-modal-desc');
const btnCancelUndo = document.getElementById('btn-cancel-undo');
const btnConfirmUndo = document.getElementById('btn-confirm-undo');
const btnCloseUndoModal = document.getElementById('btn-close-undo-modal');

// DOM Elements - Feature 1: Re-join Modal
const modalRejoinBackdrop = document.getElementById('modal-rejoin-backdrop');
const rejoinPlayerAvatar = document.getElementById('rejoin-player-avatar');
const rejoinModalTitle = document.getElementById('rejoin-modal-title');
const rejoinSummaryBox = document.getElementById('rejoin-summary-box');
const rejoinModalDesc = document.getElementById('rejoin-modal-desc');
const btnCancelRejoin = document.getElementById('btn-cancel-rejoin');
const btnConfirmRejoin = document.getElementById('btn-confirm-rejoin');
const btnCloseRejoinModal = document.getElementById('btn-close-rejoin-modal');

// DOM Elements - Feature 2: Victory Celebration Modal & Confetti
const modalVictoryBackdrop = document.getElementById('modal-victory-backdrop');
const confettiCanvas = document.getElementById('confetti-canvas');
const victoryModalTitle = document.getElementById('victory-modal-title');
const victoryModalSubtitle = document.getElementById('victory-modal-subtitle');
const victoryWinnerCard = document.getElementById('victory-winner-card');
const victoryPodiumsWrap = document.getElementById('victory-podiums-wrap');
const btnShareVictory = document.getElementById('btn-share-victory');
const btnViewStatsFromVictory = document.getElementById('btn-view-stats-from-victory');
const btnCloseVictory = document.getElementById('btn-close-victory');

// DOM Elements - Feature 3: Game Stats Modal
const btnGameStats = document.getElementById('btn-game-stats');
const modalStatsBackdrop = document.getElementById('modal-stats-backdrop');
const statsModalTitle = document.getElementById('stats-modal-title');
const statsModalSubtitle = document.getElementById('stats-modal-subtitle');
const statsHighlightsGrid = document.getElementById('stats-highlights-grid');
const statsPlayersList = document.getElementById('stats-players-list');
const btnShareStats = document.getElementById('btn-share-stats');
const btnCloseStatsModal = document.getElementById('btn-close-stats-modal');

// DOM Elements - Validation Toast
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
let toastTimeout = null;

// ==========================================
// TOAST NOTIFICATION CONTROLLER
// ==========================================

function showValidationToast(message) {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastMessage.textContent = message;
  toastNotification.classList.add('show');
  toastTimeout = setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 4000);
}

// ==========================================
// LOCAL STORAGE & GAME MANAGEMENT
// ==========================================

function getSavedGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading saved games', e);
    return [];
  }
}

function updateSavedGamesBadge() {
  const games = getSavedGames();
  if (savedGamesCountBadge) {
    savedGamesCountBadge.textContent = games.length;
  }
}

function saveCurrentGame(showToast = false) {
  if (!currentGameId) {
    currentGameId = 'game_' + Date.now();
  }

  // Collect rounds data
  const roundsData = [];
  for (let r = 1; r <= currentRoundCount; r++) {
    const row = document.getElementById(`round-row-${r}`);
    if (!row) continue;

    const roundScores = [];
    players.forEach((_, pIndex) => {
      const btn = row.querySelector(`.score-cell-btn[data-player-index="${pIndex}"]`);
      if (btn) {
        roundScores.push({
          score: btn.dataset.score !== undefined && btn.dataset.score !== '' ? parseInt(btn.dataset.score, 10) : null,
          type: btn.dataset.type || null,
          isOut: btn.dataset.isOut === 'true'
        });
      } else {
        roundScores.push({ score: null, type: null, isOut: false });
      }
    });

    roundsData.push({
      roundNumber: r,
      scores: roundScores
    });
  }

  const gameObj = {
    id: currentGameId,
    name: currentGameName,
    updatedAt: new Date().toISOString(),
    players: [...players],
    currentRoundCount,
    rounds: roundsData,
    playerReentries: { ...playerReentries },
    manualDealerOffset,
    gameVictoryDeclared
  };

  const games = getSavedGames();
  const existingIndex = games.findIndex(g => g.id === currentGameId);

  if (existingIndex >= 0) {
    games[existingIndex] = gameObj;
  } else {
    games.unshift(gameObj);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    updateSavedGamesBadge();
    if (showToast) {
      showValidationToast(`Game "${currentGameName}" saved successfully! ✓`);
    }
  } catch (e) {
    console.error('Error saving game', e);
    showValidationToast('Failed to save game to local storage.');
  }
}

function openRenameModal(gameId = null) {
  targetRenameGameId = gameId || currentGameId;

  if (targetRenameGameId === currentGameId) {
    inputGameName.value = currentGameName;
  } else {
    const games = getSavedGames();
    const g = games.find(item => item.id === targetRenameGameId);
    inputGameName.value = g ? g.name : '';
  }

  modalRenameBackdrop.classList.add('open');
  modalRenameBackdrop.setAttribute('aria-hidden', 'false');
  setTimeout(() => inputGameName.focus(), 100);
}

function closeRenameModal() {
  modalRenameBackdrop.classList.remove('open');
  modalRenameBackdrop.setAttribute('aria-hidden', 'true');
  targetRenameGameId = null;
}

function executeRenameGame(newName) {
  const cleanName = newName.trim() || 'Rummy Game';

  if (!targetRenameGameId || targetRenameGameId === currentGameId) {
    currentGameName = cleanName;
    scoreboardGameTitle.textContent = cleanName;
    saveCurrentGame(false);
    showValidationToast(`Game renamed to "${cleanName}"`);
  } else {
    const games = getSavedGames();
    const g = games.find(item => item.id === targetRenameGameId);
    if (g) {
      g.name = cleanName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
      renderSavedGamesList();
      showValidationToast(`Saved match renamed to "${cleanName}"`);
    }
  }

  closeRenameModal();
}

function openSavedGamesModal() {
  renderSavedGamesList();
  modalSavedGamesBackdrop.classList.add('open');
  modalSavedGamesBackdrop.setAttribute('aria-hidden', 'false');
}

function closeSavedGamesModal() {
  modalSavedGamesBackdrop.classList.remove('open');
  modalSavedGamesBackdrop.setAttribute('aria-hidden', 'true');
}

function renderSavedGamesList() {
  const games = getSavedGames();
  savedGamesList.innerHTML = '';

  if (games.length === 0) {
    savedGamesList.innerHTML = `
      <div class="saved-games-empty">
        <div class="empty-icon">🂡</div>
        <p><strong>No saved games found</strong></p>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Start a game to save and resume rounds anytime.</p>
      </div>
    `;
    return;
  }

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'saved-game-card';

    const isCurrent = game.id === currentGameId;
    const dateFormatted = new Date(game.updatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    card.innerHTML = `
      <div class="saved-card-header">
        <div>
          <h4 class="saved-card-title">${game.name}</h4>
          <span class="saved-card-time">${dateFormatted}</span>
        </div>
        ${isCurrent ? `<span class="saved-card-active-tag">Active</span>` : ''}
      </div>
      <div class="saved-card-details">
        <span class="saved-detail-pill players-pill">${game.players.length} Players</span>
        <span class="saved-detail-pill">${game.currentRoundCount} ${game.currentRoundCount === 1 ? 'Round' : 'Rounds'}</span>
        <span class="saved-detail-pill" style="font-size: 0.7rem; color: var(--text-muted);">${game.players.join(', ')}</span>
      </div>
      <div class="saved-card-actions">
        <button type="button" class="btn-resume-game" data-id="${game.id}">
          ${isCurrent ? 'Continue Game' : 'Resume Game'}
        </button>
        <button type="button" class="btn-rename-saved" data-id="${game.id}" title="Rename Game">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button type="button" class="btn-delete-saved" data-id="${game.id}" title="Delete Game">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Event Listeners for card buttons
    card.querySelector('.btn-resume-game').addEventListener('click', () => {
      loadSavedGame(game.id);
    });

    card.querySelector('.btn-rename-saved').addEventListener('click', () => {
      openRenameModal(game.id);
    });

    card.querySelector('.btn-delete-saved').addEventListener('click', () => {
      deleteSavedGame(game.id);
    });

    savedGamesList.appendChild(card);
  });
}

function loadSavedGame(gameId) {
  const games = getSavedGames();
  const game = games.find(g => g.id === gameId);
  if (!game) {
    showValidationToast('Could not load game.');
    return;
  }

  currentGameId = game.id;
  currentGameName = game.name;
  players = [...game.players];
  scoreboardGameTitle.textContent = currentGameName;
  playerReentries = game.playerReentries || {};
  manualDealerOffset = game.manualDealerOffset || 0;
  gameVictoryDeclared = game.gameVictoryDeclared || false;

  // Sync Home screen inputs
  renderPlayerInputs();

  // Setup scoreboard
  buildScoreboardHeader();
  scoreboardTbody.innerHTML = '';
  currentRoundCount = 0;

  // Restore rounds
  if (game.rounds && game.rounds.length > 0) {
    game.rounds.forEach(rData => {
      currentRoundCount += 1;
      const row = document.createElement('tr');
      row.className = 'new-round-row';
      row.id = `round-row-${currentRoundCount}`;

      const tdRound = document.createElement('td');
      tdRound.className = 'cell-round';
      const roundBadgeBtn = document.createElement('button');
      roundBadgeBtn.type = 'button';
      roundBadgeBtn.className = 'round-badge-btn';
      roundBadgeBtn.title = `Score all players for Round ${rData.roundNumber}`;
      roundBadgeBtn.setAttribute('aria-label', `Score all players for Round ${rData.roundNumber}`);
      roundBadgeBtn.innerHTML = `<span class="round-badge">R${rData.roundNumber}</span>`;
      roundBadgeBtn.addEventListener('click', () => {
        openBatchScoreModal(rData.roundNumber);
      });
      tdRound.appendChild(roundBadgeBtn);
      row.appendChild(tdRound);

      players.forEach((_, pIndex) => {
        const td = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'score-cell-wrap';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'score-cell-btn';
        btn.setAttribute('aria-label', `Enter score for ${players[pIndex]} in Round ${currentRoundCount}`);
        btn.dataset.round = currentRoundCount;
        btn.dataset.playerIndex = pIndex;

        const cellSaved = rData.scores && rData.scores[pIndex];
        if (cellSaved && cellSaved.score !== null && cellSaved.score !== undefined) {
          btn.dataset.score = cellSaved.score;
          btn.dataset.type = cellSaved.type || 'custom';
        }

        btn.innerHTML = `<span class="cell-val empty">—</span>`;

        btn.addEventListener('click', () => {
          btn.classList.remove('cell-missing');
          openScoreModal(rData.roundNumber, pIndex, btn);
        });

        wrap.appendChild(btn);
        td.appendChild(wrap);
        row.appendChild(td);
      });

      scoreboardTbody.appendChild(row);
    });
  } else {
    addNewRoundRow();
  }

  // Recalculate totals and elimination states
  recalculateAllScores();

  // Switch to scoreboard screen
  closeSavedGamesModal();
  screenHome.classList.remove('active');
  screenScoreboard.classList.add('active');

  showValidationToast(`Loaded "${currentGameName}" ✓`);
}

function deleteSavedGame(gameId) {
  if (!confirm('Are you sure you want to delete this saved game?')) return;

  let games = getSavedGames();
  games = games.filter(g => g.id !== gameId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));

  if (gameId === currentGameId) {
    currentGameId = null;
  }

  updateSavedGamesBadge();
  renderSavedGamesList();
  showValidationToast('Game deleted.');
}

function promptNewGame() {
  if (currentRoundCount > 0) {
    modalConfirmNewBackdrop.classList.add('open');
    modalConfirmNewBackdrop.setAttribute('aria-hidden', 'false');
  } else {
    executeStartNewGame();
  }
}

function closeConfirmNewModal() {
  modalConfirmNewBackdrop.classList.remove('open');
  modalConfirmNewBackdrop.setAttribute('aria-hidden', 'true');
}

function executeStartNewGame() {
  // Auto-save existing progress if it had scores
  if (currentRoundCount > 0) {
    saveCurrentGame(false);
  }

  closeConfirmNewModal();
  closeSavedGamesModal();

  // Reset current game state
  currentGameId = null;
  const gamesCount = getSavedGames().length;
  currentGameName = `Rummy Game #${gamesCount + 1}`;
  scoreboardGameTitle.textContent = currentGameName;
  currentRoundCount = 0;
  scoreboardTbody.innerHTML = '';
  playerReentries = {};
  manualDealerOffset = 0;
  gameVictoryDeclared = false;

  // Switch to Home screen
  screenScoreboard.classList.remove('active');
  screenHome.classList.add('active');

  showValidationToast('New game setup ready. Configure players to begin!');
}

// ==========================================
// HOME SCREEN CONTROLLERS (2 - 6 PLAYERS)
// ==========================================

function renderPlayerInputs() {
  playerInputsContainer.innerHTML = '';

  players.forEach((name, index) => {
    const row = document.createElement('div');
    row.className = 'player-input-row';

    const avatar = document.createElement('div');
    avatar.className = `player-avatar-badge avatar-color-${index % 6}`;
    avatar.textContent = AVATAR_SUITS[index % AVATAR_SUITS.length];

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'player-name-input';
    input.value = name;
    input.placeholder = `Player ${index + 1}`;
    input.maxLength = 18;
    input.addEventListener('input', (e) => {
      players[index] = e.target.value.trim() || `Player ${index + 1}`;
    });

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'btn-remove-player';
    btnRemove.title = 'Remove Player';
    btnRemove.disabled = players.length <= 2;
    btnRemove.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    btnRemove.addEventListener('click', () => {
      if (players.length > 2) {
        removePlayer(index);
      }
    });

    row.appendChild(avatar);
    row.appendChild(input);
    row.appendChild(btnRemove);
    playerInputsContainer.appendChild(row);
  });

  updatePlayerStateControls();
}

function updatePlayerStateControls() {
  const count = players.length;
  playerCountBadge.textContent = `${count} ${count === 1 ? 'Player' : 'Players'}`;

  // Update quick selector chips
  countChips.forEach(chip => {
    const chipCount = parseInt(chip.getAttribute('data-count'), 10);
    if (chipCount === count) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // Enable/disable add button
  if (count >= 6) {
    btnAddPlayer.disabled = true;
    btnAddPlayer.querySelector('span').textContent = 'Max 6 Players Reached';
  } else {
    btnAddPlayer.disabled = false;
    btnAddPlayer.querySelector('span').textContent = 'Add Player';
  }
}

function addPlayer() {
  if (players.length < 6) {
    const nextIndex = players.length + 1;
    players.push(`Player ${nextIndex}`);
    renderPlayerInputs();
  }
}

function removePlayer(index) {
  if (players.length > 2) {
    players.splice(index, 1);
    renderPlayerInputs();
  }
}

function setPlayerCount(targetCount) {
  if (targetCount < 2 || targetCount > 6) return;
  
  if (targetCount > players.length) {
    while (players.length < targetCount) {
      players.push(`Player ${players.length + 1}`);
    }
  } else if (targetCount < players.length) {
    players = players.slice(0, targetCount);
  }
  renderPlayerInputs();
}

// Quick chip event listeners
countChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const count = parseInt(chip.getAttribute('data-count'), 10);
    setPlayerCount(count);
  });
});

btnAddPlayer.addEventListener('click', addPlayer);

// ==========================================
// SCOREBOARD SCREEN CONTROLLERS
// ==========================================

function startScoreboard() {
  // Capture player names from input fields
  const inputElements = playerInputsContainer.querySelectorAll('.player-name-input');
  players = Array.from(inputElements).map((input, idx) => input.value.trim() || `Player ${idx + 1}`);

  if (!currentGameId) {
    currentGameId = 'game_' + Date.now();
  }
  scoreboardGameTitle.textContent = currentGameName;

  // Setup the scoreboard UI
  buildScoreboardHeader();
  scoreboardTbody.innerHTML = '';
  currentRoundCount = 0;

  // Add initial round (Round 1)
  addNewRoundRow();

  // Auto-save initial state
  saveCurrentGame(false);

  // Switch screens
  screenHome.classList.remove('active');
  screenScoreboard.classList.add('active');
}

function buildScoreboardHeader() {
  scoreboardThead.innerHTML = '';
  const tr = document.createElement('tr');

  // Sticky Round column header
  const thRound = document.createElement('th');
  thRound.className = 'col-round';
  thRound.textContent = 'Round';
  tr.appendChild(thRound);

  // Each Player column header with live total badge and elimination progress track
  players.forEach((playerName, index) => {
    const th = document.createElement('th');
    th.id = `th-player-${index}`;
    th.innerHTML = `
      <div class="player-th-content">
        <div class="player-th-avatar-wrap">
          <div class="player-th-avatar avatar-color-${index % 6}">
            ${AVATAR_SUITS[index % AVATAR_SUITS.length]}
          </div>
          <span class="player-th-avatar-out-badge">OUT</span>
          <span class="player-th-dealer-badge" id="th-dealer-${index}" title="Dealer">D</span>
        </div>
        <span class="player-th-name" title="${playerName}">${playerName}</span>
        <div class="player-th-total-badge" id="th-total-${index}">
          <span class="th-total-num">0</span>
          <span class="th-total-max">/ 250</span>
        </div>
        <div class="player-th-progress-track">
          <div class="player-th-progress-fill" id="th-progress-${index}" style="width: 0%"></div>
        </div>
        <button type="button" class="btn-rejoin-chip" id="th-rejoin-btn-${index}" style="display: none;" title="Re-join game with highest score + 1">♻️ Re-join</button>
      </div>
    `;
    tr.appendChild(th);
  });

  scoreboardThead.appendChild(tr);
  updateScoreboardSummary();
}

function canEndCurrentRound() {
  if (currentRoundCount === 0) return true;

  const currentRow = document.getElementById(`round-row-${currentRoundCount}`);
  if (!currentRow) return true;

  const scoreBtns = currentRow.querySelectorAll('.score-cell-btn');
  const missingPlayers = [];
  const missingBtns = [];

  scoreBtns.forEach((btn, pIndex) => {
    // If player is already eliminated prior to this round, they do not need to score
    if (btn.dataset.isOut === 'true') {
      return;
    }

    const scoreVal = btn.dataset.score;
    if (scoreVal === undefined || scoreVal === null || scoreVal === '') {
      missingPlayers.push(players[pIndex]);
      missingBtns.push(btn);
    }
  });

  if (missingPlayers.length > 0) {
    // Highlight and trigger shake animation on missing score cells
    missingBtns.forEach(btn => {
      btn.classList.remove('cell-missing');
      void btn.offsetWidth; // Force CSS reflow to re-trigger shake animation
      btn.classList.add('cell-missing');
    });

    const namesFormatted = missingPlayers.length <= 2 
      ? missingPlayers.join(' and ') 
      : `${missingPlayers.slice(0, -1).join(', ')}, and ${missingPlayers[missingPlayers.length - 1]}`;

    showValidationToast(
      `Round ${currentRoundCount} incomplete! Please enter scores for ${namesFormatted} before ending the round.`
    );

    // Scroll to the incomplete round row so user sees it
    currentRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    return false;
  }

  return true;
}

function addNewRoundRow() {
  // Prevent creating/ending round if current round has missing scores
  if (!canEndCurrentRound()) {
    return;
  }

  // Dismiss any visible validation toast once valid
  toastNotification.classList.remove('show');

  currentRoundCount += 1;
  const row = document.createElement('tr');
  row.className = 'new-round-row';
  row.id = `round-row-${currentRoundCount}`;

  // Round label cell (sticky left)
  const tdRound = document.createElement('td');
  tdRound.className = 'cell-round';
  const roundBadgeBtn = document.createElement('button');
  roundBadgeBtn.type = 'button';
  roundBadgeBtn.className = 'round-badge-btn';
  roundBadgeBtn.title = `Score all players for Round ${currentRoundCount}`;
  roundBadgeBtn.setAttribute('aria-label', `Score all players for Round ${currentRoundCount}`);
  roundBadgeBtn.innerHTML = `<span class="round-badge">R${currentRoundCount}</span>`;
  const thisRound = currentRoundCount;
  roundBadgeBtn.addEventListener('click', () => {
    openBatchScoreModal(thisRound);
  });
  tdRound.appendChild(roundBadgeBtn);
  row.appendChild(tdRound);

  // Score cell for each player
  players.forEach((_, pIndex) => {
    const td = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'score-cell-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'score-cell-btn';
    btn.setAttribute('aria-label', `Enter score for ${players[pIndex]} in Round ${currentRoundCount}`);
    btn.dataset.round = currentRoundCount;
    btn.dataset.playerIndex = pIndex;
    btn.innerHTML = `<span class="cell-val empty">—</span>`;

    btn.addEventListener('click', () => {
      btn.classList.remove('cell-missing');
      openScoreModal(currentRoundCount, pIndex, btn);
    });

    wrap.appendChild(btn);
    td.appendChild(wrap);
    row.appendChild(td);
  });

  scoreboardTbody.appendChild(row);

  // Calculate and sync totals & OUT states for all rows
  recalculateAllScores();

  // Auto-save updated rounds
  saveCurrentGame(false);

  // Smooth scroll down to newly added round
  setTimeout(() => {
    tableScrollArea.scrollTo({
      top: tableScrollArea.scrollHeight,
      behavior: 'smooth'
    });
  }, 50);
}

// ==========================================
// CUMULATIVE SCORE & ELIMINATION ENGINE
// ==========================================

function recalculateAllScores() {
  const runningTotals = new Array(players.length).fill(0);
  const isPlayerEliminated = new Array(players.length).fill(false);
  const eliminationRound = new Array(players.length).fill(null);

  // Chronologically iterate through every round row
  for (let r = 1; r <= currentRoundCount; r++) {
    const row = document.getElementById(`round-row-${r}`);
    if (!row) continue;

    players.forEach((_, pIndex) => {
      const btn = row.querySelector(`.score-cell-btn[data-player-index="${pIndex}"]`);
      if (!btn) return;

      // Check if player was eliminated in an earlier round:
      if (isPlayerEliminated[pIndex] && eliminationRound[pIndex] < r) {
        btn.disabled = true;
        btn.classList.add('player-is-out');
        btn.classList.remove('cell-missing', 'just-eliminated');
        btn.innerHTML = `
          <span class="cell-out-badge">OUT</span>
          <span class="cell-running-total out">${runningTotals[pIndex]} pts</span>
        `;
        btn.dataset.isOut = 'true';
        return;
      }

      // Player was eligible to play this round
      btn.dataset.isOut = 'false';
      btn.disabled = false;
      btn.classList.remove('player-is-out');

      const scoreVal = btn.dataset.score;
      const scoreType = btn.dataset.type;

      if (scoreVal !== undefined && scoreVal !== null && scoreVal !== '' && scoreVal !== 'out') {
        const pts = parseInt(scoreVal, 10);
        runningTotals[pIndex] += pts;

        const isNowOut = runningTotals[pIndex] >= ELIMINATION_SCORE;
        if (isNowOut) {
          isPlayerEliminated[pIndex] = true;
          if (eliminationRound[pIndex] === null) {
            eliminationRound[pIndex] = r;
          }
          btn.classList.add('just-eliminated');
        } else {
          btn.classList.remove('just-eliminated');
        }

        // Determine warning styling for running total & cell button
        let cellWarningClass = '';
        let btnWarningClass = '';
        if (isNowOut) {
          cellWarningClass = 'out';
        } else if (runningTotals[pIndex] >= THRESHOLD_NO_DROP) {
          // Non-drop situation (>= 225) -> Red highlight
          cellWarningClass = 'danger-no-drop';
          btnWarningClass = 'danger-no-drop';
        } else if (runningTotals[pIndex] >= THRESHOLD_NO_MID_DROP) {
          // Non-middle drop situation (>= 210) -> Yellow highlight
          cellWarningClass = 'warning-no-mid-drop';
          btnWarningClass = 'warning-no-mid-drop';
        }

        btn.classList.remove('warning-no-mid-drop', 'danger-no-drop');
        if (btnWarningClass) {
          btn.classList.add(btnWarningClass);
        }

        const badgeLabel = SCORE_TYPE_LABELS[scoreType] || 'PTS';
        btn.innerHTML = `
          <span class="cell-val">${pts}</span>
          <span class="cell-type-badge badge-${scoreType}">${badgeLabel}</span>
          <span class="cell-running-total ${cellWarningClass}">
            ${isNowOut ? `OUT (${runningTotals[pIndex]})` : `Tot: ${runningTotals[pIndex]}`}
          </span>
        `;
      } else {
        // Score not entered yet in this round
        btn.classList.remove('just-eliminated', 'warning-no-mid-drop', 'danger-no-drop');
        let pendingWarningClass = '';
        if (runningTotals[pIndex] >= THRESHOLD_NO_DROP) {
          pendingWarningClass = 'danger-no-drop';
        } else if (runningTotals[pIndex] >= THRESHOLD_NO_MID_DROP) {
          pendingWarningClass = 'warning-no-mid-drop';
        }

        if (pendingWarningClass) {
          btn.classList.add(pendingWarningClass);
        }

        btn.innerHTML = `
          <span class="cell-val empty">—</span>
          ${runningTotals[pIndex] > 0 ? `<span class="cell-running-total ${pendingWarningClass}">Tot: ${runningTotals[pIndex]}</span>` : ''}
        `;
      }
    });
  }

  // Cache running totals & eliminated states
  currentRunningTotals = [...runningTotals];
  currentEliminatedState = [...isPlayerEliminated];

  // Feature 1: Dealer Rotation (only among active players)
  const activePlayerIndices = [];
  players.forEach((_, idx) => {
    if (!isPlayerEliminated[idx]) activePlayerIndices.push(idx);
  });

  let currentDealerIndex = null;
  if (activePlayerIndices.length > 0 && currentRoundCount > 0) {
    const offsetRound = (currentRoundCount - 1 + manualDealerOffset);
    const dealerPos = ((offsetRound % activePlayerIndices.length) + activePlayerIndices.length) % activePlayerIndices.length;
    currentDealerIndex = activePlayerIndices[dealerPos];
  }

  // Feature 1: Re-entry rule calculations
  const activeScores = activePlayerIndices.map(idx => runningTotals[idx]);
  const highestActiveScore = activeScores.length > 0 ? Math.max(...activeScores) : 0;
  const reentryScore = highestActiveScore + 1;
  const canRejoin = reentryScore < ELIMINATION_SCORE && activeScores.length > 0;

  // Update Player Column Headers with live totals, progress bars, and OUT indicators
  players.forEach((_, pIndex) => {
    const th = document.getElementById(`th-player-${pIndex}`);
    const totalBadge = document.getElementById(`th-total-${pIndex}`);
    const progressFill = document.getElementById(`th-progress-${pIndex}`);
    const dealerBadge = document.getElementById(`th-dealer-${pIndex}`);
    const rejoinBtn = document.getElementById(`th-rejoin-btn-${pIndex}`);
    if (!th || !totalBadge || !progressFill) return;

    const total = runningTotals[pIndex];
    const isOut = isPlayerEliminated[pIndex];

    // Reset status & warning classes
    th.classList.remove('player-eliminated', 'warning-no-mid-drop', 'danger-no-drop');
    totalBadge.classList.remove('is-out', 'warning-no-mid-drop', 'danger-no-drop');

    // Dealer badge setup
    if (dealerBadge) {
      if (pIndex === currentDealerIndex) {
        dealerBadge.classList.add('active');
        dealerBadge.title = `Current Dealer: ${players[pIndex]} (Round ${currentRoundCount})`;
      } else {
        dealerBadge.classList.remove('active');
        dealerBadge.title = `Click to set ${players[pIndex]} as Dealer`;
      }
      dealerBadge.onclick = (e) => {
        e.stopPropagation();
        setManualDealer(pIndex);
      };
    }

    // Re-join button on header for eliminated players
    if (rejoinBtn) {
      if (isOut && canRejoin) {
        rejoinBtn.style.display = 'inline-flex';
        rejoinBtn.textContent = `♻️ Re-join (${reentryScore})`;
        rejoinBtn.onclick = (e) => {
          e.stopPropagation();
          openRejoinModal(pIndex, total, highestActiveScore, reentryScore);
        };
      } else {
        rejoinBtn.style.display = 'none';
      }
    }

    if (isOut) {
      th.classList.add('player-eliminated');
      totalBadge.classList.add('is-out');
      totalBadge.innerHTML = `<span class="th-total-num">OUT (${total})</span>`;
      progressFill.style.width = '100%';
      progressFill.style.background = 'var(--accent-red)';
    } else if (total >= THRESHOLD_NO_DROP) {
      // Non-drop situation (>= 225) -> RED HIGHLIGHT
      th.classList.add('danger-no-drop');
      totalBadge.classList.add('danger-no-drop');
      totalBadge.innerHTML = `
        <span class="th-total-num">🚨 ${total}</span>
        <span class="th-total-max">/ 250</span>
      `;
      const pct = Math.min(100, Math.round((total / ELIMINATION_SCORE) * 100));
      progressFill.style.width = `${pct}%`;
      progressFill.style.background = '#ef4444';
    } else if (total >= THRESHOLD_NO_MID_DROP) {
      // Non-middle drop situation (>= 210) -> YELLOW HIGHLIGHT
      th.classList.add('warning-no-mid-drop');
      totalBadge.classList.add('warning-no-mid-drop');
      totalBadge.innerHTML = `
        <span class="th-total-num">⚠️ ${total}</span>
        <span class="th-total-max">/ 250</span>
      `;
      const pct = Math.min(100, Math.round((total / ELIMINATION_SCORE) * 100));
      progressFill.style.width = `${pct}%`;
      progressFill.style.background = '#eab308';
    } else {
      totalBadge.innerHTML = `
        <span class="th-total-num">${total}</span>
        <span class="th-total-max">/ 250</span>
      `;
      const pct = Math.min(100, Math.round((total / ELIMINATION_SCORE) * 100));
      progressFill.style.width = `${pct}%`;
      progressFill.style.background = '#059669';
    }
  });

  // Check Game Winner
  checkGameWinner(runningTotals, isPlayerEliminated);

  // Update Header Summary
  updateScoreboardSummary();
}

function checkGameWinner(runningTotals, isPlayerEliminated) {
  if (players.length < 2 || currentRoundCount === 0) return;

  const activePlayers = players
    .map((name, idx) => ({ name, idx, total: runningTotals[idx], isOut: isPlayerEliminated[idx] }))
    .filter(p => !p.isOut);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    if (!gameVictoryDeclared) {
      gameVictoryDeclared = true;
      triggerVictoryModal(winner, runningTotals, isPlayerEliminated);
    }
  } else if (activePlayers.length === 0) {
    showValidationToast(`Game Over! All players reached 250 points.`);
  } else {
    gameVictoryDeclared = false;
  }
}

function updateScoreboardSummary() {
  if (currentRoundCount === 0) {
    scoreboardPlayerSummary.textContent = `${players.length} Players • No rounds`;
    return;
  }

  // Count entered scores vs active players in current active round
  const currentRow = document.getElementById(`round-row-${currentRoundCount}`);
  let enteredCount = 0;
  let activeInRoundCount = 0;

  if (currentRow) {
    const scoreBtns = currentRow.querySelectorAll('.score-cell-btn');
    scoreBtns.forEach(btn => {
      if (btn.dataset.isOut !== 'true') {
        activeInRoundCount += 1;
        if (btn.dataset.score !== undefined && btn.dataset.score !== '' && btn.dataset.score !== null) {
          enteredCount += 1;
        }
      }
    });
  }

  const statusLabel = activeInRoundCount === 0 
    ? 'Game Completed' 
    : (enteredCount === activeInRoundCount 
        ? 'All scores entered' 
        : `${enteredCount}/${activeInRoundCount} scores`);

  scoreboardPlayerSummary.textContent = `${players.length} Players • Round ${currentRoundCount} (${statusLabel})`;
}

function resetRounds() {
  if (confirm('Clear all rounds and restart from Round 1?')) {
    scoreboardTbody.innerHTML = '';
    currentRoundCount = 0;
    addNewRoundRow();
    saveCurrentGame(false);
  }
}

function backToSetup() {
  saveCurrentGame(false);
  screenScoreboard.classList.remove('active');
  screenHome.classList.add('active');
}

// ==========================================
// QUICK SCORE MODAL / BOTTOM SHEET
// ==========================================

function openScoreModal(round, playerIndex, buttonElement) {
  // If player was already eliminated in a prior round, check if eligible to re-join
  if (buttonElement.dataset.isOut === 'true' || buttonElement.disabled) {
    const highestActive = getHighestActiveScore();
    const reentryScore = highestActive + 1;
    if (highestActive > 0 && reentryScore < ELIMINATION_SCORE) {
      openRejoinModal(playerIndex, currentRunningTotals[playerIndex] || 250, highestActive, reentryScore);
    } else {
      showValidationToast(`${players[playerIndex]} was eliminated in an earlier round.`);
    }
    return;
  }

  activeScoreTarget = {
    round,
    playerIndex,
    buttonElement
  };

  const playerName = players[playerIndex];
  modalPlayerName.textContent = playerName;
  modalRoundTag.textContent = `Round ${round}`;
  modalPlayerAvatar.textContent = AVATAR_SUITS[playerIndex % AVATAR_SUITS.length];
  modalPlayerAvatar.className = `player-avatar-badge avatar-color-${playerIndex % 6}`;

  // Calculate player's cumulative total before this round
  let playerPriorTotal = 0;
  for (let r = 1; r < round; r++) {
    const row = document.getElementById(`round-row-${r}`);
    if (!row) continue;
    const b = row.querySelector(`.score-cell-btn[data-player-index="${playerIndex}"]`);
    if (b && b.dataset.score) {
      playerPriorTotal += parseInt(b.dataset.score, 10);
    }
  }

  // Update modal player total badge
  if (modalPlayerTotalBadge) {
    modalPlayerTotalBadge.textContent = `Tot: ${playerPriorTotal}`;
    modalPlayerTotalBadge.classList.remove('warning-no-mid-drop', 'danger-no-drop');
    if (playerPriorTotal >= THRESHOLD_NO_DROP) {
      modalPlayerTotalBadge.classList.add('danger-no-drop');
    } else if (playerPriorTotal >= THRESHOLD_NO_MID_DROP) {
      modalPlayerTotalBadge.classList.add('warning-no-mid-drop');
    }
  }

  // Update modal warning banner
  if (modalWarningBanner && modalWarningIcon && modalWarningText) {
    if (playerPriorTotal >= THRESHOLD_NO_DROP) {
      modalWarningBanner.style.display = 'flex';
      modalWarningBanner.className = 'modal-warning-banner danger-no-drop';
      modalWarningIcon.textContent = '🚨';
      modalWarningText.textContent = `Non-Drop Situation (${playerPriorTotal} pts): A drop (+25) or points will eliminate player (≥250)! Only Win (0) is safe.`;
    } else if (playerPriorTotal >= THRESHOLD_NO_MID_DROP) {
      modalWarningBanner.style.display = 'flex';
      modalWarningBanner.className = 'modal-warning-banner warning-no-mid-drop';
      modalWarningIcon.textContent = '⚠️';
      modalWarningText.textContent = `Non-Middle Drop Situation (${playerPriorTotal} pts): A middle drop (+40) will eliminate player (≥250)! First drop (+25) is still safe.`;
    } else {
      modalWarningBanner.style.display = 'none';
    }
  }

  // Update score type card descriptions for tactical hazards
  if (cardDescDrop) {
    if (playerPriorTotal + DROP_SCORE >= ELIMINATION_SCORE) {
      cardDescDrop.textContent = '⚠️ Eliminates (250+)';
      cardDescDrop.className = 'type-desc alert-danger';
    } else {
      cardDescDrop.textContent = 'First drop (25 pts)';
      cardDescDrop.className = 'type-desc';
    }
  }

  if (cardDescMidDrop) {
    if (playerPriorTotal + MID_DROP_SCORE >= ELIMINATION_SCORE) {
      cardDescMidDrop.textContent = '⚠️ Eliminates (250+)';
      cardDescMidDrop.className = 'type-desc alert-danger';
    } else {
      cardDescMidDrop.textContent = 'Mid round drop (40 pts)';
      cardDescMidDrop.className = 'type-desc';
    }
  }

  if (cardDescFullCount) {
    if (playerPriorTotal + MAX_ROUND_SCORE >= ELIMINATION_SCORE) {
      cardDescFullCount.textContent = '💥 Eliminates (250+)';
      cardDescFullCount.className = 'type-desc alert-danger';
    } else {
      cardDescFullCount.textContent = 'Maximum points (80 pts)';
      cardDescFullCount.className = 'type-desc';
    }
  }

  // Current values
  const currentScore = buttonElement.dataset.score;
  const currentType = buttonElement.dataset.type;

  customScoreInput.value = currentScore !== undefined ? currentScore : '';

  // Highlight active type card
  scoreTypeCards.forEach(card => {
    if (currentType && card.dataset.type === currentType) {
      card.classList.add('selected');
      card.style.borderColor = '';
      card.style.background = '';
    } else {
      card.classList.remove('selected');
      card.style.borderColor = '';
      card.style.background = '';
    }
  });

  scoreModalBackdrop.classList.add('open');
  scoreModalBackdrop.setAttribute('aria-hidden', 'false');
}

function closeScoreModal() {
  scoreModalBackdrop.classList.remove('open');
  scoreModalBackdrop.setAttribute('aria-hidden', 'true');
  if (modalWarningBanner) {
    modalWarningBanner.style.display = 'none';
  }
  if (cardDescDrop) {
    cardDescDrop.textContent = 'First drop';
    cardDescDrop.className = 'type-desc';
  }
  if (cardDescMidDrop) {
    cardDescMidDrop.textContent = 'Mid round drop';
    cardDescMidDrop.className = 'type-desc';
  }
  if (cardDescFullCount) {
    cardDescFullCount.textContent = 'Maximum points';
    cardDescFullCount.className = 'type-desc';
  }
  activeScoreTarget = {
    round: null,
    playerIndex: null,
    buttonElement: null
  };
}

function applyScore(score, type) {
  if (!activeScoreTarget.buttonElement) return;

  const btn = activeScoreTarget.buttonElement;
  btn.classList.remove('cell-missing');

  if (score === null || score === undefined || score === '') {
    // Clear score
    delete btn.dataset.score;
    delete btn.dataset.type;
  } else {
    const numScore = parseInt(score, 10);
    if (numScore > MAX_ROUND_SCORE) {
      showValidationToast(`Score rejected! Maximum allowed score is ${MAX_ROUND_SCORE} points.`);
      return;
    }
    btn.dataset.score = numScore;
    btn.dataset.type = type;
  }

  // Recalculate totals and check 250 point elimination across all rounds
  recalculateAllScores();

  // Auto-save updated score
  saveCurrentGame(false);

  // If all active scores in current round are filled, dismiss toast
  const currentRow = document.getElementById(`round-row-${currentRoundCount}`);
  if (currentRow) {
    const scoreBtns = currentRow.querySelectorAll('.score-cell-btn:not([data-is-out="true"])');
    const allFilled = Array.from(scoreBtns).every(b => b.dataset.score !== undefined && b.dataset.score !== '');
    if (allFilled) {
      toastNotification.classList.remove('show');
    }
  }

  closeScoreModal();
}

// ==========================================
// BATCH SCORE MODAL CONTROLLER (SCORE ALL AT ONCE)
// ==========================================

let activeBatchRound = null;

function openBatchScoreModal(targetRound) {
  if (currentRoundCount === 0) {
    showValidationToast('Please add at least one round before entering scores.');
    return;
  }

  activeBatchRound = (targetRound && targetRound > 0 && targetRound <= currentRoundCount) 
    ? targetRound 
    : currentRoundCount;

  batchModalTitle.textContent = `Round ${activeBatchRound} Scores`;
  batchModalRoundTag.textContent = `Round ${activeBatchRound}`;
  batchModalSubtitle.textContent = `Enter scores for all active players in Round ${activeBatchRound}`;

  const targetRow = document.getElementById(`round-row-${activeBatchRound}`);
  if (!targetRow) return;

  // Calculate prior running totals up to activeBatchRound - 1
  const priorTotals = new Array(players.length).fill(0);
  const isPlayerOutPrior = new Array(players.length).fill(false);

  for (let r = 1; r < activeBatchRound; r++) {
    const priorRow = document.getElementById(`round-row-${r}`);
    if (!priorRow) continue;
    players.forEach((_, pIdx) => {
      if (playerReentries[pIdx] && playerReentries[pIdx].round === r) {
        priorTotals[pIdx] = playerReentries[pIdx].score;
        isPlayerOutPrior[pIdx] = false;
      }
      const b = priorRow.querySelector(`.score-cell-btn[data-player-index="${pIdx}"]`);
      if (b && b.dataset.score !== undefined && b.dataset.score !== '' && b.dataset.score !== 'out') {
        priorTotals[pIdx] += parseInt(b.dataset.score, 10);
        if (priorTotals[pIdx] >= ELIMINATION_SCORE) {
          isPlayerOutPrior[pIdx] = true;
        }
      }
    });
  }

  // Check if player re-entered in activeBatchRound itself
  players.forEach((_, pIdx) => {
    if (playerReentries[pIdx] && playerReentries[pIdx].round === activeBatchRound) {
      priorTotals[pIdx] = playerReentries[pIdx].score;
      isPlayerOutPrior[pIdx] = false;
    }
  });

  // Populate players cards
  batchPlayersContainer.innerHTML = '';

  players.forEach((playerName, pIdx) => {
    const isOut = isPlayerOutPrior[pIdx];
    const priorTot = priorTotals[pIdx];

    const cellBtn = targetRow.querySelector(`.score-cell-btn[data-player-index="${pIdx}"]`);
    const currentScore = (cellBtn && cellBtn.dataset.score !== undefined && cellBtn.dataset.score !== '') 
      ? parseInt(cellBtn.dataset.score, 10) 
      : null;
    const currentType = (cellBtn && cellBtn.dataset.type) || null;

    const card = document.createElement('div');
    card.className = `batch-player-card ${isOut ? 'eliminated' : ''}`;
    card.id = `batch-card-${pIdx}`;
    card.dataset.playerIndex = pIdx;
    card.dataset.isOut = isOut ? 'true' : 'false';

    // Top section: Avatar, Name, Prior score / warnings, and live preview pill
    const topDiv = document.createElement('div');
    topDiv.className = 'batch-player-top';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'batch-player-meta';

    const avatar = document.createElement('div');
    avatar.className = `player-avatar-badge avatar-color-${pIdx % 6}`;
    avatar.textContent = AVATAR_SUITS[pIdx % AVATAR_SUITS.length];

    const nameCol = document.createElement('div');
    const nameSpan = document.createElement('div');
    nameSpan.className = `batch-player-name ${isOut ? 'strikethrough' : ''}`;
    nameSpan.textContent = playerName;

    const scoreInfo = document.createElement('div');
    scoreInfo.className = 'batch-player-score-info';

    if (isOut) {
      const activeScores = [];
      players.forEach((_, idx) => {
        if (!isPlayerOutPrior[idx]) {
          activeScores.push(priorTotals[idx]);
        }
      });
      const highestActive = activeScores.length > 0 ? Math.max(...activeScores) : 0;
      const reentryScore = highestActive + 1;
      const canRejoin = activeScores.length > 0 && reentryScore < ELIMINATION_SCORE;

      const rejoinBtnHtml = canRejoin 
        ? `<button type="button" class="btn-rejoin-chip" id="batch-rejoin-${pIdx}">♻️ Re-join (${reentryScore} pts)</button>`
        : '';
      scoreInfo.innerHTML = `<span class="batch-warning-pill danger-no-drop">OUT (≥250)</span> ${rejoinBtnHtml}`;
    } else {
      let warningPillHtml = '';
      if (priorTot >= THRESHOLD_NO_DROP) {
        warningPillHtml = `<span class="batch-warning-pill danger-no-drop">🚨 Danger (≥225)</span>`;
      } else if (priorTot >= THRESHOLD_NO_MID_DROP) {
        warningPillHtml = `<span class="batch-warning-pill warning-no-mid-drop">⚠️ Warning (≥210)</span>`;
      }
      scoreInfo.innerHTML = `<span>Prior: <strong>${priorTot}</strong></span> ${warningPillHtml}`;
    }

    nameCol.appendChild(nameSpan);
    nameCol.appendChild(scoreInfo);
    metaDiv.appendChild(avatar);
    metaDiv.appendChild(nameCol);

    // Live preview pill on the right
    const previewPill = document.createElement('div');
    previewPill.className = 'batch-preview-pill';
    previewPill.id = `batch-preview-${pIdx}`;

    topDiv.appendChild(metaDiv);
    topDiv.appendChild(previewPill);
    card.appendChild(topDiv);

    if (isOut) {
      previewPill.className = 'batch-preview-pill out';
      previewPill.textContent = `OUT (${priorTot} pts)`;
      const batchRejoinBtn = card.querySelector(`#batch-rejoin-${pIdx}`);
      if (batchRejoinBtn) {
        batchRejoinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const activeScores = [];
          players.forEach((_, idx) => {
            if (!isPlayerOutPrior[idx]) activeScores.push(priorTotals[idx]);
          });
          const highestActive = activeScores.length > 0 ? Math.max(...activeScores) : 0;
          openRejoinModal(pIdx, priorTot, highestActive, highestActive + 1);
        });
      }
    } else {
      // Controls: Quick chips + numeric input
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'batch-player-controls';

      // Custom input container
      const inputWrap = document.createElement('div');
      inputWrap.className = 'batch-input-wrap';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '80';
      input.className = 'batch-score-input';
      input.id = `batch-input-${pIdx}`;
      input.inputMode = 'numeric';
      input.placeholder = '—';
      input.value = currentScore !== null ? currentScore : '';

      const inputLabel = document.createElement('span');
      inputLabel.className = 'batch-input-label';
      inputLabel.textContent = 'pts';

      input.addEventListener('input', () => {
        card.classList.remove('missing-highlight');
        const raw = input.value.trim();
        if (raw === '') {
          updatePlayerCardState(pIdx, null, null);
          updateBatchStatusCounter();
          return;
        }

        let val = parseInt(raw, 10);
        if (isNaN(val) || val < 0) {
          val = 0;
          input.value = '0';
        } else if (val > MAX_ROUND_SCORE) {
          showValidationToast(`Score rejected! Maximum allowed score is ${MAX_ROUND_SCORE} points.`);
          val = MAX_ROUND_SCORE;
          input.value = MAX_ROUND_SCORE;
        }

        let type = 'custom';
        if (val === 0) type = 'win';
        else if (val === DROP_SCORE) type = 'drop';
        else if (val === MID_DROP_SCORE) type = 'mid_drop';
        else if (val === MAX_ROUND_SCORE) type = 'full_count';

        updatePlayerCardState(pIdx, val, type);
        updateBatchStatusCounter();
      });

      inputWrap.appendChild(input);
      inputWrap.appendChild(inputLabel);

      // Quick Chips container
      const chipsDiv = document.createElement('div');
      chipsDiv.className = 'batch-quick-chips';

      const chipOptions = [
        { label: 'Win (0)', score: 0, type: 'win', classSuffix: 'win' },
        { label: 'Drop (25)', score: 25, type: 'drop', classSuffix: 'drop' },
        { label: 'Mid (40)', score: 40, type: 'mid_drop', classSuffix: 'mid' },
        { label: 'Full (80)', score: 80, type: 'full_count', classSuffix: 'full' }
      ];

      chipOptions.forEach(opt => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `batch-chip chip-${opt.classSuffix}`;
        chip.dataset.score = opt.score;
        chip.dataset.type = opt.type;
        chip.textContent = opt.label;
        if (currentScore === opt.score) {
          chip.classList.add('active');
        }

        chip.addEventListener('click', () => {
          input.value = opt.score;
          updatePlayerCardState(pIdx, opt.score, opt.type);
          card.classList.remove('missing-highlight');
          updateBatchStatusCounter();
        });

        chipsDiv.appendChild(chip);
      });

      controlsDiv.appendChild(chipsDiv);
      controlsDiv.appendChild(inputWrap);
      card.appendChild(controlsDiv);

      // Initial update for preview pill & chip active states
      updatePlayerCardState(pIdx, currentScore, currentType);
    }

    batchPlayersContainer.appendChild(card);
  });

  updateBatchStatusCounter();

  modalBatchScoreBackdrop.classList.add('open');
  modalBatchScoreBackdrop.setAttribute('aria-hidden', 'false');
}

function updatePlayerCardState(pIdx, score, type) {
  const card = document.getElementById(`batch-card-${pIdx}`);
  if (!card || card.dataset.isOut === 'true') return;

  const previewPill = document.getElementById(`batch-preview-${pIdx}`);
  const chips = card.querySelectorAll('.batch-chip');

  // Sync chips
  chips.forEach(chip => {
    const chipScore = parseInt(chip.dataset.score, 10);
    if (score !== null && chipScore === score) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // Calculate prior total up to activeBatchRound - 1
  let priorTot = 0;
  for (let r = 1; r < activeBatchRound; r++) {
    const priorRow = document.getElementById(`round-row-${r}`);
    if (!priorRow) continue;
    const b = priorRow.querySelector(`.score-cell-btn[data-player-index="${pIdx}"]`);
    if (b && b.dataset.score !== undefined && b.dataset.score !== '' && b.dataset.score !== 'out') {
      priorTot += parseInt(b.dataset.score, 10);
    }
  }

  // Update preview pill
  previewPill.className = 'batch-preview-pill';
  if (score === null || isNaN(score)) {
    previewPill.textContent = 'Needs Score';
    previewPill.style.color = '#94a3b8';
  } else {
    const newTot = priorTot + score;
    previewPill.style.color = '';
    if (newTot >= ELIMINATION_SCORE) {
      previewPill.classList.add('out');
      previewPill.textContent = `💥 OUT (${newTot} pts)`;
    } else if (newTot >= THRESHOLD_NO_DROP) {
      previewPill.classList.add('danger-no-drop');
      previewPill.textContent = `🚨 ${newTot} pts (+${score})`;
    } else if (newTot >= THRESHOLD_NO_MID_DROP) {
      previewPill.classList.add('warning-no-mid-drop');
      previewPill.textContent = `⚠️ ${newTot} pts (+${score})`;
    } else {
      previewPill.textContent = `New: ${newTot} pts (+${score})`;
    }
  }
}

function updateBatchStatusCounter() {
  const activeCards = batchPlayersContainer.querySelectorAll('.batch-player-card:not([data-is-out="true"])');
  let enteredCount = 0;
  const totalEligible = activeCards.length;

  activeCards.forEach(card => {
    const input = card.querySelector('.batch-score-input');
    if (input && input.value.trim() !== '') {
      enteredCount++;
    }
  });

  if (totalEligible === 0) {
    batchStatusCounter.textContent = 'All players already eliminated';
  } else if (enteredCount === totalEligible) {
    batchStatusCounter.textContent = `All ${totalEligible} scores entered ✓`;
    batchStatusCounter.style.color = '#059669';
  } else {
    batchStatusCounter.textContent = `${enteredCount} of ${totalEligible} entered`;
    batchStatusCounter.style.color = '';
  }
}

function closeBatchScoreModal() {
  modalBatchScoreBackdrop.classList.remove('open');
  modalBatchScoreBackdrop.setAttribute('aria-hidden', 'true');
  activeBatchRound = null;
}

function fillUnfilledBatchWithDrops() {
  const activeCards = batchPlayersContainer.querySelectorAll('.batch-player-card:not([data-is-out="true"])');
  let filledCount = 0;

  activeCards.forEach(card => {
    const input = card.querySelector('.batch-score-input');
    if (input && input.value.trim() === '') {
      input.value = DROP_SCORE;
      const pIdx = parseInt(card.dataset.playerIndex, 10);
      updatePlayerCardState(pIdx, DROP_SCORE, 'drop');
      card.classList.remove('missing-highlight');
      filledCount++;
    }
  });

  updateBatchStatusCounter();

  if (filledCount > 0) {
    showValidationToast(`Filled ${filledCount} remaining player(s) with Drop (25 pts) ✓`);
  } else {
    showValidationToast('No unfilled active players to set to Drop.');
  }
}

function saveBatchScores() {
  if (!activeBatchRound) return;

  const targetRow = document.getElementById(`round-row-${activeBatchRound}`);
  if (!targetRow) return;

  const activeCards = batchPlayersContainer.querySelectorAll('.batch-player-card:not([data-is-out="true"])');
  const missingCards = [];
  const missingNames = [];

  activeCards.forEach(card => {
    const pIdx = parseInt(card.dataset.playerIndex, 10);
    const input = card.querySelector('.batch-score-input');
    const val = input ? input.value.trim() : '';

    if (val === '') {
      missingCards.push(card);
      missingNames.push(players[pIdx]);
      card.classList.remove('missing-highlight');
      void card.offsetWidth; // force reflow
      card.classList.add('missing-highlight');
    }
  });

  if (missingCards.length > 0) {
    const formatted = missingNames.length <= 2 
      ? missingNames.join(' and ') 
      : `${missingNames.slice(0, -1).join(', ')}, and ${missingNames[missingNames.length - 1]}`;

    showValidationToast(`Please enter scores for ${formatted} before saving.`);
    missingCards[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  // All active scores are valid! Apply them to the row
  activeCards.forEach(card => {
    const pIdx = parseInt(card.dataset.playerIndex, 10);
    const input = card.querySelector('.batch-score-input');
    const numVal = parseInt(input.value.trim(), 10);

    let type = 'custom';
    if (numVal === 0) type = 'win';
    else if (numVal === DROP_SCORE) type = 'drop';
    else if (numVal === MID_DROP_SCORE) type = 'mid_drop';
    else if (numVal === MAX_ROUND_SCORE) type = 'full_count';

    const cellBtn = targetRow.querySelector(`.score-cell-btn[data-player-index="${pIdx}"]`);
    if (cellBtn) {
      cellBtn.classList.remove('cell-missing');
      cellBtn.dataset.score = numVal;
      cellBtn.dataset.type = type;
    }
  });

  // Recalculate totals and check 250 point elimination across all rounds
  recalculateAllScores();

  // Auto-save game
  saveCurrentGame(false);

  const roundNum = activeBatchRound;
  closeBatchScoreModal();
  showValidationToast(`Round ${roundNum} scores saved for all players! ✓`);
}

// Score Type Card Clicks (Win, Drop, Middle Drop, Full Count)
scoreTypeCards.forEach(card => {
  card.addEventListener('click', () => {
    const score = card.getAttribute('data-score');
    const type = card.getAttribute('data-type');
    applyScore(score, type);
  });
});

// Real-time clamping & rejection on custom input
customScoreInput.addEventListener('input', () => {
  const raw = customScoreInput.value.trim();
  if (raw === '') return;
  const val = parseInt(raw, 10);
  if (!isNaN(val) && val > MAX_ROUND_SCORE) {
    showValidationToast(`Score rejected! Scores above ${MAX_ROUND_SCORE} are not allowed.`);
    customScoreInput.value = MAX_ROUND_SCORE;
  }
});

// Custom Score Form Submit
customScoreForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawVal = customScoreInput.value.trim();
  if (rawVal === '') {
    closeScoreModal();
    return;
  }

  const numVal = parseInt(rawVal, 10);
  if (isNaN(numVal) || numVal < 0) {
    showValidationToast('Please enter a valid positive score.');
    return;
  }

  if (numVal > MAX_ROUND_SCORE) {
    showValidationToast(`Score rejected! Maximum allowed score is ${MAX_ROUND_SCORE} points.`);
    customScoreInput.value = '';
    return;
  }

  // Auto-detect standard score types or set custom
  let type = 'custom';
  if (numVal === 0) type = 'win';
  else if (numVal === DROP_SCORE) type = 'drop';
  else if (numVal === 40) type = 'mid_drop';
  else if (numVal === MAX_ROUND_SCORE) type = 'full_count';

  applyScore(numVal, type);
});

// Clear Score
btnClearScore.addEventListener('click', () => {
  applyScore(null, null);
});

// Close Modal Interactions
modalCloseBtn.addEventListener('click', closeScoreModal);

scoreModalBackdrop.addEventListener('click', (e) => {
  if (e.target === scoreModalBackdrop) {
    closeScoreModal();
  }
});

// Rename Modal Interactions
gameTitleTrigger.addEventListener('click', () => openRenameModal(currentGameId));
formRenameGame.addEventListener('submit', (e) => {
  e.preventDefault();
  executeRenameGame(inputGameName.value);
});
btnCancelRename.addEventListener('click', closeRenameModal);
btnCloseRenameModal.addEventListener('click', closeRenameModal);
modalRenameBackdrop.addEventListener('click', (e) => {
  if (e.target === modalRenameBackdrop) {
    closeRenameModal();
  }
});

// Saved Games Modal Interactions
btnOpenSavedHome.addEventListener('click', openSavedGamesModal);
btnSavedGames.addEventListener('click', openSavedGamesModal);
btnCloseSavedModal.addEventListener('click', closeSavedGamesModal);
modalSavedGamesBackdrop.addEventListener('click', (e) => {
  if (e.target === modalSavedGamesBackdrop) {
    closeSavedGamesModal();
  }
});
btnStartNewFromSaved.addEventListener('click', () => {
  promptNewGame();
});

// Confirm New Game Modal Interactions
btnNewGame.addEventListener('click', promptNewGame);
btnConfirmNewGame.addEventListener('click', executeStartNewGame);
btnCancelNewGame.addEventListener('click', closeConfirmNewModal);
btnCloseConfirmModal.addEventListener('click', closeConfirmNewModal);
modalConfirmNewBackdrop.addEventListener('click', (e) => {
  if (e.target === modalConfirmNewBackdrop) {
    closeConfirmNewModal();
  }
});

// Save Current Game Button
btnSaveGame.addEventListener('click', () => {
  saveCurrentGame(true);
});

// Batch Score Modal Event Listeners
if (btnBatchRoundHeader) {
  btnBatchRoundHeader.addEventListener('click', () => {
    openBatchScoreModal(currentRoundCount);
  });
}

if (fabScoreAll) {
  fabScoreAll.addEventListener('click', () => {
    openBatchScoreModal(currentRoundCount);
  });
}

if (btnCloseBatchModal) {
  btnCloseBatchModal.addEventListener('click', closeBatchScoreModal);
}

if (btnCancelBatch) {
  btnCancelBatch.addEventListener('click', closeBatchScoreModal);
}

if (btnSaveBatchScores) {
  btnSaveBatchScores.addEventListener('click', saveBatchScores);
}

if (btnBatchFillDrops) {
  btnBatchFillDrops.addEventListener('click', fillUnfilledBatchWithDrops);
}

if (modalBatchScoreBackdrop) {
  modalBatchScoreBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBatchScoreBackdrop) {
      closeBatchScoreModal();
    }
  });
}

// ==========================================
// FEATURE 1: UNDO ROUND CONTROLLERS
// ==========================================

function openUndoRoundModal() {
  if (currentRoundCount === 0) {
    showValidationToast('No rounds to undo.');
    return;
  }

  undoModalTitle.textContent = `Undo Round ${currentRoundCount}?`;
  undoModalDesc.textContent = `Are you sure you want to delete Round ${currentRoundCount}? All entered scores for Round ${currentRoundCount} will be deleted and prior totals will be restored.`;
  modalConfirmUndoBackdrop.classList.add('open');
  modalConfirmUndoBackdrop.setAttribute('aria-hidden', 'false');
}

function closeUndoRoundModal() {
  modalConfirmUndoBackdrop.classList.remove('open');
  modalConfirmUndoBackdrop.setAttribute('aria-hidden', 'true');
}

function executeUndoRound() {
  if (currentRoundCount === 0) return;

  const targetRow = document.getElementById(`round-row-${currentRoundCount}`);
  if (targetRow) {
    targetRow.remove();
  }

  const removedRound = currentRoundCount;
  // Clean up any re-entry recorded in this removed round
  Object.keys(playerReentries).forEach(pIdx => {
    if (playerReentries[pIdx] && playerReentries[pIdx].round === removedRound) {
      delete playerReentries[pIdx];
    }
  });

  currentRoundCount -= 1;
  gameVictoryDeclared = false;
  recalculateAllScores();
  saveCurrentGame(false);
  closeUndoRoundModal();
  showValidationToast(`Round ${removedRound} deleted. Scoreboard rolled back ✓`);
}

// Feature 1: Manual Dealer Assignment
function setManualDealer(pIndex) {
  const activePlayerIndices = [];
  players.forEach((_, idx) => {
    if (currentRunningTotals[idx] < ELIMINATION_SCORE) {
      activePlayerIndices.push(idx);
    }
  });

  const targetPos = activePlayerIndices.indexOf(pIndex);
  if (targetPos === -1) {
    showValidationToast(`${players[pIndex]} is eliminated and cannot be dealer.`);
    return;
  }

  manualDealerOffset = targetPos - ((currentRoundCount - 1) % activePlayerIndices.length);
  recalculateAllScores();
  saveCurrentGame(false);
  showValidationToast(`🎴 Dealer set to ${players[pIndex]}!`);
}

// Feature 1: Re-join / Re-entry Controllers
let pendingRejoinPlayerIndex = null;
let pendingReentryScore = null;

function getHighestActiveScore() {
  let highest = 0;
  players.forEach((_, idx) => {
    if (currentRunningTotals[idx] < ELIMINATION_SCORE && currentRunningTotals[idx] > highest) {
      highest = currentRunningTotals[idx];
    }
  });
  return highest;
}

function openRejoinModal(pIndex, currentScore, highestActive, reentryScore) {
  pendingRejoinPlayerIndex = pIndex;
  pendingReentryScore = reentryScore;

  rejoinPlayerAvatar.textContent = AVATAR_SUITS[pIndex % AVATAR_SUITS.length];
  rejoinPlayerAvatar.className = `player-avatar-badge avatar-color-${pIndex % 6}`;
  rejoinModalTitle.textContent = `Re-join ${players[pIndex]}?`;

  rejoinSummaryBox.innerHTML = `
    <div class="rejoin-row">
      <span>Player Score:</span>
      <strong>${currentScore} pts (OUT)</strong>
    </div>
    <div class="rejoin-row">
      <span>Highest Active Score:</span>
      <span>${highestActive} pts</span>
    </div>
    <div class="rejoin-row highlight">
      <span>New Re-entry Score:</span>
      <span class="rejoin-score-pill">${reentryScore} pts</span>
    </div>
  `;

  modalRejoinBackdrop.classList.add('open');
  modalRejoinBackdrop.setAttribute('aria-hidden', 'false');
}

function closeRejoinModal() {
  modalRejoinBackdrop.classList.remove('open');
  modalRejoinBackdrop.setAttribute('aria-hidden', 'true');
  pendingRejoinPlayerIndex = null;
  pendingReentryScore = null;
}

function executeRejoinPlayer() {
  if (pendingRejoinPlayerIndex === null || pendingReentryScore === null) return;

  const pIdx = pendingRejoinPlayerIndex;
  const newScore = pendingReentryScore;

  playerReentries[pIdx] = {
    round: currentRoundCount,
    score: newScore
  };

  closeRejoinModal();
  if (modalBatchScoreBackdrop.classList.contains('open')) {
    openBatchScoreModal(activeBatchRound);
  }

  recalculateAllScores();
  saveCurrentGame(false);

  showValidationToast(`♻️ ${players[pIdx]} re-joined the game with ${newScore} points! ✓`);
}

// ==========================================
// FEATURE 2: VICTORY CELEBRATION & CONFETTI
// ==========================================

function launchConfetti(durationMs = 4500) {
  if (!confettiCanvas) return;
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const confettiColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308'];
  const particles = [];
  const particleCount = 110;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height * 0.4 - 50,
      size: Math.random() * 8 + 5,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationFrameId;
  const startTime = Date.now();

  function render() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      if (elapsed > durationMs - 1200) {
        p.opacity = Math.max(0, 1 - (elapsed - (durationMs - 1200)) / 1200);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (elapsed < durationMs) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  render();
}

function triggerVictoryModal(winner, runningTotals, isPlayerEliminated) {
  launchConfetti(4500);

  victoryWinnerCard.innerHTML = `
    <div class="winner-info-left">
      <div class="winner-avatar-wrap">
        <div class="winner-avatar avatar-color-${winner.idx % 6}">
          ${AVATAR_SUITS[winner.idx % AVATAR_SUITS.length]}
        </div>
        <span class="winner-crown-mini">👑</span>
      </div>
      <div class="winner-name-wrap">
        <h3>${winner.name}</h3>
        <span class="winner-status-tag">Tournament Champion</span>
      </div>
    </div>
    <div class="winner-score-badge">
      <div class="winner-score-num">${winner.total}</div>
      <span class="winner-score-label">Final Pts</span>
    </div>
  `;

  const sorted = players
    .map((name, idx) => ({
      name,
      idx,
      total: runningTotals[idx],
      isOut: isPlayerEliminated[idx]
    }))
    .sort((a, b) => a.total - b.total);

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  victoryPodiumsWrap.innerHTML = '';

  sorted.forEach((p, rank) => {
    const div = document.createElement('div');
    div.className = `podium-item ${rank === 0 ? 'rank-1' : ''}`;
    div.innerHTML = `
      <div class="podium-left">
        <span class="podium-medal">${p.isOut ? '❌' : (medals[rank] || '•')}</span>
        <span class="podium-name">${p.name}</span>
      </div>
      <div class="podium-score ${p.isOut ? 'is-out' : ''}">
        ${p.isOut ? `OUT (${p.total})` : `${p.total} pts`}
      </div>
    `;
    victoryPodiumsWrap.appendChild(div);
  });

  modalVictoryBackdrop.classList.add('open');
  modalVictoryBackdrop.setAttribute('aria-hidden', 'false');
}

function closeVictoryModal() {
  modalVictoryBackdrop.classList.remove('open');
  modalVictoryBackdrop.setAttribute('aria-hidden', 'true');
}

// ==========================================
// FEATURE 2: SHARE TO WHATSAPP / CLIPBOARD
// ==========================================

function generateShareText() {
  const sorted = players
    .map((name, idx) => ({
      name,
      idx,
      total: currentRunningTotals[idx],
      isOut: currentEliminatedState[idx]
    }))
    .sort((a, b) => a.total - b.total);

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  const lines = [];
  lines.push(`🎴 *${currentGameName.toUpperCase()}* 🏆`);
  lines.push(`Rounds: ${currentRoundCount} • Players: ${players.length}`);
  lines.push('');
  lines.push('*STANDINGS:*');

  sorted.forEach((p, rank) => {
    if (p.isOut) {
      lines.push(`❌ ${p.name}: ${p.total} pts (OUT)`);
    } else if (rank === 0 && sorted.filter(x => !x.isOut).length === 1) {
      lines.push(`${medals[0]} *${p.name}*: ${p.total} pts 👑 WINNER!`);
    } else {
      lines.push(`${medals[rank] || '•'} ${p.name}: ${p.total} pts`);
    }
  });

  // Calculate quick awards
  const winsCount = new Array(players.length).fill(0);
  const dropsCount = new Array(players.length).fill(0);

  for (let r = 1; r <= currentRoundCount; r++) {
    const row = document.getElementById(`round-row-${r}`);
    if (!row) continue;
    players.forEach((_, pIdx) => {
      const b = row.querySelector(`.score-cell-btn[data-player-index="${pIdx}"]`);
      if (b && b.dataset.score !== undefined && b.dataset.score !== '') {
        const pts = parseInt(b.dataset.score, 10);
        if (pts === 0) winsCount[pIdx]++;
        if (pts === 25 || pts === 40) dropsCount[pIdx]++;
      }
    });
  }

  const maxWins = Math.max(...winsCount);
  if (maxWins > 0) {
    const mostWinsIdx = winsCount.indexOf(maxWins);
    lines.push('');
    lines.push('*MATCH HIGHLIGHTS:*');
    lines.push(`• 👑 Most Wins: ${players[mostWinsIdx]} (${maxWins} rounds)`);
  }

  lines.push('');
  lines.push('Tracked with Rummy Scoreboard ♣♦♥♠');

  return lines.join('\n');
}

function shareOrCopySummary() {
  const text = generateShareText();
  if (navigator.share) {
    navigator.share({
      title: `${currentGameName} Summary`,
      text: text
    }).catch(() => {
      copyToClipboardFallback(text);
    });
  } else {
    copyToClipboardFallback(text);
  }
}

function copyToClipboardFallback(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showValidationToast('Game summary copied! Ready to paste into WhatsApp 📋');
    }).catch(() => {
      showValidationToast('Failed to copy summary to clipboard.');
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showValidationToast('Game summary copied! 📋');
  }
}

// ==========================================
// FEATURE 3: GAME STATS & ANALYTICS
// ==========================================

function openStatsModal() {
  statsModalSubtitle.textContent = `${currentGameName} • Round ${currentRoundCount}`;

  // Gather stats per player across all rounds
  const playerStats = players.map((name, idx) => {
    let wins = 0;
    let drops = 0;
    let midDrops = 0;
    let fullCounts = 0;
    let totalScore = currentRunningTotals[idx];
    let roundsCount = 0;

    for (let r = 1; r <= currentRoundCount; r++) {
      const row = document.getElementById(`round-row-${r}`);
      if (!row) continue;
      const b = row.querySelector(`.score-cell-btn[data-player-index="${idx}"]`);
      if (b && b.dataset.score !== undefined && b.dataset.score !== '' && b.dataset.score !== 'out') {
        const pts = parseInt(b.dataset.score, 10);
        roundsCount++;
        if (pts === 0) wins++;
        else if (pts === 25) drops++;
        else if (pts === 40) midDrops++;
        else if (pts === 80) fullCounts++;
      }
    }

    const avg = roundsCount > 0 ? (totalScore / roundsCount).toFixed(1) : '0';

    return {
      name,
      idx,
      totalScore,
      wins,
      drops,
      midDrops,
      fullCounts,
      roundsCount,
      avg,
      isOut: currentEliminatedState[idx]
    };
  });

  // Calculate Awards
  const mvp = [...playerStats].sort((a, b) => b.wins - a.wins)[0];
  const dropMaster = [...playerStats].sort((a, b) => (b.drops + b.midDrops) - (a.drops + a.midDrops))[0];
  const fullKing = [...playerStats].sort((a, b) => b.fullCounts - a.fullCounts)[0];
  const bestAvg = [...playerStats].filter(p => !p.isOut).sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg))[0] || playerStats[0];

  statsHighlightsGrid.innerHTML = `
    <div class="stats-award-card">
      <div class="award-top">
        <span class="award-icon">👑</span>
        <span>Most Wins</span>
      </div>
      <div class="award-winner-name">${mvp && mvp.wins > 0 ? mvp.name : '—'}</div>
      <div class="award-stat-val">${mvp && mvp.wins > 0 ? `${mvp.wins} wins` : 'None yet'}</div>
    </div>
    <div class="stats-award-card">
      <div class="award-top">
        <span class="award-icon">🛡️</span>
        <span>Drop Master</span>
      </div>
      <div class="award-winner-name">${dropMaster && (dropMaster.drops + dropMaster.midDrops) > 0 ? dropMaster.name : '—'}</div>
      <div class="award-stat-val">${dropMaster && (dropMaster.drops + dropMaster.midDrops) > 0 ? `${dropMaster.drops + dropMaster.midDrops} drops` : 'None yet'}</div>
    </div>
    <div class="stats-award-card">
      <div class="award-top">
        <span class="award-icon">💥</span>
        <span>Full Counts (80s)</span>
      </div>
      <div class="award-winner-name">${fullKing && fullKing.fullCounts > 0 ? fullKing.name : '—'}</div>
      <div class="award-stat-val">${fullKing && fullKing.fullCounts > 0 ? `${fullKing.fullCounts} full counts` : 'None yet'}</div>
    </div>
    <div class="stats-award-card">
      <div class="award-top">
        <span class="award-icon">🎯</span>
        <span>Best Avg / Rnd</span>
      </div>
      <div class="award-winner-name">${bestAvg ? bestAvg.name : '—'}</div>
      <div class="award-stat-val">${bestAvg ? `${bestAvg.avg} pts/rnd` : '—'}</div>
    </div>
  `;

  // Leaderboard ranking list
  const sorted = [...playerStats].sort((a, b) => a.totalScore - b.totalScore);
  statsPlayersList.innerHTML = '';

  sorted.forEach((p, rank) => {
    const card = document.createElement('div');
    card.className = 'stats-player-card';
    card.innerHTML = `
      <div class="stats-player-header">
        <div class="stats-player-info-wrap">
          <span class="stats-rank-num ${rank === 0 ? 'rank-1' : ''}">${rank + 1}</span>
          <div class="player-avatar-badge avatar-color-${p.idx % 6}" style="width:26px;height:26px;font-size:0.75rem;">
            ${AVATAR_SUITS[p.idx % AVATAR_SUITS.length]}
          </div>
          <span class="stats-player-title">${p.name}</span>
        </div>
        <div class="stats-total-score ${p.isOut ? 'cell-running-total out' : ''}">
          ${p.isOut ? `OUT (${p.totalScore})` : `${p.totalScore} pts`}
        </div>
      </div>
      <div class="stats-metrics-grid">
        <div class="metric-item">
          <span class="metric-val" style="color: #15803d;">${p.wins}</span>
          <span class="metric-label">Wins (0)</span>
        </div>
        <div class="metric-item">
          <span class="metric-val" style="color: #c2410c;">${p.drops}</span>
          <span class="metric-label">Drops</span>
        </div>
        <div class="metric-item">
          <span class="metric-val" style="color: #b91c1c;">${p.fullCounts}</span>
          <span class="metric-label">80s</span>
        </div>
        <div class="metric-item">
          <span class="metric-val" style="color: #0f172a;">${p.avg}</span>
          <span class="metric-label">Avg/Rnd</span>
        </div>
      </div>
    `;
    statsPlayersList.appendChild(card);
  });

  modalStatsBackdrop.classList.add('open');
  modalStatsBackdrop.setAttribute('aria-hidden', 'false');
}

function closeStatsModal() {
  modalStatsBackdrop.classList.remove('open');
  modalStatsBackdrop.setAttribute('aria-hidden', 'true');
}

// ==========================================
// NEW FEATURE EVENT LISTENERS
// ==========================================

// Undo Round Event Listeners
if (btnUndoRound) btnUndoRound.addEventListener('click', openUndoRoundModal);
if (btnCancelUndo) btnCancelUndo.addEventListener('click', closeUndoRoundModal);
if (btnConfirmUndo) btnConfirmUndo.addEventListener('click', executeUndoRound);
if (btnCloseUndoModal) btnCloseUndoModal.addEventListener('click', closeUndoRoundModal);
if (modalConfirmUndoBackdrop) {
  modalConfirmUndoBackdrop.addEventListener('click', (e) => {
    if (e.target === modalConfirmUndoBackdrop) closeUndoRoundModal();
  });
}

// Re-join Event Listeners
if (btnCancelRejoin) btnCancelRejoin.addEventListener('click', closeRejoinModal);
if (btnConfirmRejoin) btnConfirmRejoin.addEventListener('click', executeRejoinPlayer);
if (btnCloseRejoinModal) btnCloseRejoinModal.addEventListener('click', closeRejoinModal);
if (modalRejoinBackdrop) {
  modalRejoinBackdrop.addEventListener('click', (e) => {
    if (e.target === modalRejoinBackdrop) closeRejoinModal();
  });
}

// Stats & Analytics Event Listeners
if (btnGameStats) btnGameStats.addEventListener('click', openStatsModal);
if (btnCloseStatsModal) btnCloseStatsModal.addEventListener('click', closeStatsModal);
if (btnShareStats) btnShareStats.addEventListener('click', shareOrCopySummary);
if (modalStatsBackdrop) {
  modalStatsBackdrop.addEventListener('click', (e) => {
    if (e.target === modalStatsBackdrop) closeStatsModal();
  });
}

// Victory Modal Event Listeners
if (btnShareVictory) btnShareVictory.addEventListener('click', shareOrCopySummary);
if (btnViewStatsFromVictory) {
  btnViewStatsFromVictory.addEventListener('click', () => {
    closeVictoryModal();
    openStatsModal();
  });
}
if (btnCloseVictory) btnCloseVictory.addEventListener('click', closeVictoryModal);
if (modalVictoryBackdrop) {
  modalVictoryBackdrop.addEventListener('click', (e) => {
    if (e.target === modalVictoryBackdrop) closeVictoryModal();
  });
}

// Escape key to close any active modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (scoreModalBackdrop.classList.contains('open')) closeScoreModal();
    if (modalRenameBackdrop.classList.contains('open')) closeRenameModal();
    if (modalSavedGamesBackdrop.classList.contains('open')) closeSavedGamesModal();
    if (modalConfirmNewBackdrop.classList.contains('open')) closeConfirmNewModal();
    if (modalBatchScoreBackdrop && modalBatchScoreBackdrop.classList.contains('open')) closeBatchScoreModal();
    if (modalConfirmUndoBackdrop && modalConfirmUndoBackdrop.classList.contains('open')) closeUndoRoundModal();
    if (modalRejoinBackdrop && modalRejoinBackdrop.classList.contains('open')) closeRejoinModal();
    if (modalStatsBackdrop && modalStatsBackdrop.classList.contains('open')) closeStatsModal();
    if (modalVictoryBackdrop && modalVictoryBackdrop.classList.contains('open')) closeVictoryModal();
  }
});

// Top Bar Actions
btnStartGame.addEventListener('click', startScoreboard);
btnBackSetup.addEventListener('click', backToSetup);
fabAddRound.addEventListener('click', addNewRoundRow);

// Initialize initial player setup & check saved games on load
renderPlayerInputs();
updateSavedGamesBadge();
