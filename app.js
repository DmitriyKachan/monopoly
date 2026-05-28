// ==========================================================================
// MAIN APP ROUTER & PLAY LOOP - MONOPOLY UKRAINE
// ==========================================================================

import { GameState, SPACE_TYPES, CHANCE_CARDS } from './game.js';
import { renderBoard, updatePlayerTokens, animatePlayerMovement, animateDiceRoll, renderPlayersHUD, updateGameLog, showPropertyModal, showChanceModal, showGameOverModal, renderShopScreen, showModal, hideModal } from './ui.js';
import { startMatchmakingSimulation, BotAI } from './multiplayer.js';
import { shopData } from './shop.js';

// Game state instance
let game = new GameState();
let isLocalGame = false;
let userProfile = { name: "Гість", username: "guest", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop" };

// Telegram WebApp Initialization
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    
    // Set headers color
    tg.setHeaderColor('#0b0f19');
    
    // Retrieve Telegram User parameters
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
    // Populate User HUD in Menu
    document.getElementById('user-name').innerText = userProfile.name;
    document.getElementById('user-avatar').src = userProfile.avatar;
    document.getElementById('user-rank').innerText = getRankTitle(shopData.stars);
    updateStarsBalances();

    // Fade out splash screen after 1.5s
    setTimeout(() => {
        switchScreen('screen-menu');
    }, 1500);

    // Setup Router Event Listeners
    setupMenuHandlers();
    setupBackButton();
});

function getRankTitle(stars) {
    if (stars >= 500) return "Олігарх України";
    if (stars >= 300) return "Венчурний Інвестор";
    if (stars >= 150) return "Власник Корпорації";
    return "Магнат початківець";
}

function updateStarsBalances() {
    document.getElementById('stars-balance').innerText = shopData.stars;
    document.getElementById('shop-stars-balance').innerText = shopData.stars;
}

// Router Screen Switcher
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.remove('active');
    });
    
    const activeScr = document.getElementById(screenId);
    activeScr.classList.add('active');

    // Update Telegram BackButton visibility
    if (tg && tg.BackButton) {
        if (screenId === 'screen-menu' || screenId === 'screen-splash') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
}

