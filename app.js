// ==========================================================================
// MAIN APP ROUTER & PLAY LOOP - MONOPOLY UKRAINE (SIMPLIFIED MULTIPLAYER ONLY)
// ==========================================================================

import { GameState, SPACE_TYPES, CHANCE_CARDS } from './game.js';
import { renderBoard, updatePlayerTokens, animatePlayerMovement, animateDiceRoll, renderPlayersHUD, updateGameLog, showPropertyModal, showChanceModal, showGameOverModal, showModal, hideModal } from './ui.js';
import { MultiplayerManager } from './multiplayer.js';

// Game state instance
let game = new GameState();
let isMultiplayerGame = false;
const mp = new MultiplayerManager();
let userProfile = { name: "Гість", username: "guest", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop" };

// Telegram WebApp Initialization
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0b0f19');
    
    if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        userProfile.name = u.first_name + (u.last_name ? ' ' + u.last_name : '');
        userProfile.username = u.username || 'player';
        if (u.photo_url) {
            userProfile.avatar = u.photo_url;
        }
    }
}

// Global DOM setup
document.addEventListener("DOMContentLoaded", () => {
    // Populate User Profile
    document.getElementById('user-name').innerText = userProfile.name;
    document.getElementById('user-avatar').src = userProfile.avatar;

    // Fade out splash screen after 1.5s
    setTimeout(() => {
        switchScreen('screen-menu');
    }, 1500);

    setupMenuHandlers();
    setupBackButton();
});

// Router Screen Switcher
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.remove('active');
    });
    
    const activeScr = document.getElementById(screenId);
    activeScr.classList.add('active');

    if (tg && tg.BackButton) {
        if (screenId === 'screen-menu' || screenId === 'screen-splash') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
}

function setupBackButton() {
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen('screen-menu');
        });
    });

    if (tg && tg.BackButton) {
        tg.BackButton.onClick(() => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id !== 'screen-menu') {
                if (activeScreen.id === 'screen-game') {
                    showModal("Вихід з гри", "<p>Ви впевнені, що хочете вийти з поточної сесії? Ваш прогрес буде втрачено.</p>", [
                        { text: "Так, вийти", class: "btn-danger", onClick: () => switchScreen('screen-menu') },
                        { text: "Скасувати", class: "btn-secondary" }
                    ]);
                } else {
                    switchScreen('screen-menu');
                }
            }
        });
    }
}

