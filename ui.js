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

// Helper to compute rent cost dynamically from plain JSON or GameState
function getSpaceRentPrice(gameState, space) {
    if (!space || space.owner === null) return 0;
    
    if (typeof gameState.getRentCost === 'function') {
        return gameState.getRentCost(space.id);
    }
    
    const ownerId = space.owner;
    
    if (space.group) { // STREET PROPERTY
        let rent = space.rent[space.branches];
        const sameGroupSpaces = gameState.spaces.filter(s => s.group === space.group);
        const allOwnedBySame = sameGroupSpaces.every(s => s.owner === ownerId);
        if (allOwnedBySame && space.branches === 0) {
            rent *= 2;
        }
        return rent;
    }
    
    if (space.type === SPACE_TYPES.STATION) {
        const utilities = gameState.spaces.filter(s => s.type === SPACE_TYPES.UTILITY && s.owner === ownerId);
        if (utilities.length > 0) {
            return space.baseRent * 2;
        }
        return space.baseRent;
    }
    
    if (space.type === SPACE_TYPES.UTILITY) {
        return 7 * space.multiplier; // Average dice sum roll is 7
    }
    
    return 0;
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
            nameEl = document.createElement('div');
            nameEl.className = 'cell-name';
            nameEl.innerText = space.name;
            cell.appendChild(nameEl);

            const logoEl = document.createElement('div');
            logoEl.className = 'cell-logo';
            if (space.logoSvg.includes('<svg') || space.logoSvg.includes('<img')) {
                logoEl.innerHTML = space.logoSvg;
            } else {
                logoEl.innerHTML = `<img src="${space.logoSvg}" alt="${space.name}">`;
            }
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
                dot.className = `cell-branch-dot p-color-${space.owner}`;
                branchesEl.appendChild(dot);
            }
            cell.appendChild(branchesEl);
        }

        // 5. Price / Rent tag
        if (space.price) {
            const priceEl = document.createElement('div');
            if (space.owner !== null) {
                const rentVal = getSpaceRentPrice(gameState, space);
                priceEl.className = 'cell-price cell-price-rent';
                priceEl.innerText = `₴${rentVal}`;
            } else {
                priceEl.className = 'cell-price';
                priceEl.innerText = `₴${space.price}`;
            }
            cell.appendChild(priceEl);
        }

        // 6. Owner label
        if (space.owner !== null) {
            cell.classList.add(`owned-p${space.owner}`);
            const ownerDot = document.createElement('div');
            ownerDot.className = `cell-owner-indicator p-color-${space.owner}`;
            cell.appendChild(ownerDot);
        }

        // 6.5 Mortgage Label Overlay
        if (space.isMortgaged) {
            cell.classList.add('mortgaged-cell');
            const mortgageOverlay = document.createElement('div');
            mortgageOverlay.className = 'cell-mortgage-badge';
            mortgageOverlay.innerText = 'ЗАСТАВА';
            cell.appendChild(mortgageOverlay);
        }

        // 7. Token Container
        const tokenContainer = document.createElement('div');
        tokenContainer.className = 'cell-tokens';
        tokenContainer.id = `cell-tokens-${index}`;
        cell.appendChild(tokenContainer);

        boardEl.appendChild(cell);
    });

    // 8. Board Center Space (Logo & Trade Container)
    const centerEl = document.createElement('div');
    centerEl.className = 'board-center';
    centerEl.id = 'board-center';
    centerEl.innerHTML = `
        <div class="board-center-logo">
            <span class="logo-text-top">МОНОПОЛІЯ</span>
            <span class="logo-text-bottom">УКРАЇНА</span>
        </div>
    `;
    boardEl.appendChild(centerEl);

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
            
            // Screen shake and neon flash effects upon dice landing
            const boardWrapper = document.querySelector('.monopoly-board-wrapper');
            if (boardWrapper) {
                boardWrapper.classList.add('screen-shake');
                setTimeout(() => boardWrapper.classList.remove('screen-shake'), 400);
            }
            const board = document.getElementById('board');
            if (board) {
                const flash = document.createElement('div');
                flash.className = 'dice-flash-effect active';
                board.appendChild(flash);
                setTimeout(() => flash.remove(), 600);
            }

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
        card.className = `player-hud-card ${gameState.currentPlayerIndex === player.id ? 'active' : ''} ${player.isBankrupt ? 'bankrupt' : ''} p-border-${player.id}`;
        
        if (playerClickCallback && !player.isBankrupt) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => playerClickCallback(player.id));
        }

        // Render player avatar with animated border frames
        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'hud-avatar-wrapper';
        
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatar-container';
        if (player.frame) {
            avatarContainer.classList.add(`frame-${player.frame}`);
            avatarContainer.style.width = '32px';
            avatarContainer.style.height = '32px';
        } else {
            avatarContainer.style.width = '28px';
            avatarContainer.style.height = '28px';
            avatarContainer.style.border = `2px solid rgba(255, 255, 255, 0.15)`;
        }

        const avatarImg = document.createElement('img');
        avatarImg.className = 'hud-avatar';
        avatarImg.src = player.avatar || 'assets/cossack_tycoon.png';
        avatarImg.style.width = '100%';
        avatarImg.style.height = '100%';
        avatarImg.onerror = () => { avatarImg.src = 'assets/cossack_tycoon.png'; };
        
        avatarContainer.appendChild(avatarImg);
        avatarWrapper.appendChild(avatarContainer);
        card.appendChild(avatarWrapper);

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
    if (logEl) {
        logEl.innerHTML = '';

        gameState.logs.forEach(log => {
            const entry = document.createElement('div');
            entry.className = `log-entry ${log.type}`;
            entry.innerText = log.text;
            logEl.appendChild(entry);
        });

        logEl.scrollTop = logEl.scrollHeight;
    }
}