function setupBackButton() {
    // Web Back button
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen('screen-menu');
        });
    });

    // Telegram Back button integration
    if (tg && tg.BackButton) {
        tg.BackButton.onClick(() => {
            // Find current active screen
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id !== 'screen-menu') {
                if (activeScreen.id === 'screen-game') {
                    // Ask for verification before exiting game
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
    // Quick play
    document.getElementById('btn-quick-play').addEventListener('click', () => {
        isLocalGame = false;
        switchScreen('screen-lobby');
        runMatchmaking();
    });

    // Pass & Play
    document.getElementById('btn-pass-play').addEventListener('click', () => {
        isLocalGame = true;
        startNewGame([
            { name: userProfile.name, isBot: false, avatar: userProfile.avatar },
            { name: "Друг 1", isBot: false, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop" },
            { name: "Друг 2", isBot: false, avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop" }
        ]);
    });

    // Invite friends
    document.getElementById('btn-invite-friends').addEventListener('click', () => {
        if (tg) {
            // Check if share exists
            tg.shareToStory("https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop", {
                text: "Зіграй зі мною в українську Монополію в Telegram! 🇺🇦🏦",
                widget_link: {
                    url: "https://t.me/monopoly_ua_bot/app",
                    name: "Грати зараз"
                }
            });
        } else {
            // Standalone Clipboard copy fallback
            navigator.clipboard.writeText("https://t.me/monopoly_ua_bot/app");
            showModal("Запросити друзів", "<p>Посилання скопійовано! Надішліть його друзям у Telegram, щоб грати разом.</p>", [
                { text: "Чудово", class: "btn-primary" }
            ]);
        }
    });

    // Shop
    document.getElementById('btn-open-shop').addEventListener('click', () => {
        switchScreen('screen-shop');
        renderShopScreen(updateStarsBalances);
    });

    // Leaderboard
    document.getElementById('btn-open-ranks').addEventListener('click', () => {
        switchScreen('screen-leaderboard');
        loadLeaderboard();
    });

    // Rules
    document.getElementById('btn-open-rules').addEventListener('click', () => {
        switchScreen('screen-rules');
    });

    // Exit Game button in GameHUD
    document.getElementById('btn-game-quit').addEventListener('click', () => {
        showModal("Вихід з гри", "<p>Залишити ігрову кімнату?</p>", [
            { text: "Так, вийти", class: "btn-danger", onClick: () => switchScreen('screen-menu') },
            { text: "Скасувати", class: "btn-secondary" }
        ]);
    });

    // Leaderboard tab selector
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadLeaderboard(e.currentTarget.getAttribute('data-tab'));
        });
    });
}

// simulated matchmaking loading
let matchmakingCancelFn = null;
function runMatchmaking() {
    const listEl = document.getElementById('lobby-players-list');
    const statusEl = document.getElementById('matchmaking-status');
    
    // Clear list
    listEl.innerHTML = `
        <div class="lobby-player-card">
            <div class="player-card-info">
                <img src="${userProfile.avatar}" class="lobby-avatar connected">
                <span class="lobby-name">${userProfile.name} (Ви)</span>
            </div>
            <span class="lobby-status-text ready">Готовий</span>
        </div>
    `;
    statusEl.innerText = "Пошук гравців в мережі...";

    matchmakingCancelFn = startMatchmakingSimulation(
        (playerJoined) => {
            // Player joined callback
            const card = document.createElement('div');
            card.className = 'lobby-player-card';
            card.innerHTML = `
                <div class="player-card-info">
                    <img src="${playerJoined.avatar}" class="lobby-avatar connected">
                    <span class="lobby-name">${playerJoined.name}</span>
                </div>
                <span class="lobby-status-text ready">Підключено</span>
            `;
            listEl.appendChild(card);
            statusEl.innerText = "Гравців знайдено! Створення сесії...";
        },
        (allBots) => {
            // Ready callback
            statusEl.innerText = "Матч знайдено! Початок гри...";
            setTimeout(() => {
                const setupList = [{ name: userProfile.name, isBot: false, avatar: userProfile.avatar, tokenSkin: shopData.equippedToken }];
                allBots.forEach(bot => {
                    setupList.push({ name: bot.name, isBot: true, avatar: bot.avatar });
                });
                startNewGame(setupList);
            }, 1000);
        }
    );
}

// Start actual Monopoly game state loop
function startNewGame(playerList) {
    game.reset();
    
    const colors = ['cossack', 'cat', 'dumpling', 'sunflower']; // map to skins or basic
    playerList.forEach((p, idx) => {
        game.addPlayer(p.name, `p-color-${idx}`, p.avatar, p.isBot, p.tokenSkin || 'classic');
    });

    switchScreen('screen-game');
    
    // Render Board grid
    renderBoard(game, handleCellClick);
    renderPlayersHUD(game);
    updateGameLog(game);

    // Setup active game buttons
    document.getElementById('btn-roll-dice').disabled = false;
    document.getElementById('btn-end-turn').disabled = true;
    
    // Bind main action buttons
    // Remove previous listeners
    const rollBtn = document.getElementById('btn-roll-dice');
    const endTurnBtn = document.getElementById('btn-end-turn');
    
    rollBtn.onclick = null;
    endTurnBtn.onclick = null;

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
                if (game.currentPlayerIndex === 0 && !isLocalGame) {
                    const success = game.upgradeProperty(0, space.id);
                    if (success) {
                        renderBoard(game, handleCellClick);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                        hideModal();
                    } else {
                        alert("Недостатньо грошей для будівництва філії!");
                    }
                } else if (isLocalGame) {
                    // In local mode, active player can upgrade their own land
                    const activePIdx = game.currentPlayerIndex;
                    const success = game.upgradeProperty(activePIdx, space.id);
                    if (success) {
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

    // 1. Check if in Jail
    if (activePlayer.inJail) {
        showModal("Вихід з Укриття", "<p>Ви перебуваєте в укритті через повітряну тривогу. Оберіть дію:</p>", [
            {
                text: "Задонатити ₴500 волонтерам",
                class: "btn-primary",
                onClick: () => {
                    const success = game.tryGetOutJail(activePlayer.id, 'pay');
                    if (success) {
                        renderPlayersHUD(game);
                        updateGameLog(game);
                        rollBtn.disabled = false; // allow to roll movement now!
                    }
                }
            },
            {
                text: "Кинути кубики на дубль",
                class: "btn-secondary",
                onClick: () => {
                    const rollResult = game.tryGetOutJail(activePlayer.id, 'roll');
                    renderPlayersHUD(game);
                    updateGameLog(game);
                    
                    if (rollResult.success) {
                        // Out of jail and moved!
                        animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                            // Already moved inside tryGetOutJail
                            updatePlayerTokens(game);
                            resolveLandingSpace(activePlayer.id, activePlayer.position, rollResult.sum);
                        });
                    } else {
                        // Failed, end turn immediately
                        animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                            document.getElementById('btn-end-turn').disabled = false;
                        });
                    }
                }
            }
        ]);
        return;
    }

    // 2. Normal Roll
    const { d1, d2, sum } = game.rollDice();
    game.log(`${activePlayer.name} кинув кубики: ${d1}:${d2}`, 'system');
    
    animateDiceRoll(d1, d2, () => {
        const fromPos = activePlayer.position;
        // Start movement animation
        animatePlayerMovement(game, activePlayer.id, fromPos, sum, () => {
            // Passed start payout checking is inside game.js, but let's draw HUD updates
            renderPlayersHUD(game);
            
            // Resolve Landing Cell
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
            if (player.isBot) return; // bot handled in multiplayer.js

            showPropertyModal(
                space,
                () => {
                    // Buy confirm
                    const success = game.purchaseProperty(playerId, spaceId);
                    if (success) {
                        renderBoard(game, handleCellClick);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                    } else {
                        alert("Недостатньо коштів для придбання компанії!");
                    }
                    endTurnBtn.disabled = false;
                },
                () => {
                    // Buy decline
                    game.log(`${player.name} відмовився купувати ${space.name}`);
                    updateGameLog(game);
                    endTurnBtn.disabled = false;
                }
            );
        } else if (space.owner !== playerId) {
            // Pay rent
            const rent = game.payRent(playerId, spaceId, diceSum);
            renderPlayersHUD(game);
            updateGameLog(game);
            
            if (player.money < 0) {
                // Debt/Bankruptcy flow
                resolveUserDebt(playerId, rent);
            } else {
                endTurnBtn.disabled = false;
            }
        } else {
            // Own property landed
            endTurnBtn.disabled = false;
        }
    } else if (space.type === SPACE_TYPES.FREE_PARKING) {
        // Collect donation
        const claimed = game.claimFreeParking(playerId);
        renderPlayersHUD(game);
        updateGameLog(game);
        endTurnBtn.disabled = false;
    } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
        // Go to jail
        game.sendToJail(playerId);
        updatePlayerTokens(game);
        renderPlayersHUD(game);
        updateGameLog(game);
        endTurnBtn.disabled = false;
    } else if (space.type === SPACE_TYPES.CHANCE) {
        // Draw Chance Card
        const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        
        showChanceModal(card.text, () => {
            applyChanceCardAction(playerId, card);
        });
    } else {
        // Start or jail visiting
        endTurnBtn.disabled = false;
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
        resolveUserDebt(playerId, 0);
    } else {
        endTurnBtn.disabled = false;
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

        // Get owned assets with branches to sell
        const branchesToSell = game.spaces.filter(s => s.owner === playerId && s.branches > 0);
        branchesToSell.forEach(s => {
            const sellVal = Math.floor(s.branchCost * 0.5);
            itemsHtml += `
                <button class="btn btn-secondary" style="width:100%; display:flex; justify-content:space-between;" id="btn-sell-branch-${s.id}">
                    <span>Продати філію на ${s.name}</span><strong>+₴${sellVal}</strong>
                </button>
            `;
        });

        // Get owned assets without branches to sell property
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
                    // Landed space details
                    const currentSpace = game.spaces[player.position];
                    let beneficiaryId = null;
                    if (currentSpace.owner !== null && currentSpace.owner !== playerId) {
                        beneficiaryId = currentSpace.owner;
                    }
                    game.declareBankruptcy(playerId, beneficiaryId);
                    
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

        // Bind clicks
        branchesToSell.forEach(s => {
            document.getElementById(`btn-sell-branch-${s.id}`).onclick = () => {
                game.sellBranch(s.id);
                renderBoard(game, handleCellClick);
                renderPlayersHUD(game);
                updateGameLog(game);
                showDebtModal(); // redraw
            };
        });

        propsToSell.forEach(s => {
            document.getElementById(`btn-sell-prop-${s.id}`).onclick = () => {
                game.sellProperty(s.id);
                renderBoard(game, handleCellClick);
                renderPlayersHUD(game);
                updateGameLog(game);
                showDebtModal(); // redraw
            };
        });
    }

    showDebtModal();
}

