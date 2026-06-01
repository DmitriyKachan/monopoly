// ==========================================================================
// MAIN APP ROUTER & PLAY LOOP - MONOPOLY UKRAINE (SIMPLIFIED MULTIPLAYER ONLY)
// ==========================================================================

import { GameState, SPACE_TYPES, CHANCE_CARDS } from './game.js';
import { renderBoard, updatePlayerTokens, animatePlayerMovement, animateDiceRoll, renderPlayersHUD, updateGameLog, showPropertyModal, showChanceModal, showGameOverModal, showModal, hideModal, setPlayerClickCallback, triggerConfetti } from './ui.js';
import { MultiplayerManager } from './multiplayer.js';

// Game state instance
let game = new GameState();
let isMultiplayerGame = false;
const mp = new MultiplayerManager();

mp.onPlayerLeftCallback = (name) => {
    game.log(`⚠️ Гравець ${name} залишив гру!`, 'system');
    updateGameLog(game);
    
    showModal("Гравець вийшов з гри ⚠️", `<p>Гравець <strong>${name}</strong> залишив ігрову сесію.</p>`, [
        { text: "Зрозуміло", class: "btn-secondary" }
    ]);
    
    const playerObj = game.players.find(p => p.name === name);
    if (playerObj && !playerObj.isBankrupt) {
        game.declareBankruptcy(playerObj.id, null);
        renderBoard(game, handleCellClick);
        renderPlayersHUD(game);
    }
};

let userProfile = { name: "Гість", username: "guest", avatar: "assets/cossack_tycoon.png", frame: null, stats: { games: 0, wins: 0 } };

// Ссылка на вашу банку Монобанка для донатов (замените YOUR_JAR_ID на ваш ID банки)
const DONATE_URL = "https://send.monobank.ua/jar/2rhzs3ebtE";

// Telegram WebApp Initialization
const tg = window.Telegram?.WebApp;

// AdsGram Configuration (Rewarded Video Ads)
const ADSGRAM_BLOCK_ID = "33680"; 
let AdController = null;
let activeAdTimeout = null;

// Determine if we should run AdsGram in debug (testing) mode.
// We enable debug mode if:
// 1. Host is localhost/127.0.0.1 (local testing)
// 2. URL query contains "debug_ad=true" or "debug=true"
// 3. Platform is desktop/web or we are outside native Telegram mobile (to prevent no-fill errors on PC)
const urlParams = new URLSearchParams(window.location.search);
const isDebugAd = urlParams.has('debug_ad') || 
                  urlParams.get('debug') === 'true' || 
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';

function initializeAdsGram() {
    if (window.Adsgram && !AdController) {
        AdController = window.Adsgram.init({
            blockId: ADSGRAM_BLOCK_ID,
            debug: isDebugAd,
            debugConsole: isDebugAd
        });

        // Register event listeners to override the default AdsGram built-in error/no-fill modals.
        // Doing this will prevent the duplicate double-modal issue.
        AdController.addEventListener("onBannerNotFound", (res) => {
            console.warn("AdsGram Event (onBannerNotFound): No ads available", res);
        });
        AdController.addEventListener("onError", (res) => {
            console.error("AdsGram Event (onError):", res);
        });
        AdController.addEventListener("onNonStopShow", (res) => {
            console.warn("AdsGram Event (onNonStopShow):", res);
        });
        AdController.addEventListener("onTooLongSession", (res) => {
            console.warn("AdsGram Event (onTooLongSession):", res);
        });

        // Clear loading safety timeout as soon as the ad successfully starts playing
        AdController.addEventListener("onStart", () => {
            console.log("AdsGram Event (onStart): Ad started playing, clearing safety timeout.");
            if (activeAdTimeout) {
                clearTimeout(activeAdTimeout);
                activeAdTimeout = null;
            }
        });
        
        console.log(`AdsGram initialized: blockId=${ADSGRAM_BLOCK_ID}, debug=${isDebugAd}`);
    }
}

// Initial attempt to load if script is loaded early
initializeAdsGram();

// Cooldown settings (15 minutes in milliseconds)
const AD_COOLDOWN_MS = 15 * 60 * 1000;

function getAdRewardRemainingTime() {
    const lastRewarded = localStorage.getItem('last_ad_reward_time');
    if (!lastRewarded) return 0;
    const elapsed = Date.now() - parseInt(lastRewarded, 10);
    const remaining = AD_COOLDOWN_MS - elapsed;
    return remaining > 0 ? remaining : 0;
}

function updateAdButtonText() {
    const btnWatchAd = document.getElementById('btn-watch-ad');
    if (!btnWatchAd) return;
    const btnText = btnWatchAd.querySelector('.btn-text');
    if (!btnText) return;

    const remaining = getAdRewardRemainingTime();
    if (remaining > 0) {
        const remainingMin = Math.ceil(remaining / 60000);
        btnText.innerText = `Підтримати рекламою 📺 (Бонус через ${remainingMin} хв)`;
    } else {
        btnText.innerText = "Бонус за рекламу 📺 (+1.5M ₴)";
    }
}

// Load custom profile if saved, otherwise load from Telegram
const savedProfile = localStorage.getItem('custom_user_profile');
if (savedProfile) {
    try {
        const parsed = JSON.parse(savedProfile);
        userProfile.name = parsed.name || userProfile.name;
        userProfile.username = parsed.username || userProfile.username;
        userProfile.avatar = parsed.avatar || userProfile.avatar;
        userProfile.frame = parsed.frame || null;
        userProfile.stats = parsed.stats || { games: 0, wins: 0 };
    } catch (e) {
        console.error("Error parsing saved profile", e);
    }
}

function getSyncedAvatar() {
    return userProfile.avatar + (userProfile.frame ? '|' + userProfile.frame : '');
}

function updateUserAvatarFrames() {
    const menuContainer = document.getElementById('user-avatar-container');
    if (menuContainer) {
        menuContainer.className = 'avatar-container';
        if (userProfile.frame) {
            menuContainer.classList.add(`frame-${userProfile.frame}`);
        }
    }
    const cabinetContainer = document.getElementById('profile-avatar-container');
    if (cabinetContainer) {
        cabinetContainer.className = 'avatar-container';
        if (userProfile.frame) {
            cabinetContainer.classList.add(`frame-${userProfile.frame}`);
        }
    }
} else if (tg && tg.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    userProfile.name = u.first_name + (u.last_name ? ' ' + u.last_name : '');
    userProfile.username = u.username || 'player';
    if (u.photo_url) {
        userProfile.avatar = u.photo_url;
    }
}

if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0b0f19');
}

