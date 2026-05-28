// ==========================================================================
// SHOP & MONETIZATION - MONOPOLY UKRAINE
// ==========================================================================

export const DICE_SKINS = [
    { id: 'classic', name: 'Класичний', price: 0, class: '', desc: 'Стандартний білий кубик' },
    { id: 'neon', name: 'Неоновий Світ', price: 50, class: 'die-neon', desc: 'Світиться неоновим UA синім' },
    { id: 'gold', name: 'Золото Магната', price: 150, class: 'die-gold', desc: 'Преміальні золоті грані' }
];

export const TOKEN_SKINS = [
    { id: 'classic', name: 'Козак', price: 0, class: 'token-cossack', preview: '💂', desc: 'Справжній козацький чуб' },
    { id: 'cat', name: 'Кіт Моно', price: 100, class: 'token-cat', preview: '🐱', desc: 'Улюбленець фінтеху' },
    { id: 'dumpling', name: 'Вареник', price: 80, class: 'token-dumpling', preview: '🥟', desc: 'Традиційний гарячий вареничок' },
    { id: 'sunflower', name: 'Соняшник', price: 120, class: 'token-sunflower', preview: '🌻', desc: 'Символ українських ланів' }
];

class UserShopData {
    constructor() {
        this.load();
    }

    load() {
        try {
            const data = localStorage.getItem('monopoly_shop_data');
            if (data) {
                const parsed = JSON.parse(data);
                this.stars = parsed.stars ?? 250;
                this.ownedDice = parsed.ownedDice ?? ['classic'];
                this.ownedTokens = parsed.ownedTokens ?? ['classic'];
                this.equippedDice = parsed.equippedDice ?? 'classic';
                this.equippedToken = parsed.equippedToken ?? 'classic';
            } else {
                this.stars = 250;
                this.ownedDice = ['classic'];
                this.ownedTokens = ['classic'];
                this.equippedDice = 'classic';
                this.equippedToken = 'classic';
            }
        } catch (e) {
            this.stars = 250;
            this.ownedDice = ['classic'];
            this.ownedTokens = ['classic'];
            this.equippedDice = 'classic';
            this.equippedToken = 'classic';
        }
    }

    save() {
        try {
            const data = {
                stars: this.stars,
                ownedDice: this.ownedDice,
                ownedTokens: this.ownedTokens,
                equippedDice: this.equippedDice,
                equippedToken: this.equippedToken
            };
            localStorage.setItem('monopoly_shop_data', JSON.stringify(data));
        } catch (e) {
            console.error("Помилка збереження даних магазину", e);
        }
    }

    buyItem(type, itemId, price, successCallback, failCallback) {
        if (this.stars < price) {
            failCallback("Недостатньо зірок Telegram ⭐️. Ви можете поповнити баланс у реальному додатку.");
            return;
        }

        this.stars -= price;
        if (type === 'dice') {
            this.ownedDice.push(itemId);
        } else if (type === 'token') {
            this.ownedTokens.push(itemId);
        }
        this.save();
        successCallback();
    }

    equipItem(type, itemId) {
        if (type === 'dice' && this.ownedDice.includes(itemId)) {
            this.equippedDice = itemId;
            this.save();
            return true;
        } else if (type === 'token' && this.ownedTokens.includes(itemId)) {
            this.equippedToken = itemId;
            this.save();
            return true;
        }
        return false;
    }
}

export const shopData = new UserShopData();