// Display Property Info card details in popup modal
export function showPropertyModal(space, onBuy, onDecline, isSelfOwner = false, onUpgrade = null, onMortgage = null, onUnmortgage = null, ownerName = null) {
    const isSpecial = space.type === SPACE_TYPES.STATION || space.type === SPACE_TYPES.UTILITY;
    const headerColor = space.group ? `var(--prop-${space.group})` : '#475569';
    
    let detailsHtml = `
        <div class="deed-card ${space.isMortgaged ? 'mortgaged' : ''}">
            <div class="deed-header" style="background-color: ${headerColor};">
                ${space.name}
            </div>
            <div class="deed-body">
    `;

    if (ownerName) {
        detailsHtml += `
            <div class="deed-row highlight" style="border-bottom: 2px solid rgba(255, 215, 0, 0.2); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                <span>Власник</span><strong>${ownerName}</strong>
            </div>
        `;
    }

    if (space.isMortgaged) {
        detailsHtml += `
            <div class="deed-mortgaged-banner">
                <i class="fa-solid fa-lock text-danger" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                <div style="font-weight: 800; color: var(--color-danger); font-size: 0.9rem;">МАЙНО ЗАКЛАДЕНО В БАНК</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">Оренда не нараховується. Будівництво заблоковано.</div>
            </div>
        `;
    }

    detailsHtml += `
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
        if (onBuy && onDecline) {
            buttons.push({ text: `Придбати за ₴${space.price}`, class: 'btn-primary', onClick: onBuy });
            buttons.push({ text: 'Відхилити', class: 'btn-secondary', onClick: onDecline });
        } else {
            buttons.push({ text: 'Закрити', class: 'btn-secondary' });
        }
    } else {
        if (space.isMortgaged) {
            const cost = Math.floor(space.price * 0.55);
            buttons.push({ text: `Викупити за ₴${cost}`, class: 'btn-primary', onClick: onUnmortgage });
        } else {
            // Can upgrade street property if no mortgaged and not maxed
            if (!isSpecial && space.branches < 4 && onUpgrade) {
                buttons.push({ text: `Побудувати філію (₴${space.branchCost})`, class: 'btn-primary', onClick: onUpgrade });
            }
            // Can mortgage if has no branches
            if ((!space.branches || space.branches === 0) && onMortgage) {
                const val = Math.floor(space.price * 0.5);
                buttons.push({ text: `Заставити (+₴${val})`, class: 'btn-danger', onClick: onMortgage });
            }
        }
        buttons.push({ text: 'Закрити', class: 'btn-secondary' });
    }

    showModal("Комерційна Пропозиція", detailsHtml, buttons);
}

// Display Special Space details in modal
export function showSpecialSpaceModal(space, currentFund = 0) {
    let title = space.name;
    let icon = "fa-circle-info";
    let color = "var(--color-primary)";
    let desc = "";

    if (space.type === SPACE_TYPES.START) {
        title = "Клітка Старт 🏁";
        icon = "fa-flag-checkered";
        color = "var(--color-yellow)";
        desc = "Стартова позиція гри. Кожного разу, коли ви проходите або зупиняєтесь на цій клітці, ви отримуєте зарплату в розмірі <strong>₴2,000</strong>.";
    } else if (space.type === SPACE_TYPES.JAIL) {
        title = "Тюрма / Відпочинок 🛡️";
        icon = "fa-shield-halved";
        color = "var(--color-info)";
        desc = "Якщо ви просто зупинилися тут, ви вважаєтесь 'Звичайним відвідувачем' і можете спокійно відпочивати. Якщо ж вас відправили сюди за порушення правил, вам доведеться пропустити ходи або заплатити штраф ₴500 для виходу.";
    } else if (space.type === SPACE_TYPES.FREE_PARKING) {
        title = "Благодійний Фонд 🏦";
        icon = "fa-hand-holding-heart";
        color = "var(--color-success)";
        desc = `Тут накопичуються всі податки та штрафи гравців. Якщо ви зупинитесь на цій клітці, ви отримаєте весь накопичений джекпот фонду!<br><br>Поточний баланс фонду: <strong class="text-success" style="font-size: 1.1rem;">₴${currentFund}</strong>`;
    } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
        title = "Іди в Тюрьму! 🚨";
        icon = "fa-triangle-exclamation";
        color = "var(--color-danger)";
        desc = "Ви заарештовані! Негайно перемістіться на клітку Тюрьма. Ви не проходите повз Старт і не отримуєте зарплату.";
    } else if (space.type === SPACE_TYPES.CHANCE) {
        title = "Telegram Premium Подія ✉️";
        icon = "fa-envelope-open-text";
        color = "var(--color-accent)";
        desc = "Зупинка на цій клітці відкриває випадкову картку Telegram-події. Ви можете як отримати прибуток, так і втратити гроші, або даже потрапити в тюрьму.";
    } else if (space.type === SPACE_TYPES.TAX) {
        title = "Податки 💸";
        icon = "fa-sack-xmark";
        color = "var(--color-warning)";
        desc = `Зупинка на цій клітці зобов'язує вас сплатити податок банку. Всі сплачені податки відправляються в Благодійний Фонд.`;
    }

    const colorHex = color.includes('primary') ? '#3b82f6' : 
                     color.includes('yellow') ? '#eab308' : 
                     color.includes('success') ? '#10b981' : 
                     color.includes('danger') ? '#ef4444' : 
                     color.includes('accent') ? '#a855f7' : 
                     color.includes('warning') ? '#f59e0b' : '#3b82f6';

    const content = `
        <div class="chance-popup-card" style="border-color: ${colorHex}; box-shadow: 0 0 25px ${colorHex}40; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div class="chance-icon" style="color: ${colorHex};"><i class="fa-solid ${icon}"></i></div>
            <h4 class="chance-title" style="color: #ffffff;">${title}</h4>
            <p class="chance-text" style="color: var(--text-secondary);">${desc}</p>
        </div>
    `;

    showModal("Інформація про ячейку", content, [{ text: "Зрозуміло", class: "btn-primary" }]);
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
    triggerConfetti(); // Confetti on game win!
}