// Menu Click Bindings
function setupMenuHandlers() {
    // Open Lobby
    document.getElementById('btn-quick-play').addEventListener('click', () => {
        isMultiplayerGame = false;
        switchScreen('screen-lobby');
        initLobbyScreen();
    });

    // Create Room
    document.getElementById('btn-create-lobby').addEventListener('click', () => {
        document.getElementById('lobby-modes').style.display = 'none';
        const activeRoomPanel = document.getElementById('lobby-room-active');
        activeRoomPanel.style.display = 'flex';
        
        document.getElementById('matchmaking-status').innerText = "Підключення до WSS сервера...";
        
        mp.connect(getWsUrl(), userProfile.name, userProfile.avatar, () => {
            document.getElementById('matchmaking-status').innerText = "Створення кімнати...";
            mp.createRoom(userProfile.name, userProfile.avatar);
        });

        mp.onPlayerUpdateCallback = (players) => {
            document.getElementById('matchmaking-status').innerText = "Очікування друзів...";
            document.getElementById('display-room-code').innerText = mp.roomCode;
            renderLobbyPlayers(players);
            
            const startBtn = document.getElementById('btn-start-multiplayer');
            if (players.length >= 2) {
                startBtn.style.display = 'block';
            } else {
                startBtn.style.display = 'none';
            }
        };

        mp.onGameStartCallback = () => {
            isMultiplayerGame = true;
            startNewGame(mp.playersList.map(p => ({
                name: p.name,
                isBot: false,
                avatar: p.avatar
            })));
        };

        mp.onActionCallback = handleRemoteAction;
    });

    // Join Room panel
    document.getElementById('btn-join-lobby-init').addEventListener('click', () => {
        document.getElementById('lobby-modes').style.display = 'none';
        document.getElementById('lobby-code-input').style.display = 'flex';
    });

    // Cancel Join
    document.getElementById('btn-cancel-join').addEventListener('click', () => {
        document.getElementById('lobby-code-input').style.display = 'none';
        document.getElementById('lobby-modes').style.display = 'flex';
    });

    // Join Room Confirm
    document.getElementById('btn-join-lobby-confirm').addEventListener('click', () => {
        const codeInput = document.getElementById('input-room-code');
        const code = codeInput.value.trim();
        if (code.length !== 4) {
            alert("Код кімнати має складатися з 4 цифр!");
            return;
        }

        document.getElementById('lobby-code-input').style.display = 'none';
        const activeRoomPanel = document.getElementById('lobby-room-active');
        activeRoomPanel.style.display = 'flex';
        
        document.getElementById('matchmaking-status').innerText = `Підключення до кімнати ${code}...`;

        mp.connect(getWsUrl(), userProfile.name, userProfile.avatar, () => {
            mp.joinRoom(code, userProfile.name, userProfile.avatar);
        });

        mp.onPlayerUpdateCallback = (players) => {
            document.getElementById('matchmaking-status').innerText = "Очікування старту від організатора...";
            document.getElementById('display-room-code').innerText = mp.roomCode;
            renderLobbyPlayers(players);
            document.getElementById('btn-start-multiplayer').style.display = 'none';
        };

        mp.onGameStartCallback = () => {
            isMultiplayerGame = true;
            startNewGame(mp.playersList.map(p => ({
                name: p.name,
                isBot: false,
                avatar: p.avatar
            })));
        };

        mp.onActionCallback = handleRemoteAction;
    });

    // Start multiplayer by Host
    document.getElementById('btn-start-multiplayer').addEventListener('click', () => {
        mp.startGame();
    });

    // Invite friends
    document.getElementById('btn-invite-friends').addEventListener('click', () => {
        const botUsername = "queuecomfybot";
        if (tg) {
            tg.shareToStory("https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop", {
                text: "Зіграй зі мною в українську Монополію в Telegram! 🇺🇦🏦",
                widget_link: {
                    url: `https://t.me/${botUsername}/app`,
                    name: "Грати зараз"
                }
            });
        } else {
            navigator.clipboard.writeText(`https://t.me/${botUsername}/app`);
            showModal("Запросити друзів", "<p>Посилання на бота скопійовано! Надішліть його друзям, щоб вони приєдналися.</p>", [
                { text: "Чудово", class: "btn-primary" }
            ]);
        }
    });

    // Exit Game in HUD
    document.getElementById('btn-game-quit').addEventListener('click', () => {
        showModal("Вихід з гри", "<p>Залишити ігрову кімнату?</p>", [
            { 
                text: "Так, вийти", 
                class: "btn-danger", 
                onClick: () => {
                    if (isMultiplayerGame) mp.disconnect();
                    switchScreen('screen-menu');
                } 
            },
            { text: "Скасувати", class: "btn-secondary" }
        ]);
    });
}

// Reset Lobby UI panel state
function initLobbyScreen() {
    document.getElementById('lobby-modes').style.display = 'flex';
    document.getElementById('lobby-code-input').style.display = 'none';
    document.getElementById('lobby-room-active').style.display = 'none';
    document.getElementById('btn-start-multiplayer').style.display = 'none';
    document.getElementById('lobby-players-list').innerHTML = '';
    
    if (mp) mp.disconnect();
}

// Render player list cards in lobby
function renderLobbyPlayers(players) {
    const listEl = document.getElementById('lobby-players-list');
    listEl.innerHTML = '';

    players.forEach(p => {
        const card = document.createElement('div');
        card.className = 'lobby-player-card';
        card.innerHTML = `
            <div class="player-card-info">
                <img src="${p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop'}" class="lobby-avatar connected">
                <span class="lobby-name">${p.name} ${p.name === userProfile.name ? '(Ви)' : ''}</span>
            </div>
            <span class="lobby-status-text ready">${p.is_host ? 'Хост' : 'Гравець'}</span>
        `;
        listEl.appendChild(card);
    });
}

function getWsUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ws_server')) {
        return urlParams.get('ws_server');
    }
    return "ws://localhost:8765";
}

// Start Monopoly game state loop
function startNewGame(playerList) {
    game.reset();
    
    playerList.forEach((p, idx) => {
        game.addPlayer(p.name, `p-color-${idx}`, p.avatar, false);
    });

    switchScreen('screen-game');
    
    renderBoard(game, handleCellClick);
    renderPlayersHUD(game);
    updateGameLog(game);

    document.getElementById('btn-roll-dice').disabled = false;
    document.getElementById('btn-end-turn').disabled = true;
    
    const rollBtn = document.getElementById('btn-roll-dice');
    const endTurnBtn = document.getElementById('btn-end-turn');
    
    rollBtn.onclick = handleUserRoll;
    endTurnBtn.onclick = handleUserEndTurn;

    game.log("Гра почалася! Ваш хід.");
    updateGameLog(game);
}