// Global DOM setup
document.addEventListener("DOMContentLoaded", () => {
    // Populate User Profile
    document.getElementById('user-name').innerText = userProfile.name;
    document.getElementById('user-avatar').src = userProfile.avatar;
    updateUserAvatarFrames();

    // Setup Frames Shop button
    const shopBtn = document.getElementById('btn-open-shop');
    if (shopBtn) {
        shopBtn.onclick = showFrameShopModal;
    }

    // Set callback for player HUD trading clicks
    setPlayerClickCallback(handlePlayerClick);

    // Check for startapp parameters (auto-joining room)
    let hasStartParam = false;
    if (tg) {
        const startParam = tg.initDataUnsafe?.start_param;
        if (startParam && startParam.length === 4) {
            hasStartParam = true;
            autoJoinRoomByCode(startParam);
        }
    }

    // Fade out splash screen after 1.5s
    setTimeout(() => {
        if (!hasStartParam) {
            switchScreen('screen-menu');
        }
    }, 1500);

    setupMenuHandlers();
    setupBackButton();

    // Setup Navigation Tabs, Theme and Profile editing
    setupMenuTabs();
    initTheme();
    setupProfileCustomization();
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

// Auto-join room helper (for Telegram startapp redirect links)
function autoJoinRoomByCode(code) {
    switchScreen('screen-lobby');
    document.getElementById('lobby-modes').style.display = 'none';
    document.getElementById('lobby-code-input').style.display = 'none';
    const activeRoomPanel = document.getElementById('lobby-room-active');
    activeRoomPanel.style.display = 'flex';
    
    document.getElementById('matchmaking-status').innerText = `Підключення до кімнати ${code}...`;

    mp.connect(getWsUrl(), userProfile.name, getSyncedAvatar(), () => {
        mp.joinRoom(code, userProfile.name, getSyncedAvatar());
    });

    mp.onPlayerUpdateCallback = (players) => {
        document.getElementById('matchmaking-status').innerText = "Очікування старту від хоста...";
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
}

// Create Room Workflow helper (handles normal creation and direct TG invitation creation)
function createRoomWorkflow(autoShare = false) {
    switchScreen('screen-lobby');
    document.getElementById('lobby-modes').style.display = 'none';
    document.getElementById('lobby-code-input').style.display = 'none';
    const activeRoomPanel = document.getElementById('lobby-room-active');
    activeRoomPanel.style.display = 'flex';
    
    document.getElementById('matchmaking-status').innerText = "Підключення до WSS сервера...";
    
    mp.connect(getWsUrl(), userProfile.name, getSyncedAvatar(), () => {
        document.getElementById('matchmaking-status').innerText = "Створення кімнати...";
        mp.createRoom(userProfile.name, getSyncedAvatar());
    });

    let shareLinkOpened = false;

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

        if (autoShare && mp.roomCode && !shareLinkOpened) {
            shareLinkOpened = true;
            const botUsername = "queuecomfybot";
            const shareUrl = `https://t.me/${botUsername}/app?startapp=${mp.roomCode}`;
            const shareText = `Приєднуйся до моєї гри в українську Монополію! 🇺🇦🏦 Код кімнати: ${mp.roomCode}`;
            const telegramShareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

            if (tg) {
                tg.openTelegramLink(telegramShareLink);
            } else {
                navigator.clipboard.writeText(shareUrl);
                showModal("Запросити друзів", `<p>Код кімнати: <strong>${mp.roomCode}</strong>. Посилання скопійовано! Надішліть його другу.</p>`, [
                    { text: "Чудово", class: "btn-primary" }
                ]);
            }
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

    // Play with Bot
    document.getElementById('btn-play-bot').addEventListener('click', () => {
        isMultiplayerGame = false;
        startNewGame([
            { name: userProfile.name, isBot: false, avatar: getSyncedAvatar() },
            { name: "АТБ-Борис 🤖", isBot: true, avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=80&auto=format&fit=crop" }
        ]);
    });

    // Create Room
    document.getElementById('btn-create-lobby').addEventListener('click', () => {
        createRoomWorkflow(false);
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

        mp.connect(getWsUrl(), userProfile.name, getSyncedAvatar(), () => {
            mp.joinRoom(code, userProfile.name, getSyncedAvatar());
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

    // Invite friends (auto-creates lobby and opens native TG share dialog with room start parameter)
    document.getElementById('btn-invite-friends').addEventListener('click', () => {
        createRoomWorkflow(true);
    });

    // Donate Monobank Button Handler
    const btnDonate = document.getElementById('btn-donate-mono');
    if (btnDonate) {
        btnDonate.addEventListener('click', () => {
            if (DONATE_URL.includes("YOUR_JAR_ID")) {
                showModal("Підтримка гри ☕️", "<p>Наразі посилання на банку не налаштовано розробником. Будь ласка, зверніться до адміністратора гри!</p>", [
                    { text: "Зрозуміло", class: "btn-secondary" }
                ]);
            } else {
                if (tg) {
                    tg.openLink(DONATE_URL);
                } else {
                    window.open(DONATE_URL, '_blank');
                }
            }
        });
    }

    // AdsGram Rewarded Video Ad Handler
    const btnWatchAd = document.getElementById('btn-watch-ad');
    if (btnWatchAd) {
        updateAdButtonText();
        // Update button timer periodically
        setInterval(updateAdButtonText, 30000); // every 30 seconds

        btnWatchAd.addEventListener('click', () => {
            initializeAdsGram();

            if (AdController) {
                btnWatchAd.disabled = true;
                const btnTextSpan = btnWatchAd.querySelector('.btn-text');
                const originalText = btnTextSpan ? btnTextSpan.innerText : "Бонус за рекламу 📺 (+1.5M ₴)";
                if (btnTextSpan) btnTextSpan.innerText = "Завантаження реклами...";

                let adResolved = false;

                // 12 seconds safety timeout to release the button if AdsGram hangs/fails to load
                activeAdTimeout = setTimeout(() => {
                    if (!adResolved) {
                        adResolved = true;
                        activeAdTimeout = null;
                        btnWatchAd.disabled = false;
                        if (btnTextSpan) btnTextSpan.innerText = originalText;
                        updateAdButtonText();
                        showModal("Час очікування минув ⚠️", "<p>Реклама завантажується занадто довго. Будь ласка, перевірте з'єднання з інтернетом або спробуйте пізніше.</p>", [
                            { text: "Зрозуміло", class: "btn-secondary" }
                        ]);
                    }
                }, 12000);

                try {
                    AdController.show().then((result) => {
                        if (adResolved) return;
                        adResolved = true;
                        if (activeAdTimeout) {
                            clearTimeout(activeAdTimeout);
                            activeAdTimeout = null;
                        }
                        btnWatchAd.disabled = false;

                        } else {
                            userProfile.startingBonus = 1500; // +1.5M ₴
                            localStorage.setItem('last_ad_reward_time', Date.now().toString());
                            triggerConfetti(); // Confetti on ad reward!
                            showModal("Дякуємо за підтримку! ❤️", "<p>Ви успішно переглянули рекламу та підтримали проект!<br><br>Оскільки бонус доступний раз на 15 хвилин, наступна нагорода буде доступна через <strong>${remainingMin} хв</strong>.</p>", [
                                { text: "Дякую! 🥰", class: "btn-primary" }
                            ]);
                        }
                        updateAdButtonText();
                    }).catch((result) => {
                        if (adResolved) return;
                        adResolved = true;
                        if (activeAdTimeout) {
                            clearTimeout(activeAdTimeout);
                            activeAdTimeout = null;
                        }
                        btnWatchAd.disabled = false;
                        if (btnTextSpan) btnTextSpan.innerText = originalText;
                        updateAdButtonText();

                        console.warn("AdsGram Error:", result);
                        const errorMsg = result.description || result.error || "перегляд відхилено";
                        
                        let title = "Рекламу перервано ⚠️";
                        let text = `<p>Для отримання бонусу необхідно переглянути відео повністю без пропусків. Спробуйте ще раз! (Статус: ${errorMsg})</p>`;
                        
                        if (errorMsg.includes("нет доступной рекламы") || errorMsg.toLowerCase().includes("no ad") || errorMsg.toLowerCase().includes("no_fill")) {
                            title = "Реклама тимчасово недоступна ⚠️";
                            text = `<p>Наразі у провайдера немає доступної реклами для показу. Будь ласка, спробуйте ще раз трохи пізніше! (Статус: ${errorMsg})</p>`;
                        }

                        showModal(title, text, [
                            { text: "Спробувати знову", class: "btn-secondary" }
                        ]);
                    });
                } catch (err) {
                    console.error("Synchronous AdsGram show exception caught", err);
                    if (!adResolved) {
                        adResolved = true;
                        if (activeAdTimeout) {
                            clearTimeout(activeAdTimeout);
                            activeAdTimeout = null;
                        }
                        btnWatchAd.disabled = false;
                        if (btnTextSpan) btnTextSpan.innerText = originalText;
                        updateAdButtonText();
                        showModal("Помилка ініціалізації реклами ⚠️", `<p>Сталася помилка при запуску реклами: ${err.message || err}</p>`, [
                            { text: "Зрозуміло", class: "btn-secondary" }
                        ]);
                    }
                }
            } else {
                showModal("Помилка завантаження ⚠️", "<p>Служба реклами AdsGram наразі недоступна. Будь ласка, перевірте з'єднання з інтернетом або спробуйте пізніше.</p>", [
                    { text: "Зрозуміло", class: "btn-secondary" }
                ]);
            }
        });
    }

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
        const parts = (p.avatar || '').split('|');
        const avatarUrl = parts[0] || 'assets/cossack_tycoon.png';
        const frame = parts[1] || null;

        const card = document.createElement('div');
        card.className = 'lobby-player-card';
        card.innerHTML = `
            <div class="player-card-info" style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="avatar-container ${frame ? 'frame-' + frame : ''}" style="width: 36px; height: 36px;">
                    <img src="${avatarUrl}" class="lobby-avatar connected" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                </div>
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
    return "wss://jiubehb-monopoly-backend.hf.space";
}

// Start Monopoly game state loop
function startNewGame(playerList) {
    game.reset();
    
    playerList.forEach((p, idx) => {
        const parts = (p.avatar || '').split('|');
        const avatarUrl = parts[0] || 'assets/cossack_tycoon.png';
        const frame = parts[1] || null;

        const addedPlayer = game.addPlayer(p.name, `p-color-${idx}`, avatarUrl, p.isBot || false);
        addedPlayer.frame = frame; // Expose frame inside the game state!

        // Добавляем бонус за просмотр рекламы, если он есть
        if (!p.isBot && p.name === userProfile.name && userProfile.startingBonus) {
            addedPlayer.money += userProfile.startingBonus;
        }
    });
    // Сбрасываем бонус после начала игры
    userProfile.startingBonus = 0;

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

// Click on cell shows deed card properties details (restricted to own properties on player's turn)
function handleCellClick(index) {
    const space = game.spaces[index];
    if (space.type === SPACE_TYPES.PROPERTY || space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY) {
        const localPlayerId = isMultiplayerGame ? mp.playerId : game.currentPlayerIndex;
        const isSelf = space.owner === localPlayerId;
        
        if (!isSelf) {
            // Cannot inspect or click properties not owned by self (requested by user)
            return;
        }

        const isMyTurn = game.currentPlayerIndex === localPlayerId;
        if (!isMyTurn) {
            // Can only interact with properties during own turn
            return;
        }

        showPropertyModal(
            space,
            () => {}, // buy handler (only triggered inside actual landing workflow)
            () => {}, 
            true, // isSelfOwner
            () => {
                // Check if player owns all properties of the color group (monopoly)
                let allOwnedBySelf = false;
                if (space.group) {
                    const sameGroupSpaces = game.spaces.filter(s => s.group === space.group);
                    allOwnedBySelf = sameGroupSpaces.every(s => s.owner === localPlayerId);
                }

                if (!allOwnedBySelf) {
                    alert("Ви не можете будувати філії, поки не зберете монополію (всі компанії одного кольору)!");
                    return;
                }

                // Upgrade handler
                if (isMultiplayerGame && game.currentPlayerIndex === mp.playerId) {
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
                } else if (!isMultiplayerGame) {
                    const success = game.upgradeProperty(game.currentPlayerIndex, space.id);
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

// Open trade proposal modal on HUD player nickname click
function handlePlayerClick(clickedPlayerId) {
    const localPlayerId = isMultiplayerGame ? mp.playerId : game.currentPlayerIndex;
    if (clickedPlayerId === localPlayerId) return;

    const proposer = game.players.find(p => p.id === localPlayerId);
    const receiver = game.players.find(p => p.id === clickedPlayerId);
    if (!proposer || !receiver || proposer.isBankrupt || receiver.isBankrupt) return;

    // Filter properties, stations, utilities owned by proposer/receiver (including those with branches)
    const proposerProps = game.spaces.filter(s => s.owner === localPlayerId && (s.type === SPACE_TYPES.PROPERTY || s.type === SPACE_TYPES.STATION || s.type === SPACE_TYPES.UTILITY));
    const receiverProps = game.spaces.filter(s => s.owner === clickedPlayerId && (s.type === SPACE_TYPES.PROPERTY || s.type === SPACE_TYPES.STATION || s.type === SPACE_TYPES.UTILITY));

    let contentHtml = `
        <div class="trade-modal" style="display: flex; flex-direction: column; gap: 1rem; color: var(--text-primary);">
            <p style="text-align: center; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                Пропозиція торгової угоди для <strong>${receiver.name}</strong>
            </p>
            <div style="display: flex; gap: 1rem;">
                <!-- Proposer Offer (Left) -->
                <div style="flex: 1; border-right: 1px solid var(--border-glass); padding-right: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <h4 style="color: var(--color-success); border-bottom: 1px solid var(--border-glass); padding-bottom: 0.2rem; font-size: 0.95rem;">Ви пропонуєте:</h4>
                    
                    <div>
                        <label style="font-size: 0.8rem; color: var(--text-secondary);">Доплата (₴):</label>
                        <input type="number" id="trade-offer-cash" min="0" max="${proposer.money}" value="0" 
                            style="width: 100%; background: var(--bg-card-solid); color: var(--text-primary); border: 1px solid var(--border-glass); padding: 0.4rem; border-radius: 4px; font-weight: bold; font-family: inherit;">
                    </div>
                    
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Ваші компанії:</span>
                    <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.3rem; padding-right: 0.2rem;">
    `;

    if (proposerProps.length === 0) {
        contentHtml += `<span style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0;">Немає компаній для обміну</span>`;
    } else {
        proposerProps.forEach(p => {
            const branchText = p.branches > 0 ? ` (${p.branches} ф.)` : '';
            contentHtml += `
                <label class="trade-item-label">
                    <input type="checkbox" class="trade-offer-prop" value="${p.id}" style="accent-color: var(--color-primary);">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--prop-${p.group || 'special'}); display: inline-block;"></span>
                    ${p.name}${branchText}
                </label>
            `;
        });
    }

    contentHtml += `
                    </div>
                </div>

                <!-- Receiver Request (Right) -->
                <div style="flex: 1; padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <h4 style="color: var(--color-yellow); border-bottom: 1px solid var(--border-glass); padding-bottom: 0.2rem; font-size: 0.95rem;">Ви хочете:</h4>
                    
                    <div>
                        <label style="font-size: 0.8rem; color: var(--text-secondary);">Гроші від гравця (₴):</label>
                        <input type="number" id="trade-request-cash" min="0" max="${receiver.money}" value="0" 
                            style="width: 100%; background: var(--bg-card-solid); color: var(--text-primary); border: 1px solid var(--border-glass); padding: 0.4rem; border-radius: 4px; font-weight: bold; font-family: inherit;">
                    </div>
                    
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Активи гравця:</span>
                    <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.3rem; padding-right: 0.2rem;">
    `;

    if (receiverProps.length === 0) {
        contentHtml += `<span style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0;">Немає компаній для обміну</span>`;
    } else {
        receiverProps.forEach(p => {
            const branchText = p.branches > 0 ? ` (${p.branches} ф.)` : '';
            contentHtml += `
                <label class="trade-item-label">
                    <input type="checkbox" class="trade-request-prop" value="${p.id}" style="accent-color: var(--color-primary);">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--prop-${p.group || 'special'}); display: inline-block;"></span>
                    ${p.name}${branchText}
                </label>
            `;
        });
    }

    contentHtml += `
                    </div>
                </div>
            </div>
        </div>
    `;

    showModal("Пропозиція обміну 🤝", contentHtml, [
        {
            text: "Надіслати пропозицію ✉️",
            class: "btn-primary",
            onClick: () => {
                const offerCash = parseInt(document.getElementById('trade-offer-cash').value) || 0;
                const requestCash = parseInt(document.getElementById('trade-request-cash').value) || 0;

                const offerProps = Array.from(document.querySelectorAll('.trade-offer-prop:checked')).map(el => parseInt(el.value));
                const requestProps = Array.from(document.querySelectorAll('.trade-request-prop:checked')).map(el => parseInt(el.value));

                if (offerCash < 0 || offerCash > proposer.money) {
                    alert("Невірна сума доплати!");
                    return;
                }
                if (requestCash < 0 || requestCash > receiver.money) {
                    alert("Невірна сума запиту грошей!");
                    return;
                }

                if (offerCash === 0 && requestCash === 0 && offerProps.length === 0 && requestProps.length === 0) {
                    alert("Ви не вибрали жодного активу чи суми для торгу!");
                    return;
                }

                if (isMultiplayerGame) {
                    mp.sendAction({
                        type: 'trade_propose',
                        proposerId: localPlayerId,
                        receiverId: clickedPlayerId,
                        offerCash,
                        requestCash,
                        offerProps,
                        requestProps
                    });
                    game.log(`Ви надіслали пропозицію обміну для ${receiver.name}...`);
                    updateGameLog(game);
                } else {
                    alert("Торги доступні тільки в мережевій грі!");
                }
            }
        },
        {
            text: "Скасувати",
            class: "btn-secondary"
        }
    ]);
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
                        triggerGameOver(game.rankings);
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
        triggerGameOver(game.rankings);
        return;
    }

    if (isMultiplayerGame) {
        mp.sendAction({ type: 'end_turn', playerId: game.currentPlayerIndex });
    }

    game.nextTurn();
    renderPlayersHUD(game);
    updateGameLog(game);

    if (game.isGameOver) {
        triggerGameOver(game.rankings);
        return;
    }

    processNextTurn();
}

// Coordinates turns routing (User vs Bot or User vs User)
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
    } else {
        // Offline / Bot Mode
        if (activePlayer.isBot) {
            document.getElementById('btn-roll-dice').disabled = true;
            document.getElementById('btn-end-turn').disabled = true;
            game.log(`Хід робота ${activePlayer.name}...`);
            updateGameLog(game);
            setTimeout(runBotTurn, 1500);
        } else {
            document.getElementById('btn-roll-dice').disabled = false;
            document.getElementById('btn-end-turn').disabled = true;
            game.log(`Ваш хід (${activePlayer.name}). Кидайте кубики!`);
            updateGameLog(game);
        }
    }
}

// Bot AI Decision loop
function runBotTurn() {
    const bot = game.getCurrentPlayer();
    if (!bot || !bot.isBot || bot.isBankrupt) return;

    // Check if in Jail (Shelter)
    if (bot.inJail) {
        game.log(`${bot.name} намагається вийти з укриття...`);
        updateGameLog(game);
        
        // If rich, pay to get out. Otherwise, try to roll double.
        if (bot.money >= 3000) {
            game.tryGetOutJail(bot.id, 'pay');
            renderPlayersHUD(game);
            updateGameLog(game);
            setTimeout(executeBotRoll, 1000);
        } else {
            const rollResult = game.tryGetOutJail(bot.id, 'roll');
            renderPlayersHUD(game);
            updateGameLog(game);
            
            if (rollResult.success) {
                animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                    updatePlayerTokens(game);
                    resolveBotLanding(bot.id, bot.position, rollResult.sum);
                });
            } else {
                animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                    setTimeout(executeBotEndTurn, 1500);
                });
            }
        }
        return;
    }

    executeBotRoll();
}

