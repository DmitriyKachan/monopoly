// ==========================================================================
// MAIN APP ROUTER & PLAY LOOP - MONOPOLY UKRAINE (SIMPLIFIED MULTIPLAYER ONLY)
// ==========================================================================

import { GameState, SPACE_TYPES, CHANCE_CARDS, COLOR_GROUPS } from './game.js';
import { renderBoard, updatePlayerTokens, animatePlayerMovement, animateDiceRoll, renderPlayersHUD, updateGameLog, showPropertyModal, showChanceModal, showGameOverModal, showModal, hideModal, setPlayerClickCallback, triggerConfetti, showSpecialSpaceModal } from './ui.js';
import { MultiplayerManager } from './multiplayer.js';

// Game state instance
let game = new GameState();
let isMultiplayerGame = false;
const mp = new MultiplayerManager();
let userProfile = {
    name: "Гравець",
    username: "guest",
    avatar: "assets/cossack_tycoon.png",
    frame: null,
    token: null,
    dice: null,
    trail: null,
    effect: null,
    stats: { games: 0, wins: 0 },
    coins: 0,
    purchasedFrames: [],
    purchasedTokens: [],
    purchasedDice: [],
    purchasedTrails: [],
    purchasedEffects: []
};

const BOT_USERNAME = "queuecomfybot";
const MINI_APP_SHORT_NAME = "play"; // Замените на короткое имя (Short Name) вашего Mini App в BotFather (например, "play" или "app") для мгновенного входа без кнопки Старт

const tg = window.Telegram?.WebApp;
let tgId = null;
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('tg_id')) {
    tgId = urlParams.get('tg_id');
} else if (tg && tg.initDataUnsafe?.user) {
    tgId = tg.initDataUnsafe.user.id.toString();
}

if (urlParams.has('coins')) {
    userProfile.coins = parseInt(urlParams.get('coins')) || 0;
}
if (urlParams.has('purchased_frames')) {
    const pStr = urlParams.get('purchased_frames');
    userProfile.purchasedFrames = pStr ? pStr.split(',') : [];
}

// Setup premium store callbacks
mp.onProfileDataCallback = (data) => {
    userProfile.coins = data.coins;
    userProfile.purchasedFrames = data.purchased_frames || [];
    userProfile.purchasedTokens = data.purchased_tokens || [];
    userProfile.purchasedDice = data.purchased_dice || [];
    userProfile.purchasedTrails = data.purchased_trails || [];
    userProfile.purchasedEffects = data.purchased_effects || [];
    userProfile.frame = data.equipped_frame || 'default';
    userProfile.token = data.equipped_token || 'default';
    userProfile.dice = data.equipped_dice || 'default';
    userProfile.trail = data.equipped_trail || 'default';
    userProfile.effect = data.equipped_effect || 'default';
    userProfile.isAdmin = data.is_admin || false;
    
    // Toggle admin panel button visibility in Cabinet tab!
    const adminBtnContainer = document.getElementById('admin-panel-btn-container');
    if (adminBtnContainer) {
        adminBtnContainer.style.display = userProfile.isAdmin ? 'block' : 'none';
    }
    
    syncDonateShop();
    syncProfileTab();
};

mp.onInvoiceLinkCallback = (data) => {
    window.closeLoaderModal();
    if (tg) {
        tg.openInvoice(data.url, (status) => {
            if (status === 'paid') {
                triggerConfetti();
                if (mp.socket && mp.socket.readyState === WebSocket.OPEN) {
                    mp.socket.send(JSON.stringify({ type: "get_profile", tg_id: tgId, username: userProfile.username }));
                }
            } else {
                syncDonateShop();
            }
        });
    }
};

mp.onBuyFrameSuccessCallback = (data) => {
    triggerConfetti();
    userProfile.coins = data.coins;
    if (!userProfile.purchasedFrames.includes(data.frame_id)) {
        userProfile.purchasedFrames.push(data.frame_id);
    }
    userProfile.frame = data.frame_id;
    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
    updateUserAvatarFrames();
    syncDonateShop();
    syncProfileTab();
    showModal("Успішна покупка! 🎉", "<p>Ви придбали та одягли рамку!</p>", [
        { text: "Клас!", class: "btn-primary" }
    ]);
};

mp.onBuyItemSuccessCallback = (data) => {
    triggerConfetti();
    userProfile.coins = data.coins;
    const category = data.category; // 'frame', 'token', 'dice', 'trail', 'effect'
    const itemId = data.item_id;
    
    if (category === 'frame') {
        if (!userProfile.purchasedFrames.includes(itemId)) userProfile.purchasedFrames.push(itemId);
        userProfile.frame = itemId;
    } else if (category === 'token') {
        if (!userProfile.purchasedTokens.includes(itemId)) userProfile.purchasedTokens.push(itemId);
        userProfile.token = itemId;
    } else if (category === 'dice') {
        if (!userProfile.purchasedDice.includes(itemId)) userProfile.purchasedDice.push(itemId);
        userProfile.dice = itemId;
    } else if (category === 'trail') {
        if (!userProfile.purchasedTrails.includes(itemId)) userProfile.purchasedTrails.push(itemId);
        userProfile.trail = itemId;
    } else if (category === 'effect') {
        if (!userProfile.purchasedEffects.includes(itemId)) userProfile.purchasedEffects.push(itemId);
        userProfile.effect = itemId;
    }
    
    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
    updateUserAvatarFrames();
    syncDonateShop();
    syncProfileTab();
    
    let catText = "елемент";
    if (category === 'frame') catText = "рамку";
    else if (category === 'token') catText = "фішку";
    else if (category === 'dice') catText = "кубик";
    else if (category === 'trail') catText = "шлейф";
    else if (category === 'effect') catText = "ефект перемоги";

    showModal("Успішна покупка! 🎉", `<p>Ви придбали та одягли ${catText}!</p>`, [
        { text: "Клас!", class: "btn-primary" }
    ]);
};

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

// Ссылка на вашу банку Монобанка для донатов (замените YOUR_JAR_ID на ваш ID банки)
const DONATE_URL = "https://send.monobank.ua/jar/2rhzs3ebtE";

// Telegram WebApp Initialization
// tg is defined globally at the top

// AdsGram Configuration (Rewarded Video Ads)
const ADSGRAM_BLOCK_ID = "33680"; 
let AdController = null;
let activeAdTimeout = null;

// Determine if we should run AdsGram in debug (testing) mode.
// We enable debug mode if:
// 1. Host is localhost/127.0.0.1 (local testing)
// 2. URL query contains "debug_ad=true" or "debug=true"
// 3. Platform is desktop/web or we are outside native Telegram mobile (to prevent no-fill errors on PC)
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
        userProfile.token = parsed.token || null;
        userProfile.dice = parsed.dice || null;
        userProfile.trail = parsed.trail || null;
        userProfile.effect = parsed.effect || null;
        userProfile.purchasedFrames = parsed.purchasedFrames || [];
        userProfile.purchasedTokens = parsed.purchasedTokens || [];
        userProfile.purchasedDice = parsed.purchasedDice || [];
        userProfile.purchasedTrails = parsed.purchasedTrails || [];
        userProfile.purchasedEffects = parsed.purchasedEffects || [];
        userProfile.stats = parsed.stats || { games: 0, wins: 0 };
    } catch (e) {
        console.error("Error parsing saved profile", e);
    }
}
if (tg && tg.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    userProfile.name = u.first_name + (u.last_name ? ' ' + u.last_name : '');
    userProfile.username = u.username || 'player';
    if (u.photo_url) {
        userProfile.avatar = u.photo_url;
    }
}