// Click on cell shows deed card properties details
function handleCellClick(index) {
    const space = game.spaces[index];
    if (space.type === SPACE_TYPES.PROPERTY || space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY) {
        const isSelf = space.owner === game.currentPlayerIndex;
        showPropertyModal(
            space,
            () => {}, // buy handler (only triggered inside actual landing workflow)
            () => {}, 
            isSelf,
            () => {
                // Upgrade handler
                if (isMultiplayerGame && game.currentPlayerIndex === mp.playerId && isSelf) {
                    const success = game.upgradeProperty(mp.playerId, space.id);
                    if (success) {
                        mp.sendAction({ type: 'upgrade', playerId: mp.playerId, spaceId: space.id });
                        renderBoard(game, handleCellClick);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                        hideModal();
                    } else {
                        alert("Недостатньо грошей для будівництва філії!");
                    }
                }
            }
        );
    }
}

// User Roll Turn
function handleUserRoll() {
    const rollBtn = document.getElementById('btn-roll-dice');
    rollBtn.disabled = true;

    const activePlayer = game.getCurrentPlayer();

    // Check if in Jail
    if (activePlayer.inJail) {
        showModal("Вихід з Укриття", "<p>Ви перебуваєте в укритті через повітряну тривогу. Оберіть дію:</p>", [
            {
                text: "Задонатити ₴500 волонтерам",
                class: "btn-primary",
                onClick: () => {
                    const success = game.tryGetOutJail(activePlayer.id, 'pay');
                    if (success) {
                        if (isMultiplayerGame) {
                            mp.sendAction({ type: 'jail_free', method: 'pay', playerId: activePlayer.id });
                        }
                        renderPlayersHUD(game);
                        updateGameLog(game);
                        rollBtn.disabled = false; // allow to roll movement now
                    }
                }
            },
            {
                text: "Кинути кубики на дубль",
                class: "btn-secondary",
                onClick: () => {
                    const rollResult = game.tryGetOutJail(activePlayer.id, 'roll');
                    if (isMultiplayerGame) {
                        mp.sendAction({ type: 'jail_free', method: 'roll', playerId: activePlayer.id, result: rollResult });
                    }
                    renderPlayersHUD(game);
                    updateGameLog(game);
                    
                    if (rollResult.success) {
                        animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                            updatePlayerTokens(game);
                            resolveLandingSpace(activePlayer.id, activePlayer.position, rollResult.sum);
                        });
                    } else {
                        animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                            document.getElementById('btn-end-turn').disabled = false;
                        });
                    }
                }
            }
        ]);
        return;
    }

    // Normal Roll
    const { d1, d2, sum } = game.rollDice();
    game.log(`${activePlayer.name} кинув кубики: ${d1}:${d2}`, 'system');
    
    if (isMultiplayerGame) {
        mp.sendAction({ type: 'roll', d1, d2, sum });
    }

    const fromPos = activePlayer.position;
    game.movePlayer(activePlayer.id, sum);

    animateDiceRoll(d1, d2, () => {
        animatePlayerMovement(game, activePlayer.id, fromPos, sum, () => {
            renderPlayersHUD(game);
            resolveLandingSpace(activePlayer.id, activePlayer.position, sum);
        });
    });
}