function executeBotRoll() {
    const bot = game.getCurrentPlayer();
    if (!bot || !bot.isBot || bot.isBankrupt) return;

    const { d1, d2, sum } = game.rollDice();
    game.log(`${bot.name} кинув кубики: ${d1}:${d2}`, 'system');
    
    const fromPos = bot.position;
    game.movePlayer(bot.id, sum);

    animateDiceRoll(d1, d2, () => {
        animatePlayerMovement(game, bot.id, fromPos, sum, () => {
            renderPlayersHUD(game);
            resolveBotLanding(bot.id, bot.position, sum);
        });
    });
}

function resolveBotLanding(botId, spaceId, diceSum) {
    const bot = game.players.find(p => p.id === botId);
    const space = game.spaces[spaceId];
    if (!bot || bot.isBankrupt) return;

    if (space.type === SPACE_TYPES.PROPERTY || space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY) {
        if (space.owner === null) {
            // Buy if has enough money (price + 500 reserve)
            if (bot.money >= space.price + 500) {
                game.purchaseProperty(botId, spaceId);
                renderBoard(game, handleCellClick);
                renderPlayersHUD(game);
                updateGameLog(game);
            } else {
                game.log(`${bot.name} вирішив не купувати ${space.name} через брак коштів.`);
                updateGameLog(game);
            }
        } else if (space.owner !== botId) {
            // Pay rent
            const rent = game.payRent(botId, spaceId, diceSum);
            renderPlayersHUD(game);
            updateGameLog(game);
            
            if (bot.money < 0) {
                resolveBotDebt(botId, rent);
                return;
            }
        }
    } else if (space.type === SPACE_TYPES.FREE_PARKING) {
        game.claimFreeParking(botId);
        renderPlayersHUD(game);
        updateGameLog(game);
    } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
        game.sendToJail(botId);
        updatePlayerTokens(game);
        renderPlayersHUD(game);
        updateGameLog(game);
    } else if (space.type === SPACE_TYPES.CHANCE) {
        const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        showChanceModal(`${bot.name} витягнув картку Шанс:\n\n${card.text}`, () => {
            applyChanceCardAction(botId, card);
            setTimeout(executeBotUpgradesAndEnd, 1000);
        });
        return;
    }

    setTimeout(executeBotUpgradesAndEnd, 1500);
}