function getSyncedAvatar() {
    return [
        userProfile.avatar,
        userProfile.frame || 'default',
        userProfile.token || 'default',
        userProfile.dice || 'default',
        userProfile.trail || 'default',
        userProfile.effect || 'default'
    ].join('|');
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
        shopBtn.onclick = () => {
            const supportTabBtn = document.querySelector('.menu-nav-bar .nav-item[data-tab="support"]');
            if (supportTabBtn) supportTabBtn.click();
            
            const framesSubTabBtn = document.querySelector('.donate-tab-btn[data-subtab="shop-frames"]');
            if (framesSubTabBtn) framesSubTabBtn.click();
        };
    }

    // Set callback for player HUD trading clicks
    setPlayerClickCallback(handlePlayerClick);

    // Check for startapp parameters (auto-joining room)
    let hasStartParam = false;
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = (tg && tg.initDataUnsafe?.start_param) || urlParams.get('startapp') || urlParams.get('tgWebAppStartParam');
    if (startParam && startParam.length === 4) {
        hasStartParam = true;
        autoJoinRoomByCode(startParam);
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

    const statsBtn = document.getElementById('btn-toggle-stats');
    if (statsBtn) {
        statsBtn.onclick = showGameStatsModal;
    }

    // Initialize Admin status based on connection type
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    if (isLocal) {
        userProfile.isAdmin = true;
    }

    const adminBtnContainer = document.getElementById('admin-panel-btn-container');
    if (adminBtnContainer) {
        adminBtnContainer.style.display = userProfile.isAdmin ? 'block' : 'none';
    }

    const openAdminBtn = document.getElementById('btn-open-admin-panel');
    if (openAdminBtn) {
        openAdminBtn.onclick = showAdminPanelModal;
    }

    // Keyboard shortcut for verified admins
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
            if (userProfile.isAdmin) {
                showAdminPanelModal();
            }
        }
    });

    // 5-clicks secret trigger on user avatar
    const userAvatarEl = document.getElementById('user-avatar');
    if (userAvatarEl) {
        let avatarClickCount = 0;
        let avatarClickTimeout = null;
        userAvatarEl.addEventListener('click', () => {
            if (!userProfile.isAdmin) return;
            avatarClickCount++;
            clearTimeout(avatarClickTimeout);
            if (avatarClickCount >= 5) {
                avatarClickCount = 0;
                showAdminPanelModal();
            } else {
                avatarClickTimeout = setTimeout(() => {
                    avatarClickCount = 0;
                }, 2000);
            }
        });
    }

    // Initial silent profile fetch for Telegram sessions
    if (tgId) {
        ensureWsConnected(() => {
            mp.socket.send(JSON.stringify({
                type: "get_profile",
                tg_id: tgId,
                username: userProfile.username
            }));
        });
    }
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
        mp.joinRoom(code, userProfile.name, getSyncedAvatar(), tgId);
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
        mp.createRoom(userProfile.name, getSyncedAvatar(), tgId);
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
            const shareUrl = MINI_APP_SHORT_NAME 
                ? `https://t.me/${BOT_USERNAME}/${MINI_APP_SHORT_NAME}?startapp=${mp.roomCode}`
                : `https://t.me/${BOT_USERNAME}?start=${mp.roomCode}`;
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
            if (mp) mp.disconnect();
            switchScreen('screen-menu');
        });
    });

    if (tg && tg.BackButton) {
        tg.BackButton.onClick(() => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id !== 'screen-menu') {
                if (activeScreen.id === 'screen-game') {
                    showModal("Вихід з гри", "<p>Ви впевнені, що хочете вийти з поточної сесії? Ваш прогрес буде втрачено.</p>", [
                        { text: "Так, вийти", class: "btn-danger", onClick: () => {
                            if (mp) mp.disconnect();
                            switchScreen('screen-menu');
                        } },
                        { text: "Скасувати", class: "btn-secondary" }
                    ]);
                } else {
                    if (activeScreen && activeScreen.id === 'screen-lobby') {
                        if (mp) mp.disconnect();
                    }
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

    // Invite friends from active lobby
    const btnLobbyInvite = document.getElementById('btn-lobby-invite');
    if (btnLobbyInvite) {
        btnLobbyInvite.addEventListener('click', () => {
            if (mp.roomCode) {
                const shareUrl = MINI_APP_SHORT_NAME 
                    ? `https://t.me/${BOT_USERNAME}/${MINI_APP_SHORT_NAME}?startapp=${mp.roomCode}`
                    : `https://t.me/${BOT_USERNAME}?start=${mp.roomCode}`;
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
            } else {
                alert("Помилка: кімнату ще не створено!");
            }
        });
    }

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

                        const remaining = getAdRewardRemainingTime();
                        if (remaining > 0) {
                            const remainingMin = Math.ceil(remaining / 60000);
                            showModal("Дякуємо за підтримку! ❤️", `<p>Ви успішно переглянули рекламу та підтримали проект!<br><br>Оскільки бонус доступний раз на 15 хвилин, наступна нагорода буде доступна через <strong>${remainingMin} хв</strong>.</p>`, [
                                { text: "Дякую! 🥰", class: "btn-primary" }
                            ]);
                        } else {
                            userProfile.startingBonus = 1500; // +1.5M ₴
                            localStorage.setItem('last_ad_reward_time', Date.now().toString());
                            triggerConfetti(); // Confetti on ad reward!
                            showModal("Дякуємо за підтримку! ❤️", "<p>Ви успішно переглянули відеорекламу. У наступній одиночній грі ваш стартовий баланс становитиме <strong>16,500,000 ₴</strong> (бонус +1,500,000 ₴)!</p>", [
                                { text: "Чудово! 🚀", class: "btn-primary" }
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
    return "wss://monopoly-backend-piny.onrender.com";
}

// Start Monopoly game state loop
function startNewGame(playerList) {
    game.reset();
    
    playerList.forEach((p, idx) => {
        const parts = (p.avatar || '').split('|');
        const avatarUrl = parts[0] || 'assets/cossack_tycoon.png';
        const frame = (parts[1] && parts[1] !== 'default') ? parts[1] : null;
        const token = (parts[2] && parts[2] !== 'default') ? parts[2] : null;
        const dice = (parts[3] && parts[3] !== 'default') ? parts[3] : null;
        const trail = (parts[4] && parts[4] !== 'default') ? parts[4] : null;
        const effect = (parts[5] && parts[5] !== 'default') ? parts[5] : null;

        const addedPlayer = game.addPlayer(p.name, `p-color-${idx}`, avatarUrl, p.isBot || false);
        addedPlayer.frame = frame;
        addedPlayer.token = token;
        addedPlayer.dice = dice;
        addedPlayer.trail = trail;
        addedPlayer.effect = effect;
        if (p.style) {
            addedPlayer.style = p.style;
        } else if (p.isBot) {
            const styles = ['agressive', 'balanced', 'conservative'];
            addedPlayer.style = styles[idx % styles.length];
        }

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
// Click on cell shows details (anyone can inspect any cell)
function handleCellClick(index) {
    if (game.botTradeActive) {
        alert("Зараз триває обговорення угоди з роботом! Спочатку прийміть або відхиліть пропозицію.");
        return;
    }
    const space = game.spaces[index];
    const localPlayerId = isMultiplayerGame ? mp.playerId : 0; // В синглплеере игрок - 0, в мультиплеере - mp.playerId

    if (space.type === SPACE_TYPES.PROPERTY || space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY) {
        const isSelf = space.owner === localPlayerId;
        const isMyTurn = game.currentPlayerIndex === localPlayerId;
        
        // Получаем имя владельца, если оно есть
        let ownerName = null;
        if (space.owner !== null) {
            const ownerObj = game.players.find(p => p.id === space.owner);
            if (ownerObj) {
                ownerName = ownerObj.name;
            }
        }

        if (isSelf && isMyTurn) {
            // Своя компания в свой ход: показываем кнопки управления (апгрейд, залог, выкуп)
            showPropertyModal(
                space,
                null, // onBuy
                null, // onDecline
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
                },
                () => {
                    // Mortgage handler
                    if (isMultiplayerGame && game.currentPlayerIndex === mp.playerId) {
                        const success = game.mortgageProperty(mp.playerId, space.id);
                        if (success) {
                            mp.sendAction({ type: 'mortgage', playerId: mp.playerId, spaceId: space.id });
                            renderBoard(game, handleCellClick);
                            renderPlayersHUD(game);
                            updateGameLog(game);
                            hideModal();
                        } else {
                            alert("Не вдалося заставити майно! Перевірте, чи немає побудованих філій у цієї групи.");
                        }
                    } else if (!isMultiplayerGame) {
                        const success = game.mortgageProperty(game.currentPlayerIndex, space.id);
                        if (success) {
                            renderBoard(game, handleCellClick);
                            renderPlayersHUD(game);
                            updateGameLog(game);
                            hideModal();
                        } else {
                            alert("Не вдалося заставити майно! Перевірте, чи немає побудованих філій у цієї групи.");
                        }
                    }
                },
                () => {
                    // Unmortgage handler
                    if (isMultiplayerGame && game.currentPlayerIndex === mp.playerId) {
                        const success = game.unmortgageProperty(mp.playerId, space.id);
                        if (success) {
                            mp.sendAction({ type: 'unmortgage', playerId: mp.playerId, spaceId: space.id });
                            renderBoard(game, handleCellClick);
                            renderPlayersHUD(game);
                            updateGameLog(game);
                            hideModal();
                        } else {
                            alert("Недостатньо грошей для викупу майна!");
                        }
                    } else if (!isMultiplayerGame) {
                        const success = game.unmortgageProperty(game.currentPlayerIndex, space.id);
                        if (success) {
                            renderBoard(game, handleCellClick);
                            renderPlayersHUD(game);
                            updateGameLog(game);
                            hideModal();
                        } else {
                            alert("Недостатньо грошей для викупу майна!");
                        }
                    }
                },
                ownerName
            );
        } else {
            // Чужая ячейка, свободная ячейка или своя в чужой ход: только для просмотра
            showPropertyModal(
                space,
                null, // onBuy = null -> скроет кнопки покупки
                null, // onDecline = null
                isSelf, // isSelfOwner
                null, // onUpgrade = null -> скроет кнопку улучшения
                null, // onMortgage = null -> скроет кнопку залога
                null, // onUnmortgage = null -> скроет кнопку выкупа
                ownerName
            );
        }
    } else {
        // Некоммерческая клетка (Старт, Тюрьма, Налог, Парковка, Шанс)
        showSpecialSpaceModal(space, game.freeParkingCash);
    }
}

// Global functions for Center Board Trade System
window.closeCenterTrade = () => {
    game.botTradeActive = false;
    game.pendingBotTrade = null;
    // Clear highlights on outer cells
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('trade-highlight-offer', 'trade-highlight-request');
    });
    renderBoard(game, handleCellClick);
};

// Heuristic check: does receiving propertyId complete a monopoly for playerId?
function completesMonopoly(playerId, propertyId, isReceiving) {
    if (!propertyId) return false;
    const space = game.spaces.find(s => s.id === propertyId);
    if (!space || !space.group) return false;
    
    const groupSpaces = game.spaces.filter(s => s.group === space.group);
    if (isReceiving) {
        // Will owner own all spaces in the group after receiving this one?
        const otherSpaces = groupSpaces.filter(s => s.id !== propertyId);
        return otherSpaces.every(s => s.owner === playerId);
    }
    return false;
}

// Heuristic trade evaluation for bots
function evaluateBotTrade(proposerId, receiverId, offerProps, offerCash, requestProps, requestCash) {
    const receiver = game.players.find(p => p.id === receiverId); // the bot
    const proposer = game.players.find(p => p.id === proposerId); // the player
    
    // Value bot gives up (Given)
    let valueGiven = requestCash;
    requestProps.forEach(propId => {
        const space = game.spaces.find(s => s.id === propId);
        if (space) {
            let val = space.price;
            // Check if player completes monopoly by receiving this property
            if (completesMonopoly(proposerId, propId, true)) {
                val *= 2.2; // penalty for helping player complete monopoly
            }
            valueGiven += val;
        }
    });
    
    // Value bot receives (Received)
    let valueReceived = offerCash;
    offerProps.forEach(propId => {
        const space = game.spaces.find(s => s.id === propId);
        if (space) {
            let val = space.price;
            // Check if bot completes monopoly by receiving this property
            if (completesMonopoly(receiverId, propId, true)) {
                val *= 2.5; // bonus for completing monopoly
            }
            valueReceived += val;
        }
    });
    
    // Determine threshold based on bot style
    const botProfile = receiver.style || 'balanced';
    let ratioThreshold = 0.95;
    if (botProfile === 'agressive' || botProfile === 'aggressive') ratioThreshold = 0.90;
    if (botProfile === 'conservative') ratioThreshold = 1.05;
    
    const accepted = valueReceived >= valueGiven * ratioThreshold;
    return {
        accepted,
        valueReceived,
        valueGiven,
        ratioThreshold
    };
}

// Check if bot wants to propose a trade proactively
function checkForBotProactiveTrade(botId) {
    const bot = game.players.find(p => p.id === botId);
    const player = game.players.find(p => p.id === 0);
    if (!bot || bot.isBankrupt || !player || player.isBankrupt) return null;

    // Check color groups
    const groups = Object.values(COLOR_GROUPS);
    for (const group of groups) {
        const groupSpaces = game.spaces.filter(s => s.group === group);
        if (groupSpaces.length === 2) {
            const spaceA = groupSpaces[0];
            const spaceB = groupSpaces[1];
            
            // Check if one is owned by bot and one by player, and neither has branches/mortgages
            const botOwnsA = spaceA.owner === botId;
            const botOwnsB = spaceB.owner === botId;
            const playerOwnsA = spaceA.owner === 0;
            const playerOwnsB = spaceB.owner === 0;
            
            if (((botOwnsA && playerOwnsB) || (botOwnsB && playerOwnsA)) && spaceA.branches === 0 && spaceB.branches === 0 && !spaceA.isMortgaged && !spaceB.isMortgaged) {
                const botProperty = botOwnsA ? spaceA : spaceB;
                const playerProperty = botOwnsA ? spaceB : spaceA;
                
                // Now evaluate whether bot is rich or poor
                if (bot.money > 2500) {
                    // Bot wants to BUY the player's property to complete their monopoly
                    const offerCash = Math.round(playerProperty.price * 1.35);
                    // Bot must have enough money to actually pay this (price + 500 reserve)
                    if (bot.money >= offerCash + 500) {
                        return {
                            type: 'buy_monopoly',
                            offerProps: [],
                            offerCash: offerCash,
                            requestProps: [playerProperty.id],
                            requestCash: 0
                        };
                    }
                } else if (bot.money < 1000) {
                    // Bot is poor, tries to SELL its property to player to raise cash
                    const requestCash = Math.round(botProperty.price * 0.90);
                    // Player must have enough cash to pay
                    if (player.money >= requestCash) {
                        return {
                            type: 'sell_property',
                            offerProps: [botProperty.id],
                            offerCash: 0,
                            requestProps: [],
                            requestCash: requestCash
                        };
                    }
                }
            }
        }
    }
    return null;
}

// Display proactive bot trade proposal in the center
function displayBotProactiveTrade(botId, trade) {
    const bot = game.players.find(p => p.id === botId);
    const centerEl = document.getElementById('board-center');
    if (!centerEl) return;
    
    let offerHtml = '';
    if (trade.offerCash > 0) {
        offerHtml += `<div style="font-size: 0.65rem; color: var(--color-success); font-weight: 700; margin-bottom: 2px;">₴${trade.offerCash}</div>`;
    }
    trade.offerProps.forEach(id => {
        const space = game.spaces[id];
        offerHtml += `
            <div class="center-trade-item" style="padding: 2px; font-size: 0.52rem; display: flex; align-items: center; gap: 4px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: var(--prop-${space.group}); display: inline-block;"></span>
                <span>${space.name}</span>
            </div>
        `;
    });
    if (!offerHtml) offerHtml = '<span style="color: var(--text-muted); font-size: 0.5rem;">Нічого</span>';
    
    let requestHtml = '';
    if (trade.requestCash > 0) {
        requestHtml += `<div style="font-size: 0.65rem; color: var(--color-yellow); font-weight: 700; margin-bottom: 2px;">₴${trade.requestCash}</div>`;
    }
    trade.requestProps.forEach(id => {
        const space = game.spaces[id];
        requestHtml += `
            <div class="center-trade-item" style="padding: 2px; font-size: 0.52rem; display: flex; align-items: center; gap: 4px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: var(--prop-${space.group}); display: inline-block;"></span>
                <span>${space.name}</span>
            </div>
        `;
    });
    if (!requestHtml) requestHtml = '<span style="color: var(--text-muted); font-size: 0.5rem;">Нічого</span>';

    centerEl.innerHTML = `
        <div class="center-trade-container" style="animation: center-trade-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
            <div class="center-trade-header" style="color: var(--color-primary); border-bottom: 1.5px solid var(--border-glass); padding-bottom: 3px; font-size: 0.72rem;">
                <span>Пропозиція від ${bot.name}</span>
            </div>
            <div class="center-trade-body" style="display: flex; gap: 6px; flex: 1; margin-top: 4px;">
                <div class="center-trade-column" style="flex: 1; border-right: 1px solid rgba(255,255,255,0.08); padding-right: 3px;">
                    <h4 style="color: var(--color-success); font-size: 0.58rem; margin: 0 0 2px 0;">Робот пропонує:</h4>
                    <div class="center-trade-list" style="display: flex; flex-direction: column; gap: 2px;">
                        ${offerHtml}
                    </div>
                </div>
                <div class="center-trade-column" style="flex: 1; padding-left: 3px;">
                    <h4 style="color: var(--color-yellow); font-size: 0.58rem; margin: 0 0 2px 0;">Робот хоче:</h4>
                    <div class="center-trade-list" style="display: flex; flex-direction: column; gap: 2px;">
                        ${requestHtml}
                    </div>
                </div>
            </div>
            <div class="center-trade-actions" style="display: flex; gap: 4px; width: 100%; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
                <button class="btn btn-primary" style="flex: 1; padding: 3px 0; font-size: 0.55rem; height: auto;" onclick="window.acceptBotProactiveTrade()">Прийняти</button>
                <button class="btn btn-danger" style="flex: 1; padding: 3px 0; font-size: 0.55rem; height: auto;" onclick="window.declineBotProactiveTrade()">Відхилити</button>
            </div>
        </div>
    `;
    window.updateTradeHighlightsForProactive(trade.offerProps, trade.requestProps);
}

// Resume bot turn execution after trade resolution
function resumeBotTurnAfterTrade() {
    const bot = game.getCurrentPlayer();
    if (!bot || !bot.isBot || bot.isBankrupt) return;
    
    if (game.rolledDouble && !bot.inJail && !bot.isBankrupt) {
        game.log(`🎲 Робот ${bot.name} викинув дубль і кидає ще раз!`);
        updateGameLog(game);
        setTimeout(runBotTurn, 1500);
    } else {
        executeBotEndTurn();
    }
}

window.acceptBotProactiveTrade = () => {
    if (!game.pendingBotTrade) return;
    const t = game.pendingBotTrade;
    const bot = game.players.find(p => p.id === t.botId);
    const player = game.players.find(p => p.id === 0);
    
    // Safety check money limits
    if (bot.money < t.offerCash) {
        alert("У робота недостатньо коштів для завершення угоди!");
        window.declineBotProactiveTrade();
        return;
    }
    if (player.money < t.requestCash) {
        alert("У вас недостатньо коштів для прийняття цієї угоди!");
        game.botTradeActive = false;
        game.pendingBotTrade = null;
        window.closeCenterTrade();
        resumeBotTurnAfterTrade();
        return;
    }
    
    // Execute trade
    const success = game.executeTrade(t.botId, 0, t.offerProps, t.offerCash, t.requestProps, t.requestCash);
    if (success) {
        game.log(`🤝 Ви прийняли пропозицію обміну від ${bot.name}.`, 'gain');
        renderPlayersHUD(game);
        renderBoard(game, handleCellClick);
        updateGameLog(game);
    }
    
    game.botTradeActive = false;
    game.pendingBotTrade = null;
    window.closeCenterTrade();
    
    // Resume bot turn
    setTimeout(resumeBotTurnAfterTrade, 1500);
};

window.declineBotProactiveTrade = () => {
    if (!game.pendingBotTrade) return;
    const bot = game.players.find(p => p.id === game.pendingBotTrade.botId);
    
    game.log(`❌ Ви відхилили пропозицію обміну від ${bot.name}.`, 'pay');
    updateGameLog(game);
    
    game.botTradeActive = false;
    game.pendingBotTrade = null;
    window.closeCenterTrade();
    
    // Resume bot turn
    setTimeout(resumeBotTurnAfterTrade, 1000);
};

window.updateTradeHighlightsForProactive = (offerProps, requestProps) => {
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('trade-highlight-offer', 'trade-highlight-request');
    });
    offerProps.forEach(id => {
        const cellEl = document.querySelector(`.cell-${id}`);
        if (cellEl) cellEl.classList.add('trade-highlight-offer');
    });
    requestProps.forEach(id => {
        const cellEl = document.querySelector(`.cell-${id}`);
        if (cellEl) cellEl.classList.add('trade-highlight-request');
    });
};

window.updateTradeHighlights = () => {
    // Clear all trade highlights first
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('trade-highlight-offer', 'trade-highlight-request');
    });

    // Highlight what you are offering (Green)
    document.querySelectorAll('.trade-offer-prop:checked').forEach(el => {
        const propId = el.value;
        const cellEl = document.querySelector(`.cell-${propId}`);
        if (cellEl) cellEl.classList.add('trade-highlight-offer');
    });

    // Highlight what you are requesting (Orange)
    document.querySelectorAll('.trade-request-prop:checked').forEach(el => {
        const propId = el.value;
        const cellEl = document.querySelector(`.cell-${propId}`);
        if (cellEl) cellEl.classList.add('trade-highlight-request');
    });
};

window.sendCenterTrade = (clickedPlayerId) => {
    const localPlayerId = isMultiplayerGame ? mp.playerId : 0;
    const proposer = game.players.find(p => p.id === localPlayerId);
    const receiver = game.players.find(p => p.id === clickedPlayerId);

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
        
        // Show status waiting inside the center area
        const centerEl = document.getElementById('board-center');
        if (centerEl) {
            centerEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-secondary); text-align: center; font-size: 0.65rem; height: 100%; padding: 5px;">
                    <i class="fa-solid fa-paper-plane" style="font-size: 1.2rem; color: var(--color-primary); animation: center-logo-pulse 2s infinite;"></i>
                    <p style="margin: 0; line-height: 1.3;">Пропозицію надіслано.<br>Очікування відповіді від <strong>${receiver.name}</strong>...</p>
                    <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 0.55rem; width: auto; margin-top: 4px;" onclick="window.closeCenterTrade()">Скасувати</button>
                </div>
            `;
        }
    } else {
        // Single-player bot trade evaluation
        game.botTradeActive = true;
        game.pendingBotTrade = {
            botId: clickedPlayerId,
            offerProps,
            offerCash,
            requestProps,
            requestCash
        };

        const centerEl = document.getElementById('board-center');
        if (centerEl) {
            centerEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-secondary); text-align: center; font-size: 0.65rem; height: 100%; padding: 5px;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; color: var(--color-primary);"></i>
                    <p style="margin: 0; line-height: 1.3;"><strong>${receiver.name}</strong> розглядає вашу пропозицію...</p>
                </div>
            `;
        }

        setTimeout(() => {
            if (!game.botTradeActive || !game.pendingBotTrade) return;

            const res = evaluateBotTrade(localPlayerId, clickedPlayerId, offerProps, offerCash, requestProps, requestCash);
            
            if (res.accepted) {
                const tradeSuccess = game.executeTrade(localPlayerId, clickedPlayerId, offerProps, offerCash, requestProps, requestCash);
                if (tradeSuccess) {
                    game.log(`🤝 Угода прийнята! ${receiver.name} погодився на ваші умови.`, 'gain');
                    renderPlayersHUD(game);
                    renderBoard(game, handleCellClick);
                    updateGameLog(game);

                    if (centerEl) {
                        centerEl.innerHTML = `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--color-success); text-align: center; font-size: 0.65rem; height: 100%; padding: 5px;">
                                <i class="fa-solid fa-circle-check" style="font-size: 1.25rem;"></i>
                                <p style="margin: 0; font-weight: 700;">Угоду прийнято!</p>
                                <p style="margin: 0; color: var(--text-secondary); line-height: 1.2;">${receiver.name} погодився на обмін.</p>
                                <button class="btn btn-primary" style="padding: 2px 8px; font-size: 0.55rem; width: auto; margin-top: 4px;" onclick="window.closeCenterTrade()">Чудово</button>
                            </div>
                        `;
                    }
                } else {
                    game.log(`❌ Угода не відбулась через помилку валідації.`, 'pay');
                    updateGameLog(game);
                    window.closeCenterTrade();
                }
            } else {
                game.log(`❌ ${receiver.name} відхилив пропозицію обміну.`, 'pay');
                updateGameLog(game);

                if (centerEl) {
                    centerEl.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--color-danger); text-align: center; font-size: 0.65rem; height: 100%; padding: 5px;">
                            <i class="fa-solid fa-circle-xmark" style="font-size: 1.25rem;"></i>
                            <p style="margin: 0; font-weight: 700;">Угоду відхилено</p>
                            <p style="margin: 0; color: var(--text-secondary); line-height: 1.2;">${receiver.name} вважає пропозицію невигідною.</p>
                            <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.55rem; width: auto; margin-top: 4px;" onclick="window.closeCenterTrade()">Закрити</button>
                        </div>
                    `;
                }
            }

            game.botTradeActive = false;
            game.pendingBotTrade = null;

        }, 1500);
    }
};

window.acceptCenterTrade = (proposerId, receiverId, offerProps, offerCash, requestProps, requestCash) => {
    const receiver = game.players.find(p => p.id === mp.playerId);
    if (receiver.money < requestCash) {
        alert("У вас недостатньо грошей для прийняття цієї угоди!");
        mp.sendAction({
            type: 'trade_decline',
            proposerId: proposerId,
            receiverId: mp.playerId,
            reason: 'no_money'
        });
        window.closeCenterTrade();
        return;
    }
    
    const proposerPlayer = game.players.find(p => p.id === proposerId);
    if (proposerPlayer.money < offerCash) {
        alert("У партнера недостатньо грошей для завершення угоди!");
        mp.sendAction({
            type: 'trade_decline',
            proposerId: proposerId,
            receiverId: mp.playerId,
            reason: 'partner_no_money'
        });
        window.closeCenterTrade();
        return;
    }

    game.executeTrade(proposerId, receiverId, offerProps, offerCash, requestProps, requestCash);
    mp.sendAction({
        type: 'trade_accept',
        proposerId: proposerId,
        receiverId: receiverId,
        offerProps,
        offerCash,
        requestProps,
        requestCash
    });
    
    window.closeCenterTrade();
    renderPlayersHUD(game);
    updateGameLog(game);
};

window.declineCenterTrade = (proposerId) => {
    mp.sendAction({
        type: 'trade_decline',
        proposerId: proposerId,
        receiverId: mp.playerId
    });
    window.closeCenterTrade();
};

// Open trade proposal editor in the center of the board
function handlePlayerClick(clickedPlayerId) {
    if (game.botTradeActive) {
        alert("Зараз триває обговорення угоди з роботом! Спочатку прийміть або відхиліть пропозицію.");
        return;
    }
    const localPlayerId = isMultiplayerGame ? mp.playerId : 0;
    if (clickedPlayerId === localPlayerId) return;

    if (!isMultiplayerGame && game.currentPlayerIndex !== 0) {
        alert("Ви можете пропонувати угоди тільки у свій хід!");
        return;
    }

    const proposer = game.players.find(p => p.id === localPlayerId);
    const receiver = game.players.find(p => p.id === clickedPlayerId);
    if (!proposer || !receiver || proposer.isBankrupt || receiver.isBankrupt) return;

    // Filter properties, stations, utilities owned by proposer/receiver, excluding groups with branches built
    const hasGroupBranches = (space) => {
        if (!space.group) return (space.branches || 0) > 0;
        const groupSpaces = game.spaces.filter(s => s.group === space.group);
        return groupSpaces.some(s => s.branches > 0);
    };
    const proposerProps = game.spaces.filter(s => s.owner === localPlayerId && (s.type === SPACE_TYPES.PROPERTY || s.type === SPACE_TYPES.STATION || s.type === SPACE_TYPES.UTILITY) && !hasGroupBranches(s));
    const receiverProps = game.spaces.filter(s => s.owner === clickedPlayerId && (s.type === SPACE_TYPES.PROPERTY || s.type === SPACE_TYPES.STATION || s.type === SPACE_TYPES.UTILITY) && !hasGroupBranches(s));

    let centerTradeHtml = `
        <div class="center-trade-container">
            <div class="center-trade-header">
                <span>Угода з ${receiver.name}</span>
                <span class="trade-close-btn" style="cursor: pointer; color: var(--color-danger); font-size: 0.8rem;" onclick="window.closeCenterTrade()"><i class="fa-solid fa-xmark"></i></span>
            </div>
            <div class="center-trade-body">
                <!-- Proposer Offer (Left) -->
                <div class="center-trade-column" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 3px;">
                    <h4 style="color: var(--color-success); font-size: 0.6rem;">Ви пропонуєте:</h4>
                    <div class="center-trade-input-grp">
                        <input type="number" id="trade-offer-cash" min="0" max="${proposer.money}" value="0" placeholder="₴ Доплата">
                    </div>
                    <div class="center-trade-list">
    `;

    if (proposerProps.length === 0) {
        centerTradeHtml += `<span style="color: var(--text-muted); font-size: 0.5rem; text-align: center; padding: 5px 0;">Нічого дати</span>`;
    } else {
        proposerProps.forEach(p => {
            const branchText = p.branches > 0 ? ` (${p.branches} ф.)` : '';
            centerTradeHtml += `
                <label class="center-trade-item" title="${p.name}">
                    <input type="checkbox" class="trade-offer-prop" value="${p.id}" onchange="window.updateTradeHighlights()">
                    <span style="width: 5px; height: 5px; border-radius: 50%; background: var(--prop-${p.group || 'special'}); display: inline-block; flex-shrink: 0;"></span>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55px; font-size: 0.52rem;">${p.name}${branchText}</span>
                </label>
            `;
        });
    }

    centerTradeHtml += `
                    </div>
                </div>

                <!-- Receiver Request (Right) -->
                <div class="center-trade-column" style="padding-left: 3px;">
                    <h4 style="color: var(--color-yellow); font-size: 0.6rem;">Ви хочете:</h4>
                    <div class="center-trade-input-grp">
                        <input type="number" id="trade-request-cash" min="0" max="${receiver.money}" value="0" placeholder="₴ Гроші">
                    </div>
                    <div class="center-trade-list">
    `;

    if (receiverProps.length === 0) {
        centerTradeHtml += `<span style="color: var(--text-muted); font-size: 0.5rem; text-align: center; padding: 5px 0;">Нічого попросити</span>`;
    } else {
        receiverProps.forEach(p => {
            const branchText = p.branches > 0 ? ` (${p.branches} ф.)` : '';
            centerTradeHtml += `
                <label class="center-trade-item" title="${p.name}">
                    <input type="checkbox" class="trade-request-prop" value="${p.id}" onchange="window.updateTradeHighlights()">
                    <span style="width: 5px; height: 5px; border-radius: 50%; background: var(--prop-${p.group || 'special'}); display: inline-block; flex-shrink: 0;"></span>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55px; font-size: 0.52rem;">${p.name}${branchText}</span>
                </label>
            `;
        });
    }

    centerTradeHtml += `
                    </div>
                </div>
            </div>
            <div class="center-trade-actions">
                <button class="btn btn-primary" onclick="window.sendCenterTrade(${clickedPlayerId})">Надіслати угоду</button>
            </div>
        </div>
    `;

    const centerEl = document.getElementById('board-center');
    if (centerEl) {
        centerEl.innerHTML = centerTradeHtml;
        window.updateTradeHighlights(); // Initialize empty highlights
    }
}

function showGameStatsModal() {
    let html = `
        <div class="stats-modal-content" style="color: var(--text-primary); font-family: 'Outfit', sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); padding: 0.6rem 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Поточний хід: <strong class="text-yellow" style="font-size: 0.9rem;">${game.turnCount} / ${game.maxTurns}</strong></span>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Благодійний фонд: <strong class="text-success" style="font-size: 0.9rem;">₴${game.freeParkingCash}</strong></span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
    `;

    game.players.forEach(p => {
        const netWorth = game.getNetWorth(p.id);
        const ownedSpaces = game.spaces.filter(s => s.owner === p.id);
        
        let propsHtml = '';
        if (ownedSpaces.length === 0) {
            propsHtml = `<span style="color: var(--text-muted); font-size: 0.65rem;">Немає компаній</span>`;
        } else {
            ownedSpaces.forEach(s => {
                const color = s.group ? `var(--prop-${s.group})` : 'var(--prop-special)';
                const badgeText = s.type === SPACE_TYPES.STATION ? 'УЗ' : 
                                  s.type === SPACE_TYPES.UTILITY ? 'Дія' : 
                                  s.name.substring(0, 3);
                const mortgageText = s.isMortgaged ? ' 🔒' : '';
                const branchesText = s.branches > 0 ? ` (${s.branches}ф)` : '';
                
                propsHtml += `
                    <span style="background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 6px; font-size: 0.55rem; font-weight: 700; display: inline-flex; align-items: center; border: 1px solid rgba(255,255,255,0.15);" title="${s.name}">
                        ${badgeText}${branchesText}${mortgageText}
                    </span>
                `;
            });
        }

        html += `
            <div class="player-stat-card ${p.isBankrupt ? 'bankrupt' : ''}" style="background: rgba(255,255,255,0.03); border: 1.5px solid var(--border-glass); border-radius: 12px; padding: 0.75rem; position: relative; display: flex; flex-direction: column; gap: 0.4rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.35rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div class="avatar-container ${p.frame ? 'frame-' + p.frame : ''}" style="width: 26px; height: 26px;">
                            <img src="${p.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.src='assets/cossack_tycoon.png'">
                        </div>
                        <span style="font-weight: 700; font-size: 0.8rem; color: var(--text-primary);">${p.name} ${game.currentPlayerIndex === p.id ? '👤' : ''}</span>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 700; color: ${p.isBankrupt ? 'var(--text-muted)' : 'var(--color-success)'};">
                        ${p.isBankrupt ? 'БАНКРУТ' : `₴${p.money}`}
                    </span>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-secondary);">
                    <span>Капітал (Net Worth):</span>
                    <strong>₴${p.isBankrupt ? 0 : netWorth}</strong>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                    <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600;">Компанії:</span>
                    <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                        ${propsHtml}
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    showModal("Статистика гри 📊", html, [{ text: "Закрити", class: "btn-secondary" }]);
}

function enableNextTurnButton() {
    const rollBtn = document.getElementById('btn-roll-dice');
    const endTurnBtn = document.getElementById('btn-end-turn');
    const activePlayer = game.getCurrentPlayer();
    
    // Check if it's the local user's turn
    const localPlayerId = isMultiplayerGame ? mp.playerId : game.currentPlayerIndex;
    if (activePlayer.id !== localPlayerId) {
        rollBtn.disabled = true;
        endTurnBtn.disabled = true;
        return;
    }
    
    if (game.rolledDouble && !activePlayer.inJail && !activePlayer.isBankrupt) {
        rollBtn.disabled = false;
        endTurnBtn.disabled = true;
    } else {
        rollBtn.disabled = true;
        endTurnBtn.disabled = false;
    }
}

// User Roll Turn
function handleUserRoll() {
    if (game.botTradeActive) {
        alert("Зараз триває обговорення угоди з роботом! Спочатку прийміть або відхиліть пропозицію.");
        return;
    }
    const rollBtn = document.getElementById('btn-roll-dice');
    rollBtn.disabled = true;

    const activePlayer = game.getCurrentPlayer();

    // Check if in Jail
    if (activePlayer.inJail) {
        showModal("Вихід з Тюрми", "<p>Ви перебуваєте в тюрмі. Оберіть дію:</p>", [
            {
                text: "Сплатити штраф ₴500",
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
                        }, activePlayer.dice, activePlayer.trail);
                    } else {
                        animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                            enableNextTurnButton();
                        }, activePlayer.dice, activePlayer.trail);
                    }
                }
            }
        ]);
        return;
    }

    // Normal Roll
    const startedInJail = activePlayer.inJail;
    const { d1, d2, sum, isDouble } = game.rollDice();
    game.log(`${activePlayer.name} кинув кубики: ${d1}:${d2}`, 'system');
    
    if (isMultiplayerGame) {
        mp.sendAction({ type: 'roll', d1, d2, sum });
    }

    // Doubles check
    if (isDouble && !startedInJail) {
        game.consecutiveDoubles++;
        if (game.consecutiveDoubles === 3) {
            game.consecutiveDoubles = 0;
            game.rolledDouble = false;
            game.log(`🚨 3 дублі підряд! ${activePlayer.name} відправляється в Тюрму.`, 'system');
            
            game.sendToJail(activePlayer.id);
            if (isMultiplayerGame) {
                mp.sendAction({ type: 'go_to_jail', playerId: activePlayer.id });
            }
            
            animateDiceRoll(d1, d2, () => {
                updatePlayerTokens(game);
                renderPlayersHUD(game);
                updateGameLog(game);
                const endTurnBtn = document.getElementById('btn-end-turn');
                endTurnBtn.disabled = false;
            }, activePlayer.dice, activePlayer.trail);
            return;
        } else {
            game.rolledDouble = true;
            game.log(`🎲 Дубль (${d1}:${d2})! ${activePlayer.name} отримує право на ще один кидок.`, 'gain');
        }
    } else {
        game.consecutiveDoubles = 0;
        game.rolledDouble = false;
    }

    const fromPos = activePlayer.position;
    game.movePlayer(activePlayer.id, sum);

    animateDiceRoll(d1, d2, () => {
        animatePlayerMovement(game, activePlayer.id, fromPos, sum, () => {
            renderPlayersHUD(game);
            resolveLandingSpace(activePlayer.id, activePlayer.position, sum);
        });
    }, activePlayer.dice, activePlayer.trail);
}