// Landing space checker and action triggers
function resolveLandingSpace(playerId, spaceId, diceSum) {
    const player = game.players.find(p => p.id === playerId);
    const space = game.spaces[spaceId];
    const endTurnBtn = document.getElementById('btn-end-turn');

    if (space.type === SPACE_TYPES.PROPERTY || space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY) {
        if (space.owner === null) {
            // Unowned: Offer purchase
            if (isMultiplayerGame && playerId !== mp.playerId) {
                // Remote player landed. Wait for action.
                return;
            }

            showPropertyModal(
                space,
                () => {
                    const success = game.purchaseProperty(playerId, spaceId);
                    if (success) {
                        if (isMultiplayerGame) {
                            mp.sendAction({ type: 'buy', playerId, spaceId });
                        }
                        renderBoard(game, handleCellClick);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                    } else {
                        alert("Недостатньо коштів для придбання компанії!");
                    }
                    endTurnBtn.disabled = false;
                },
                () => {
                    game.log(`${player.name} відмовився купувати ${space.name}`);
                    updateGameLog(game);
                    endTurnBtn.disabled = false;
                }
            );
        } else if (space.owner !== playerId) {
            // Pay rent
            const rent = game.payRent(playerId, spaceId, diceSum);
            if (isMultiplayerGame && playerId === mp.playerId) {
                mp.sendAction({ type: 'pay_rent', playerId, spaceId });
            }
            renderPlayersHUD(game);
            updateGameLog(game);
            
            if (player.money < 0) {
                if (isMultiplayerGame) {
                    if (playerId === mp.playerId) {
                        resolveUserDebt(playerId, rent);
                    }
                } else {
                    resolveUserDebt(playerId, rent);
                }
            } else {
                if (isMultiplayerGame) {
                    if (playerId === mp.playerId) endTurnBtn.disabled = false;
                } else {
                    endTurnBtn.disabled = false;
                }
            }
        } else {
            // Own property landed
            if (isMultiplayerGame) {
                if (playerId === mp.playerId) endTurnBtn.disabled = false;
            } else {
                endTurnBtn.disabled = false;
            }
        }
    } else if (space.type === SPACE_TYPES.FREE_PARKING) {
        const claimed = game.claimFreeParking(playerId);
        if (isMultiplayerGame && claimed > 0 && playerId === mp.playerId) {
            mp.sendAction({ type: 'claim_parking', playerId, amount: claimed });
        }
        renderPlayersHUD(game);
        updateGameLog(game);
        if (isMultiplayerGame) {
            if (playerId === mp.playerId) endTurnBtn.disabled = false;
        } else {
            endTurnBtn.disabled = false;
        }
    } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
        game.sendToJail(playerId);
        if (isMultiplayerGame && playerId === mp.playerId) {
            mp.sendAction({ type: 'go_to_jail', playerId });
        }
        updatePlayerTokens(game);
        renderPlayersHUD(game);
        updateGameLog(game);
        if (isMultiplayerGame) {
            if (playerId === mp.playerId) endTurnBtn.disabled = false;
        } else {
            endTurnBtn.disabled = false;
        }
    } else if (space.type === SPACE_TYPES.CHANCE) {
        if (isMultiplayerGame) {
            if (playerId === mp.playerId) {
                const cardIndex = Math.floor(Math.random() * CHANCE_CARDS.length);
                const card = CHANCE_CARDS[cardIndex];
                mp.sendAction({ type: 'chance_card', playerId, cardIndex });
                showChanceModal(card.text, () => {
                    applyChanceCardAction(playerId, card);
                });
            }
        } else {
            const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
            showChanceModal(card.text, () => {
                applyChanceCardAction(playerId, card);
            });
        }
    } else {
        if (isMultiplayerGame) {
            if (playerId === mp.playerId) endTurnBtn.disabled = false;
        } else {
            endTurnBtn.disabled = false;
        }
    }
}

// Chance card evaluator
function applyChanceCardAction(playerId, card) {
    const player = game.players.find(p => p.id === playerId);
    const endTurnBtn = document.getElementById('btn-end-turn');

    if (card.action === 'money') {
        player.money += card.amount;
        if (card.amount > 0) {
            game.log(`${player.name} отримав ₴${card.amount} від картки Шанс`, 'gain');
        } else {
            game.log(`${player.name} втратив ₴${Math.abs(card.amount)} від картки Шанс`, 'pay');
        }
    } else if (card.action === 'tax') {
        game.payTax(playerId, card.amount);
    } else if (card.action === 'gotojail') {
        game.sendToJail(playerId);
        updatePlayerTokens(game);
    } else if (card.action === 'move') {
        player.position = card.target;
        if (card.target === 0) {
            player.money += 2000;
            game.log(`${player.name} пройшов Старт і отримав ₴2,000`, 'gain');
        }
        updatePlayerTokens(game);
    }

    renderPlayersHUD(game);
    updateGameLog(game);

    if (player.money < 0) {
        if (isMultiplayerGame) {
            if (playerId === mp.playerId) {
                resolveUserDebt(playerId, 0);
            }
        } else {
            resolveUserDebt(playerId, 0);
        }
    } else {
        if (isMultiplayerGame) {
            if (playerId === mp.playerId) endTurnBtn.disabled = false;
        } else {
            endTurnBtn.disabled = false;
        }
    }
}