// ==========================================================================
// CONFETTI CELEBRATION ENGINE
// ==========================================================================
export function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = ['#ffe259', '#ffa751', '#00f2fe', '#4facfe', '#ff007f', '#7f00ff', '#10b981'];
    const particles = [];
    
    // Shoot from left and right corners
    function createParticle(side) {
        return {
            x: side === 'left' ? 0 : canvas.width,
            y: canvas.height,
            vx: side === 'left' ? (Math.random() * 12 + 8) : -(Math.random() * 12 + 8),
            vy: -(Math.random() * 15 + 18),
            r: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0,
            gravity: 0.5
        };
    }
    
    for (let i = 0; i < 75; i++) {
        particles.push(createParticle('left'));
        particles.push(createParticle('right'));
    }
    
    let animationFrameId;
    const duration = 3500; // 3.5 seconds
    const startTime = Date.now();
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const remaining = startTime + duration - Date.now();
        if (remaining <= 0 && particles.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrameId);
            return;
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.tiltAngle += p.tiltAngleIncremental;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.tilt = Math.sin(p.tiltAngle) * 15;
            
            // Draw
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
            
            // Remove particles that go off-screen
            if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
                particles.splice(i, 1);
            }
        }
        
        animationFrameId = requestAnimationFrame(draw);
    }
    
    draw();
}