// Landing space checker and action triggers
function resolveLandingSpace(playerId, spaceId, diceSum) {
    const player = game.players.find(p => p.id === playerId);
    const space = game.spaces[spaceId];

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
                    enableNextTurnButton();
                },
                () => {
                    game.log(`${player.name} відмовився купувати ${space.name}`);
                    updateGameLog(game);
                    enableNextTurnButton();
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
                enableNextTurnButton();
            }
        } else {
            // Own property landed
            enableNextTurnButton();
        }
    } else if (space.type === SPACE_TYPES.FREE_PARKING) {
        const claimed = game.claimFreeParking(playerId);
        if (isMultiplayerGame && claimed > 0 && playerId === mp.playerId) {
            mp.sendAction({ type: 'claim_parking', playerId, amount: claimed });
        }
        if (claimed > 0) {
            const isLocal = isMultiplayerGame ? (playerId === mp.playerId) : (playerId === 0);
            if (isLocal) {
                triggerConfetti();
            }
        }
        renderPlayersHUD(game);
        updateGameLog(game);
        enableNextTurnButton();
    } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
        game.sendToJail(playerId);
        if (isMultiplayerGame && playerId === mp.playerId) {
            mp.sendAction({ type: 'go_to_jail', playerId });
        }
        updatePlayerTokens(game);
        renderPlayersHUD(game);
        updateGameLog(game);
        enableNextTurnButton();
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
        enableNextTurnButton();
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
            const isLocal = isMultiplayerGame ? (playerId === mp.playerId) : (playerId === 0);
            if (isLocal) {
                triggerConfetti();
            }
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
            const isLocal = isMultiplayerGame ? (playerId === mp.playerId) : (playerId === 0);
            if (isLocal) {
                triggerConfetti();
            }
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
        enableNextTurnButton();
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

        const propsToSell = game.spaces.filter(s => s.owner === playerId && !s.isMortgaged && (!s.branches || s.branches === 0));
        propsToSell.forEach(s => {
            const sellVal = Math.floor(s.price * 0.5);
            itemsHtml += `
                <button class="btn btn-secondary" style="width:100%; display:flex; justify-content:space-between;" id="btn-sell-prop-${s.id}">
                    <span>Заставити компанію ${s.name}</span><strong>+₴${sellVal}</strong>
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
                    enableNextTurnButton();
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
                        enableNextTurnButton();
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
                game.mortgageProperty(playerId, s.id);
                if (isMultiplayerGame) {
                    mp.sendAction({ type: 'mortgage', playerId, spaceId: s.id });
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
    if (game.botTradeActive) {
        alert("Зараз триває обговорення угоди з роботом! Спочатку прийміть або відхиліть пропозицію.");
        return;
    }
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
        game.log(`${bot.name} намагається вийти з тюрми...`);
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
                }, bot.dice, bot.trail);
            } else {
                animateDiceRoll(rollResult.d1, rollResult.d2, () => {
                    setTimeout(executeBotEndTurn, 1500);
                }, bot.dice, bot.trail);
            }
        }
        return;
    }

    executeBotRoll();
}

function executeBotRoll() {
    const bot = game.getCurrentPlayer();
    if (!bot || !bot.isBot || bot.isBankrupt) return;

    const startedInJail = bot.inJail;
    const { d1, d2, sum, isDouble } = game.rollDice();
    game.log(`${bot.name} кинув кубики: ${d1}:${d2}`, 'system');
    
    // Doubles logic
    if (isDouble && !startedInJail) {
        game.consecutiveDoubles++;
        if (game.consecutiveDoubles === 3) {
            game.consecutiveDoubles = 0;
            game.rolledDouble = false;
            game.log(`🚨 3 дублі підряд! ${bot.name} відправляється в Тюрму.`, 'system');
            
            game.sendToJail(bot.id);
            animateDiceRoll(d1, d2, () => {
                updatePlayerTokens(game);
                renderPlayersHUD(game);
                updateGameLog(game);
                setTimeout(executeBotEndTurn, 1500);
            }, bot.dice, bot.trail);
            return;
        } else {
            game.rolledDouble = true;
        }
    } else {
        game.consecutiveDoubles = 0;
        game.rolledDouble = false;
    }

    const fromPos = bot.position;
    game.movePlayer(bot.id, sum);

    animateDiceRoll(d1, d2, () => {
        animatePlayerMovement(game, bot.id, fromPos, sum, () => {
            renderPlayersHUD(game);
            resolveBotLanding(bot.id, bot.position, sum);
        });
    }, bot.dice, bot.trail);
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

    // Check for proactive trade in single-player mode
    if (!isMultiplayerGame) {
        const trade = checkForBotProactiveTrade(bot.id);
        if (trade) {
            game.pendingBotTrade = {
                botId: bot.id,
                offerProps: trade.offerProps,
                offerCash: trade.offerCash,
                requestProps: trade.requestProps,
                requestCash: trade.requestCash
            };
            game.botTradeActive = true;
            
            // Display proposal to player
            displayBotProactiveTrade(bot.id, trade);
            return; // Pause bot turn loop, do NOT end turn!
        }
    }

    if (game.rolledDouble && !bot.inJail && !bot.isBankrupt) {
        game.log(`🎲 Робот ${bot.name} викинув дубль і кидає ще раз!`);
        updateGameLog(game);
        setTimeout(runBotTurn, 1500);
    } else {
        executeBotEndTurn();
    }
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

    // 2. Mortgage properties
    if (bot.money < 0) {
        const props = game.spaces.filter(s => s.owner === botId && !s.isMortgaged && (!s.branches || s.branches === 0));
        for (let s of props) {
            if (bot.money >= 0) break;
            game.mortgageProperty(botId, s.id);
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
            const isDouble = action.d1 === action.d2;
            const startedInJail = player.inJail;
            
            game.log(`${player.name} кинув кубики: ${action.d1}:${action.d2}`, 'system');
            const fromPos = player.position;
            
            // Replicate double roll rules on remote clients
            if (isDouble && !startedInJail) {
                game.consecutiveDoubles++;
                if (game.consecutiveDoubles === 3) {
                    game.consecutiveDoubles = 0;
                    game.rolledDouble = false;
                    game.log(`🚨 3 дублі підряд! ${player.name} відправляється в Тюрму.`, 'system');
                    game.sendToJail(playerId);
                    animateDiceRoll(action.d1, action.d2, () => {
                        updatePlayerTokens(game);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                    }, player.dice, player.trail);
                    break;
                } else {
                    game.rolledDouble = true;
                }
            } else {
                game.consecutiveDoubles = 0;
                game.rolledDouble = false;
            }
            
            game.movePlayer(playerId, action.sum);
            animateDiceRoll(action.d1, action.d2, () => {
                animatePlayerMovement(game, playerId, fromPos, action.sum, () => {
                    renderPlayersHUD(game);
                    resolveLandingSpace(playerId, player.position, action.sum);
                });
            }, player.dice, player.trail);
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
                game.log(`${player.name} сплатив штраф ₴500 і вийшов з тюрми`, 'gain');
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
                        game.log(`${player.name} відбув термін 3 ходи, сплатив автоматичний штраф ₴500 і вийшов з тюрми`, 'gain');
                    } else {
                        game.log(`${player.name} викинув дубль (${res.d1}:${res.d2}) та вийшов з тюрми безкоштовно!`, 'gain');
                    }
                    animateDiceRoll(res.d1, res.d2, () => {
                        game.movePlayer(playerId, res.sum);
                        updatePlayerTokens(game);
                        renderPlayersHUD(game);
                        updateGameLog(game);
                        resolveLandingSpace(playerId, player.position, res.sum);
                    }, player.dice, player.trail);
                } else {
                    player.jailTurns++;
                    game.log(`${player.name} кинув кубики (${res.d1}:${res.d2}) та не викинув дубль. Залишається в тюрмі`, 'system');
                    animateDiceRoll(res.d1, res.d2, () => {
                        renderPlayersHUD(game);
                        updateGameLog(game);
                    }, player.dice, player.trail);
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

        case 'mortgage':
            game.mortgageProperty(playerId, action.spaceId);
            renderBoard(game, handleCellClick);
            renderPlayersHUD(game);
            updateGameLog(game);
            break;

        case 'unmortgage':
            game.unmortgageProperty(playerId, action.spaceId);
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

            let incomingTradeHtml = `
                <div class="center-trade-container">
                    <div class="center-trade-header">
                        <span>Пропозиція від ${proposerPlayer.name}</span>
                    </div>
                    <div class="center-trade-body" style="flex-direction: column; justify-content: center; gap: 4px; overflow-y: auto;">
                        <div style="display: flex; gap: 4px; width: 100%;">
                            <!-- Proposer Offer -->
                            <div style="flex: 1; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 3px; min-width: 0;">
                                <div style="color: var(--color-success); font-weight: 700; font-size: 0.6rem; margin-bottom: 2px;">Отримаєте:</div>
                                <div style="font-size: 0.52rem; line-height: 1.2; display: flex; flex-direction: column; gap: 1px;">
                                    <span>Гроші: <strong>₴${action.offerCash}</strong></span>
                                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${offerPropsNames.join(', ') || 'нічого'}">Компанії: ${offerPropsNames.join(', ') || 'нічого'}</span>
                                </div>
                            </div>
                            <!-- Receiver Request -->
                            <div style="flex: 1; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 4px; padding: 3px; min-width: 0;">
                                <div style="color: var(--color-yellow); font-weight: 700; font-size: 0.6rem; margin-bottom: 2px;">Віддасте:</div>
                                <div style="font-size: 0.52rem; line-height: 1.2; display: flex; flex-direction: column; gap: 1px;">
                                    <span>Гроші: <strong>₴${action.requestCash}</strong></span>
                                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${requestPropsNames.join(', ') || 'нічого'}">Компанії: ${requestPropsNames.join(', ') || 'нічого'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="center-trade-actions">
                        <button class="btn btn-primary" onclick="window.acceptCenterTrade(${action.proposerId}, ${action.receiverId}, ${JSON.stringify(action.offerProps)}, ${action.offerCash}, ${JSON.stringify(action.requestProps)}, ${action.requestCash})">Так ✅</button>
                        <button class="btn btn-secondary" onclick="window.declineCenterTrade(${action.proposerId})">Ні ❌</button>
                    </div>
                </div>
            `;

            const centerEl = document.getElementById('board-center');
            if (centerEl) {
                centerEl.innerHTML = incomingTradeHtml;

                // Highlight what you receive as offer (Green) and what you lose as request (Orange)
                document.querySelectorAll('.cell').forEach(el => {
                    el.classList.remove('trade-highlight-offer', 'trade-highlight-request');
                });

                action.offerProps.forEach(propId => {
                    const cellEl = document.querySelector(`.cell-${propId}`);
                    if (cellEl) cellEl.classList.add('trade-highlight-offer');
                });

                action.requestProps.forEach(propId => {
                    const cellEl = document.querySelector(`.cell-${propId}`);
                    if (cellEl) cellEl.classList.add('trade-highlight-request');
                });
            }
            break;

        case 'trade_accept':
            game.executeTrade(action.proposerId, action.receiverId, action.offerProps, action.offerCash, action.requestProps, action.requestCash);
            window.closeCenterTrade();
            renderPlayersHUD(game);
            updateGameLog(game);
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
                window.closeCenterTrade();
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
    
    const winnerName = rankings[0] ? rankings[0].name : '';
    const winnerPlayer = game.players.find(p => p.name === winnerName);
    const winnerEffect = (winnerPlayer && winnerPlayer.effect) ? winnerPlayer.effect : 'default';
    
    showGameOverModal(rankings, () => switchScreen('screen-menu'), winnerEffect);
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
            // Sync support/donate details if tab is support
            if (targetTab === 'support') {
                syncDonateShop();
                if (tgId) {
                    ensureWsConnected(() => {
                        mp.socket.send(JSON.stringify({
                            type: "get_profile",
                            tg_id: tgId,
                            username: userProfile.username
                        }));
                    });
                }
            }
        });
    });

    // Setup support sub-tabs switching
    const subTabBtns = document.querySelectorAll('.donate-tab-btn');
    const subTabContents = document.querySelectorAll('.donate-sub-content');
    
    subTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetSub = btn.getAttribute('data-subtab');
            
            subTabBtns.forEach(b => b.classList.remove('active'));
            subTabContents.forEach(c => c.style.display = 'none');
            
            btn.classList.add('active');
            const targetContent = document.getElementById(`subtab-${targetSub}`);
            if (targetContent) targetContent.style.display = 'block';
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
    { id: "neon", name: "Неонова Аура 💎", desc: "Світиться яскравим блакитним неон-світлом", price: 100, class: "frame-neon" },
    { id: "cyberpunk", name: "Кіберпанк Ворп ⚡️", desc: "Неоново-рожева та блакитна хай-тек рамка", price: 150, class: "frame-cyberpunk" },
    { id: "cossack", name: "Козацька Слава 🇺🇦", desc: "Патріотичний синьо-жовтий перелив", price: 200, class: "frame-cossack" },
    { id: "gold", name: "Кібер Золото 👑", desc: "Рамка з анімованим золотим градієнтом", price: 250, class: "frame-gold" },
    { id: "fire", name: "Пекельне Полум'я 🔥", desc: "Пульсуюче вогняне окантування", price: 300, class: "frame-fire" },
    { id: "rainbow", name: "Веселковий Рейв 🌈", desc: "Анімований перелив кольорів веселки", price: 500, class: "frame-rainbow" }
];

const TOKEN_ITEMS = [
    { id: "tractor", name: "Аграрний Трактор 🚜", desc: "Легендарний трактор, що тягне танк", price: 150 },
    { id: "cat", name: "Бандера-Кіт 🐱", desc: "Грізний бойовий котик", price: 200 },
    { id: "patron", name: "Пес Патрон 🐶", desc: "Найвідоміший сапер України", price: 250 },
    { id: "crown", name: "Корона Монополіста 👑", desc: "Символ абсолютного успіху", price: 300 }
];

const DICE_ITEMS = [
    { id: "neon", name: "Неонові Грані 🌌", desc: "Світяться блакитним світлом у темряві", price: 250, class: "die-neon" },
    { id: "gold", name: "Золоті Злитки 🪙", desc: "Кубики з чистого золота з чорними цятками", price: 400, class: "die-gold" }
];

const TRAIL_ITEMS = [
    { id: "fire", name: "Вогняний Шлейф 🔥", desc: "Залишає полум'яний след при кидку", price: 150 },
    { id: "rainbow", name: "Веселковий Слід 🌈", desc: "Кольоровий спектр при обертанні", price: 150 }
];

const EFFECT_ITEMS = [
    { id: "fireworks", name: "Святковий Салют 🎆", desc: "Яскраві вибухи феєрверків при перемозі", price: 100 },
    { id: "coins", name: "Золотий Дощ 🪙", desc: "Злива блискучих золотих монет", price: 120 },
    { id: "money", name: "Грошопад 💸", desc: "Падіння купюр номіналом ₴1000", price: 150 }
];

function ensureWsConnected(callback) {
    if (mp.socket && mp.socket.readyState === WebSocket.OPEN) {
        callback();
    } else {
        mp.connect(getWsUrl(), userProfile.name, getSyncedAvatar(), () => {
            callback();
        });
    }
}

window.closeLoaderModal = () => {
    const modal = document.getElementById('modal-container');
    if (modal) modal.style.display = 'none';
};

function showFrameShopModal() {
    const supportTabBtn = document.querySelector('.menu-nav-bar .nav-item[data-tab="support"]');
    if (supportTabBtn) {
        supportTabBtn.click();
    }
    const framesSubTabBtn = document.querySelector('.donate-tab-btn[data-subtab="shop-frames"]');
    if (framesSubTabBtn) {
        framesSubTabBtn.click();
    }
}

window.buyCoinsPack = (packId) => {
    if (!tgId) {
        let addedCoins = 0;
        if (packId === 'pack_50') addedCoins = 50;
        else if (packId === 'pack_120') addedCoins = 120;
        else if (packId === 'pack_300') addedCoins = 300;
        
        userProfile.coins = (userProfile.coins || 0) + addedCoins;
        localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
        triggerConfetti();
        syncDonateShop();
        syncProfileTab();
        showModal("Оплата успішна! 🪙", `<p>Ви отримали +${addedCoins} Моно-Коїнів (офлайн-режим).</p>`, [
            { text: "Клас!", class: "btn-primary" }
        ]);
        return;
    }
    showModal("Завантаження ⏳", "<p>Створення платіжного посилання Stars...</p>", []);
    ensureWsConnected(() => {
        mp.socket.send(JSON.stringify({
            type: "get_invoice",
            package: packId,
            tg_id: tgId
        }));
    });
};

window.equipItem = (category, itemId) => {
    let equippedKey;
    if (category === 'frame') equippedKey = 'frame';
    else if (category === 'token') equippedKey = 'token';
    else if (category === 'dice') equippedKey = 'dice';
    else if (category === 'trail') equippedKey = 'trail';
    else if (category === 'effect') equippedKey = 'effect';

    userProfile[equippedKey] = itemId;
    localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
    
    if (category === 'frame') {
        updateUserAvatarFrames();
    }
    
    syncDonateShop();
    syncProfileTab();

    if (tgId) {
        ensureWsConnected(() => {
            mp.socket.send(JSON.stringify({
                type: "equip_item",
                category: category,
                item_id: itemId || "default",
                tg_id: tgId
            }));
        });
    }
};

window.purchaseItem = (category, itemId) => {
    let price = 0;
    if (category === 'frame') {
        const item = FRAME_ITEMS.find(f => f.id === itemId);
        price = item ? item.price : 0;
    } else if (category === 'token') {
        const item = TOKEN_ITEMS.find(t => t.id === itemId);
        price = item ? item.price : 0;
    } else if (category === 'dice') {
        const item = DICE_ITEMS.find(d => d.id === itemId);
        price = item ? item.price : 0;
    } else if (category === 'trail') {
        const item = TRAIL_ITEMS.find(t => t.id === itemId);
        price = item ? item.price : 0;
    } else if (category === 'effect') {
        const item = EFFECT_ITEMS.find(e => e.id === itemId);
        price = item ? item.price : 0;
    }

    if (!tgId) {
        const balance = userProfile.coins || 0;
        if (balance < price) {
            alert(`Недостатньо Моно-Коїнів! Потрібно: 🪙${price}, у вас: 🪙${balance}`);
            return;
        }
        userProfile.coins -= price;
        
        let purchasedListKey;
        let equippedKey;
        if (category === 'frame') { purchasedListKey = 'purchasedFrames'; equippedKey = 'frame'; }
        else if (category === 'token') { purchasedListKey = 'purchasedTokens'; equippedKey = 'token'; }
        else if (category === 'dice') { purchasedListKey = 'purchasedDice'; equippedKey = 'dice'; }
        else if (category === 'trail') { purchasedListKey = 'purchasedTrails'; equippedKey = 'trail'; }
        else if (category === 'effect') { purchasedListKey = 'purchasedEffects'; equippedKey = 'effect'; }
        
        if (!userProfile[purchasedListKey]) userProfile[purchasedListKey] = [];
        if (!userProfile[purchasedListKey].includes(itemId)) {
            userProfile[purchasedListKey].push(itemId);
        }
        userProfile[equippedKey] = itemId;
        
        localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
        triggerConfetti();
        updateUserAvatarFrames();
        syncDonateShop();
        syncProfileTab();
        
        let catText = "елемент";
        if (category === 'frame') catText = "рамку";
        else if (category === 'token') catText = "фішку";
        else if (category === 'dice') catText = "кубик";
        else if (category === 'trail') catText = "шлейф";
        else if (category === 'effect') catText = "ефект перемоги";

        showModal("Успішна покупка! 🎉", `<p>Ви придбали та одягли ${catText}!</p>`, [
            { text: "Клас!", class: "btn-primary" }
        ]);
        return;
    }

    ensureWsConnected(() => {
        mp.socket.send(JSON.stringify({
            type: "buy_item",
            category: category,
            item_id: itemId,
            tg_id: tgId
        }));
    });
};

// Legacy Wrappers
window.purchaseFrame = (frameId) => window.purchaseItem('frame', frameId);
window.equipFrame = (frameId) => window.equipItem('frame', frameId || 'default');

// Dynamic Donate/Support Shop Synchronizer
function syncDonateShop() {
    const coinsEl = document.getElementById('donate-coins-balance');
    const balance = userProfile.coins || 0;
    
    if (coinsEl) coinsEl.innerText = `🪙 ${balance}`;
    
    renderDonateCategoryList('frame', FRAME_ITEMS, 'donate-frames-list', 'donate-unequip-container', 'donate-frames-balance');
    renderDonateCategoryList('token', TOKEN_ITEMS, 'donate-tokens-list', 'donate-tokens-unequip-container', 'donate-tokens-balance');
    renderDonateDiceList();
    renderDonateCategoryList('effect', EFFECT_ITEMS, 'donate-effects-list', 'donate-effects-unequip-container', 'donate-effects-balance');
}

function renderDonateCategoryList(category, items, listId, unequipId, balanceId) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    const balanceEl = document.getElementById(balanceId);
    if (balanceEl) balanceEl.innerText = `🪙 ${userProfile.coins || 0}`;

    let purchased = [];
    let equipped = 'default';
    
    if (category === 'frame') { purchased = userProfile.purchasedFrames || []; equipped = userProfile.frame; }
    else if (category === 'token') { purchased = userProfile.purchasedTokens || []; equipped = userProfile.token; }
    else if (category === 'dice') { purchased = userProfile.purchasedDice || []; equipped = userProfile.dice; }
    else if (category === 'trail') { purchased = userProfile.purchasedTrails || []; equipped = userProfile.trail; }
    else if (category === 'effect') { purchased = userProfile.purchasedEffects || []; equipped = userProfile.effect; }

    equipped = equipped || 'default';

    let html = '';
    items.forEach(item => {
        const isPurchased = purchased.includes(item.id);
        const isActive = equipped === item.id;
        
        let actionBtnHtml = '';
        if (isActive) {
            actionBtnHtml = `<button class="btn btn-secondary btn-shop-action" style="background: transparent; border: 1.5px solid var(--color-success); color: var(--color-success); cursor: default; pointer-events: none; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;">Екіпіровано</button>`;
        } else if (isPurchased) {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;" onclick="window.equipItem('${category}', '${item.id}')">Вдягти</button>`;
        } else {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; color: #ffffff; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;" onclick="window.purchaseItem('${category}', '${item.id}')">Купити 🪙${item.price}</button>`;
        }

        let previewHtml = '';
        if (category === 'frame') {
            previewHtml = `
                <div class="avatar-container ${item.class || 'frame-' + item.id}" style="width: 46px; height: 46px; flex-shrink: 0;">
                    <img src="${userProfile.avatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/cossack_tycoon.png'">
                </div>
            `;
        } else if (category === 'token') {
            const emojis = { patron: '🐶', crown: '👑', tractor: '🚜', cat: '🐱' };
            previewHtml = `
                <div class="token token-${item.id}" style="width: 32px; height: 32px; font-size: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); flex-shrink: 0; color: white;">
                    ${emojis[item.id] || ''}
                </div>
            `;
        } else if (category === 'dice') {
            previewHtml = `
                <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    <div class="die ${item.class || 'die-' + item.id}" style="width: 28px; height: 28px; padding: 2px; font-size: 8px; border-radius: 6px;">
                        <span class="dot" style="width: 4px; height: 4px;"></span>
                        <span></span><span></span><span></span>
                        <span class="dot" style="width: 4px; height: 4px;"></span>
                        <span></span><span></span><span></span>
                        <span class="dot" style="width: 4px; height: 4px;"></span>
                    </div>
                </div>
            `;
        } else if (category === 'trail') {
            const glowColor = item.id === 'fire' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(127, 0, 255, 0.6)';
            previewHtml = `
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-glass); box-shadow: 0 0 10px ${glowColor}; flex-shrink: 0;">
                    <i class="fa-solid fa-wind" style="color: ${item.id === 'fire' ? '#ef4444' : '#a855f7'}; font-size: 14px;"></i>
                </div>
            `;
        } else if (category === 'effect') {
            const icon = item.id === 'fireworks' ? 'fa-wand-magic-sparkles' : (item.id === 'coins' ? 'fa-coins' : 'fa-money-bill-wave');
            const color = item.id === 'fireworks' ? '#ec4899' : (item.id === 'coins' ? '#eab308' : '#22c55e');
            previewHtml = `
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-glass); flex-shrink: 0;">
                    <i class="fa-solid ${icon}" style="color: ${color}; font-size: 14px;"></i>
                </div>
            `;
        }

        html += `
            <div class="shop-card-item ${isActive ? 'active-item' : ''}" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 0.6rem; border-radius: 12px; border: 1px solid var(--border-glass); margin-bottom: 0.5rem;">
                <div class="shop-card-left" style="display: flex; align-items: center; gap: 0.75rem;">
                    ${previewHtml}
                    <div class="shop-frame-info" style="display: flex; flex-direction: column; text-align: left;">
                        <span class="shop-frame-name" style="font-weight: 700; font-size: 0.85rem;">${item.name}</span>
                        <span class="shop-frame-desc" style="font-size: 0.7rem; color: var(--text-secondary);">${item.desc}</span>
                    </div>
                </div>
                <div>
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    });
    listEl.innerHTML = html;
    
    const unequipEl = document.getElementById(unequipId);
    if (unequipEl) {
        unequipEl.innerHTML = (equipped && equipped !== 'default') ? `<button class="btn btn-secondary" style="width: 100%; padding: 0.5rem; font-size: 0.8rem; border-radius: 10px;" onclick="window.equipItem('${category}', 'default')">Зняти кастомізацію ❌</button>` : '';
    }
}

function renderDonateDiceList() {
    const listEl = document.getElementById('donate-dice-list');
    if (!listEl) return;
    
    const balanceEl = document.getElementById('donate-dice-balance');
    if (balanceEl) balanceEl.innerText = `🪙 ${userProfile.coins || 0}`;

    let html = '';
    
    html += `<div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--color-primary); margin-top: 0.25rem; margin-bottom: 0.25rem; letter-spacing: 0.05em; text-align: left;">Скіни кубиків</div>`;
    
    let purchasedDice = userProfile.purchasedDice || [];
    let equippedDice = userProfile.dice || 'default';
    
    DICE_ITEMS.forEach(item => {
        const isPurchased = purchasedDice.includes(item.id);
        const isActive = equippedDice === item.id;
        
        let actionBtnHtml = '';
        if (isActive) {
            actionBtnHtml = `<button class="btn btn-secondary btn-shop-action" style="background: transparent; border: 1.5px solid var(--color-success); color: var(--color-success); cursor: default; pointer-events: none; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;">Екіпіровано</button>`;
        } else if (isPurchased) {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;" onclick="window.equipItem('dice', '${item.id}')">Вдягти</button>`;
        } else {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; color: #ffffff; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;" onclick="window.purchaseItem('dice', '${item.id}')">Купити 🪙${item.price}</button>`;
        }

        const previewHtml = `
            <div style="display: flex; gap: 4px; flex-shrink: 0;">
                <div class="die ${item.class || 'die-' + item.id}" style="width: 28px; height: 28px; padding: 2px; font-size: 8px; border-radius: 6px;">
                    <span class="dot" style="width: 4px; height: 4px;"></span>
                    <span></span><span></span><span></span>
                    <span class="dot" style="width: 4px; height: 4px;"></span>
                    <span></span><span></span><span></span>
                    <span class="dot" style="width: 4px; height: 4px;"></span>
                </div>
            </div>
        `;

        html += `
            <div class="shop-card-item ${isActive ? 'active-item' : ''}" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 0.6rem; border-radius: 12px; border: 1px solid var(--border-glass); margin-bottom: 0.5rem;">
                <div class="shop-card-left" style="display: flex; align-items: center; gap: 0.75rem;">
                    ${previewHtml}
                    <div class="shop-frame-info" style="display: flex; flex-direction: column; text-align: left;">
                        <span class="shop-frame-name" style="font-weight: 700; font-size: 0.85rem;">${item.name}</span>
                        <span class="shop-frame-desc" style="font-size: 0.7rem; color: var(--text-secondary);">${item.desc}</span>
                    </div>
                </div>
                <div>
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    });
    
    html += `<div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--color-primary); margin-top: 1rem; margin-bottom: 0.25rem; letter-spacing: 0.05em; text-align: left;">Шлейфи кидка</div>`;
    
    let purchasedTrails = userProfile.purchasedTrails || [];
    let equippedTrail = userProfile.trail || 'default';
    
    TRAIL_ITEMS.forEach(item => {
        const isPurchased = purchasedTrails.includes(item.id);
        const isActive = equippedTrail === item.id;
        
        let actionBtnHtml = '';
        if (isActive) {
            actionBtnHtml = `<button class="btn btn-secondary btn-shop-action" style="background: transparent; border: 1.5px solid var(--color-success); color: var(--color-success); cursor: default; pointer-events: none; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;">Екіпіровано</button>`;
        } else if (isPurchased) {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;" onclick="window.equipItem('trail', '${item.id}')">Вдягти</button>`;
        } else {
            actionBtnHtml = `<button class="btn btn-primary btn-shop-action" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; color: #ffffff; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 8px;" onclick="window.purchaseItem('trail', '${item.id}')">Купити 🪙${item.price}</button>`;
        }

        const glowColor = item.id === 'fire' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(127, 0, 255, 0.6)';
        const previewHtml = `
            <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-glass); box-shadow: 0 0 10px ${glowColor}; flex-shrink: 0;">
                <i class="fa-solid fa-wind" style="color: ${item.id === 'fire' ? '#ef4444' : '#a855f7'}; font-size: 14px;"></i>
            </div>
        `;

        html += `
            <div class="shop-card-item ${isActive ? 'active-item' : ''}" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 0.6rem; border-radius: 12px; border: 1px solid var(--border-glass); margin-bottom: 0.5rem;">
                <div class="shop-card-left" style="display: flex; align-items: center; gap: 0.75rem;">
                    ${previewHtml}
                    <div class="shop-frame-info" style="display: flex; flex-direction: column; text-align: left;">
                        <span class="shop-frame-name" style="font-weight: 700; font-size: 0.85rem;">${item.name}</span>
                        <span class="shop-frame-desc" style="font-size: 0.7rem; color: var(--text-secondary);">${item.desc}</span>
                    </div>
                </div>
                <div>
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    
    const unequipEl = document.getElementById('donate-dice-unequip-container');
    if (unequipEl) {
        let buttonsHtml = '';
        if (equippedDice && equippedDice !== 'default') {
            buttonsHtml += `<button class="btn btn-secondary" style="width: 100%; padding: 0.5rem; font-size: 0.8rem; border-radius: 10px; margin-bottom: 0.5rem;" onclick="window.equipItem('dice', 'default')">Зняти кубики ❌</button>`;
        }
        if (equippedTrail && equippedTrail !== 'default') {
            buttonsHtml += `<button class="btn btn-secondary" style="width: 100%; padding: 0.5rem; font-size: 0.8rem; border-radius: 10px;" onclick="window.equipItem('trail', 'default')">Зняти шлейф ❌</button>`;
        }
        unequipEl.innerHTML = buttonsHtml;
    }
}

// ==========================================================================
// DEVELOPER ADMIN PANEL & SUBMISSION HANDLERS
// ==========================================================================
function showAdminPanelModal() {
    let modalHtml = `
        <div class="admin-panel-container" style="color: var(--text-primary); display: flex; flex-direction: column; gap: 1rem; text-align: left;">
            <div style="border-bottom: 1px solid var(--border-glass); padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.15rem; color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4); display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fa-solid fa-user-shield"></i> Адмін-Панель Монополії
                </h3>
                <span style="font-size: 0.75rem; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700;">ADMIN</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div>
                    <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Введіть Telegram ID отримувача:</label>
                    <input type="text" id="admin-target-tg-id" placeholder="Telegram ID (наприклад: 792013800)" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; font-family: inherit;">
                    <button class="btn btn-secondary" id="btn-admin-insert-my-id" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; width: auto; margin-top: 0.4rem; font-family: inherit;">
                        🎯 Вставити мій ID
                    </button>
                </div>

                <div>
                    <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Кількість Моно-Коїнів:</label>
                    <input type="number" id="admin-coins-value" placeholder="Наприклад: 500" value="100" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: #fff; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; font-family: inherit;">
                </div>

                <button class="btn btn-primary" id="btn-admin-submit-coins" style="margin-top: 0.5rem; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border: none; color: white;">
                    Нарахувати коїни 🪙
                </button>
            </div>
        </div>
    `;

    showModal("Адміністрування", modalHtml, []);
    
    const insertMyIdBtn = document.getElementById('btn-admin-insert-my-id');
    if (insertMyIdBtn) {
        insertMyIdBtn.onclick = () => {
            const targetInput = document.getElementById('admin-target-tg-id');
            if (targetInput) {
                targetInput.value = tgId || 'local_admin';
            }
        };
    }
    
    const submitCoinsBtn = document.getElementById('btn-admin-submit-coins');
    if (submitCoinsBtn) {
        submitCoinsBtn.onclick = window.adminSubmitSetCoins;
    }
}

window.adminSubmitSetCoins = () => {
    const targetIdInput = document.getElementById('admin-target-tg-id');
    const coinsValueInput = document.getElementById('admin-coins-value');
    if (!targetIdInput || !coinsValueInput) return;
    
    const targetId = targetIdInput.value.trim();
    const coinsVal = parseInt(coinsValueInput.value) || 0;
    
    if (!targetId) {
        alert("Будь ласка, введіть Telegram ID отримувача!");
        return;
    }

    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    
    if (!tgId && isLocal) {
        userProfile.coins = coinsVal;
        localStorage.setItem('custom_user_profile', JSON.stringify(userProfile));
        triggerConfetti();
        syncDonateShop();
        syncProfileTab();
        
        showModal("Оффлайн нарахування ✅", `<p>Баланс вашого локального профілю встановлено на <strong>🪙${coinsVal}</strong>.</p>`, [
            { text: "Чудово", class: "btn-primary" }
        ]);
        return;
    }

    ensureWsConnected(() => {
        mp.socket.send(JSON.stringify({
            type: "admin_set_coins",
            admin_tg_id: tgId,
            admin_username: userProfile.username,
            target_tg_id: targetId,
            coins: coinsVal
        }));

        showModal("Запит надіслано ⚙️", `<p>Запит на нарахування <strong>🪙${coinsVal}</strong> для ID <strong>${targetId}</strong> надіслано на сервер.</p>`, [
            { text: "Готово", class: "btn-primary", onClick: () => {
                if (targetId === tgId) {
                    if (mp.socket && mp.socket.readyState === WebSocket.OPEN) {
                        mp.socket.send(JSON.stringify({ type: "get_profile", tg_id: tgId }));
                    }
                }
            }}
        ]);
    });
};