// Debt Resolution Modal loop (locks user until debt resolved or bankrupt)
function resolveUserDebt(playerId, rentAmount) {
    const player = game.players.find(p => p.id === playerId);
    const endTurnBtn = document.getElementById('btn-end-turn');

    function showDebtModal() {
        const debt = Math.abs(player.money);
        let itemsHtml = `
            <div class="chance-popup-card" style="border-color: var(--color-danger); box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);">
                <div class="chance-icon" style="color: var(--color-danger);"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                <h4 class="chance-title">Погашення боргу</h4>
                <p class="chance-text">Ви маєте борг перед банком/суперником у розмірі <strong>₴${debt}</strong>. Продайте філії або активи, щоб покрити борг.</p>
            </div>
            <div class="shop-grid" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
        `;

        const branchesToSell = game.spaces.filter(s => s.owner === playerId && s.branches > 0);
        branchesToSell.forEach(s => {
            const sellVal = Math.floor(s.branchCost * 0.5);
            itemsHtml += `
                <button class="btn btn-secondary" style="width:100%; display:flex; justify-content:space-between;" id="btn-sell-branch-${s.id}">
                    <span>Продати філію на ${s.name}</span><strong>+₴${sellVal}</strong>
                </button>
            `;
        });

        const propsToSell = game.spaces.filter(s => s.owner === playerId && (!s.branches || s.branches === 0));
        propsToSell.forEach(s => {
            const sellVal = Math.floor(s.price * 0.5);
            itemsHtml += `
                <button class="btn btn-secondary" style="width:100%; display:flex; justify-content:space-between;" id="btn-sell-prop-${s.id}">
                    <span>Продати компанію ${s.name}</span><strong>+₴${sellVal}</strong>
                </button>
            `;
        });

        if (branchesToSell.length === 0 && propsToSell.length === 0) {
            itemsHtml += `<p style="text-align:center; color:var(--text-muted);">У вас немає майна для продажу!</p>`;
        }

        itemsHtml += `</div>`;

        const buttons = [];
        if (player.money >= 0) {
            buttons.push({
                text: "Погасити борг",
                class: "btn-primary",
                onClick: () => {
                    renderPlayersHUD(game);
                    updateGameLog(game);
                    endTurnBtn.disabled = false;
                }
            });
        } else {
            buttons.push({
                text: "Оголосити Банкрутство 💥",
                class: "btn-danger",
                onClick: () => {
                    const currentSpace = game.spaces[player.position];
                    let beneficiaryId = null;
                    if (currentSpace.owner !== null && currentSpace.owner !== playerId) {
                        beneficiaryId = currentSpace.owner;
                    }
                    game.declareBankruptcy(playerId, beneficiaryId);
                    
                    if (isMultiplayerGame) {
                        mp.sendAction({ type: 'bankrupt', playerId, beneficiaryId });
                    }
                    
                    renderBoard(game, handleCellClick);
                    renderPlayersHUD(game);
                    updateGameLog(game);
                    
                    if (game.isGameOver) {
                        showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
                    } else {
                        endTurnBtn.disabled = false;
                    }
                }
            });
        }

        showModal("Нестача коштів!", itemsHtml, buttons);

        branchesToSell.forEach(s => {
            document.getElementById(`btn-sell-branch-${s.id}`).onclick = () => {
                game.sellBranch(s.id);
                if (isMultiplayerGame) {
                    mp.sendAction({ type: 'sell_branch', playerId, spaceId: s.id });
                }
                renderBoard(game, handleCellClick);
                renderPlayersHUD(game);
                updateGameLog(game);
                showDebtModal();
            };
        });

        propsToSell.forEach(s => {
            document.getElementById(`btn-sell-prop-${s.id}`).onclick = () => {
                game.sellProperty(s.id);
                if (isMultiplayerGame) {
                    mp.sendAction({ type: 'sell_property', playerId, spaceId: s.id });
                }
                renderBoard(game, handleCellClick);
                renderPlayersHUD(game);
                updateGameLog(game);
                showDebtModal();
            };
        });
    }

    showDebtModal();
}

