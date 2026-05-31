// ==========================================================================
// UI RENDERER & INTERACTIVE ANIMATIONS - MONOPOLY UKRAINE
// ==========================================================================

import { SPACE_TYPES, COLOR_GROUPS } from './game.js';

// Setup Modal DOM references
const modalOverlay = document.getElementById('global-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const modalClose = document.getElementById('btn-modal-close');

modalClose.addEventListener('click', hideModal);

export function showModal(title, contentHtml, buttons = []) {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHtml;
    modalFooter.innerHTML = '';

    buttons.forEach(btn => {
        const btnEl = document.createElement('button');
        btnEl.className = `btn ${btn.class || 'btn-secondary'}`;
        btnEl.innerText = btn.text;
        btnEl.addEventListener('click', () => {
            if (btn.onClick) btn.onClick();
            if (!btn.keepOpen) hideModal();
        });
        modalFooter.appendChild(btnEl);
    });

    modalOverlay.classList.add('active');
}

export function hideModal() {
    modalOverlay.classList.remove('active');
}

// Generate the board grid elements
export function renderBoard(gameState, onCellClick) {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    gameState.spaces.forEach((space, index) => {
        const cell = document.createElement('div');
        cell.className = `cell cell-${index}`;
        
        // Mark corner cell
        if ([0, 5, 10, 15].includes(index)) {
            cell.classList.add('corner-cell');
        }

        cell.addEventListener('click', () => onCellClick(index));

        // 1. Color Bar for groups
        if (space.group) {
            const colorBar = document.createElement('div');
            colorBar.className = 'cell-color-bar';
            colorBar.style.backgroundColor = `var(--prop-${space.group})`;
            cell.appendChild(colorBar);
        }

        // 2. Logo SVG or Name text
        let nameEl;
        if (space.logoSvg) {
            const logoEl = document.createElement('div');
            logoEl.className = 'cell-logo';
            logoEl.innerHTML = space.logoSvg;
            cell.appendChild(logoEl);
        } else {
            nameEl = document.createElement('div');
            nameEl.className = 'cell-name';
            nameEl.innerText = space.name;
            cell.appendChild(nameEl);
        }

        // 3. Icons for corners
        if (space.type === SPACE_TYPES.START) {
            nameEl.style.color = 'var(--color-yellow)';
            cell.innerHTML += `<i class="fa-solid fa-flag-checkered corner-icon text-yellow"></i>`;
        } else if (space.type === SPACE_TYPES.JAIL) {
            cell.innerHTML += `<i class="fa-solid fa-shield-halved corner-icon text-info"></i>`;
        } else if (space.type === SPACE_TYPES.FREE_PARKING) {
            cell.innerHTML += `<i class="fa-solid fa-hand-holding-heart corner-icon text-success"></i>`;
        } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
            cell.innerHTML += `<i class="fa-solid fa-triangle-exclamation corner-icon text-danger"></i>`;
        }

        // 4. Upgrades (Branches indicator)
        if (space.branches > 0) {
            const branchesEl = document.createElement('div');
            branchesEl.className = 'cell-branches';
            for (let i = 0; i < space.branches; i++) {
                const dot = document.createElement('div');
                dot.className = 'cell-branch-dot';
                branchesEl.appendChild(dot);
            }
            cell.appendChild(branchesEl);
        }

        // 5. Price tag
        if (space.price) {
            const priceEl = document.createElement('div');
            priceEl.className = 'cell-price';
            priceEl.innerText = `₴${space.price}`;
            cell.appendChild(priceEl);
        }

        // 6. Owner label
        if (space.owner !== null) {
            cell.classList.add(`owned-p${space.owner}`);
            const ownerDot = document.createElement('div');
            ownerDot.className = `cell-owner-indicator p-color-${space.owner}`;
            cell.appendChild(ownerDot);
        }

        // 7. Token Container
        const tokenContainer = document.createElement('div');
        tokenContainer.className = 'cell-tokens';
        tokenContainer.id = `cell-tokens-${index}`;
        cell.appendChild(tokenContainer);

        boardEl.appendChild(cell);
    });

    updatePlayerTokens(gameState);
}

