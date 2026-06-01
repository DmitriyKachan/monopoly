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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#003594"/><circle cx="50" cy="50" r="38" fill="#fccd04"/><circle cx="50" cy="50" r="32" fill="#e4002b"/><path d="M30,59 L35.5,37 H38.5 L44,59 H39.5 L38,51.5 H31.5 L30,59 Z M33,47.5 H36.5 L34.75,41.5 Z M47,37 H59 V41 H55.5 V59 H50.5 V41 H47 Z M63,37 H73.5 V40.5 H67 V47 C69.5,47 73.5,48.5 73.5,53 C73.5,57.5 70,59 63,59 Z M67,46.5 H67.5 C68.5,46.5 69.5,47 69.5,49 C69.5,51 68.5,51.5 67.5,51.5 H67 Z" fill="#ffffff" fill-rule="evenodd"/></svg>`
    },
    {
        id: 2,
        name: "Сільпо",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.BROWN,
        price: 600,
        rent: [50, 200, 500, 1000, 2000],
        branchCost: 500,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#f97316"/><path d="M12,50 C12,28 30,16 50,16 C70,16 88,28 88,50 C88,72 70,84 50,84 C30,84 12,72 12,50 Z" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.35"/><path d="M18,48 C18,42 26,42 26,48 C26,53 21,55 18,52 M32,44 V54 M32,38 A1.5,1.5 0 1,1 32,37 M32,54 Q36,47 38,45 T44,54 M48,38 V54 C48,58 53,58 53,54 C53,50 48,50 48,54 M58,45 V54 M58,48 Q62,44 64,48 V54 M69,49 C69,43 77,43 77,49 C77,55 69,55 69,49 Z" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#002b5c"/><path d="M22,30 H36 L43,54 L52,30 H66 L52,65 H38 Z" fill="#ffffff"/><path d="M60,30 H78 C84,30 87,33 87,37 C87,41 84,44 79,45 C84,46 86,49 86,54 C86,60 81,65 74,65 H56 L59,57 H72 C76,57 78,55 78,52 C78,49 76,47 71,47 H64 L66,39 H72 C76,39 78,37 78,35 C78,33 76,32 72,32 H61 Z" fill="#ffffff"/></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#00a046"/><circle cx="50" cy="53" r="32" fill="#ffffff"/><circle cx="38" cy="48" r="4.5" fill="#00a046"/><circle cx="62" cy="48" r="4.5" fill="#00a046"/><rect x="48" y="46" width="4" height="8" rx="2" fill="#00a046"/><path d="M32,56 Q50,76 68,56" fill="none" stroke="#00a046" stroke-width="6.5" stroke-linecap="round"/><path d="M22,40 C35,28 65,28 78,40 C70,36 30,36 22,40 Z" fill="#00a046"/></svg>`
    },
    {
        id: 7,
        name: "Prom.ua",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.LIGHTBLUE,
        price: 1000,
        rent: [80, 320, 800, 1600, 3000],
        branchCost: 700,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#833ae0"/><path d="M50,18 L80,33 L80,63 L50,78 L20,63 L20,33 Z" fill="none" stroke="#ffffff" stroke-width="7.5" stroke-linejoin="round"/><path d="M50,18 L50,78 M20,33 L50,48 L80,33" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/><path d="M30,82 H35 C36.5,82 37.5,82.8 37.5,84.5 C37.5,86.2 36.5,87 35,87 H32.5 V90 H30 Z M32.5,84 H35 C35.6,84 35.6,85 35,85 H32.5 Z M41,82 H46 C47.5,82 48.5,82.8 48.5,84.5 C48.5,86.2 47.5,87 46,87 L48.5,90 H46 L43.5,87 H43.5 V90 H41 Z M43.5,84 H46 C46.6,84 46.6,85 46,85 H43.5 Z M52,82 H57 C58.5,82 59.5,83.5 59.5,86 C59.5,88.5 58.5,90 57,90 H52 Z M54.5,84 V88 H57 C57.6,88 57.6,84 57,84 Z M63,90 V82 L67,86.5 L71,82 V90 H68.5 V85 L67,86.8 L65.5,85 V90 Z" fill="#ffffff" fill-rule="evenodd"/></svg>`
    },
    {
        id: 8,
        name: "Monobank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1400,
        rent: [120, 480, 1200, 2400, 4200],
        branchCost: 1000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#111111"/><path d="M22,65 C22,50 25,36 34,26 L38,36 C42,34 46,33 50,33 C54,33 58,34 62,36 L66,26 C75,36 78,50 78,65 Z" fill="#222222"/><path d="M30,30 L35,22 L37,28 Z" fill="#ff8da1"/><path d="M70,30 L65,22 L63,28 Z" fill="#ff8da1"/><ellipse cx="38" cy="46" rx="6" ry="8" fill="#facc15"/><ellipse cx="62" cy="46" rx="6" ry="8" fill="#facc15"/><ellipse cx="38" cy="46" rx="2.2" ry="6" fill="#000000"/><ellipse cx="62" cy="46" rx="2.2" ry="6" fill="#000000"/><polygon points="50,51 47,48 53,48" fill="#ff8da1"/><path d="M47,59 Q50,62 53,59" fill="none" stroke="#ff8da1" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="48" x2="8" y2="47" stroke="#ffffff" stroke-width="1.5"/><line x1="22" y1="52" x2="6" y2="52" stroke="#ffffff" stroke-width="1.5"/><line x1="74" y1="48" x2="88" y2="47" stroke="#ffffff" stroke-width="1.5"/><line x1="74" y1="52" x2="90" y2="52" stroke="#ffffff" stroke-width="1.5"/><path d="M30,84 V90 H32 V85 C32,83.5 33.5,83 34,83 C34.5,83 35.5,83.5 35.5,85 V90 H37.5 V85 C37.5,83.5 39,83 39.5,83 C40,83 41,83.5 41,85 V90 H43 V83.5 H41 V84.5 C40.2,83.5 39.2,83 38,83 C37,83 36.2,83.5 35.5,84.5 C34.8,83.5 33.8,83 32.5,83 C31.2,83 30,84 30,85.5 Z M47,83 C44.5,83 43.5,84.5 43.5,86.5 C43.5,88.5 44.5,90 47,90 C49.5,90 50.5,88.5 50.5,86.5 C50.5,84.5 49.5,83 47,83 Z M47,85 C48,85 48.5,85.5 48.5,86.5 C48.5,87.5 48,88 47,88 C46,88 45.5,87.5 45.5,86.5 C45.5,85.5 46,85 47,85 Z M53,83.5 H55 V84.5 C55.8,83.5 56.8,83 58,83 C59.8,83 61,84.5 61,86.5 V90 H59 V86.5 C59,85 58.2,84.8 57.5,84.8 C56.8,84.8 55,85 55,86.5 V90 H53 Z M65,83 C62.5,83 61.5,84.5 61.5,86.5 C61.5,88.5 62.5,90 65,90 C67.5,90 68.5,88.5 68.5,86.5 C68.5,84.5 67.5,83 65,83 Z M65,85 C66,85 66.5,85.5 66.5,86.5 C66.5,87.5 66,88 65,88 C64,88 63.5,87.5 63.5,86.5 C63.5,85.5 64,85 65,85 Z" fill="#ffffff" fill-rule="evenodd"/></svg>`
    },
    {
        id: 9,
        name: "PrivatBank",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.RED,
        price: 1600,
        rent: [140, 560, 1400, 2800, 4800],
        branchCost: 1000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#74af27"/><rect x="30" y="24" width="11" height="52" fill="#ffffff" rx="1.5"/><rect x="44" y="24" width="26" height="11" fill="#ffffff" rx="1.5"/><rect x="59" y="38" width="11" height="15" fill="#ffffff" rx="1.5"/></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#e31e24"/><rect x="25" y="25" width="50" height="50" rx="10" fill="#ffffff"/><path d="M31,31 H42 V37 H37 V42 H31 Z" fill="#e31e24"/><path d="M69,31 H58 V37 H63 V42 H69 Z" fill="#e31e24"/><path d="M31,69 H42 V63 H37 V58 H31 Z" fill="#e31e24"/><path d="M69,69 H58 V63 H63 V58 H69 Z" fill="#e31e24"/><rect x="46" y="46" width="8" height="8" rx="1" fill="#e31e24"/></svg>`
    },
    {
        id: 12,
        name: "Ukrposhta",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.ORANGE,
        price: 1800,
        rent: [160, 640, 1600, 3200, 5400],
        branchCost: 1200,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#005a9c"/><g transform="rotate(45, 50, 50)"><path d="M50,18 C33,18 24,30 24,46 C24,63 50,82 50,82 C50,82 76,63 76,46 C76,30 67,18 50,18 Z" fill="#ffcc00"/><circle cx="50" cy="46" r="14" fill="#ffcc00" stroke="#005a9c" stroke-width="6"/><path d="M38,46 L34,50 M62,46 L66,50" stroke="#005a9c" stroke-width="4.5" stroke-linecap="round"/></g></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#0057b7"/><g transform="translate(50,50)"><path d="M-4,-12 L-6,-32 L0,-42 L6,-32 L4,-12 Z" fill="#ffdd00"/><path d="M-4,-12 L-6,-32 L0,-42 L6,-32 L4,-12 Z" fill="#ffdd00" transform="rotate(72)"/><path d="M-4,-12 L-6,-32 L0,-42 L6,-32 L4,-12 Z" fill="#ffdd00" transform="rotate(144)"/><path d="M-4,-12 L-6,-32 L0,-42 L6,-32 L4,-12 Z" fill="#ffdd00" transform="rotate(216)"/><path d="M-4,-12 L-6,-32 L0,-42 L6,-32 L4,-12 Z" fill="#ffdd00" transform="rotate(288)"/><circle cx="0" cy="0" r="7.5" fill="#0057b7"/></g></svg>`
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
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#0054a6"/><path d="M22,28 L50,12 L78,28 V76 H22 Z" fill="#ffffff"/><rect x="36" y="34" width="28" height="11" rx="1" fill="#0054a6"/><rect x="36" y="53" width="28" height="11" rx="1" fill="#0054a6"/></svg>`
    },
    {
        id: 17,
        name: "WOG",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 2800,
        rent: [260, 1000, 2600, 5200, 8000],
        branchCost: 1800,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,10 C50,10 82,46 82,64 C82,81 67.5,90 50,90 C32.5,90 18,81 18,64 C18,46 50,10 50,10 Z" fill="#009639" stroke="#ffdd00" stroke-width="4.5"/><path d="M34,48 L42,75 L50,56 L58,75 L66,48" fill="none" stroke="#ffdd00" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    {
        id: 18,
        name: "Дія",
        type: SPACE_TYPES.UTILITY,
        price: 1500,
        multiplier: 100,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#000000"/><path d="M24,53 C24,49 27,46 31,46 C35,46 38,49 38,53 C38,57 35,60 31,60 C27,60 24,57 24,53 M38,42 V60 M24,60 V64 M38,60 V64 M47,46 V60 M65,46 V60 M65,46 C60,46 57,49 57,53 C57,57 60,57 65,57 M63,57 L57,60" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="38" r="2.5" fill="#ffffff"/><circle cx="42" cy="76" r="3.5" fill="#00f0ff"/><circle cx="52" cy="76" r="3.5" fill="#ff007f"/><circle cx="62" cy="76" r="3.5" fill="#c2e812"/></svg>`
    },
    {
        id: 19,
        name: "MEGOGO",
        type: SPACE_TYPES.PROPERTY,
        group: COLOR_GROUPS.GREEN,
        price: 3200,
        rent: [350, 1400, 3500, 7000, 10000],
        branchCost: 2000,
        logoSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="20" fill="#0f0f1a"/><path d="M25,65 V35 C25,28 32,28 35,32 L50,50 L65,32 C68,28 75,28 75,35 V65" fill="none" stroke="#20e29d" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 4px rgba(32, 226, 157, 0.55))"/></svg>`
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