function executeBotUpgradesAndEnd() {
    const bot = game.getCurrentPlayer();
    if (!bot || !bot.isBot || bot.isBankrupt) return;

    // Upgrade properties if owns full set and has > 2000 cash
    if (bot.money > 2000) {
        const botProps = game.spaces.filter(s => s.owner === bot.id && s.type === SPACE_TYPES.PROPERTY && s.branches < 4);
        for (let s of botProps) {
            const sameGroup = game.spaces.filter(sp => sp.group === s.group);
            const ownsAll = sameGroup.every(sp => sp.owner === bot.id);
            if (ownsAll && bot.money >= s.branchCost + 1000) {
                game.upgradeProperty(bot.id, s.id);
                renderBoard(game, handleCellClick);
                renderPlayersHUD(game);
                updateGameLog(game);
                break;
            }
        }
    }

    executeBotEndTurn();
}

function executeBotEndTurn() {
    if (game.isGameOver) {
        triggerGameOver(game.rankings);
        return;
    }

    game.nextTurn();
    renderPlayersHUD(game);
    updateGameLog(game);

    if (game.isGameOver) {
        triggerGameOver(game.rankings);
        return;
    }

    processNextTurn();
}

function resolveBotDebt(botId, rentAmount) {
    const bot = game.players.find(p => p.id === botId);
    if (!bot || bot.money >= 0) return;

    // 1. Sell branches
    const branches = game.spaces.filter(s => s.owner === botId && s.branches > 0);
    for (let s of branches) {
        while (s.branches > 0 && bot.money < 0) {
            game.sellBranch(s.id);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
        }
    }

    // 2. Sell properties
    if (bot.money < 0) {
        const props = game.spaces.filter(s => s.owner === botId && (!s.branches || s.branches === 0));
        for (let s of props) {
            if (bot.money >= 0) break;
            game.sellProperty(s.id);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
        }
    }

    // 3. Declare bankruptcy if still negative
    if (bot.money < 0) {
        const currentSpace = game.spaces[bot.position];
        let beneficiaryId = null;
        if (currentSpace.owner !== null && currentSpace.owner !== botId) {
            beneficiaryId = currentSpace.owner;
        }
        game.declareBankruptcy(botId, beneficiaryId);
        renderBoard(game, handleCellClick);
        renderPlayersHUD(game);
        updateGameLog(game);
    }

    setTimeout(executeBotEndTurn, 1500);
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

        case 'trade_propose':
            if (action.receiverId !== mp.playerId) break;
            const proposerPlayer = game.players.find(p => p.id === action.proposerId);
            if (!proposerPlayer) break;

            const offerPropsNames = action.offerProps.map(id => game.spaces.find(s => s.id === id).name);
            const requestPropsNames = action.requestProps.map(id => game.spaces.find(s => s.id === id).name);

            let tradeHtml = `
                <div style="color: #fff; display: flex; flex-direction: column; gap: 1rem;">
                    <p style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                        Гравець <strong>${proposerPlayer.name}</strong> пропонує вам обмін:
                    </p>
                    <div style="display: flex; gap: 1rem; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-glass);">
                        <div style="flex: 1; border-right: 1px solid var(--border-glass); padding-right: 0.5rem;">
                            <span style="color: var(--color-success); font-weight: bold; font-size: 0.9rem;">Ви отримаєте:</span>
                            <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem;">
                                <span>Гроші: <strong>₴${action.offerCash}</strong></span>
                                <span>Компанії: ${offerPropsNames.join(', ') || '<span style="color:var(--text-muted);">нічого</span>'}</span>
                            </div>
                        </div>
                        <div style="flex: 1; padding-left: 0.5rem;">
                            <span style="color: var(--color-danger); font-weight: bold; font-size: 0.9rem;">З вас спишеться:</span>
                            <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem;">
                                <span>Гроші: <strong>₴${action.requestCash}</strong></span>
                                <span>Компанії: ${requestPropsNames.join(', ') || '<span style="color:var(--text-muted);">нічого</span>'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            showModal("Пропозиція обміну 🤝", tradeHtml, [
                {
                    text: "Прийняти ✅",
                    class: "btn-primary",
                    onClick: () => {
                        const receiver = game.players.find(p => p.id === mp.playerId);
                        if (receiver.money < action.requestCash) {
                            alert("У вас недостатньо грошей для прийняття цієї угоди!");
                            mp.sendAction({
                                type: 'trade_decline',
                                proposerId: action.proposerId,
                                receiverId: mp.playerId,
                                reason: 'no_money'
                            });
                            return;
                        }
                        if (proposerPlayer.money < action.offerCash) {
                            alert("У супротивника недостатньо грошей для виконання угоди!");
                            mp.sendAction({
                                type: 'trade_decline',
                                proposerId: action.proposerId,
                                receiverId: mp.playerId,
                                reason: 'partner_no_money'
                            });
                            return;
                        }

                        game.executeTrade(action.proposerId, action.receiverId, action.offerProps, action.offerCash, action.requestProps, action.requestCash);
                        mp.sendAction({
                            type: 'trade_accept',
                            proposerId: action.proposerId,
                            receiverId: action.receiverId,
                            offerProps: action.offerProps,
                            offerCash: action.offerCash,
                            requestProps: action.requestProps,
                            requestCash: action.requestCash
                        });
                        renderBoard(game, handleCellClick);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                    }
                },
                {
                    text: "Відхилити ❌",
                    class: "btn-secondary",
                    onClick: () => {
                        mp.sendAction({
                            type: 'trade_decline',
                            proposerId: action.proposerId,
                            receiverId: mp.playerId
                        });
                        game.log(`Ви відхилили пропозицію обміну.`);
                        updateGameLog(game);
                    }
                }
            ]);
            break;

        case 'trade_accept':
            game.executeTrade(action.proposerId, action.receiverId, action.offerProps, action.offerCash, action.requestProps, action.requestCash);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            hideModal();
            break;

        case 'trade_decline':
            if (action.proposerId === mp.playerId) {
                const partner = game.players.find(p => p.id === action.receiverId);
                const reasonStr = action.reason === 'no_money' ? " (недостатньо коштів у вас)" : 
                                  action.reason === 'partner_no_money' ? " (недостатньо коштів у партнера)" : "";
                showModal("Угоду відхилено ❌", `<p>Гравець <strong>${partner ? partner.name : 'Суперник'}</strong> відхилив вашу пропозицію обміну${reasonStr}.</p>`, [
                    { text: "Зрозуміло", class: "btn-secondary" }
                ]);
                game.log(`Пропозицію обміну відхилено.`);
                updateGameLog(game);
            }
            break;

        case 'end_turn':
            game.nextTurn();
            renderPlayersHUD(game);
            updateGameLog(game);
            if (game.isGameOver) {
                triggerGameOver(game.rankings);
            } else {
                processNextTurn();
            }
            break;
    }
}

// ==========================================================================
// GAME OVER & STATS TRACKING HANDLERS
// ==========================================================================

const RANKS = [
    { name: "Початківець 👤", minWins: 0 },
    { name: "ФОП 💼", minWins: 2 },
    { name: "Стартапер 🚀", minWins: 5 },
    { name: "Бізнесмен 🏢", minWins: 10 },
    { name: "Олігарх 👑", minWins: 20 },
    { name: "Інвестор 📈", minWins: 40 }
];

function getUserRank(wins) {
    let currentRank = RANKS[0].name;
    for (const rank of RANKS) {
        if (wins >= rank.minWins) {
            currentRank = rank.name;
        }
    }
    return currentRank;
}

function showRanksInfoModal() {
    const modalHtml = `
        <div class="rank-list-modal">
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem; text-align: center;">
                Звання даються за досягнення певної кількості перемог в іграх:
            </p>
            ${RANKS.map(rank => `
                <div class="rank-list-item">
                    <span class="rank-list-name">${rank.name}</span>
                    <span class="rank-list-criteria">${rank.minWins === 0 ? 'Стартове звання' : `від ${rank.minWins} перемог`}</span>
                </div>
            `).join('')}
        </div>
    `;
    showModal("Система звань 🏆", modalHtml, [
        { text: "Зрозуміло", class: "btn-primary" }
    ]);
}

function recordGameResult(rankings) {
    if (!rankings || rankings.length === 0) return;
    
    userProfile.stats = userProfile.stats || { games: 0, wins: 0 };
    userProfile.stats.games++;
    
    // Check if the user is the winner
    const winner = rankings[0];
    if (winner && winner.name === userProfile.name) {
        userProfile.stats.wins++;
    }
    
    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
    
    // Sync UI with updated stats
    syncProfileTab();
}

function triggerGameOver(rankings) {
    recordGameResult(rankings);
    showGameOverModal(rankings, () => switchScreen('screen-menu'));
}

// ==========================================================================
// GLOBAL LEADERBOARD WSS SYNC
// ==========================================================================

function fetchGlobalLeaderboard() {
    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "sync_stats",
            name: userProfile.name,
            avatar: getSyncedAvatar(),
            wins: userProfile.stats?.wins || 0,
            games: userProfile.stats?.games || 0
        }));
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "leaderboard") {
                renderLeaderboardList(data.top50, data.your_rank);
                ws.close();
            }
        } catch (e) {
            console.error("Error parsing leaderboard message", e);
        }
    };
    
    ws.onerror = (e) => {
        console.error("Leaderboard WebSocket connection error", e);
        const listEl = document.getElementById('leaderboard-list');
        if (listEl) {
            listEl.innerHTML = `<p style="text-align: center; color: var(--color-danger); font-size: 0.85rem; padding: 1rem 0;">Помилка підключення до сервера</p>`;
        }
    };
}

function renderLeaderboardList(top50, yourRank) {
    const ratingStat = document.getElementById('profile-stat-rating');
    if (ratingStat) ratingStat.innerText = yourRank > 0 ? `#${yourRank}` : '--';
    
    const myRankEl = document.getElementById('leaderboard-my-rank');
    if (myRankEl) myRankEl.innerText = yourRank > 0 ? `Ваше місце: #${yourRank}` : 'Ваше місце: --';
    
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    
    if (top50.length === 0) {
        listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">Рейтинг порожній</p>`;
        return;
    }
    
    listEl.innerHTML = '';
    top50.forEach((player, idx) => {
        const rank = idx + 1;
        const isMe = player.name === userProfile.name;
        
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        const parts = (player.avatar || '').split('|');
        const avatarUrl = parts[0] || 'assets/cossack_tycoon.png';
        const frame = parts[1] || null;
        
        const row = document.createElement('div');
        row.className = `leaderboard-row ${isMe ? 'my-row' : ''}`;
        row.innerHTML = `
            <div class="leaderboard-player-info" style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="leaderboard-rank ${rankClass}">${rank}</span>
                <div class="avatar-container ${frame ? 'frame-' + frame : ''}" style="width: 32px; height: 32px;">
                    <img src="${avatarUrl}" class="leaderboard-avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.src='assets/cossack_tycoon.png'">
                </div>
                <span class="leaderboard-name">${player.name}</span>
            </div>
            <div class="leaderboard-stats">
                <span class="leaderboard-wins">${player.wins} 🏆</span> / ${player.games} ігор
            </div>
        `;
        listEl.appendChild(row);
    });
}

