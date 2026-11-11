var SAVE_KEY = 'emberwood-save-v1';
var SAVE_SCHEMA = 1;

function defaultQuest() {
    return { id: 'goblins', stage: 0, progress: 0, goal: 5, points: 0 };
}

function buildSavePayload(registry) {
    var hero = registry.get('hero');
    var quest = registry.get('quest');
    var zone = registry.get('zone') || 'haven';
    var playerX = registry.get('playerX');
    var playerY = registry.get('playerY');
    var interiorId = registry.get('interiorId');
    if (!hero) {
        return null;
    }
    return {
        schema: SAVE_SCHEMA,
        savedAt: Date.now(),
        zone: zone,
        playerX: typeof playerX === 'number' ? playerX : null,
        playerY: typeof playerY === 'number' ? playerY : null,
        interiorId: interiorId || null,
        hero: JSON.parse(JSON.stringify(hero)),
        quest: JSON.parse(JSON.stringify(quest || defaultQuest()))
    };
}

function writeSave(registry) {
    var payload = buildSavePayload(registry);
    if (!payload || typeof localStorage === 'undefined') {
        return false;
    }
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
        return true;
    } catch (err) {
        return false;
    }
}

function readSave() {
    var raw;
    var data;
    if (typeof localStorage === 'undefined') {
        return null;
    }
    try {
        raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            return null;
        }
        data = JSON.parse(raw);
    } catch (err) {
        return null;
    }
    if (!data || typeof data !== 'object') {
        return null;
    }
    if (typeof data.schema === 'number' && data.schema > SAVE_SCHEMA) {
        return { tooNew: true };
    }
    if (!data.hero || !data.quest) {
        return null;
    }
    return data;
}

function clearSave() {
    if (typeof localStorage === 'undefined') {
        return;
    }
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (err) {
        /* ignore */
    }
}

function hasSave() {
    var data = readSave();
    return !!(data && data.hero && !data.tooNew);
}

function exportSaveJson(registry) {
    var payload = buildSavePayload(registry);
    return payload ? JSON.stringify(payload, null, 2) : '';
}

function importSaveJson(text) {
    var data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        return null;
    }
    if (!data || !data.hero || !data.quest) {
        return null;
    }
    if (typeof data.schema === 'number' && data.schema > SAVE_SCHEMA) {
        return { tooNew: true };
    }
    data.schema = data.schema || SAVE_SCHEMA;
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
        return null;
    }
    return data;
}