// Update tokens positions
export function updatePlayerTokens(gameState) {
    // Clear all token nodes
    document.querySelectorAll('.cell-tokens').forEach(el => el.innerHTML = '');

    gameState.players.forEach(player => {
        if (player.isBankrupt) return;

        const container = document.getElementById(`cell-tokens-${player.position}`);
        if (container) {
            const tokenEl = document.createElement('div');
            tokenEl.className = `token p-color-${player.id}`;
            

            
            tokenEl.id = `player-token-${player.id}`;
            container.appendChild(tokenEl);
        }
    });
}

// Animated movement step-by-step
export function animatePlayerMovement(gameState, playerId, fromPos, steps, onComplete) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    let currentStep = 0;
    let currentPos = fromPos;

    function step() {
        if (currentStep < steps) {
            currentPos = (currentPos + 1) % 20;
            player.position = currentPos;
            
            // Redraw tokens
            updatePlayerTokens(gameState);
            
            // Bounce effect
            const tokenEl = document.getElementById(`player-token-${playerId}`);
            if (tokenEl) {
                tokenEl.style.transform = 'translateY(-8px) scale(1.3)';
                setTimeout(() => {
                    tokenEl.style.transform = 'translateY(0) scale(1)';
                }, 150);
            }

            // Optional beep or hop effect can go here
            currentStep++;
            setTimeout(step, 250); // delay between steps
        } else {
            onComplete();
        }
    }

    step();
}

// Animate dice rolling faces
export function animateDiceRoll(d1, d2, callback) {
    const die1 = document.getElementById('die-1');
    const die2 = document.getElementById('die-2');
    const sumEl = document.getElementById('dice-sum-display');

    // Clear previous skins
    die1.className = 'die';
    die2.className = 'die';

    die1.classList.add('rolling');
    die2.classList.add('rolling');
    sumEl.innerText = '...';

    let count = 0;
    const interval = setInterval(() => {
        const tempVal1 = Math.floor(Math.random() * 6) + 1;
        const tempVal2 = Math.floor(Math.random() * 6) + 1;
        
        die1.setAttribute('data-value', tempVal1);
        updateDiceDots(die1, tempVal1);
        
        die2.setAttribute('data-value', tempVal2);
        updateDiceDots(die2, tempVal2);

        count++;
        if (count > 8) {
            clearInterval(interval);
            die1.classList.remove('rolling');
            die2.classList.remove('rolling');
            
            die1.setAttribute('data-value', d1);
            updateDiceDots(die1, d1);
            
            die2.setAttribute('data-value', d2);
            updateDiceDots(die2, d2);
            
            sumEl.innerText = d1 + d2;
            
            // Add neon pulse glow to double
            if (d1 === d2) {
                sumEl.style.boxShadow = '0 0 15px var(--color-yellow)';
                setTimeout(() => sumEl.style.boxShadow = 'none', 1000);
            }
            
            callback();
        }
    }, 80);
}

function updateDiceDots(dieEl, value) {
    dieEl.innerHTML = '';
    for (let i = 0; i < value; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dieEl.appendChild(dot);
    }
}

let playerClickCallback = null;
export function setPlayerClickCallback(callback) {
    playerClickCallback = callback;
}

// Redraw HUD cards for players
export function renderPlayersHUD(gameState) {
    const hudEl = document.getElementById('game-players-hud');
    hudEl.innerHTML = '';

    gameState.players.forEach(player => {
        const card = document.createElement('div');
        card.className = `player-hud-card ${gameState.currentPlayerIndex === player.id ? 'active' : ''} ${player.isBankrupt ? 'bankrupt' : ''}`;
        
        if (playerClickCallback && !player.isBankrupt) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => playerClickCallback(player.id));
        }

        const dot = document.createElement('div');
        dot.className = `hud-player-dot p-color-${player.id}`;
        card.appendChild(dot);

        const name = document.createElement('span');
        name.className = 'hud-player-name';
        name.innerText = player.name;
        card.appendChild(name);

        const money = document.createElement('span');
        money.className = 'hud-player-money';
        money.innerText = player.isBankrupt ? 'Банкрут' : `₴${player.money}`;
        card.appendChild(money);

        hudEl.appendChild(card);
    });
}

// Log view scroller
export function updateGameLog(gameState) {
    const logEl = document.getElementById('game-log');
    logEl.innerHTML = '';

    gameState.logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = `log-entry ${log.type}`;
        entry.innerText = log.text;
        logEl.appendChild(entry);
    });

    logEl.scrollTop = logEl.scrollHeight;
}