// ==========================================================================
// TABS, CUSTOMIZATION & THEME CONTROLLERS
// ==========================================================================

function setupMenuTabs() {
    const navItems = document.querySelectorAll('.menu-nav-bar .nav-item');
    const tabContents = document.querySelectorAll('.menu-tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const targetEl = document.getElementById(`tab-${targetTab}`);
            if (targetEl) targetEl.classList.add('active');
            
            // Sync cabinet details if tab is profile
            if (targetTab === 'profile') {
                syncProfileTab();
            }
        });
    });
}

function syncProfileTab() {
    const avatarLg = document.getElementById('profile-avatar-lg');
    if (avatarLg) avatarLg.src = userProfile.avatar;
    updateUserAvatarFrames();
    
    const nameLg = document.getElementById('profile-name-lg');
    if (nameLg) nameLg.innerText = userProfile.name;
    
    const wins = userProfile.stats?.wins || 0;
    const games = userProfile.stats?.games || 0;
    
    const rankBadge = document.getElementById('profile-rank-badge');
    if (rankBadge) rankBadge.innerText = getUserRank(wins);
    
    const statGames = document.getElementById('profile-stat-games');
    if (statGames) statGames.innerText = games;
    
    const statWins = document.getElementById('profile-stat-wins');
    if (statWins) statWins.innerText = wins;
    
    const statWinrate = document.getElementById('profile-stat-winrate');
    if (statWinrate) statWinrate.innerText = games > 0 ? Math.round((wins / games) * 100) + '%' : '0%';
    
    fetchGlobalLeaderboard();
}

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeCheckbox) themeCheckbox.checked = true;
        if (tg) tg.setHeaderColor('#f4f4f5');
    } else {
        document.body.classList.remove('light-theme');
        if (themeCheckbox) themeCheckbox.checked = false;
        if (tg) tg.setHeaderColor('#0b0f19');
    }
    
    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('light-theme');
                localStorage.setItem('app_theme', 'light');
                if (tg) tg.setHeaderColor('#f4f4f5');
            } else {
                document.body.classList.remove('light-theme');
                localStorage.setItem('app_theme', 'dark');
                if (tg) tg.setHeaderColor('#0b0f19');
            }
        });
    }
}

