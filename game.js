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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#e4002b"/><path d="M26,72 L38,28 H50 L62,72 H52 L49,60 H39 L36,72 Z M41,52 H47 L44,38 Z" fill="#fff" font-weight="900"/><path d="M64,28 H80 L74,72 H62 L64,28 Z" fill="#fccd04" opacity=".9"/></svg>`
    },
    {
        id: 2,
        name: "Сільпо",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.BROWN,
        price: 600,
        rent: [50, 200, 500, 1000, 2000],
        branchCost: 500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#f97316"/><path d="M34,38 C34,30 42,26 50,26 C58,26 64,30 64,38 C64,44 58,48 52,50 C48,51 46,54 46,58 M46,64 A3,3 0 1,0 46,70" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#1a237e"/><path d="M28,70 L42,30 L50,55 L58,30 L72,70" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><line x1="30" y1="56" x2="70" y2="56" stroke="#ffd600" stroke-width="5" stroke-linecap="round"/></svg>`
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
        branchCost: 700,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#00a046"/><circle cx="50" cy="48" r="28" fill="#fff"/><circle cx="40" cy="43" r="4" fill="#00a046"/><circle cx="60" cy="43" r="4" fill="#00a046"/><path d="M36,54 Q50,70 64,54" fill="none" stroke="#00a046" stroke-width="5.5" stroke-linecap="round"/></svg>`
    },
    {
        id: 7,
        name: "Prom.ua",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.LIGHTBLUE,
        price: 1000,
        rent: [80, 320, 800, 1600, 3000],
        branchCost: 700,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#7b2ff2"/><path d="M50,20 L76,34 V66 L50,80 L24,66 V34 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M50,20 V80 M24,34 L50,48 L76,34" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-linejoin="round"/></svg>`
    },
    {
        id: 8,
        name: "Monobank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1400,
        rent: [120, 480, 1200, 2400, 4200],
        branchCost: 1000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#1a1a1a"/><path d="M50,26 C38,26 26,34 26,52 C26,60 30,68 38,72 L50,72 L62,72 C70,68 74,60 74,52 C74,34 62,26 50,26 Z" fill="#2d2d2d"/><path d="M34,34 L38,24 L42,32" fill="#ff8da1"/><path d="M66,34 L62,24 L58,32" fill="#ff8da1"/><ellipse cx="40" cy="46" rx="5" ry="7" fill="#facc15"/><ellipse cx="60" cy="46" rx="5" ry="7" fill="#facc15"/><ellipse cx="40" cy="46" rx="2" ry="5" fill="#000"/><ellipse cx="60" cy="46" rx="2" ry="5" fill="#000"/><path d="M47,55 L50,52 L53,55" fill="#ff8da1"/><path d="M46,62 Q50,66 54,62" fill="none" stroke="#ff8da1" stroke-width="2" stroke-linecap="round"/><line x1="26" y1="48" x2="16" y2="46" stroke="#888" stroke-width="1.5"/><line x1="26" y1="52" x2="14" y2="53" stroke="#888" stroke-width="1.5"/><line x1="74" y1="48" x2="84" y2="46" stroke="#888" stroke-width="1.5"/><line x1="74" y1="52" x2="86" y2="53" stroke="#888" stroke-width="1.5"/></svg>`
    },
    {
        id: 9,
        name: "PrivatBank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1600,
        rent: [140, 560, 1400, 2800, 4800],
        branchCost: 1000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#538a00"/><rect x="28" y="24" width="14" height="52" rx="3" fill="#fff"/><rect x="28" y="24" width="38" height="14" rx="3" fill="#fff"/><rect x="52" y="24" width="14" height="30" rx="3" fill="#fff"/></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#e31e24"/><rect x="26" y="26" width="48" height="48" rx="10" fill="#fff"/><path d="M32,32 H44 V38 H38 V44 H32 Z" fill="#e31e24"/><path d="M68,32 H56 V38 H62 V44 H68 Z" fill="#e31e24"/><path d="M32,68 H44 V62 H38 V56 H32 Z" fill="#e31e24"/><path d="M68,68 H56 V62 H62 V56 H68 Z" fill="#e31e24"/><rect x="46" y="46" width="8" height="8" rx="1" fill="#e31e24"/></svg>`
    },
    {
        id: 12,
        name: "Ukrposhta",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.ORANGE,
        price: 1800,
        rent: [160, 640, 1600, 3200, 5400],
        branchCost: 1200,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#005bac"/><path d="M50,22 C36,22 28,32 28,44 C28,58 50,78 50,78 C50,78 72,58 72,44 C72,32 64,22 50,22 Z" fill="#ffd500"/><circle cx="50" cy="44" r="12" fill="#ffd500" stroke="#005bac" stroke-width="5"/><path d="M40,44 L36,48 M60,44 L64,48" stroke="#005bac" stroke-width="4" stroke-linecap="round"/></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#0057b7"/><g transform="translate(50,50)"><path d="M0,-10 L-5,-30 L0,-38 L5,-30 Z" fill="#ffd500"/><path d="M0,-10 L-5,-30 L0,-38 L5,-30 Z" fill="#ffd500" transform="rotate(72)"/><path d="M0,-10 L-5,-30 L0,-38 L5,-30 Z" fill="#ffd500" transform="rotate(144)"/><path d="M0,-10 L-5,-30 L0,-38 L5,-30 Z" fill="#ffd500" transform="rotate(216)"/><path d="M0,-10 L-5,-30 L0,-38 L5,-30 Z" fill="#ffd500" transform="rotate(288)"/><circle r="7" fill="#0057b7"/></g></svg>`
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
        branchCost: 1500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#0054a6"/><path d="M25,75 V30 L50,18 L75,30 V75 Z" fill="#fff"/><rect x="38" y="36" width="24" height="9" fill="#0054a6"/><rect x="38" y="52" width="24" height="9" fill="#0054a6"/></svg>`
    },
    {
        id: 17,
        name: "WOG",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 2800,
        rent: [260, 1000, 2600, 5200, 8000],
        branchCost: 1800,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#fff"/><path d="M50,12 C50,12 80,44 80,60 C80,76 66,88 50,88 C34,88 20,76 20,60 C20,44 50,12 50,12 Z" fill="#009639"/><path d="M36,50 L44,72 L50,58 L56,72 L64,50" fill="none" stroke="#ffd500" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    {
        id: 18,
        name: "Дія",
        type: SPACE_TYPES.UTILITY,
        price: 1500,
        multiplier: 100,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#000"/><rect x="22" y="30" width="18" height="40" rx="9" fill="none" stroke="#fff" stroke-width="5"/><line x1="40" y1="30" x2="40" y2="70" stroke="#fff" stroke-width="5"/><line x1="22" y1="70" x2="22" y2="78" stroke="#fff" stroke-width="5" stroke-linecap="round"/><line x1="40" y1="70" x2="40" y2="78" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="52" cy="30" r="3" fill="#fff"/><line x1="52" y1="38" x2="52" y2="70" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M62,38 C72,38 78,44 78,50 C78,56 72,56 62,56 L62,70" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="84" r="3.5" fill="#00e5ff"/><circle cx="50" cy="84" r="3.5" fill="#ff4081"/><circle cx="64" cy="84" r="3.5" fill="#c6ff00"/></svg>`
    },
    {
        id: 19,
        name: "MEGOGO",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 3200,
        rent: [350, 1400, 3500, 7000, 10000],
        branchCost: 2000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#0d0d1a"/><path d="M24,68 V36 C24,28 32,28 36,34 L50,54 L64,34 C68,28 76,28 76,36 V68" fill="none" stroke="#20e29d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`
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

        // Check if player owns all properties of the color group (monopoly)
        const sameGroupSpaces = this.spaces.filter(s => s.group === space.group);
        const allOwnedBySame = sameGroupSpaces.every(s => s.owner === playerId);
        if (!allOwnedBySame) return false;

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