// Display Property Info card details in popup modal
export function showPropertyModal(space, onBuy, onDecline, isSelfOwner = false, onUpgrade = null) {
    const isSpecial = space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY;
    const headerColor = space.group ? `var(--prop-${space.group})` : '#475569';
    
    let detailsHtml = `
        <div class="deed-card">
            <div class="deed-header" style="background-color: ${headerColor};">
                ${space.name}
            </div>
            <div class="deed-body">
                <div class="deed-row"><span>Ціна купівлі</span><strong>₴${space.price}</strong></div>
    `;

    if (!isSpecial) {
        detailsHtml += `
            <div class="deed-row"><span>Базова оренда</span><strong>₴${space.rent[0]}</strong></div>
            <div class="deed-row"><span>З 1 філією</span><span>₴${space.rent[1]}</span></div>
            <div class="deed-row"><span>З 2 філіями</span><span>₴${space.rent[2]}</span></div>
            <div class="deed-row"><span>З 3 філіями</span><span>₴${space.rent[3]}</span></div>
            <div class="deed-row.highlight deed-row"><span>Супер-філія</span><strong>₴${space.rent[4]}</strong></div>
            <div class="deed-row"><span>Вартість будівництва</span><strong>₴${space.branchCost} / філія</strong></div>
        `;
    } else if (space.type === SPACE_TYPES.STATION) {
        detailsHtml += `
            <div class="deed-row"><span>Базова оренда</span><strong>₴${space.baseRent}</strong></div>
            <div class="deed-row"><span>Якщо володієте фінтех/дiя</span><strong>₴${space.baseRent * 2}</strong></div>
        `;
    } else if (space.type === SPACE_TYPES.UTILITY) {
        detailsHtml += `
            <div class="deed-row"><span>Рента за використання</span><strong>100x від суми кубиків</strong></div>
            <div class="deed-row"><span>Приклад: випало 7</span><strong>₴700</strong></div>
        `;
    }

    detailsHtml += `
            </div>
        </div>
    `;

    const buttons = [];
    if (!isSelfOwner) {
        buttons.push({ text: `Придбати за ₴${space.price}`, class: 'btn-primary', onClick: onBuy });
        buttons.push({ text: 'Відхилити', class: 'btn-secondary', onClick: onDecline });
    } else if (!isSpecial && space.branches < 4) {
        buttons.push({ text: `Побудувати філію за ₴${space.branchCost}`, class: 'btn-primary', onClick: onUpgrade });
        buttons.push({ text: 'Закрити', class: 'btn-secondary' });
    } else {
        buttons.push({ text: 'Закрити', class: 'btn-secondary' });
    }

    showModal("Комерційна Пропозиція", detailsHtml, buttons);
}

// Display Chance card popup modal
export function showChanceModal(cardText, onConfirm) {
    const content = `
        <div class="chance-popup-card">
            <div class="chance-icon"><i class="fa-solid fa-envelope-open-text"></i></div>
            <h4 class="chance-title">Telegram Premium Подія</h4>
            <p class="chance-text">${cardText}</p>
        </div>
    `;
    showModal("Шанс / Подія", content, [{ text: "Отримати", class: "btn-primary", onClick: onConfirm }]);
}



// Display End game screen leaderboard modal
export function showGameOverModal(rankings, onExit) {
    let rowsHtml = `
        <div class="rules-content" style="padding: 0;">
            <div class="rule-card" style="background: rgba(16, 185, 129, 0.1); border-color: var(--color-success); margin-bottom: 1rem; text-align: center;">
                <h3>👑 Переможець: ${rankings[0].name}</h3>
                <p>Кінцевий капітал магната: ₴${rankings[0].netWorth}</p>
            </div>
            <div class="leaderboard-list">
    `;

    rankings.forEach((p, idx) => {
        rowsHtml += `
            <div class="leaderboard-row">
                <div class="leaderboard-row-left">
                    <span class="row-rank">${idx + 1}</span>
                    <span class="row-name">${p.name}</span>
                </div>
                <span class="row-worth">${p.isBankrupt ? 'Банкрут' : `₴${p.netWorth}`}</span>
            </div>
        `;
    });

    rowsHtml += `
            </div>
        </div>
    `;

    showModal("Гру Завершено!", rowsHtml, [{ text: "Головне Меню", class: "btn-primary", onClick: onExit }]);
}


