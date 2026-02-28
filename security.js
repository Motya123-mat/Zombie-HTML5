(function() {
    'use strict';

    const SECRET_KEY = 'ZombieGinZar2026';
    const DEFAULT_PLAYER = {
        name: 'Gin Zar',
        money: 1000,
        weapons: [{ name: 'Нож кухонный', durability: -1 }], // -1 = бесконечная
        zombieKills: {
            'Зомби-страх': 0,
            'Зомби-силач': 0,
            'Зомби-хакер': 0,
            'Зомби-невидимка': 0,
            'Зомби-прыгун': 0,
            'Зомби-скелет': 0,
            'Big Zombie': 0
        },
        towerUnits: []
    };

    let _player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // XOR шифрование
    function _xorEncrypt(str, key) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    function _xorDecrypt(encryptedBase64, key) {
        try {
            const str = atob(encryptedBase64);
            let result = '';
            for (let i = 0; i < str.length; i++) {
                result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch {
            return null;
        }
    }

    // Простой хеш
    function _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
        }
        return hash.toString(16);
    }

    function _save() {
        try {
            const dataStr = JSON.stringify({ player: _player, version: 1 });
            const payload = JSON.stringify({ data: dataStr, hash: _hash(dataStr) });
            localStorage.setItem('zgz_save', _xorEncrypt(payload, SECRET_KEY));
        } catch (e) {
            console.warn('Save failed', e);
        }
    }

    function _load() {
        try {
            const encrypted = localStorage.getItem('zgz_save');
            if (!encrypted) return false;
            const decrypted = _xorDecrypt(encrypted, SECRET_KEY);
            if (!decrypted) return false;
            const container = JSON.parse(decrypted);
            if (!container.data || !container.hash) return false;
            if (_hash(container.data) !== container.hash) return false; // повреждено
            const parsed = JSON.parse(container.data);
            if (parsed.version === 1 && parsed.player) {
                // Восстанавливаем, сохраняя структуру DEFAULT_PLAYER
                _player = { ...DEFAULT_PLAYER, ...parsed.player };
                _player.zombieKills = { ...DEFAULT_PLAYER.zombieKills, ...parsed.player.zombieKills };
                _player.towerUnits = parsed.player.towerUnits || [];
                // Приводим оружие к единому формату { name, durability }
                if (!Array.isArray(_player.weapons)) {
                    _player.weapons = [];
                } else {
                    _player.weapons = _player.weapons.map(w => {
                        if (typeof w === 'string') return { name: w, durability: -1 };
                        if (w && typeof w === 'object' && w.name) {
                            return { name: w.name, durability: w.durability !== undefined ? w.durability : -1 };
                        }
                        return null;
                    }).filter(w => w !== null);
                }
                // Гарантируем наличие хотя бы ножа
                if (!_player.weapons.some(w => w.name === 'Нож кухонный')) {
                    _player.weapons.push({ name: 'Нож кухонный', durability: -1 });
                }
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    if (!_load()) {
        _player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
        _save();
    }

    const Game = {
        getMoney: () => _player.money,
        getWeapons: () => _player.weapons.map(w => ({ ...w })), // копии
        getWeaponNames: () => _player.weapons.map(w => w.name),
        hasWeapon: (weaponName) => _player.weapons.some(w => w.name === weaponName),
        getWeapon: (weaponName) => {
            const w = _player.weapons.find(w => w.name === weaponName);
            return w ? { ...w } : null;
        },
        getTowerUnits: () => _player.towerUnits.slice(),
        getName: () => _player.name,

        addMoney: (amount) => {
            if (typeof amount === 'number' && amount > 0 && Number.isFinite(amount)) {
                _player.money += amount;
                _save();
                return true;
            }
            return false;
        },
        deductMoney: (amount) => {
            if (typeof amount === 'number' && amount > 0 && _player.money >= amount) {
                _player.money -= amount;
                _save();
                return true;
            }
            return false;
        },
        // weaponObj: { name, durability }
        addWeapon: (weaponObj) => {
            if (!weaponObj || !weaponObj.name) return false;
            if (_player.weapons.some(w => w.name === weaponObj.name)) return false; // уникальность
            _player.weapons.push({ name: weaponObj.name, durability: weaponObj.durability });
            _save();
            return true;
        },
        updateWeaponDurability: (weaponName, newDurability) => {
            const weapon = _player.weapons.find(w => w.name === weaponName);
            if (weapon) {
                weapon.durability = newDurability;
                _save();
                return true;
            }
            return false;
        },
        removeWeapon: (weaponName) => {
            const index = _player.weapons.findIndex(w => w.name === weaponName);
            if (index !== -1) {
                _player.weapons.splice(index, 1);
                _save();
                return true;
            }
            return false;
        },
        incrementZombieKill: (zombieName) => {
            if (_player.zombieKills.hasOwnProperty(zombieName)) {
                _player.zombieKills[zombieName] += 1;
                _save();
                return true;
            }
            return false;
        },
        addTowerUnit: (unitName) => {
            if (typeof unitName === 'string' && !_player.towerUnits.includes(unitName)) {
                _player.towerUnits.push(unitName);
                _save();
                return true;
            }
            return false;
        },
        reset: () => {
            _player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
            _save();
        }
    };

    Object.freeze(Game);
    window.Game = Game;

    // Защита от подмены
    setInterval(() => {
        if (window.Game !== Game) {
            console.warn('Game object tampered, restoring...');
            window.Game = Game;
        }
    }, 1000);
})();