// User finishes their roll turn
function handleUserEndTurn() {
    document.getElementById('btn-end-turn').disabled = true;

    if (game.isGameOver) {
        showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
        return;
    }

    if (isMultiplayerGame) {
        mp.sendAction({ type: 'end_turn', playerId: game.currentPlayerIndex });
    }

    game.nextTurn();
    renderPlayersHUD(game);
    updateGameLog(game);

    if (game.isGameOver) {
        showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
        return;
    }

    processNextTurn();
}

// Coordinates turns routing (User vs User only)
function processNextTurn() {
    const activePlayer = game.getCurrentPlayer();
    document.getElementById('current-player-name').innerText = activePlayer.name;

    if (isMultiplayerGame) {
        document.getElementById('btn-roll-dice').disabled = true;
        document.getElementById('btn-end-turn').disabled = true;

        if (activePlayer.id === mp.playerId) {
            document.getElementById('btn-roll-dice').disabled = false;
            game.log(`Ваш хід (${activePlayer.name}). Кидайте кубики!`);
            updateGameLog(game);
        } else {
            game.log(`Очікування ходу гравця ${activePlayer.name}...`);
            updateGameLog(game);
        }
        return;
    }
}

// Handler for remote events sent over WebSockets
function handleRemoteAction(action) {
    console.log("Remote action received:", action);
    const endTurnBtn = document.getElementById('btn-end-turn');
    
    if (!game || !game.players || game.players.length === 0) return;

    const playerId = action.playerId !== undefined ? action.playerId : game.currentPlayerIndex;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    switch (action.type) {
        case 'roll':
            game.log(`${player.name} кинув кубики: ${action.d1}:${action.d2}`, 'system');
            const fromPos = player.position;
            game.movePlayer(playerId, action.sum);
            animateDiceRoll(action.d1, action.d2, () => {
                animatePlayerMovement(game, playerId, fromPos, action.sum, () => {
                    renderPlayersHUD(game);
                    resolveLandingSpace(playerId, player.position, action.sum);
                });
            });
            break;

        case 'buy':
            game.purchaseProperty(playerId, action.spaceId);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            break;

        case 'upgrade':
            game.upgradeProperty(playerId, action.spaceId);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            break;

        case 'pay_rent':
            break;

        case 'claim_parking':
            game.claimFreeParking(playerId);
            renderPlayersHUD(game);
            updateGameLog(game);
            break;

        case 'jail_free':
            if (action.method === 'pay') {
                player.money -= 500;
                game.freeParkingCash += 500;
                player.inJail = false;
                player.jailTurns = 0;
                game.log(`${player.name} задонатив ₴500 волонтерам і вийшов з укриття`, 'gain');
                renderPlayersHUD(game);
                updateGameLog(game);
            } else if (action.method === 'roll') {
                const res = action.result;
                if (res.success) {
                    player.inJail = false;
                    player.jailTurns = 0;
                    if (res.forced) {
                        player.money -= 500;
                        game.freeParkingCash += 500;
                        game.log(`${player.name} відбув тривогу 2 ходи, сплатив автоматичний збір ₴500 і вийшов з укриття`, 'gain');
                    } else {
                        game.log(`${player.name} викинув дубль (${res.d1}:${res.d2}) та вийшов з укриття безкоштовно!`, 'gain');
                    }
                    animateDiceRoll(res.d1, res.d2, () => {
                        game.movePlayer(playerId, res.sum);
                        updatePlayerTokens(game);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                        resolveLandingSpace(playerId, player.position, res.sum);
                    });
                } else {
                    player.jailTurns++;
                    game.log(`${player.name} кинув кубики (${res.d1}:${res.d2}) та не викинув дубль. Залишається в укритті`, 'system');
                    animateDiceRoll(res.d1, res.d2, () => {
                        renderPlayersHUD(game);
                        updateGameLog(game);
                    });
                }
            }
            break;

        case 'chance_card':
            const card = CHANCE_CARDS[action.cardIndex];
            showChanceModal(`${player.name} витягнув картку Шанс:\n\n${card.text}`, () => {
                applyChanceCardAction(playerId, card);
            });
            break;

        case 'sell_branch':
            game.sellBranch(action.spaceId);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            break;

        case 'sell_property':
            game.sellProperty(action.spaceId);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            break;

        case 'bankrupt':
            game.declareBankruptcy(playerId, action.beneficiaryId);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            if (game.isGameOver) {
                showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
            }
            break;

        case 'end_turn':
            game.nextTurn();
            renderPlayersHUD(game);
            updateGameLog(game);
            if (game.isGameOver) {
                showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
            } else {
                processNextTurn();
            }
            break;
    }
}
