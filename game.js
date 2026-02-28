(function() {
    'use strict';

    if (typeof Game === 'undefined') {
        alert('Ошибка загрузки модуля безопасности. Перезагрузите страницу.');
        return;
    }

    // ========== КОНСТАНТЫ ==========
    const WEAPONS = Object.freeze([
        { name: 'Нож кухонный', price: 0, damage: 10, maxDurability: -1 },
        { name: 'Мачете', price: 300, damage: 50, maxDurability: 100 },
        { name: 'Топор', price: 1000, damage: 100, maxDurability: 150 },
        { name: 'Пистолет глок', price: 5000, damage: 500, maxDurability: 200 },
        { name: 'Пистолет дигл', price: 8000, damage: 600, maxDurability: 250 },
        { name: 'Автомат Калашникова', price: 16000, damage: 900, maxDurability: 300 },
        { name: 'Сюрикены', price: 30000, damage: 1300, maxDurability: 350 },
        { name: 'Дробовик', price: 50000, damage: 3000, maxDurability: 200 },
        { name: 'Пулемёт', price: 80000, damage: 5000, maxDurability: 400 }
    ]);

    const ZOMBIES = Object.freeze([
        { name: 'Зомби-страх', hp: 100, damage: 30, reward: 10 },
        { name: 'Зомби-силач', hp: 500, damage: 100, reward: 30 },
        { name: 'Зомби-хакер', hp: 1000, damage: 300, reward: 65 },
        { name: 'Зомби-невидимка', hp: 5000, damage: 1000, reward: 100 },
        { name: 'Зомби-прыгун', hp: 8000, damage: 1200, reward: 500 },
        { name: 'Зомби-скелет', hp: 10000, damage: 1800, reward: 850 },
        { name: 'Big Zombie', hp: 100000, damage: 5000, reward: 1000 }
    ]);

    const PROMO_CODES = Object.freeze({
        'KWLX927': { type: 'money', value: 5000 },
        'LSKBAOW': { type: 'money', value: 11111 },
        'MAGXWZ': { type: 'money', value: 30000 },
        'XGWWDK': { type: 'money', value: 88888 },
        'KQVDEW': { type: 'weapon', value: 'Пулемёт' },
        'KWHDBN': { type: 'weapon', value: 'Дробовик' },
        'SHDTZWM': { type: 'tower', value: 'Человек с дробовиком' },
        'USHSBWS': { type: 'tower', value: 'Человек с РПГ' }
    });

    // ========== СОСТОЯНИЕ ==========
    let battleState = {
        mode: null,
        zombies: [],
        baseHp: 5000,
        currentZombieIndex: 0,
        selectedWeapon: null,
        waveNumber: 0
    };

    // DOM-элементы
    const topBarName = document.getElementById('player-name');
    const topBarMoney = document.getElementById('money');
    const tabs = document.querySelectorAll('.tab-btn');
    const screens = document.querySelectorAll('.screen');
    const battleContent = document.getElementById('battle-content');
    const backBtn = document.getElementById('back-to-main');
    const weaponShopContainer = document.getElementById('weapon-shop');
    const inventoryContainer = document.getElementById('inventory-list');
    const zombieStatsContainer = document.getElementById('zombie-stats');
    const promoInput = document.getElementById('promo-code');
    const promoApply = document.getElementById('apply-promo');
    const promoMessage = document.getElementById('promo-message');

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function updateMoney() {
        topBarMoney.textContent = Game.getMoney();
    }

    // Переключение вкладок
    function switchTab(tabId) {
        tabs.forEach(btn => btn.classList.remove('active'));
        const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(`${tabId}-screen`);
        if (targetScreen) targetScreen.classList.add('active');

        // Обновляем содержимое при показе
        if (tabId === 'shop') renderShop();
        if (tabId === 'inventory') renderInventory();
        if (tabId === 'index') renderIndex();
    }

    // Магазин
    function renderShop() {
        weaponShopContainer.innerHTML = '';
        WEAPONS.forEach(w => {
            const card = document.createElement('div');
            card.className = 'item-card';
            const owned = Game.hasWeapon(w.name);
            card.innerHTML = `
                <strong>${w.name}</strong><br>
                💰 ${w.price}<br>
                ⚔️ ${w.damage}<br>
                🔧 ${w.maxDurability === -1 ? '∞' : w.maxDurability} ударов<br>
                <button ${owned ? 'disabled' : ''} data-weapon="${w.name}">${owned ? 'Куплено' : 'Купить'}</button>
            `;
            weaponShopContainer.appendChild(card);
        });
    }

    function handleBuyWeapon(e) {
        if (e.target.tagName !== 'BUTTON' || !e.target.dataset.weapon) return;
        const weaponName = e.target.dataset.weapon;
        const weaponData = WEAPONS.find(w => w.name === weaponName);
        if (!weaponData) return;
        if (Game.hasWeapon(weaponName)) {
            alert('Уже есть');
            return;
        }
        if (Game.deductMoney(weaponData.price)) {
            Game.addWeapon({ name: weaponName, durability: weaponData.maxDurability });
            updateMoney();
            renderShop();
            renderInventory();
        } else {
            alert('Недостаточно средств');
        }
    }

    // Инвентарь
    function renderInventory() {
        inventoryContainer.innerHTML = '';
        const weapons = Game.getWeapons();
        if (weapons.length === 0) {
            inventoryContainer.innerHTML = '<p>Пусто</p>';
        } else {
            weapons.forEach(w => {
                const wd = WEAPONS.find(wd => wd.name === w.name);
                const max = wd ? wd.maxDurability : 0;
                let durText = '';
                if (max === -1) durText = '∞';
                else durText = `${Math.floor((w.durability / max) * 100)}% (${w.durability}/${max})`;
                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `<strong>${w.name}</strong><br>🔧 ${durText}`;
                inventoryContainer.appendChild(card);
            });
        }
    }

    // ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ ИНДЕКСА ==========
    function renderIndex() {
        zombieStatsContainer.innerHTML = '';
        const kills = Game.getZombieKills();
        
        // Проверяем, что kills - это объект и не null
        if (!kills || typeof kills !== 'object') {
            zombieStatsContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
            return;
        }

        const entries = Object.entries(kills);
        if (entries.length === 0) {
            zombieStatsContainer.innerHTML = '<p>Нет убитых зомби</p>';
            return;
        }

        entries.forEach(([name, count]) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `<strong>${name}</strong><br>Убито: ${count}`;
            zombieStatsContainer.appendChild(card);
        });
    }

    // Промокоды
    function applyPromo() {
        const code = promoInput.value.trim().toUpperCase();
        const promo = PROMO_CODES[code];
        if (!promo) {
            promoMessage.textContent = '❌ Неверный код';
            return;
        }
        if (promo.type === 'money') {
            Game.addMoney(promo.value);
            promoMessage.textContent = `✅ Получено ${promo.value} монет`;
        } else if (promo.type === 'weapon') {
            const weaponName = promo.value;
            if (!Game.hasWeapon(weaponName)) {
                const wd = WEAPONS.find(w => w.name === weaponName);
                if (wd) {
                    Game.addWeapon({ name: weaponName, durability: wd.maxDurability });
                    promoMessage.textContent = `✅ Получено оружие: ${weaponName}`;
                }
            } else {
                promoMessage.textContent = `⚠️ Оружие уже есть`;
            }
        } else if (promo.type === 'tower') {
            if (!Game.getTowerUnits().includes(promo.value)) {
                Game.addTowerUnit(promo.value);
                promoMessage.textContent = `✅ Получен юнит: ${promo.value}`;
            } else {
                promoMessage.textContent = `⚠️ Юнит уже есть`;
            }
        }
        updateMoney();
        renderInventory();
        promoInput.value = '';
    }

    // Генерация волн для TD
    function generateWave(waveNum) {
        let zombies = [];
        if (waveNum < 13) {
            const patterns = [
                [{ type: 'Зомби-страх', count: 10 }],
                [{ type: 'Зомби-страх', count: 5 }, { type: 'Зомби-силач', count: 5 }],
                [{ type: 'Зомби-страх', count: 1 }, { type: 'Зомби-силач', count: 10 }],
                [{ type: 'Зомби-страх', count: 25 }],
                [{ type: 'Зомби-хакер', count: 10 }],
                [{ type: 'Зомби-хакер', count: 15 }],
                [{ type: 'Зомби-невидимка', count: 1 }, { type: 'Зомби-хакер', count: 20 }],
                [{ type: 'Зомби-невидимка', count: 5 }, { type: 'Зомби-хакер', count: 5 }],
                [{ type: 'Зомби-хакер', count: 15 }, { type: 'Зомби-невидимка', count: 10 }],
                [{ type: 'Зомби-невидимка', count: 15 }],
                [{ type: 'Зомби-невидимка', count: 5 }, { type: 'Зомби-прыгун', count: 10 }],
                [{ type: 'Зомби-прыгун', count: 5 }],
                [{ type: 'Зомби-прыгун', count: 15 }]
            ];
            const pat = patterns[waveNum] || patterns[12];
            pat.forEach(p => {
                const zt = ZOMBIES.find(z => z.name === p.type);
                for (let i = 0; i < p.count; i++) zombies.push({ ...zt, currentHp: zt.hp });
            });
        } else if (waveNum < 35) {
            let cnt = 15 + (waveNum - 13) * 3;
            for (let i = 0; i < cnt; i++) zombies.push({ ...ZOMBIES.find(z => z.name === 'Зомби-прыгун'), currentHp: ZOMBIES.find(z => z.name === 'Зомби-прыгун').hp });
        } else if (waveNum < 100) {
            let cnt = 1 + (waveNum - 35);
            for (let i = 0; i < cnt; i++) zombies.push({ ...ZOMBIES.find(z => z.name === 'Зомби-скелет'), currentHp: ZOMBIES.find(z => z.name === 'Зомби-скелет').hp });
        } else if (waveNum < 900) {
            for (let i = 0; i < 30; i++) {
                const r = Math.floor(Math.random() * 3);
                let type = r === 0 ? 'Зомби-невидимка' : r === 1 ? 'Зомби-прыгун' : 'Зомби-скелет';
                const zt = ZOMBIES.find(z => z.name === type);
                zombies.push({ ...zt, currentHp: zt.hp });
            }
        } else {
            let cnt = 1 + (waveNum - 900);
            for (let i = 0; i < cnt; i++) zombies.push({ ...ZOMBIES.find(z => z.name === 'Big Zombie'), currentHp: ZOMBIES.find(z => z.name === 'Big Zombie').hp });
        }
        return zombies;
    }

    // Управление таймерами атаки зомби (для TD)
    function clearZombieTimer(zombie) {
        if (zombie && zombie._timerId) {
            clearTimeout(zombie._timerId);
            zombie._timerId = null;
        }
    }

    function scheduleZombieAttack(zombie, onDamage) {
        if (!zombie || zombie.currentHp <= 0) return;
        clearZombieTimer(zombie);
        zombie._timerId = setTimeout(() => {
            if (zombie.currentHp > 0) {
                onDamage(zombie.damage);
                if (zombie.currentHp > 0) {
                    scheduleZombieAttack(zombie, onDamage);
                }
            }
        }, 10000);
    }

    // Использование оружия (уменьшение прочности)
    function useWeapon(weaponName) {
        const weapon = Game.getWeapon(weaponName);
        if (!weapon) return false;
        const wd = WEAPONS.find(w => w.name === weaponName);
        if (!wd) return false;
        if (weapon.durability !== -1) {
            let newDur = weapon.durability - 1;
            if (newDur <= 0) {
                Game.removeWeapon(weaponName);
                if (Game.getWeaponNames().length === 0) {
                    Game.addWeapon({ name: 'Нож кухонный', durability: -1 });
                }
                if (battleState.selectedWeapon === weaponName) {
                    const names = Game.getWeaponNames();
                    battleState.selectedWeapon = names[0] || null;
                }
            } else {
                Game.updateWeaponDurability(weaponName, newDur);
            }
        }
        renderInventory();
        return true;
    }

    // Запуск режима
    function startMode(mode) {
        if (battleState.zombies) {
            battleState.zombies.forEach(z => clearZombieTimer(z));
        }

        battleState.mode = mode;
        battleState.baseHp = 5000;
        const weaponNames = Game.getWeaponNames();
        battleState.selectedWeapon = weaponNames[0] || null;

        if (mode === 'kill25') {
            battleState.zombies = [
                ...Array(5).fill(ZOMBIES[0]),
                ...Array(5).fill(ZOMBIES[1]),
                ...Array(5).fill(ZOMBIES[2]),
                ...Array(10).fill(ZOMBIES[3])
            ].map(z => ({ ...z, currentHp: z.hp }));
            battleState.currentZombieIndex = 0;
        } else if (mode === 'cure3') {
            battleState.zombies = Array(3).fill(ZOMBIES[0]).map(z => ({ ...z, currentHp: z.hp }));
            battleState.currentZombieIndex = 0;
        } else if (mode === 'tower') {
            battleState.waveNumber = 0;
            battleState.zombies = generateWave(0);
            battleState.waveNumber = 1;
            if (battleState.zombies.length > 0) {
                scheduleZombieAttack(battleState.zombies[0], (dmg) => {
                    battleState.baseHp -= dmg;
                    if (battleState.baseHp < 0) battleState.baseHp = 0;
                    renderTDBattle();
                });
            }
        }

        switchTab('battle');
        renderBattle();
    }

    // Отрисовка боя (диспетчер)
    function renderBattle() {
        if (!battleState.mode) return;
        if (battleState.mode === 'tower') {
            renderTDBattle();
        } else {
            renderSimpleBattle();
        }
    }

    // Простые режимы
    function renderSimpleBattle() {
        const zombies = battleState.zombies;
        const idx = battleState.currentZombieIndex;

        if (idx >= zombies.length) {
            battleContent.innerHTML = `
                <h2>🎉 Победа!</h2>
                <button class="back-btn" id="back-from-battle">В меню</button>
            `;
            document.getElementById('back-from-battle')?.addEventListener('click', exitBattle);
            return;
        }

        const zombie = zombies[idx];
        const weaponNames = Game.getWeaponNames();
        if (!battleState.selectedWeapon || !weaponNames.includes(battleState.selectedWeapon)) {
            battleState.selectedWeapon = weaponNames[0] || null;
        }
        if (!battleState.selectedWeapon) {
            battleContent.innerHTML = '<p>Нет оружия</p>';
            return;
        }
        const weaponData = WEAPONS.find(w => w.name === battleState.selectedWeapon);
        if (!weaponData) return;

        let selectorHtml = '<div class="weapon-selector">';
        weaponNames.forEach(name => {
            const w = WEAPONS.find(w => w.name === name) || { damage: 0 };
            selectorHtml += `<span class="weapon-option ${battleState.selectedWeapon === name ? 'selected' : ''}" data-weapon="${name}">${name} (${w.damage})</span>`;
        });
        selectorHtml += '</div>';

        battleContent.innerHTML = `
            <div class="zombie-stats">
                <h2>${zombie.name}</h2>
                <p>❤️ ${zombie.currentHp} / ${zombie.hp}</p>
                <p>💀 Урон зомби: ${zombie.damage}</p>
            </div>
            ${selectorHtml}
            <button class="attack-btn" id="attack-btn">⚔️ АТАКОВАТЬ</button>
        `;

        document.querySelectorAll('.weapon-option').forEach(el => {
            el.addEventListener('click', (e) => {
                battleState.selectedWeapon = e.target.dataset.weapon;
                renderSimpleBattle();
            });
        });

        document.getElementById('attack-btn').addEventListener('click', () => {
            useWeapon(battleState.selectedWeapon);
            zombie.currentHp -= weaponData.damage;
            if (zombie.currentHp <= 0) {
                Game.addMoney(zombie.reward);
                Game.incrementZombieKill(zombie.name);
                battleState.currentZombieIndex++;
                updateMoney();
            }
            renderSimpleBattle();
        });
    }

    // Tower Defense
    function renderTDBattle() {
        if (battleState.baseHp <= 0) {
            battleState.zombies.forEach(z => clearZombieTimer(z));
            battleContent.innerHTML = `
                <h2>💔 Поражение</h2>
                <p>База разрушена!</p>
                <button class="back-btn" id="back-from-battle">В меню</button>
            `;
            document.getElementById('back-from-battle')?.addEventListener('click', exitBattle);
            return;
        }

        if (battleState.waveNumber > 1000 && battleState.zombies.length === 0) {
            battleContent.innerHTML = `
                <h2>🏆 Абсолютная победа!</h2>
                <p>Вы прошли 1000 волн!</p>
                <button class="back-btn" id="back-from-battle">В меню</button>
            `;
            document.getElementById('back-from-battle')?.addEventListener('click', exitBattle);
            return;
        }

        if (battleState.zombies.length === 0) {
            battleState.zombies = generateWave(battleState.waveNumber);
            battleState.waveNumber++;
            if (battleState.zombies.length > 0) {
                scheduleZombieAttack(battleState.zombies[0], (dmg) => {
                    battleState.baseHp -= dmg;
                    if (battleState.baseHp < 0) battleState.baseHp = 0;
                    renderTDBattle();
                });
            }
        }

        const zombie = battleState.zombies[0];
        const weaponNames = Game.getWeaponNames();
        if (!battleState.selectedWeapon || !weaponNames.includes(battleState.selectedWeapon)) {
            battleState.selectedWeapon = weaponNames[0] || null;
        }
        if (!battleState.selectedWeapon) {
            battleContent.innerHTML = '<p>Нет оружия</p>';
            return;
        }
        const weaponData = WEAPONS.find(w => w.name === battleState.selectedWeapon);
        if (!weaponData) return;

        let selectorHtml = '<div class="weapon-selector">';
        weaponNames.forEach(name => {
            const w = WEAPONS.find(w => w.name === name) || { damage: 0 };
            selectorHtml += `<span class="weapon-option ${battleState.selectedWeapon === name ? 'selected' : ''}" data-weapon="${name}">${name} (${w.damage})</span>`;
        });
        selectorHtml += '</div>';

        battleContent.innerHTML = `
            <h3>Волна ${battleState.waveNumber - 1}</h3>
            <p>🏰 Здоровье базы: ${battleState.baseHp}</p>
            <p>🧟 Зомби осталось: ${battleState.zombies.length}</p>
            <div class="zombie-stats">
                <strong>Текущий зомби:</strong> ${zombie.name} ❤️ ${zombie.currentHp}/${zombie.hp}
            </div>
            ${selectorHtml}
            <button class="attack-btn" id="td-attack">⚔️ Атаковать</button>
        `;

        document.querySelectorAll('.weapon-option').forEach(el => {
            el.addEventListener('click', (e) => {
                battleState.selectedWeapon = e.target.dataset.weapon;
                renderTDBattle();
            });
        });

        document.getElementById('td-attack').addEventListener('click', () => {
            clearZombieTimer(zombie);
            useWeapon(battleState.selectedWeapon);
            zombie.currentHp -= weaponData.damage;
            if (zombie.currentHp <= 0) {
                battleState.zombies.shift();
                Game.addMoney(zombie.reward);
                Game.incrementZombieKill(zombie.name);
                updateMoney();
                if (battleState.zombies.length > 0) {
                    scheduleZombieAttack(battleState.zombies[0], (dmg) => {
                        battleState.baseHp -= dmg;
                        if (battleState.baseHp < 0) battleState.baseHp = 0;
                        renderTDBattle();
                    });
                }
            } else {
                scheduleZombieAttack(zombie, (dmg) => {
                    battleState.baseHp -= dmg;
                    if (battleState.baseHp < 0) battleState.baseHp = 0;
                    renderTDBattle();
                });
            }
            renderTDBattle();
        });
    }

    function exitBattle() {
        if (battleState.zombies) {
            battleState.zombies.forEach(z => clearZombieTimer(z));
        }
        battleState.mode = null;
        switchTab('main');
    }

    function init() {
        updateMoney();
        topBarName.textContent = Game.getName();

        tabs.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        weaponShopContainer.addEventListener('click', handleBuyWeapon);
        promoApply.addEventListener('click', applyPromo);

        document.querySelector('[data-mode="kill25"]').addEventListener('click', () => startMode('kill25'));
        document.querySelector('[data-mode="cure3"]').addEventListener('click', () => startMode('cure3'));
        document.querySelector('[data-mode="tower"]').addEventListener('click', () => startMode('tower'));

        backBtn.addEventListener('click', exitBattle);

        renderShop();
        renderInventory();
        renderIndex();
    }

    document.addEventListener('DOMContentLoaded', init);
})();