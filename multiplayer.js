// ==========================================================================
// MULTIPLAYER & BOT SYSTEM - MONOPOLY UKRAINE
// ==========================================================================

import { SPACE_TYPES } from './game.js';

export const BOT_PROFILES = [
    { name: "@taras_capital", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&auto=format&fit=crop", style: "agressive" },
    { name: "@olga_kiev", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop", style: "balanced" },
    { name: "@maks_tg", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop", style: "conservative" },
    { name: "@dima_99", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop", style: "balanced" },
    { name: "@nastia_digital", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop", style: "agressive" }
];

export const BOT_EMOJIS = ["🚀", "💸", "😎", "🤝", "🔥", "🤔", "😢", "👿", "🏛️"];

export function getRandomBotProfiles(count) {
    const shuffled = [...BOT_PROFILES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Simulates connecting players in a Telegram lobby
export function startMatchmakingSimulation(onPlayerJoined, onMatchReady) {
    const bots = getRandomBotProfiles(2 + Math.floor(Math.random() * 2)); // 2 or 3 bots
    let index = 0;

    const interval = setInterval(() => {
        if (index < bots.length) {
            onPlayerJoined(bots[index]);
            index++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                onMatchReady(bots);
            }, 1500);
        }
    }, 1500 + Math.random() * 1000);

    return () => clearInterval(interval); // cancelable
}

// Advanced Bot decision maker
export class BotAI {
    static async handleTurn(gameState, playerId, logCallback, actionCallback, endTurnCallback) {
        const bot = gameState.players.find(p => p.id === playerId);
        if (!bot || !bot.isBot || bot.isBankrupt) {
            endTurnCallback();
            return;
        }

        logCallback(`🤖 Хід компанії ${bot.name}...`);
        await sleep(1200);

        // 1. JAIL DECISION
        if (bot.inJail) {
            if (bot.money >= 3000) {
                // If wealthy, pay to exit jail immediately to secure properties
                gameState.tryGetOutJail(playerId, 'pay');
                actionCallback({ type: 'jail_free', method: 'pay' });
                await sleep(1000);
            } else {
                // Otherwise roll
                logCallback(`🎲 ${bot.name} намагається кинути дубль для виходу...`);
                const rollResult = gameState.tryGetOutJail(playerId, 'roll');
                actionCallback({ type: 'jail_free', method: 'roll', result: rollResult });
                await sleep(1200);
                if (bot.inJail) {
                    // Still in jail, turn ends
                    endTurnCallback();
                    return;
                }
            }
        }

        // 2. ROLL DICE (if not already out of jail via rolling in step 1)
        let diceResult = null;
        if (!bot.inJail) {
            diceResult = gameState.rollDice();
            logCallback(`🎲 ${bot.name} викинув ${diceResult.d1}:${diceResult.d2} (сума: ${diceResult.sum})`);
            actionCallback({ type: 'roll', result: diceResult });
            
            // Move bot
            const moveResult = gameState.movePlayer(playerId, diceResult.sum);
            actionCallback({ type: 'move', playerId, result: moveResult });
            await sleep(1500);

            // Handle space bot landed on
            const currentSpace = gameState.spaces[bot.position];
            
            if (currentSpace.type === SPACE_TYPES.PROPERTY || 
                currentSpace.type === SPACE_TYPES.STATION || 
                currentSpace.type === SPACE_TYPES.UTILITY) {
                
                if (currentSpace.owner === null) {
                    // Unowned: Buy logic
                    const purchaseLimit = bot.style === 'agressive' ? 500 : (bot.style === 'conservative' ? 2000 : 1000);
                    if (bot.money - currentSpace.price >= purchaseLimit) {
                        gameState.purchaseProperty(playerId, currentSpace.id);
                        actionCallback({ type: 'buy', spaceId: currentSpace.id });
                    } else {
                        logCallback(`💸 ${bot.name} вирішив не купувати ${currentSpace.name} (зберігає готівку)`);
                    }
                } else if (currentSpace.owner !== playerId) {
                    // Owned by someone else: Rent
                    const rentPaid = gameState.payRent(playerId, currentSpace.id, diceResult.sum);
                    actionCallback({ type: 'pay_rent', spaceId: currentSpace.id, amount: rentPaid });
                }
            } else if (currentSpace.type === SPACE_TYPES.FREE_PARKING) {
                const claimed = gameState.claimFreeParking(playerId);
                if (claimed > 0) {
                    actionCallback({ type: 'claim_parking', amount: claimed });
                }
            } else if (currentSpace.type === SPACE_TYPES.GO_TO_JAIL) {
                gameState.sendToJail(playerId);
                actionCallback({ type: 'go_to_jail' });
            } else if (currentSpace.type === SPACE_TYPES.CHANCE) {
                // Draw card
                actionCallback({ type: 'draw_chance' });
            }
            await sleep(1500);
        }

        // 3. RETRY ON BANKRUPTCY (If in negative balance)
        if (bot.money < 0) {
            logCallback(`⚠️ ${bot.name} має борг ₴${Math.abs(bot.money)}. Рятує бізнес продажем майна...`);
            await sleep(1000);
            
            // Try selling branches first
            let branchesSold = false;
            do {
                branchesSold = false;
                const ownedUpgradedSpaces = gameState.spaces
                    .filter(s => s.owner === playerId && s.branches > 0)
                    .sort((a, b) => a.branchCost - b.branchCost); // sell cheap branches first
                    
                if (ownedUpgradedSpaces.length > 0) {
                    gameState.sellBranch(ownedUpgradedSpaces[0].id);
                    actionCallback({ type: 'sell_branch', spaceId: ownedUpgradedSpaces[0].id });
                    branchesSold = true;
                    await sleep(800);
                }
            } while (bot.money < 0 && branchesSold);

            // Try selling properties to the Bank if still in debt
            let propertiesSold = false;
            do {
                propertiesSold = false;
                const ownedSpaces = gameState.spaces
                    .filter(s => s.owner === playerId && (!s.branches || s.branches === 0))
                    .sort((a, b) => a.price - b.price); // sell cheap properties first

                if (ownedSpaces.length > 0) {
                    gameState.sellProperty(ownedSpaces[0].id);
                    actionCallback({ type: 'sell_property', spaceId: ownedSpaces[0].id });
                    propertiesSold = true;
                    await sleep(800);
                }
            } while (bot.money < 0 && propertiesSold);

            // If still negative, bankrupt
            if (bot.money < 0) {
                // Find who is the creditor (beneficiary)
                // Look at where player landed
                const currentSpace = gameState.spaces[bot.position];
                let beneficiaryId = null;
                if (currentSpace.owner !== null && currentSpace.owner !== playerId) {
                    beneficiaryId = currentSpace.owner;
                }
                gameState.declareBankruptcy(playerId, beneficiaryId);
                actionCallback({ type: 'bankrupt', beneficiaryId });
                await sleep(1000);
                endTurnCallback();
                return;
            }
        }

        // 4. UPGRADE / BUILD BRANCHES DECISION (If bot has money left)
        if (bot.money > 2000 && !bot.isBankrupt) {
            const upgradeLimit = bot.style === 'agressive' ? 1200 : (bot.style === 'conservative' ? 2500 : 1800);
            
            // Find owned properties that are upgradeable (types PROPERTY)
            const upgradeable = gameState.spaces.filter(s => s.owner === playerId && s.type === SPACE_TYPES.PROPERTY && s.branches < 4);
            
            if (upgradeable.length > 0) {
                // Prioritize expensive properties (higher tier, higher rent yield)
                upgradeable.sort((a, b) => b.price - a.price);
                
                for (let space of upgradeable) {
                    if (bot.money - space.branchCost >= upgradeLimit) {
                        gameState.upgradeProperty(playerId, space.id);
                        actionCallback({ type: 'upgrade', spaceId: space.id });
                        await sleep(1000);
                        break; // one upgrade per turn to avoid spamming
                    }
                }
            }
        }

        // 5. RANDOM CHAT REACTION (sometimes bots send reactions)
        if (Math.random() < 0.35) {
            const randomEmoji = BOT_EMOJIS[Math.floor(Math.random() * BOT_EMOJIS.length)];
            actionCallback({ type: 'chat_reaction', emoji: randomEmoji });
            await sleep(500);
        }

        endTurnCallback();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.playerId = null;
        this.playersList = [];
        this.onPlayerUpdateCallback = null;
        this.onGameStartCallback = null;
        this.onActionCallback = null;
        this.onDisconnectCallback = null;
    }

    connect(url, name, avatar, onConnected) {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log("Підключено до сервера мультиплеєра!");
            if (onConnected) onConnected();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Отримано повідомлення:", data);

            switch (data.type) {
                case 'created':
                    this.roomCode = data.room_code;
                    this.playerId = 0;
                    this.playersList = data.players;
                    if (this.onPlayerUpdateCallback) this.onPlayerUpdateCallback(this.playersList);
                    break;
                case 'joined':
                    this.roomCode = data.room_code;
                    this.playerId = data.player_id;
                    this.playersList = data.players;
                    if (this.onPlayerUpdateCallback) this.onPlayerUpdateCallback(this.playersList);
                    break;
                case 'player_update':
                    this.playersList = data.players;
                    if (this.onPlayerUpdateCallback) this.onPlayerUpdateCallback(this.playersList);
                    break;
                case 'game_start':
                    if (this.onGameStartCallback) this.onGameStartCallback();
                    break;
                case 'sync_action':
                    if (this.onActionCallback) this.onActionCallback(data.payload);
                    break;
                case 'error':
                    alert(data.message);
                    break;
            }
        };

        this.socket.onclose = () => {
            console.log("З'єднання з сервером розірвано.");
            if (this.onDisconnectCallback) this.onDisconnectCallback();
        };
    }

    createRoom(name, avatar) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'create',
            name: name,
            avatar: avatar
        }));
    }

    joinRoom(roomCode, name, avatar) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'join',
            room_code: roomCode,
            name: name,
            avatar: avatar
        }));
    }

    startGame() {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'start'
        }));
    }

    sendAction(payload) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({
            type: 'action',
            payload: payload
        }));
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