// User finishes their roll turn
function handleUserEndTurn() {
    document.getElementById('btn-end-turn').disabled = true;

    // Check if only 1 active remains or turn limits exceeded
    if (game.isGameOver) {
        showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
        return;
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

// Coordinates turns routing (User vs Bots)
function processNextTurn() {
    const activePlayer = game.getCurrentPlayer();
    
    // UI marker update
    document.getElementById('current-player-name').innerText = activePlayer.name;

    if (activePlayer.isBot) {
        // Disable User controls
        document.getElementById('btn-roll-dice').disabled = true;
        document.getElementById('btn-end-turn').disabled = true;

        // Run bot turn simulation logic
        BotAI.handleTurn(
            game,
            activePlayer.id,
            (botLog) => {
                // Log action
                game.log(botLog);
                updateGameLog(game);
            },
            (action) => {
                // UI render callback
                if (action.type === 'roll') {
                    // Roll
                    animateDiceRoll(action.result.d1, action.result.d2, () => {});
                } else if (action.type === 'move') {
                    // Move token
                    updatePlayerTokens(game);
                } else if (action.type === 'buy' || action.type === 'pay_rent' || action.type === 'upgrade' || action.type === 'sell_branch' || action.type === 'sell_property' || action.type === 'claim_parking' || action.type === 'go_to_jail') {
                    renderBoard(game, handleCellClick);
                    renderPlayersHUD(game);
                } else if (action.type === 'chat_reaction') {
                    // Show emoji reaction bubble above bot's HUD card
                    showEmojiBubble(activePlayer.id, action.emoji);
                } else if (action.type === 'draw_chance') {
                    // Chance
                } else if (action.type === 'bankrupt') {
                    renderBoard(game, handleCellClick);
                    renderPlayersHUD(game);
                }
            },
            () => {
                // Completed callback
                if (game.isGameOver) {
                    showGameOverModal(game.rankings, () => switchScreen('screen-menu'));
                    return;
                }
                game.nextTurn();
                renderPlayersHUD(game);
                updateGameLog(game);
                processNextTurn(); // next
            }
        );
    } else {
        // Enable User controls
        document.getElementById('btn-roll-dice').disabled = false;
        document.getElementById('btn-end-turn').disabled = true;
        game.log(`Ваш хід (${activePlayer.name}). Кидайте кубики!`);
        updateGameLog(game);
    }
}

// WOW factor: Floating bot emoji bubble reactions
function showEmojiBubble(playerId, emoji) {
    // Find player HUD card
    const hudCards = document.querySelectorAll('.player-hud-card');
    const targetCard = hudCards[playerId];
    
    if (targetCard) {
        // Create bubble element
        const bubble = document.createElement('div');
        bubble.innerText = emoji;
        bubble.style.position = 'absolute';
        bubble.style.top = '-20px';
        bubble.style.left = '50%';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.background = 'rgba(255, 255, 255, 0.95)';
        bubble.style.color = '#000';
        bubble.style.border = '1px solid rgba(0,0,0,0.1)';
        bubble.style.padding = '0.2rem 0.5rem';
        bubble.style.borderRadius = '20px';
        bubble.style.fontSize = '1.1rem';
        bubble.style.zIndex = '500';
        bubble.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        bubble.style.animation = 'bubbleFloatUp 1.2s ease forwards';
        
        // Add dynamic floating keyframe style inline
        const style = document.createElement('style');
        style.innerText = `
            @keyframes bubbleFloatUp {
                0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -15px) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -20px) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -35px) scale(0.8); }
            }
        `;
        document.head.appendChild(style);

        targetCard.appendChild(bubble);
        setTimeout(() => {
            bubble.remove();
            style.remove();
        }, 1200);
    }
}

// Leaderboard Screen content generator
function loadLeaderboard(tab = 'weekly') {
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '';

    // Mock leader rankings rows
    let leaders = [
        { name: "@ivan_invest", worth: "₴18,500", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop" },
        { name: "@sveta_lviv", worth: "₴16,900", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop" },
        { name: "@andriy_lviv", worth: "₴14,200", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&auto=format&fit=crop" }
    ];

    if (tab === 'alltime') {
        leaders = [
            { name: "@dmytro_monopoly", worth: "₴95,000", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop" },
            { name: "@taras_capital", worth: "₴89,400", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&auto=format&fit=crop" },
            { name: "@olga_kiev", worth: "₴72,100", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop" },
            { name: "@maks_tg", worth: "₴68,300", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop" }
        ];
    }

    leaders.forEach((leader, idx) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        row.innerHTML = `
            <div class="leaderboard-row-left">
                <span class="row-rank">${tab === 'alltime' ? idx + 4 : idx + 4}</span>
                <img src="${leader.avatar}" class="row-avatar">
                <span class="row-name">${leader.name}</span>
            </div>
            <span class="row-worth">${leader.worth}</span>
        `;
        listEl.appendChild(row);
    });
}