const PRESET_AVATARS = [
    "assets/cossack_tycoon.png",
    "assets/lviv_barista.png",
    "assets/kyiv_it.png",
    "assets/odesa_trader.png",
    "assets/wheat_baron.png"
];

function setupProfileCustomization() {
    const editBtn = document.getElementById('btn-edit-profile');
    if (!editBtn) return;
    
    // Register the ranks modal click on the badge/info button if it exists
    const btnShowRanks = document.getElementById('btn-show-ranks');
    if (btnShowRanks) {
        btnShowRanks.onclick = showRanksInfoModal;
    }
    
    editBtn.addEventListener('click', () => {
        let tempAvatar = userProfile.avatar;
        
        let modalHtml = `
            <div style="display: flex; flex-direction: column; gap: 1rem; color: var(--text-primary);">
                <div>
                    <label style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">Ім'я відображення:</label>
                    <input type="text" id="edit-profile-name" value="${userProfile.name}" placeholder="Ваше ім'я"
                        style="width: 100%; background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--border-glass); padding: 0.6rem; border-radius: 8px; font-family: inherit;">
                </div>
                
                <div>
                    <label style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">Аватар:</label>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <img id="edit-profile-avatar-preview" src="${tempAvatar}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary);" onerror="this.src='assets/cossack_tycoon.png'">
                        <button class="btn btn-secondary" id="btn-upload-avatar" style="padding: 0.5rem 1rem; font-size: 0.85rem; width: auto; font-family: inherit;">
                            Завантажити фото 📸
                        </button>
                        <input type="file" id="edit-profile-file" accept="image/*" style="display: none;">
                    </div>
                    
                    <span class="avatar-presets-label" style="display: block; margin-top: 0.75rem;">Або оберіть готового персонажа:</span>
                    <div class="avatar-preset-grid">
                        ${PRESET_AVATARS.map(url => {
                            const isSelected = url === tempAvatar;
                            return `<img class="avatar-preset-item ${isSelected ? 'selected' : ''}" src="${url}" data-url="${url}">`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        showModal("Редагувати профіль ⚙️", modalHtml, [
            {
                text: "Зберегти ✅",
                class: "btn-primary",
                onClick: () => {
                    const newName = document.getElementById('edit-profile-name').value.trim();
                    if (!newName) {
                        alert("Ім'я не може бути порожнім!");
                        return;
                    }
                    
                    userProfile.name = newName;
                    userProfile.avatar = tempAvatar;
                    
                    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
                    
                    // Update header HUD UI
                    const userNameEl = document.getElementById('user-name');
                    if (userNameEl) userNameEl.innerText = userProfile.name;
                    const userAvatarEl = document.getElementById('user-avatar');
                    if (userAvatarEl) userAvatarEl.src = userProfile.avatar;
                    updateUserAvatarFrames();
                    
                    // Update cabinet UI and sync with server
                    syncProfileTab();
                    hideModal();
                }
            },
            {
                text: "Скасувати",
                class: "btn-secondary"
            }
        ]);
        
        // Preset clicks setup
        const presetItems = document.querySelectorAll('.avatar-preset-item');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                presetItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                const clickedUrl = item.getAttribute('data-url');
                tempAvatar = clickedUrl;
                document.getElementById('edit-profile-avatar-preview').src = tempAvatar;
            });
        });
        
        // File Upload handlers
        const fileInput = document.getElementById('edit-profile-file');
        const uploadBtn = document.getElementById('btn-upload-avatar');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Compress via HTML5 canvas to 120x120px JPEG (0.85 quality)
                        const canvas = document.createElement('canvas');
                        canvas.width = 120;
                        canvas.height = 120;
                        const ctx = canvas.getContext('2d');
                        
                        // Crop square and center
                        const minDim = Math.min(img.width, img.height);
                        const sx = (img.width - minDim) / 2;
                        const sy = (img.height - minDim) / 2;
                        
                        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 120, 120);
                        
                        const base64Str = canvas.toDataURL('image/jpeg', 0.85);
                        tempAvatar = base64Str;
                        document.getElementById('edit-profile-avatar-preview').src = base64Str;
                        
                        // Select nothing in presets
                        presetItems.forEach(i => i.classList.remove('selected'));
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }
    });
}

// ==========================================================================
// AVATAR FRAME SHOP CONTROLLER
// ==========================================================================
const FRAME_ITEMS = [
    { id: "neon", name: "Неонова Аура 💎", desc: "Світиться яскравим блакитним неон-світлом", price: 50, starsPrice: 50, class: "frame-neon" },
    { id: "gold", name: "Кібер Золото 👑", desc: "Рамка з анімованим золотим градієнтом", price: 100, starsPrice: 100, class: "frame-gold" },
    { id: "rainbow", name: "Веселковий Рейв 🌈", desc: "Анімований перелив кольорів веселки", price: 150, starsPrice: 150, class: "frame-rainbow" }
];

function showFrameShopModal() {
    let purchased = [];
    try {
        const saved = localStorage.getItem('purchased_frames');
        if (saved) purchased = JSON.parse(saved);
    } catch (e) {}
    
    let activeFrame = userProfile.frame;

    let listHtml = `<div class="shop-modal-container">
        <p style="font-size: 0.82rem; color: var(--text-secondary); text-align: center; margin-bottom: 0.75rem; line-height: 1.4;">
            Придбайте унікальні анімовані рамки для вашого аватара. Вони відображаються у вашому кабінеті, лобі та безпосередньо в ігровому HUD на ігровій дошці!
        </p>
        <div class="shop-card-list">
    `;

    FRAME_ITEMS.forEach(item => {
        const isPurchased = purchased.includes(item.id);
        const isActive = activeFrame === item.id;
        
        let actionBtnHtml = '';
        if (isActive) {
            actionBtnHtml = `<button class="btn btn-secondary btn-shop-action" style="background: transparent; border: 1.5px solid var(--color-success); color: var(--color-success); cursor: default; pointer-events: none;">Екіпіровано</button>`;
        } else if (isPurchased) {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" onclick="window.equipFrame('${item.id}')">Вдягти</button>`;
        } else {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; color: #ffffff;" onclick="window.purchaseFrame('${item.id}')">Купити ₴${item.price}</button>`;
        }

        listHtml += `
            <div class="shop-card-item ${isActive ? 'active-frame' : ''}">
                <div class="shop-card-left">
                    <div class="avatar-container ${item.class}" style="width: 46px; height: 46px; flex-shrink: 0;">
                        <img src="${userProfile.avatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/cossack_tycoon.png'">
                    </div>
                    <div class="shop-frame-info">
                        <span class="shop-frame-name">${item.name}</span>
                        <span class="shop-frame-desc">${item.desc}</span>
                    </div>
                </div>
                <div>
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    });

    listHtml += `
        </div>
        ${activeFrame ? `<button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem;" onclick="window.equipFrame(null)">Зняти рамку ❌</button>` : ''}
    </div>`;

    showModal("Крамниця анімованих рамок 👑", listHtml, [{ text: "Закрити", class: "btn-secondary" }]);
}

window.equipFrame = (frameId) => {
    userProfile.frame = frameId;
    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
    updateUserAvatarFrames();
    showFrameShopModal(); // Redraw shop modal
    syncProfileTab(); // Refresh profile tab
};

window.purchaseFrame = (frameId) => {
    const frame = FRAME_ITEMS.find(f => f.id === frameId);
    if (!frame) return;

    // Show simulated purchase options screen
    showModal("Купівля оформлення 🛒", `
        <div style="display: flex; flex-direction: column; gap: 1rem; color: var(--text-primary); text-align: center;">
            <p>Купується рамка <strong>${frame.name}</strong> за <strong>₴${frame.price}</strong> (або ⭐️ ${frame.starsPrice} Stars).</p>
            <div class="avatar-container ${frame.class}" style="width: 80px; height: 80px; margin: 0 auto;">
                <img src="${userProfile.avatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/cossack_tycoon.png'">
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                Це симуляція купівлі. Оберіть зручний для вас тестовий спосіб оплати. Реальні кошти списані не будуть!
            </p>
        </div>
    `, [
        {
            text: "Тестовий платіж Stars ⭐️",
            class: "btn-primary",
            onClick: () => {
                if (tg) {
                    tg.showPopup({
                        title: "Оплата Telegram Stars",
                        message: `Підтверджуєте покупку ${frame.name} за ⭐️ ${frame.starsPrice} Stars?`,
                        buttons: [
                            { id: "yes", type: "default", text: "Оплатити" },
                            { id: "no", type: "cancel", text: "Скасувати" }
                        ]
                    }, (buttonId) => {
                        if (buttonId === "yes") {
                            unlockFrame(frameId);
                        } else {
                            showFrameShopModal();
                        }
                    });
                } else {
                    unlockFrame(frameId);
                }
            }
        },
        {
            text: "Тестовий платіж Mono ₴",
            class: "btn-secondary",
            onClick: () => {
                unlockFrame(frameId);
            }
        },
        { text: "Скасувати", class: "btn-secondary", onClick: showFrameShopModal }
    ]);
};

function unlockFrame(frameId) {
    let purchased = [];
    try {
        const saved = localStorage.getItem('purchased_frames');
        if (saved) purchased = JSON.parse(saved);
    } catch (e) {}
    
    if (!purchased.includes(frameId)) {
        purchased.push(frameId);
        localStorage.setItem('purchased_frames', JSON.stringify(purchased));
    }
    
    // Auto equip
    userProfile.frame = frameId;
    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
    
    updateUserAvatarFrames();
    triggerConfetti(); // Confetti on successful purchase!
    
    showModal("Успішна покупка! 🎉", `
        <p>Ви придбали та одягли рамку. Інші гравці тепер бачитимуть її на вашому профілі!</p>
    `, [{ text: "Клас!", class: "btn-primary", onClick: showFrameShopModal }]);
    
    syncProfileTab();
}

