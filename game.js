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
        rent: [50, 200, 500, 1000, 2000],
        branchCost: 500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#003594"/><circle cx="50" cy="50" r="38" fill="none" stroke="#e4002b" stroke-width="6"/><text x="50" y="62" font-family="'Outfit', 'Inter', sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#ffffff">АТБ</text></svg>`
    },
    {
        id: 2,
        name: "Сільпо",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.BROWN,
        price: 600,
        rent: [50, 200, 500, 1000, 2000],
        branchCost: 500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="30" width="70" height="55" rx="10" fill="#f97316"/><path d="M35,30 Q50,5 65,30" fill="none" stroke="#ea580c" stroke-width="8" stroke-linecap="round"/><text x="50" y="68" font-family="'Outfit', 'Inter', sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="#ffffff">сільпо</text></svg>`
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
        baseRent: 500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="15" fill="#0f172a"/><path d="M25,65 H75 M25,50 H75 M20,35 L50,15 L80,35 Z" fill="none" stroke="#f8fafc" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="50" y="58" font-family="'Outfit', 'Inter', sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#e2e8f0">УЗ</text></svg>`
    },
    {
        id: 5,
        name: "Тюрма",
        type: SPACE_TYPES.JAIL,
        description: "Просте відвідування або відбування терміну"
    },
    {
        id: 6,
        name: "Rozetka",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.LIGHTBLUE,
        price: 1000,
        rent: [80, 320, 800, 1600, 3000],
        branchCost: 700,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#00a046"/><path d="M35,16 Q40,8 48,12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M65,16 Q60,8 52,12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="42" r="5" fill="#ffffff"/><circle cx="62" cy="42" r="5" fill="#ffffff"/><path d="M32,58 Q50,78 68,58" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/></svg>`
    },
    {
        id: 7,
        name: "Prom.ua",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.LIGHTBLUE,
        price: 1000,
        rent: [80, 320, 800, 1600, 3000],
        branchCost: 700,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,12 L88,34 L88,76 L50,98 L12,76 L12,34 Z" fill="#8b5cf6"/><path d="M50,12 L50,98 M12,34 L50,56 L88,34" fill="none" stroke="#a78bfa" stroke-width="4"/><circle cx="31" cy="45" r="5" fill="#ffffff"/><circle cx="69" cy="45" r="5" fill="#ffffff"/><circle cx="50" cy="74" r="5" fill="#ffffff"/></svg>`
    },
    {
        id: 8,
        name: "Monobank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1400,
        rent: [120, 480, 1200, 2400, 4200],
        branchCost: 1000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#1e1b4b"/><path d="M28,45 L18,20 L40,32 Z" fill="#111827"/><path d="M72,45 L82,20 L60,32 Z" fill="#111827"/><path d="M30,42 L23,25 L37,33 Z" fill="#f43f5e"/><path d="M70,42 L77,25 L63,33 Z" fill="#f43f5e"/><circle cx="50" cy="55" r="30" fill="#111827"/><ellipse cx="38" cy="52" rx="4" ry="6" fill="#facc15"/><ellipse cx="62" cy="52" rx="4" ry="6" fill="#facc15"/><line x1="38" y1="47" x2="38" y2="57" stroke="#000" stroke-width="2" stroke-linecap="round"/><line x1="62" y1="47" x2="62" y2="57" stroke="#000" stroke-width="2" stroke-linecap="round"/><polygon points="50,60 47,57 53,57" fill="#f43f5e"/><path d="M47,63 Q50,66 53,63" fill="none" stroke="#f43f5e" stroke-width="2"/><line x1="22" y1="58" x2="10" y2="56" stroke="#f8fafc" stroke-width="2"/><line x1="22" y1="62" x2="8" y2="62" stroke="#f8fafc" stroke-width="2"/><line x1="78" y1="58" x2="90" y2="56" stroke="#f8fafc" stroke-width="2"/><line x1="78" y1="62" x2="92" y2="62" stroke="#f8fafc" stroke-width="2"/></svg>`
    },
    {
        id: 9,
        name: "PrivatBank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1600,
        rent: [140, 560, 1400, 2800, 4800],
        branchCost: 1000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#78b82a"/><path d="M32,25 H68 V35 H56 V75 H68 V81 H32 V75 H44 V35 H32 Z" fill="#ffffff"/></svg>`
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
        branchCost: 1200,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="15" fill="#de2c27"/><path d="M50,22 L78,50 L50,78 L22,50 Z" fill="#ffffff"/><rect x="42" y="42" width="16" height="16" fill="#de2c27"/><path d="M50,15 L50,30 M50,70 L50,85 M15,50 L30,50 M70,50 L85,50" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/></svg>`
    },
    {
        id: 12,
        name: "Ukrposhta",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.ORANGE,
        price: 1800,
        rent: [160, 640, 1600, 3200, 5400],
        branchCost: 1200,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#ffcc00"/><path d="M30,50 C30,32 70,32 70,50 C70,68 40,68 40,55 C40,48 58,48 58,55" fill="none" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/><path d="M30,42 L22,58 L38,58 Z" fill="#1e293b"/></svg>`
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
        branchCost: 1500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#0057b7"/><path d="M50,15 L54,38 L77,24 L60,45 L82,50 L60,55 L77,76 L54,62 L50,85 L46,62 L23,76 L40,55 L18,50 L40,45 L23,24 L46,38 Z" fill="#ffdd00"/></svg>`
    },
    {
        id: 15,
        name: "Іди в Тюрму",
        type: SPACE_TYPES.GO_TO_JAIL,
        description: "Негайно відправляйтеся в Тюрму!"
    },
    {
        id: 16,
        name: "Епіцентр",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.YELLOW,
        price: 2600,
        rent: [240, 960, 2400, 4800, 7200],
        branchCost: 1500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="15" fill="#0054a6"/><path d="M22,50 L50,22 L78,50 M32,45 V75 H68 V45" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M42,42 H58 M42,52 H54 M42,62 H58 M42,34 V70" stroke="#ffdd00" stroke-width="6" stroke-linecap="round"/></svg>`
    },
    {
        id: 17,
        name: "WOG",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 2800,
        rent: [260, 1000, 2600, 5200, 8000],
        branchCost: 1800,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,12 C50,12 82,48 82,65 C82,82.5 67.5,90 50,90 C32.5,90 18,82.5 18,65 C18,48 50,12 50,12 Z" fill="#009639"/><path d="M32,48 L42,75 L50,56 L58,75 L68,48" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    {
        id: 18,
        name: "Дія",
        type: SPACE_TYPES.UTILITY,
        price: 1500,
        multiplier: 100,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="18" fill="#111827"/><text x="50" y="58" font-family="'Outfit', 'Inter', sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="2">дія</text><circle cx="50" cy="72" r="3" fill="#00f0ff"/></svg>`
    },
    {
        id: 19,
        name: "MEGOGO",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 3200,
        rent: [350, 1400, 3500, 7000, 10000],
        branchCost: 2000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="18" fill="#2d3047"/><path d="M30,30 L45,55 L50,45 L55,55 L70,30 L70,70 L60,70 L60,48 L50,68 L40,48 L40,70 L30,70 Z" fill="#00f0ff"/></svg>`
    }
];

export const CHANCE_CARDS = [
    { text: "Кешбек від Monobank! Отримайте ₴1,000", action: "money", amount: 1000 },
    { text: "Підтримка ЗСУ. Зробіть внесок у фонд ₴500", action: "tax", amount: 500 },
    { text: "Нова Пошта доставила вам дивіденди: ₴1,500", action: "money", amount: 1500 },
    { text: "Порушення закону! Перейдіть в Тюрму без отримання грошей за старт", action: "gotojail" },
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
                s.isMortgaged = false;
            } else if (s.type === SPACE_TYPES.STATION || s.type === SPACE_TYPES.UTILITY) {
                s.owner = null;
                s.isMortgaged = false;
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

        // Check if player owns all properties of the color group (monopoly)
        const sameGroupSpaces = this.spaces.filter(s => s.group === space.group);
        const allOwnedBySame = sameGroupSpaces.every(s => s.owner === playerId);
        if (!allOwnedBySame) return false;

        // Cannot build if any property in the color group is mortgaged
        const anyMortgaged = sameGroupSpaces.some(s => s.isMortgaged);
        if (anyMortgaged) return false;

        player.money -= space.branchCost;
        space.branches++;
        this.log(`${player.name} побудував філію на ${space.name} за ₴${space.branchCost}`, 'gain');
        return true;
    }

    // Rent Math
    getRentCost(spaceId, diceSum = 7) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (!space || space.owner === null || space.isMortgaged) return 0;

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
        player.position = 5; // Jail space ID is 5
        this.log(`${player.name} відправлений в Тюрму`, 'jail');
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
                this.log(`${player.name} сплатив штраф ₴500 і вийшов з тюрми`, 'gain');
                return true;
            }
        } else if (method === 'roll') {
            const { d1, d2, sum, isDouble } = this.rollDice();
            if (isDouble) {
                player.inJail = false;
                player.jailTurns = 0;
                this.log(`${player.name} викинув дубль (${d1}:${d2}) та вийшов з тюрми безкоштовно!`, 'gain');
                this.movePlayer(playerId, sum);
                return { success: true, d1, d2, sum };
            } else {
                player.jailTurns++;
                this.log(`${player.name} кинув кубики (${d1}:${d2}) та не викинув дубль. Залишається в тюрмі`, 'system');
                if (player.jailTurns >= 2) {
                    // Forced out after 2 turns by paying
                    player.money -= 500;
                    this.freeParkingCash += 500;
                    player.inJail = false;
                    player.jailTurns = 0;
                    this.log(`${player.name} відбув термін 2 ходи, сплатив автоматичний штраф ₴500 і вийшов з тюрми`, 'gain');
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

    mortgageProperty(playerId, spaceId) {
        const player = this.players.find(p => p.id === playerId);
        const space = this.spaces.find(s => s.id === spaceId);

        if (!player || !space || player.isBankrupt) return false;
        if (space.owner !== playerId || space.isMortgaged) return false;

        // Cannot mortgage if there are branches built on this property or any other property in the group
        if (space.group) {
            const sameGroupSpaces = this.spaces.filter(s => s.group === space.group);
            const hasBranches = sameGroupSpaces.some(s => s.branches > 0);
            if (hasBranches) return false;
        } else if (space.branches && space.branches > 0) {
            return false;
        }

        const mortgageValue = Math.floor(space.price * 0.5);
        space.isMortgaged = true;
        player.money += mortgageValue;
        this.log(`${player.name} заставив компанію ${space.name} за ₴${mortgageValue}`, 'pay');
        return true;
    }

    unmortgageProperty(playerId, spaceId) {
        const player = this.players.find(p => p.id === playerId);
        const space = this.spaces.find(s => s.id === spaceId);

        if (!player || !space || player.isBankrupt) return false;
        if (space.owner !== playerId || !space.isMortgaged) return false;

        const unmortgageCost = Math.floor(space.price * 0.55); // 50% + 10% penalty
        if (player.money < unmortgageCost) return false;

        space.isMortgaged = false;
        player.money -= unmortgageCost;
        this.log(`${player.name} викупив з застави компанію ${space.name} за ₴${unmortgageCost}`, 'gain');
        return true;
    }

    executeTrade(proposerId, receiverId, offerProperties, offerCash, requestProperties, requestCash) {
        const proposer = this.players.find(p => p.id === proposerId);
        const receiver = this.players.find(p => p.id === receiverId);

        if (!proposer || !receiver || proposer.isBankrupt || receiver.isBankrupt) return false;

        // Check if money limits are satisfied
        if (proposer.money < offerCash) return false;
        if (receiver.money < requestCash) return false;

        // Execute money transfer
        proposer.money -= offerCash;
        proposer.money += requestCash;

        receiver.money += offerCash;
        receiver.money -= requestCash;

        // Transfer offered properties (proposer -> receiver)
        offerProperties.forEach(propId => {
            const space = this.spaces.find(s => s.id === propId);
            if (space) {
                space.owner = receiverId;
            }
        });

        // Transfer requested properties (receiver -> proposer)
        requestProperties.forEach(propId => {
            const space = this.spaces.find(s => s.id === propId);
            if (space) {
                space.owner = proposerId;
            }
        });

        this.log(`🤝 Угода! ${proposer.name} та ${receiver.name} обмінялися активами.`, 'gain');
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
