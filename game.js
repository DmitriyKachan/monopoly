// ==========================================================================
// GAME CORE ENGINE - MONOPOLY UKRAINE
// ==========================================================================

export const BOARD_SIZE = 20;

export const SPACE_TYPES = {
    START: 'start',
    PROPERTY: 'property',
    CHANCE: 'chance',
    JAIL: 'jail',
    FREE_PARKING: 'free_parking',
    GO_TO_JAIL: 'go_to_jail',
    STATION: 'station',
    UTILITY: 'utility'
};

export const COLOR_GROUPS = {
    BROWN: 'brown',
    LIGHTBLUE: 'lightblue',
    RED: 'red',
    ORANGE: 'orange',
    YELLOW: 'yellow',
    GREEN: 'green'
};

// Define 20 spaces of the board
export const SPACES_DATA = [
    {
        id: 0,
        name: "Старт",
        type: SPACE_TYPES.START,
        description: "Отримайте ₴2,000 при переході"
    },
    {
        id: 1,
        name: "АТБ",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.BROWN,
        price: 600,
        rent: [50, 200, 500, 1000, 2000], // [Base, 1 Branch, 2, 3, 4/SuperBranch]
        branchCost: 500
    },
    {
        id: 2,
        name: "Сільпо",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.BROWN,
        price: 600,
        rent: [50, 200, 500, 1000, 2000],
        branchCost: 500
    },
    {
        id: 3,
        name: "Шанс",
        type: SPACE_TYPES.CHANCE
    },
    {
        id: 4,
        name: "Укрзалізниця",
        type: SPACE_TYPES.STATION,
        price: 2000,
        baseRent: 500
    },
    {
        id: 5,
        name: "Укриття",
        type: SPACE_TYPES.JAIL,
        description: "Просте відвідування або відбування тривоги"
    },
    {
        id: 6,
        name: "Rozetka",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.LIGHTBLUE,
        price: 1000,
        rent: [80, 320, 800, 1600, 3000],
        branchCost: 700
    },
    {
        id: 7,
        name: "Prom.ua",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.LIGHTBLUE,
        price: 1000,
        rent: [80, 320, 800, 1600, 3000],
        branchCost: 700
    },
    {
        id: 8,
        name: "Monobank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1400,
        rent: [120, 480, 1200, 2400, 4200],
        branchCost: 1000
    },
    {
        id: 9,
        name: "PrivatBank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1600,
        rent: [140, 560, 1400, 2800, 4800],
        branchCost: 1000
    },
    {
        id: 10,
        name: "Благодійний Фонд",
        type: SPACE_TYPES.FREE_PARKING,
        description: "Збір добровільних внесків магнатів"
    },
    {
        id: 11,
        name: "Nova Poshta",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.ORANGE,
        price: 1800,
        rent: [160, 640, 1600, 3200, 5400],
        branchCost: 1200
    },
    {
        id: 12,
        name: "Ukrposhta",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.ORANGE,
        price: 1800,
        rent: [160, 640, 1600, 3200, 5400],
        branchCost: 1200
    },
    {
        id: 13,
        name: "Шанс",
        type: SPACE_TYPES.CHANCE
    },
    {
        id: 14,
        name: "Kyivstar",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.YELLOW,
        price: 2200,
        rent: [200, 800, 2000, 4000, 6000],
        branchCost: 1500
    },
    {
        id: 15,
        name: "Повітряна Тривога",
        type: SPACE_TYPES.GO_TO_JAIL,
        description: "Швидко прямуйте в укриття!"
    },
    {
        id: 16,
        name: "Епіцентр",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.YELLOW,
        price: 2600,
        rent: [240, 960, 2400, 4800, 7200],
        branchCost: 1500
    },
    {
        id: 17,
        name: "WOG",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 2800,
        rent: [260, 1000, 2600, 5200, 8000],
        branchCost: 1800
    },
    {
        id: 18,
        name: "Дія",
        type: SPACE_TYPES.UTILITY,
        price: 1500,
        multiplier: 100 // 100x dice roll
    },
    {
        id: 19,
        name: "MEGOGO",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 3200,
        rent: [350, 1400, 3500, 7000, 10000],
        branchCost: 2000
    }
];

export const CHANCE_CARDS = [
    { text: "Кешбек від Monobank! Отримайте ₴1,000", action: "money", amount: 1000 },
    { text: "Підтримка ЗСУ. Зробіть внесок у фонд ₴500", action: "tax", amount: 500 },
    { text: "Нова Пошта доставила вам дивіденди: ₴1,500", action: "money", amount: 1500 },
    { text: "Повітряна тривога! Перейдіть в укриття без отримання грошей за старт", action: "gotojail" },
    { text: "Купівля генераторів для офісу. Сплатіть ₴1,200", action: "money", amount: -1200 },
    { text: "Рекламна кампанія в соцмережах пройшла успішно: отримайте ₴2,000", action: "money", amount: 2000 },
    { text: "Сплатіть комунальні послуги ДТЕК: ₴600", action: "tax", amount: 600 },
    { text: "Дія.Підпис пройшов перевірку. Отримайте грант ₴1,200", action: "money", amount: 1200 },
    { text: "Купуйте квиток на Укрзалізницю. Сплатіть ₴400", action: "money", amount: -400 },
    { text: "Перейдіть вперед до СТАРТУ (отримайте ₴2,000)", action: "move", target: 0 }
];

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // Reset properties state
        this.spaces = JSON.parse(JSON.stringify(SPACES_DATA)).map(s => {
            if (s.type === SPACE_TYPES.PROPERTY) {
                s.owner = null;
                s.branches = 0;
            } else if (s.type === SPACE_TYPES.STATION || s.type === SPACE_TYPES.UTILITY) {
                s.owner = null;
            }
            return s;
        });
        
        this.players = [];
        this.currentPlayerIndex = 0;
        this.freeParkingCash = 0;
        this.turnCount = 1;
        this.maxTurns = 20; // limit for quick sessions
        this.isGameOver = false;
        this.logs = [];
    }

    addPlayer(name, colorClass, avatar, isBot = false, tokenSkin = '') {
        const player = {
            id: this.players.length,
            name: name,
            color: colorClass,
            avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop',
            money: 15000, // starting cash
            position: 0,
            isBankrupt: false,
            inJail: false,
            jailTurns: 0,
            isBot: isBot,
            tokenSkin: tokenSkin
        };
        this.players.push(player);
        return player;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextTurn() {
        if (this.isGameOver) return;

        // Loop to find next non-bankrupt player
        let originalIndex = this.currentPlayerIndex;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            if (this.currentPlayerIndex === 0) {
                this.turnCount++;
            }
            if (this.turnCount > this.maxTurns) {
                this.endGame();
                return;
            }
        } while (this.players[this.currentPlayerIndex].isBankrupt && this.currentPlayerIndex !== originalIndex);

        // Check if only 1 player remains active
        const activePlayers = this.players.filter(p => !p.isBankrupt);
        if (activePlayers.length <= 1) {
            this.endGame();
        }
    }

    rollDice() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        return { d1, d2, sum: d1 + d2, isDouble: d1 === d2 };
    }

    movePlayer(playerId, steps) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.isBankrupt) return null;

        const oldPos = player.position;
        let newPos = (oldPos + steps) % BOARD_SIZE;

        // Passed Start (and didn't jump straight into jail)
        let crossedStart = false;
        if (newPos < oldPos && steps > 0) {
            player.money += 2000;
            crossedStart = true;
            this.log(`${player.name} пройшов Старт і отримав ₴2,000`, 'gain');
        }

        player.position = newPos;
        return { newPos, crossedStart };
    }

    log(message, type = 'system') {
        this.logs.push({ text: message, type });
        if (this.logs.length > 50) this.logs.shift(); // keep log size reasonable
    }

    // Property purchases
    purchaseProperty(playerId, spaceId) {
        const player = this.players.find(p => p.id === playerId);
        const space = this.spaces.find(s => s.id === spaceId);

        if (!player || !space || player.isBankrupt) return false;
        if (space.owner !== null) return false;
        if (player.money < space.price) return false;

        player.money -= space.price;
        space.owner = playerId;
        this.log(`${player.name} купив ${space.name} за ₴${space.price}`, 'gain');
        return true;
    }

    // Upgrades: purchase branches
    upgradeProperty(playerId, spaceId) {
        const player = this.players.find(p => p.id === playerId);
        const space = this.spaces.find(s => s.id === spaceId);

        if (!player || !space || player.isBankrupt) return false;
        if (space.owner !== playerId || space.type !== SPACE_TYPES.PROPERTY) return false;
        if (space.branches >= 4) return false; // 4 branches max (SuperBranch / Hotel equivalent)
        if (player.money < space.branchCost) return false;

        player.money -= space.branchCost;
        space.branches++;
        this.log(`${player.name} побудував філію на ${space.name} за ₴${space.branchCost}`, 'gain');
        return true;
    }

    // Rent Math
    getRentCost(spaceId, diceSum = 7) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space || space.owner === null) return 0;

        const ownerId = space.owner;

        if (space.type === SPACE_TYPES.PROPERTY) {
            let rent = space.rent[space.branches];
            
            // Check if owner owns the color set
            const sameGroupSpaces = this.spaces.filter(s => s.group === space.group);
            const allOwnedBySame = sameGroupSpaces.every(s => s.owner === ownerId);
            
            // Double base rent if full group owned and NO branches are built yet
            if (allOwnedBySame && space.branches === 0) {
                rent *= 2;
            }
            return rent;
        }

        if (space.type === SPACE_TYPES.STATION) {
            // Check how many stations owner has (only 1 station in this 20-space layout)
            // To make it fun: BaseRent is 500, but if owner also owns DTEK/Diia utilities, it's 1000
            const utilities = this.spaces.filter(s => s.type === SPACE_TYPES.UTILITY && s.owner === ownerId);
            if (utilities.length > 0) {
                return space.baseRent * 2; // 1000
            }
            return space.baseRent; // 500
        }

        if (space.type === SPACE_TYPES.UTILITY) {
            // 100x dice sum
            return diceSum * space.multiplier;
        }

        return 0;
    }

    payRent(tenantId, spaceId, diceSum = 7) {
        const tenant = this.players.find(p => p.id === tenantId);
        const space = this.spaces.find(s => s.id === spaceId);

        if (!tenant || !space || tenant.isBankrupt || space.owner === null || space.owner === tenantId) return 0;

        const owner = this.players.find(p => p.id === space.owner);
        const rentAmount = this.getRentCost(spaceId, diceSum);

        // Deduct money from tenant (can go negative temporarily for bankruptcy check)
        tenant.money -= rentAmount;
        owner.money += rentAmount;

        this.log(`${tenant.name} сплатив ₴${rentAmount} оренди для ${owner.name} (${space.name})`, 'pay');
        return rentAmount;
    }

    payTax(playerId, amount) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.isBankrupt) return;

        player.money -= amount;
        this.freeParkingCash += amount;
        this.log(`${player.name} сплатив податок/пожертву ₴${amount} у Благодійний Фонд`, 'pay');
    }

    claimFreeParking(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.isBankrupt) return 0;

        const cash = this.freeParkingCash;
        if (cash > 0) {
            player.money += cash;
            this.freeParkingCash = 0;
            this.log(`${player.name} завітав до Благодійного Фонду та зняв накопичені ₴${cash}!`, 'gain');
        }
        return cash;
    }

    sendToJail(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.inJail = true;
        player.jailTurns = 0;
        player.position = 5; // Shelter space ID is 5
        this.log(`${player.name} відправлений в Укриття (Повітряна Тривога!)`, 'jail');
    }

    tryGetOutJail(playerId, method) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.inJail) return false;

        if (method === 'pay') {
            if (player.money >= 500) {
                player.money -= 500;
                this.freeParkingCash += 500;
                player.inJail = false;
                player.jailTurns = 0;
                this.log(`${player.name} задонатив ₴500 волонтерам і вийшов з укриття`, 'gain');
                return true;
            }
        } else if (method === 'roll') {
            const { d1, d2, sum, isDouble } = this.rollDice();
            if (isDouble) {
                player.inJail = false;
                player.jailTurns = 0;
                this.log(`${player.name} викинув дубль (${d1}:${d2}) та вийшов з укриття безкоштовно!`, 'gain');
                this.movePlayer(playerId, sum);
                return { success: true, d1, d2, sum };
            } else {
                player.jailTurns++;
                this.log(`${player.name} кинув кубики (${d1}:${d2}) та не викинув дубль. Залишається в укритті`, 'system');
                if (player.jailTurns >= 2) {
                    // Forced out after 2 turns by paying
                    player.money -= 500;
                    this.freeParkingCash += 500;
                    player.inJail = false;
                    player.jailTurns = 0;
                    this.log(`${player.name} відбув тривогу 2 ходи, сплатив автоматичний збір ₴500 і вийшов з укриття`, 'gain');
                    this.movePlayer(playerId, sum);
                    return { success: true, d1, d2, sum, forced: true };
                }
                return { success: false, d1, d2, sum };
            }
        }
        return false;
    }

    // Capital valuation (cash + cost of properties + cost of branches)
    getNetWorth(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return 0;
        if (player.isBankrupt) return 0;

        let total = player.money;
        this.spaces.forEach(s => {
            if (s.owner === playerId) {
                total += s.price;
                if (s.branches) {
                    total += s.branches * s.branchCost;
                }
            }
        });
        return total;
    }

    // Selling branches to raise cash when in debt
    sellBranch(spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space || space.branches <= 0) return false;

        const owner = this.players.find(p => p.id === space.owner);
        if (!owner) return false;

        const sellValue = Math.floor(space.branchCost * 0.5); // Sell for half value
        space.branches--;
        owner.money += sellValue;
        this.log(`${owner.name} продав філію на ${space.name} за ₴${sellValue}`, 'system');
        return true;
    }

    // Mortgaging or selling the entire property
    sellProperty(spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space || space.owner === null || (space.branches && space.branches > 0)) return false;

        const owner = this.players.find(p => p.id === space.owner);
        if (!owner) return false;

        const sellValue = Math.floor(space.price * 0.5); // Sell to bank for half value
        space.owner = null;
        owner.money += sellValue;
        this.log(`${owner.name} продав компанію ${space.name} банку за ₴${sellValue}`, 'system');
        return true;
    }

    declareBankruptcy(playerId, beneficiaryId = null) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.isBankrupt = true;
        player.money = 0;

        const beneficiary = beneficiaryId !== null ? this.players.find(p => p.id === beneficiaryId) : null;
        const beneficiaryName = beneficiary ? beneficiary.name : "Банк";

        this.log(`💥 ${player.name} ОГОЛОСИВ БАНКРУТСТВО перед ${beneficiaryName}!`, 'pay');

        // Transfer assets
        this.spaces.forEach(s => {
            if (s.owner === playerId) {
                s.branches = 0; // Reset branches
                if (beneficiary) {
                    s.owner = beneficiaryId; // give to creditor
                    this.log(`${beneficiary.name} отримав права на ${s.name}`, 'gain');
                } else {
                    s.owner = null; // release back to bank
                }
            }
        });

        // Check if game is over
        const activePlayers = this.players.filter(p => !p.isBankrupt);
        if (activePlayers.length <= 1) {
            this.endGame();
        }
    }

    endGame() {
        this.isGameOver = true;
        this.log("🏁 ГРУ ЗАВЕРШЕНО!", "system");
        
        // Calculate rankings based on net worth
        const rankings = this.players
            .map(p => ({
                id: p.id,
                name: p.name,
                isBankrupt: p.isBankrupt,
                netWorth: this.getNetWorth(p.id)
            }))
            .sort((a, b) => {
                if (a.isBankrupt && !b.isBankrupt) return 1;
                if (!a.isBankrupt && b.isBankrupt) return -1;
                return b.netWorth - a.netWorth;
            });
            
        this.rankings = rankings;
        this.log(`Переможець: ${rankings[0].name} з капіталом ₴${rankings[0].netWorth}!`, 'gain');
    }
}
