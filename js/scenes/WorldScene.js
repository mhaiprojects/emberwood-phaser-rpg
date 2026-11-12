/* Author movement as tiles/sec at gameSpeed 1; GameClock converts to px/sec. */
var WALK_TILES_PER_SEC = 90 / 16;
var RUN_TILES_PER_SEC = 180 / 16;
/* Legacy px aliases (gameSpeed 1, TILE_SIZE 16) for any remaining callers. */
var WALK_SPEED = WALK_TILES_PER_SEC * 16;
var RUN_SPEED = RUN_TILES_PER_SEC * 16;
/* Cap for mob move (wander + chase); actual speeds via mobMoveSpeed(def) in tiles/sec. */
var MOB_MOVE_TILES_PER_SEC = WALK_TILES_PER_SEC / 2;
var MOB_MOVE_SPEED = MOB_MOVE_TILES_PER_SEC * 16;
var RUN_ENERGY_MAX = 100;
var RUN_DRAIN_PER_SEC = 25;
var RUN_RESTORE_PER_SEC = 15;
var OW_COMBAT_TICK_SEC = 0.6;
var HP_REGEN_BASE_SEC = 4.5;
var HP_REGEN_TOWN_SEC = 1.8;
var HP_REGEN_CAMP_SEC = 1.1;
var MOB_RESPAWN_SEC = 18;
var DEST_X_COLOR = 0xf8ff38;
var DEST_X_ARM = 8;
var LONG_PRESS_MS = 2000;
var LONG_PRESS_SLOP = 8;
var MOB_RESPAWN_MS = MOB_RESPAWN_SEC * 1000;
var DOOR_ANIM_MS = 220;
var DOOR_OPEN_SCALE_X = 0.18;
var TALK_AWAY_PX = 40;
var TALK_WALL_PX = 48;
var FISH_RANGE = 28;
var NPC_WANDER_CHANCE = 80;
var NPC_WANDER_SPEED = 12;
var NPC_LEASH_PX = 16;
/* Chebyshev (king-move) tiles from spawn; wander / agro / fight chase share this leash. */
var MOB_LEASH_TILES = 4;
var NPC_BUSY_PX = 32;
var NPC_FACE_ORDER = ['down', 'left', 'right', 'up'];
var FLEE_PUSH_PX = 32;
var FLEE_GRACE_MS = 1100;
var COLLIDE_TILES = [
    TILE.WATER, TILE.TREE, TILE.ROCK, TILE.SHRINE,
    TILE.STALL, TILE.RANGE, TILE.ANVIL, TILE.BOOTH, TILE.FURNACE,
    TILE.BOAT, TILE.TOMB, TILE.DOOR, TILE.WALL
];
var GROUND_FIRE_MS = 45000;
var STATION_RANGE = 28;
var MELEE_ENGAGE_PX = 24;
var LOOT_PICKUP_PX = 12;
var GRAVE_RANGE_PX = 28;
var HP_REGEN_BASE_MS = HP_REGEN_BASE_SEC * 1000;
var HP_REGEN_TOWN_MS = HP_REGEN_TOWN_SEC * 1000;
var HP_REGEN_CAMP_MS = HP_REGEN_CAMP_SEC * 1000;
/* 5 tiles at TILE_SIZE 16 (Euclidean px, same style as weapon ranges). */
var CAMPFIRE_REGEN_RANGE = (typeof TILE_SIZE === 'number' ? TILE_SIZE : 16) * 5;
var COLLISION_DEBUG_FILL = 0xf38630;
var COLLISION_DEBUG_FACE = 0xffff66;

var WorldScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function WorldScene() {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },

    create: function () {
        var bootHero;
        Keys.init();
        bootHero = this.registry.get('hero');
        if (bootHero && window.GameClock && typeof GameClock.applyFromHero === 'function') {
            GameClock.applyFromHero(bootHero);
        }
        this.zoneId = this.registry.get('zone') || 'haven';
        this.interiorId = null;
        this.walkTarget = null;
        this.walkPath = null;
        this.travelZoneId = null;
        this.walkBlocked = false;
        this.pathCheckAt = 0;
        /* Pause auto-attack / auto-retaliate chase while player click-walk is active. */
        this.playerClickWalkActive = false;
        this.tileGrid = null;
        this.engageTarget = null;
        this.talkTarget = null;
        this.fishTarget = null;
        this.fishAction = null;
        this.chopTarget = null;
        this.chopAction = null;
        this.mineTarget = null;
        this.mineAction = null;
        this.oreNodeMarkers = {};
        this.shaftMarkers = [];
        this.zoneBorderLabels = [];
        this.mineFx = null;
        this.depletedTiles = {};
        this.dialogueNpc = null;
        this.exitLock = false;
        this.encounterLock = false;
        this.engageGrace = 0;
        this.lastFought = null;
        this.lastFacing = 'down';
        this.groundLoot = [];
        this.groundFires = [];
        this.gravestones = [];
        this.lootZoneState = {};
        this.graveZoneState = {};
        this.mobZoneState = {};
        this.unlockedDoors = {};
        this.doorFx = {};
        this.lockChatUntil = 0;
        this.shortcutChatUntil = 0;
        this.shortcutLockUntil = 0;
        this.shaftChatUntil = 0;
        this.shaftChatKey = '';
        this.dungeonFloor = this.registry.get('dungeonFloor') || 0;
        this.dungeonMeta = null;
        this._regenAcc = 0;
        this.lootTarget = null;
        this.graveTarget = null;
        this.ensureGroundFireTexture();
        this.ensureGravestoneTexture();

        this.marker = this.add.rectangle(0, 0, 6, 6, DEST_X_COLOR).setVisible(false).setDepth(8);
        this.destX = this.makeDestX();
        this.pathGfx = this.add.graphics();
        this.pathGfx.setDepth(4);
        this.pathGfx.setVisible(false);
        this.collisionDebug = false;
        this.collisionDebugTileCount = 0;
        this.collisionDebugGfx = this.add.graphics();
        this.collisionDebugGfx.setDepth(20);
        this.collisionDebugGfx.setVisible(false);
        this.combatRangeGfx = this.add.graphics();
        this.combatRangeGfx.setDepth(4);
        this.combatRangeGfx.setVisible(true);
        this.effectRadiusGfx = this.add.graphics();
        this.effectRadiusGfx.setDepth(4);
        this.effectRadiusGfx.setVisible(true);
        this.npcs = this.physics.add.group({ immovable: true });
        this.mobs = this.physics.add.group();
        this.floatLabels = [];

        var spawn0 = defaultWorldSpawn();
        this.player = this.physics.add.sprite(spawn0.x, spawn0.y, 'player', 0);
        this.player.setScale(PLAYER_WORLD_SCALE);
        applyPlayerWorldBody(this.player);
        this.player.setDepth(6);
        /* Player phases through NPCs in physics; pathfinding still avoids their tiles. */
        this.nameplate = this.add.text(spawn0.x, spawn0.y - 14, 'Adventurer', {
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            fontSize: '8px',
            color: '#ffe08a'
        }).setOrigin(0.5, 1).setDepth(7);

        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.roundPixels = true;

        this.longPressTimer = null;
        this.longPressPtr = null;
        this.pendingLootTake = null;
        this.lootTarget = null;
        this.input.on('pointerdown', this.onClick, this);
        this.input.on('pointerup', this.onPointerUp, this);
        this.input.on('pointerupoutside', this.onPointerUp, this);
        this.input.on('pointermove', this.onLongPressMove, this);
        if (this.input.mouse && this.input.mouse.disableContextMenu) {
            this.input.mouse.disableContextMenu();
        }
        this.sys.events.off('wake', this.wake, this);
        this.sys.events.on('wake', this.wake, this);

        var resumeBoot = this.registry.get('resumeAt');
        var resumeInterior = resumeBoot && resumeBoot.interiorId ? resumeBoot.interiorId : null;
        var resumeDungeon = this.registry.get('dungeonFloor') || 0;
        var fromSave = !!(resumeBoot || this.registry.get('worldSave'));
        var facing = this.registry.get('facing');
        if (resumeBoot && typeof resumeBoot.dungeonFloor === 'number') {
            resumeDungeon = resumeBoot.dungeonFloor;
        }
        if (this.registry.get('worldSave') && typeof this.importWorldSave === 'function') {
            this.importWorldSave(this.registry.get('worldSave'));
            this.registry.set('worldSave', null);
        }
        if (facing === 'left' || facing === 'right' || facing === 'up' || facing === 'down') {
            this.lastFacing = facing;
        }
        if (this.zoneId === 'dungeon' && !(resumeDungeon > 0)) {
            this.zoneId = 'darkmine';
            this.registry.set('zone', 'darkmine');
        }
        if (resumeDungeon > 0) {
            this.enterZone(this.zoneId === 'dungeon' ? 'darkmine' : this.zoneId, null, {
                fromSave: true,
                preserveResume: true
            });
            this.enterDungeonFloor(resumeDungeon, { from: 'save' });
        } else if (resumeInterior && typeof interiorById === 'function' && interiorById(resumeInterior)) {
            this.enterZone(this.zoneId === 'dungeon' ? 'darkmine' : this.zoneId, null, {
                fromSave: true,
                preserveResume: true
            });
            this.enterInterior(resumeInterior, { from: 'save' });
        } else {
            this.enterZone(this.zoneId === 'dungeon' ? 'darkmine' : this.zoneId, null, {
                fromSave: fromSave
            });
        }
        this.applyIdleFacing();
        this.refreshHud();
        this.applyDayNightTint();
        if (this._autosaveTimer) {
            this._autosaveTimer.remove(false);
        }
        this._autosaveTimer = this.time.addEvent({
            delay: 12000,
            loop: true,
            callback: function () {
                if (window.Hud && Hud.saveGame && !this.encounterLock) {
                    Hud.saveGame();
                }
            },
            callbackScope: this
        });
        this.engageGrace = this.time.now + 800;
        if (this.registry.get('respawnAfterDeath')) {
            this.registry.set('respawnAfterDeath', false);
            Hud.log('You wake in Emberhaven, barely standing.');
        } else if (fromSave) {
            Hud.log('Welcome back. Progress restored.');
        } else {
            Hud.log('You arrive in Emberhaven. WASD or arrows to walk, Ctrl to run, or click the ground.');
            Hud.log('Open Inventory (F1) for food. Bury bones, Trade with Mira, Fish/Chop/Mine, or Bank at Elise.');
            Hud.log('The Guildmaster by the courtyard has work.');
        }
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
    },

    respawnInHaven: function () {
        var spawn = defaultWorldSpawn();
        this.encounterLock = false;
        this.exitLock = false;
        this.lastFought = null;
        this.engageTarget = null;
        this.talkTarget = null;
        this.graveTarget = null;
        this.clearGather();
        this.registry.set('resumeAt', null);
        this.registry.set('interiorId', null);
        this.registry.set('dungeonFloor', 0);
        if (this.interiorId || this.zoneId !== 'haven') {
            this.enterZone('haven', null, { fromSave: true });
        }
        this.placePlayer(spawn.x, spawn.y);
        this.clearWalk();
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
    },

    moveFlags: function () {
        if (window.Hud && Hud.mode !== 'world') {
            return { left: false, right: false, up: false, down: false };
        }
        return {
            left: Keys.left(),
            right: Keys.right(),
            up: Keys.up(),
            down: Keys.downArrow()
        };
    },

    placePlayer: function (x, y) {
        if (this.player.body) {
            this.player.body.reset(x, y);
            applyPlayerWorldBody(this.player);
            this.player.body.stop();
            this.player.body.embedded = false;
            this.player.body.blocked.none = true;
            this.player.body.blocked.up = false;
            this.player.body.blocked.down = false;
            this.player.body.blocked.left = false;
            this.player.body.blocked.right = false;
        } else {
            this.player.setPosition(x, y);
        }
        if (this.cameras && this.cameras.main) {
            this.cameras.main.centerOn(x, y);
        }
    },

    applyIdleFacing: function () {
        var face = this.lastFacing || 'down';
        if (face === 'left') {
            this.player.setFrame(1);
            this.player.flipX = false;
        } else if (face === 'right') {
            this.player.setFrame(1);
            this.player.flipX = true;
        } else if (face === 'up') {
            this.player.setFrame(2);
            this.player.flipX = false;
        } else {
            this.player.setFrame(0);
            this.player.flipX = false;
        }
    },

    applyNpcFacing: function (npc) {
        if (!npc) {
            return;
        }
        var vx = npc.body ? npc.body.velocity.x : 0;
        var vy = npc.body ? npc.body.velocity.y : 0;
        if (vx < -4) {
            npc.lastFacing = 'left';
        } else if (vx > 4) {
            npc.lastFacing = 'right';
        } else if (vy < -4) {
            npc.lastFacing = 'up';
        } else if (vy > 4) {
            npc.lastFacing = 'down';
        }
        npc.flipX = (npc.lastFacing === 'right');
    },

    applyTilemap: function (grid) {
        this.tileGrid = grid;
        var data = flattenMap(grid);
        this.map = this.make.tilemap({ data: data, tileWidth: 16, tileHeight: 16 });
        var tiles = this.map.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0, 1);
        this.ground = this.map.createLayer(0, tiles, 0, 0);
        this.ground.setCollision(COLLIDE_TILES);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.groundCollider = this.physics.add.collider(this.player, this.ground);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(PLAYER_WORLD_SCALE);
        applyPlayerWorldBody(this.player);
        this.applyUnlockedDoors();
        this.applyDragonDenGate();
        this.applyCollisionDebug();
    },

    applyDragonDenGate: function () {
        var hero;
        var gate;
        var i;
        var cell;
        if (!this.tileGrid || this.zoneId !== (DRAGON_DEN_GATE && DRAGON_DEN_GATE.zoneId)) {
            return;
        }
        hero = this.registry.get('hero');
        if (typeof applyDragonDenGateState === 'function') {
            applyDragonDenGateState(this.tileGrid, this.zoneId, hero);
        }
        gate = DRAGON_DEN_GATE;
        if (!gate || !this.ground) {
            return;
        }
        if (typeof isDragonDenOpen === 'function' && isDragonDenOpen(hero)) {
            for (i = 0; i < gate.seal.length; i++) {
                cell = gate.seal[i];
                this.setTileIndex(cell.x, cell.y, TILE.PATH);
            }
            this.setTileIndex(gate.cave.x, gate.cave.y, TILE.PATH);
        } else {
            for (i = 0; i < gate.seal.length; i++) {
                cell = gate.seal[i];
                this.setTileIndex(cell.x, cell.y, TILE.ROCK);
            }
            this.setTileIndex(gate.boulder.x, gate.boulder.y, TILE.ROCK);
        }
    },

    setCollisionDebug: function (on) {
        this.collisionDebug = !!on;
        this.applyCollisionDebug();
        return this.collisionDebug;
    },

    applyArcadeBodyDebug: function (on) {
        var phys = this.physics && this.physics.world;
        if (!phys) {
            return;
        }
        phys.drawDebug = !!on;
        if (on) {
            if (!phys.debugGraphic || !phys.debugGraphic.scene) {
                if (typeof phys.createDebugGraphic === 'function') {
                    phys.createDebugGraphic();
                } else {
                    phys.debugGraphic = this.add.graphics().setDepth(1000);
                }
            }
            phys.debugGraphic.setVisible(true);
        } else if (phys.debugGraphic) {
            phys.debugGraphic.clear();
            phys.debugGraphic.setVisible(false);
        }
    },

    applyCollisionDebug: function () {
        var on = !!this.collisionDebug;
        var gfx = this.collisionDebugGfx;
        if (!gfx || !gfx.scene) {
            gfx = this.add.graphics();
            gfx.setDepth(20);
            this.collisionDebugGfx = gfx;
        }
        gfx.clear();
        this.collisionDebugTileCount = 0;
        this.applyArcadeBodyDebug(on);
        if (!on) {
            gfx.setVisible(false);
            return;
        }
        gfx.setVisible(true);
        gfx.fillStyle(COLLISION_DEBUG_FILL, 0.32);
        gfx.lineStyle(1, COLLISION_DEBUG_FACE, 0.85);
        var count = 0;
        if (this.ground && this.ground.forEachTile) {
            this.ground.forEachTile(function (tile) {
                if (!tile || !tile.collides) {
                    return;
                }
                gfx.fillRect(tile.pixelX, tile.pixelY, tile.width, tile.height);
                gfx.strokeRect(tile.pixelX, tile.pixelY, tile.width, tile.height);
                count += 1;
            });
        }
        this.collisionDebugTileCount = count;
    },

    doorUnlockKey: function (tx, ty) {
        return (this.zoneId || '') + ':' + tx + ',' + ty;
    },

    applyUnlockedDoors: function () {
        this.unlockedDoors = this.unlockedDoors || {};
        this.doorFx = this.doorFx || {};
        // Unlocked doors stay TILE.DOOR until opened this visit so open/close can animate.
    },

    playerNearDoor: function (tx, ty) {
        if (!this.player) {
            return false;
        }
        var at = worldToTile(this.player.x, this.player.y);
        return Math.abs(at.tx - tx) + Math.abs(at.ty - ty) <= 1;
    },

    clearDoorFx: function () {
        this.doorFx = this.doorFx || {};
        var key;
        for (key in this.doorFx) {
            var fx = this.doorFx[key];
            if (fx && fx.tween && fx.tween.stop) {
                fx.tween.stop();
            }
            if (fx && fx.leaf && fx.leaf.destroy) {
                fx.leaf.destroy();
            }
        }
        this.doorFx = {};
    },

    ensureDoorLeaf: function (tx, ty) {
        this.doorFx = this.doorFx || {};
        var key = this.doorUnlockKey(tx, ty);
        var fx = this.doorFx[key];
        if (fx && fx.leaf && fx.leaf.active) {
            return fx;
        }
        if (fx && fx.leaf && fx.leaf.destroy) {
            fx.leaf.destroy();
        }
        var size = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
        var leaf = this.add.rectangle(tx * size + 3, ty * size + size / 2, 10, 14, 0x7a4e28);
        leaf.setOrigin(0, 0.5);
        leaf.setDepth(5);
        if (leaf.setStrokeStyle) {
            leaf.setStrokeStyle(1, 0x503018);
        }
        this.doorFx[key] = { tx: tx, ty: ty, leaf: leaf, state: 'closed', tween: null };
        return this.doorFx[key];
    },

    playDoorOpen: function (tx, ty) {
        var fx = this.ensureDoorLeaf(tx, ty);
        var self = this;
        var key = this.doorUnlockKey(tx, ty);
        if (fx.state === 'opening') {
            return;
        }
        if (fx.state === 'open' && fx.leaf.scaleX <= DOOR_OPEN_SCALE_X + 0.02) {
            return;
        }
        if (fx.tween && fx.tween.stop) {
            fx.tween.stop();
        }
        fx.state = 'opening';
        fx.tween = this.tweens.add({
            targets: fx.leaf,
            scaleX: DOOR_OPEN_SCALE_X,
            duration: DOOR_ANIM_MS,
            ease: 'Sine.easeIn',
            onComplete: function () {
                if (!self.doorFx || !self.doorFx[key]) {
                    return;
                }
                fx.state = 'open';
                fx.tween = null;
            }
        });
    },

    finishDoorClose: function (tx, ty) {
        var key = this.doorUnlockKey(tx, ty);
        if (this.playerNearDoor(tx, ty)) {
            this.playDoorOpen(tx, ty);
            return;
        }
        if (this.tileGrid && this.tileGrid[ty] && this.tileGrid[ty][tx] === TILE.PATH) {
            this.tileGrid[ty][tx] = TILE.DOOR;
            if (this.ground) {
                this.ground.putTileAt(TILE.DOOR, tx, ty);
            }
        }
        var fx = this.doorFx && this.doorFx[key];
        if (fx && fx.leaf && fx.leaf.destroy) {
            fx.leaf.destroy();
        }
        if (this.doorFx) {
            delete this.doorFx[key];
        }
    },

    playDoorClose: function (tx, ty) {
        var fx = this.ensureDoorLeaf(tx, ty);
        var self = this;
        var key = this.doorUnlockKey(tx, ty);
        if (fx.state === 'closing' || this.playerNearDoor(tx, ty)) {
            return;
        }
        if (fx.tween && fx.tween.stop) {
            fx.tween.stop();
        }
        fx.state = 'closing';
        fx.tween = this.tweens.add({
            targets: fx.leaf,
            scaleX: 1,
            duration: DOOR_ANIM_MS,
            ease: 'Sine.easeOut',
            onComplete: function () {
                if (!self.doorFx || !self.doorFx[key]) {
                    return;
                }
                self.finishDoorClose(tx, ty);
            }
        });
    },

    updateDoors: function () {
        if (!this.doorFx || this.encounterLock || this.interiorId) {
            return;
        }
        var key;
        for (key in this.doorFx) {
            var fx = this.doorFx[key];
            if (!fx || fx.state === 'opening' || fx.state === 'closing') {
                continue;
            }
            if (fx.state === 'open' && !this.playerNearDoor(fx.tx, fx.ty)) {
                this.playDoorClose(fx.tx, fx.ty);
            }
        }
    },

    unlockDoor: function (tx, ty) {
        if (!this.tileGrid || !this.tileGrid[ty] || this.tileGrid[ty][tx] !== TILE.DOOR) {
            return false;
        }
        this.ensureDoorLeaf(tx, ty);
        this.tileGrid[ty][tx] = TILE.PATH;
        if (this.ground) {
            this.ground.putTileAt(TILE.PATH, tx, ty);
        }
        this.unlockedDoors = this.unlockedDoors || {};
        this.unlockedDoors[this.doorUnlockKey(tx, ty)] = true;
        this.playDoorOpen(tx, ty);
        return true;
    },

    handleLockedDoor: function (tx, ty) {
        var hero = this.registry.get('hero');
        var keyId = (LOCKED_DOOR && LOCKED_DOOR.keyId) || 'key';
        var known = !!(this.unlockedDoors && this.unlockedDoors[this.doorUnlockKey(tx, ty)]);
        if (!known && !heroHasItem(hero, keyId)) {
            var now = this.time ? this.time.now : 0;
            if (now && now < this.lockChatUntil) {
                return;
            }
            this.lockChatUntil = now + 800;
            Hud.log('The door is locked.');
            return;
        }
        if (this.unlockDoor(tx, ty)) {
            Hud.log(known ? 'You open the door.' : 'You unlock the door.');
        }
    },

    tryLockedDoor: function () {
        if (this.encounterLock || this.interiorId || !this.tileGrid) {
            return;
        }
        if (window.Hud && Hud.mode && Hud.mode !== 'world') {
            return;
        }
        var flags = this.moveFlags();
        var walking = flags.left || flags.right || flags.up || flags.down || !!this.walkTarget;
        if (!walking) {
            return;
        }
        var at = worldToTile(this.player.x, this.player.y);
        var spots = [
            { tx: at.tx, ty: at.ty },
            { tx: at.tx, ty: at.ty - 1 },
            { tx: at.tx, ty: at.ty + 1 },
            { tx: at.tx - 1, ty: at.ty },
            { tx: at.tx + 1, ty: at.ty }
        ];
        var i;
        for (i = 0; i < spots.length; i++) {
            var tx = spots[i].tx;
            var ty = spots[i].ty;
            if (!inBounds(tx, ty) || !this.tileGrid[ty] || this.tileGrid[ty][tx] !== TILE.DOOR) {
                continue;
            }
            this.handleLockedDoor(tx, ty);
            return;
        }
    },

    handleAgilityShortcut: function (shortcut) {
        if (!shortcut || !this.player) {
            return;
        }
        var now = this.time ? this.time.now : 0;
        if (now && now < this.shortcutLockUntil) {
            return;
        }
        var at = worldToTile(this.player.x, this.player.y);
        var flags = this.moveFlags();
        var towardNorth = flags.up || !!(this.walkTarget && this.walkTarget.y < this.player.y - 2);
        var towardSouth = flags.down || !!(this.walkTarget && this.walkTarget.y > this.player.y + 2);
        if (at.ty > shortcut.ty && !towardNorth) {
            return;
        }
        if (at.ty < shortcut.ty && !towardSouth) {
            return;
        }
        if (at.tx !== shortcut.tx) {
            return;
        }
        var hero = this.registry.get('hero');
        var need = shortcut.level || 1;
        var have = typeof heroSkillLevel === 'function'
            ? heroSkillLevel(hero, shortcut.skill || 'agility')
            : 1;
        if (have < need) {
            if (now && now < this.shortcutChatUntil) {
                return;
            }
            this.shortcutChatUntil = now + 800;
            Hud.log('You need Agility level ' + need + ' to squeeze through.');
            return;
        }
        var landTy = at.ty > shortcut.ty ? shortcut.ty - 1 : shortcut.ty + 1;
        var land = tileCenter(shortcut.tx, landTy);
        this.placePlayer(land.x, land.y);
        this.player.body.setVelocity(0, 0);
        this.clearWalk();
        this.shortcutLockUntil = now + 250;
        Hud.log('You squeeze through the gap.');
    },

    tryAgilityShortcut: function () {
        if (this.encounterLock || this.interiorId || !this.tileGrid) {
            return;
        }
        if (window.Hud && Hud.mode && Hud.mode !== 'world') {
            return;
        }
        var shortcut = typeof agilityShortcutAt === 'function'
            ? agilityShortcutAt(
                AGILITY_SHORTCUT && AGILITY_SHORTCUT.tx,
                AGILITY_SHORTCUT && AGILITY_SHORTCUT.ty,
                this.zoneId
            )
            : (AGILITY_SHORTCUT && AGILITY_SHORTCUT.zoneId === this.zoneId ? AGILITY_SHORTCUT : null);
        if (!shortcut) {
            return;
        }
        var flags = this.moveFlags();
        var walking = flags.left || flags.right || flags.up || flags.down || !!this.walkTarget;
        if (!walking) {
            return;
        }
        var at = worldToTile(this.player.x, this.player.y);
        var spots = [
            { tx: at.tx, ty: at.ty },
            { tx: at.tx, ty: at.ty - 1 },
            { tx: at.tx, ty: at.ty + 1 },
            { tx: at.tx - 1, ty: at.ty },
            { tx: at.tx + 1, ty: at.ty }
        ];
        var i;
        for (i = 0; i < spots.length; i++) {
            if (spots[i].tx !== shortcut.tx || spots[i].ty !== shortcut.ty) {
                continue;
            }
            this.handleAgilityShortcut(shortcut);
            return;
        }
    },

    lockExits: function () {
        this.exitLock = true;
        var self = this;
        this.time.delayedCall(400, function () {
            self.exitLock = false;
        });
    },

    enterZone: function (zoneId, fromDir, opts) {
        var zone = ZONES[zoneId];
        var pendingTravel;
        var resume;
        var spawn;
        opts = opts || {};
        if (!zone) {
            return;
        }
        pendingTravel = this.travelZoneId;
        if (Hud.hideDialogue) {
            Hud.hideDialogue();
        }
        if (Hud.hideShop) {
            Hud.hideShop();
        }
        if (Hud.hideBank) {
            Hud.hideBank();
        }
        this.cancelLongPress();
        if (Hud.hideContextMenu) {
            Hud.hideContextMenu();
        }
        var leavingInterior = !!this.interiorId;
        if (!leavingInterior) {
            if (fromDir && this.zoneId && this.zoneId !== zoneId) {
                this.snapshotMobs();
            } else if (!fromDir && !opts.fromSave) {
                this.clearMobZoneState();
                this.lootZoneState = {};
                this.graveZoneState = {};
                this.depletedTiles = {};
            }
            if (this.zoneId && this.zoneId !== zoneId) {
                this.snapshotLoot();
                this.snapshotGraves({ force: true });
            }
        }
        this.interiorId = null;
        this.zoneId = zoneId;
        this.registry.set('zone', zoneId);
        this.noteVisitedZone(zoneId);
        this.clearWorldObjects();

        var neighbors = zoneNeighbors(zone);
        this.dungeonFloor = 0;
        this.dungeonMeta = null;
        this.registry.set('dungeonFloor', 0);
        this.applyTilemap(generateMap(zone.seed, zone.biome, neighbors, zoneId));
        this.reapplyDepletedTiles();

        resume = this.registry.get('resumeAt');
        if (!fromDir && !opts.preserveResume && resume
            && typeof resume.x === 'number' && typeof resume.y === 'number') {
            spawn = { x: resume.x, y: resume.y };
            this.registry.set('resumeAt', null);
        } else {
            spawn = fromDir ? spawnPointForEntry(fromDir) : defaultWorldSpawn();
        }
        this.placePlayer(spawn.x, spawn.y);
        this.clearWalk();

        this.spawnPeople(zoneId);
        this.restoreLoot(zoneId);
        this.restoreGraves(zoneId);
        this.spawnZoneCampfires(zoneId);
        this.refreshOreNodeMarkers();
        this.refreshShaftMarkers();
        this.refreshZoneBorderLabels();
        this.buildBiomeFx();
        this.applyDayNightTint();
        this.playZoneMusic();
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        if (typeof this.refreshWildernessFlag === 'function') {
            this.refreshWildernessFlag();
        }
        if (!opts.fromSave || fromDir) {
            Hud.log(typeof zoneEnterChat === 'function'
                ? zoneEnterChat(zoneId)
                : ('You enter ' + zone.name + '.'));
        }
        if (pendingTravel && pendingTravel === zoneId) {
            this.travelZoneId = null;
        } else if (pendingTravel) {
            this.walkTowardZone(pendingTravel);
        }
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
    },

    enterInterior: function (interiorId, opts) {
        var spec = interiorById(interiorId);
        var resume;
        var spawn;
        opts = opts || {};
        if (!spec) {
            return;
        }
        if (spec.dungeon || interiorId === 'shaft') {
            this.enterDungeonFloor(this.rememberedDungeonEscapeFloor(), { from: 'surface' });
            return;
        }
        if (this.interiorId === interiorId) {
            return;
        }
        this.cancelLongPress();
        if (Hud.hideContextMenu) {
            Hud.hideContextMenu();
        }
        if (Hud.hideShop) {
            Hud.hideShop();
        }
        if (Hud.hideBank) {
            Hud.hideBank();
        }
        if (!this.interiorId) {
            this.snapshotMobs();
            this.snapshotLoot();
            this.snapshotGraves({ force: true });
        }
        this.interiorId = interiorId;
        this.clearWorldObjects();
        this.applyTilemap(generateInterior(interiorId));
        this.reapplyDepletedTiles();
        resume = this.registry.get('resumeAt');
        if (opts.from === 'save' && resume
            && typeof resume.x === 'number' && typeof resume.y === 'number') {
            spawn = { x: resume.x, y: resume.y };
            this.registry.set('resumeAt', null);
        } else {
            spawn = interiorSpawnPoint();
        }
        this.placePlayer(spawn.x, spawn.y);
        this.clearWalk();
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        if (opts.from === 'save') {
            Hud.log('You resume inside ' + spec.name + '.');
        } else if (spec.enterChat) {
            Hud.log(spec.enterChat);
        } else {
            Hud.log('You enter ' + spec.name + '.');
        }
        this.lockExits();
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
    },

    enterDungeonFloor: function (floor, opts) {
        var built;
        var spawn;
        var resume;
        var self = this;
        opts = opts || {};
        floor = Math.max(1, floor | 0);
        this.cancelLongPress();
        if (Hud.hideContextMenu) {
            Hud.hideContextMenu();
        }
        if (Hud.hideShop) {
            Hud.hideShop();
        }
        if (Hud.hideBank) {
            Hud.hideBank();
        }
        if (this.zoneId !== 'dungeon') {
            this.snapshotMobs();
            this.snapshotLoot();
            this.snapshotGraves({ force: true });
        }
        this.interiorId = null;
        this.dungeonFloor = floor;
        this.zoneId = 'dungeon';
        this.registry.set('zone', 'dungeon');
        this.registry.set('dungeonFloor', floor);
        this.clearWorldObjects();
        built = typeof generateDungeonFloor === 'function'
            ? generateDungeonFloor(floor)
            : { grid: generateInterior('shaft'), meta: {} };
        this.dungeonMeta = built.meta || {};
        this.applyTilemap(built.grid);
        this.reapplyDepletedTiles();
        resume = this.registry.get('resumeAt');
        if (opts.from === 'save' && resume
            && typeof resume.x === 'number' && typeof resume.y === 'number') {
            spawn = { x: resume.x, y: resume.y };
            this.registry.set('resumeAt', null);
        } else if (opts.from === 'down' && this.dungeonMeta.stairsDown) {
            spawn = tileCenter(this.dungeonMeta.stairsDown.x, this.dungeonMeta.stairsDown.y + 1);
        } else if (this.dungeonMeta.stairsUp) {
            spawn = tileCenter(this.dungeonMeta.stairsUp.x, this.dungeonMeta.stairsUp.y - 1);
        } else {
            spawn = interiorSpawnPoint();
        }
        this.placePlayer(spawn.x, spawn.y);
        this.clearWalk();
        this.spawnDungeonMobs(floor);
        if (this.dungeonMeta.campfire) {
            this.spawnGroundFire(this.dungeonMeta.campfire.x, this.dungeonMeta.campfire.y, null, {
                permanent: true,
                campfire: true
            });
        }
        this.refreshShaftMarkers();
        this.buildBiomeFx();
        this.applyDayNightTint();
        this.playZoneMusic();
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        this.lockExits();
        if (opts.from === 'surface') {
            if (floor > 1) {
                Hud.log('You return through the escape shaft to floor ' + floor + '.');
            } else {
                Hud.log('Deep Mine — floor ' + floor + '. Mobs start at level 40 and rise by 1 each floor.');
            }
        } else if (opts.from === 'save') {
            Hud.log('You resume the Deep Mine on floor ' + floor + '.');
        } else {
            Hud.log('Floor ' + floor + ' of the Deep Mine.');
        }
        if (floor % 5 === 0) {
            Hud.log('A campfire burns on this floor.');
        }
        if ((typeof dungeonIsDragonFloor === 'function' ? dungeonIsDragonFloor(floor) : (floor % 21 === 0))) {
            Hud.log('A dragon stirs on this floor.');
        }
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
    },

    rememberedDungeonEscapeFloor: function () {
        var n = this.registry.get('dungeonEscapeFloor');
        if (typeof n !== 'number' || n < 1) {
            return 1;
        }
        return Math.floor(n);
    },

    exitDungeonToSurface: function () {
        var surface = typeof DUNGEON_SURFACE_ZONE !== 'undefined' ? DUNGEON_SURFACE_ZONE : 'darkmine';
        var spec = interiorById('shaft');
        var out;
        var escapeFloor = Math.max(1, this.dungeonFloor | 0);
        this.registry.set('dungeonEscapeFloor', escapeFloor);
        this.dungeonFloor = 0;
        this.dungeonMeta = null;
        this.registry.set('dungeonFloor', 0);
        this.interiorId = null;
        if (spec) {
            out = tileCenter(spec.doorTx, spec.doorTy + 1);
            this.registry.set('resumeAt', { x: out.x, y: out.y, interiorId: null });
        }
        this.enterZone(surface, null);
        Hud.log('You escape to the surface. The shaft remembers floor ' + escapeFloor + '.');
    },

    spawnDungeonMobs: function (floor) {
        var defs = typeof dungeonMobDefsForFloor === 'function' ? dungeonMobDefsForFloor(floor) : [];
        var self = this;
        defs.forEach(function (def, index) {
            var sprite = self.physics.add.sprite(def.x, def.y, def.texture, def.frame || 0);
            var scale;
            self.mobs.add(sprite);
            scale = mobScaleFor(def.type, 'world');
            sprite.setScale(scale);
            applyMobWorldBody(sprite, def.type);
            sprite.mobDef = Object.assign({ id: 'dungeon-' + floor + '-' + index }, def);
            if (typeof mobCombatClass === 'function') {
                sprite.mobDef.combatClass = mobCombatClass(sprite.mobDef);
            }
            if (typeof mobLevel === 'function' && typeof sprite.mobDef.level !== 'number') {
                sprite.mobDef.level = mobLevel(sprite.mobDef);
            }
            sprite.aliveMob = true;
            sprite.respawnAt = 0;
            var label = self.add.text(def.x, def.y - Math.round(8 * scale) - 6,
                typeof mobLabelText === 'function' ? mobLabelText(sprite.mobDef) : def.type, {
                fontSize: '8px',
                fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
                color: '#ffb0a0',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(7);
            sprite.nameLabel = label;
            self.floatLabels.push(label);
            self.physics.add.collider(sprite, self.ground);
            self.nudgeMobOffMapEdge(sprite);
        });
    },

    leaveInterior: function () {
        var spec = interiorById(this.interiorId);
        var zone = ZONES[this.zoneId];
        if (!spec || !zone) {
            return;
        }
        this.cancelLongPress();
        if (Hud.hideContextMenu) {
            Hud.hideContextMenu();
        }
        if (Hud.hideShop) {
            Hud.hideShop();
        }
        if (Hud.hideBank) {
            Hud.hideBank();
        }
        this.interiorId = null;
        this.clearWorldObjects();
        this.applyTilemap(generateMap(zone.seed, zone.biome, zoneNeighbors(zone), this.zoneId));
        this.reapplyDepletedTiles();
        var out = tileCenter(spec.doorTx, spec.doorTy + 1);
        this.placePlayer(out.x, out.y);
        this.clearWalk();
        this.spawnPeople(this.zoneId);
        this.restoreLoot(this.zoneId);
        this.restoreGraves(this.zoneId);
        this.spawnZoneCampfires(this.zoneId);
        this.refreshOreNodeMarkers();
        this.refreshShaftMarkers();
        this.refreshZoneBorderLabels();
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        Hud.log(typeof zoneEnterChat === 'function'
            ? zoneEnterChat(this.zoneId)
            : ('You enter ' + zone.name + '.'));
        this.lockExits();
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
    },

    clearWorldObjects: function () {
        this.clearWalk();
        this.clearDoorFx();
        this.clearBiomeFx();
        this.clearOreNodeMarkers();
        this.clearShaftMarkers();
        this.clearZoneBorderLabels();
        this.clearMineFx();
        this.engageTarget = null;
        this.talkTarget = null;
        this.clearGather();
        this.dialogueNpc = null;
        this.tileGrid = null;
        this.shaftChatKey = '';
        if (this.groundCollider) {
            this.groundCollider.destroy();
            this.groundCollider = null;
        }
        for (var i = 0; i < this.floatLabels.length; i++) {
            this.floatLabels[i].destroy();
        }
        this.floatLabels.length = 0;
        this.clearLoot();
        this.clearGravestones();
        this.clearGroundFires();
        this.npcs.clear(true, true);
        this.mobs.clear(true, true);
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
    },

    spawnPeople: function (zoneId) {
        var self = this;
        var hero = this.registry.get('hero');
        (NPC_DEFS[zoneId] || []).forEach(function (def, index) {
            var sprite = self.npcs.create(def.x, def.y, def.texture || ('npc-' + def.key));
            if (def.tint && def.tint !== 0xffffff && !isUniqueMobTexture(def.texture || ('npc-' + def.key))) {
                sprite.setTint(def.tint);
            }
            sprite.setImmovable(true);
            sprite.body.setSize(12, 12);
            sprite.npcDef = def;
            sprite.homeX = def.x;
            sprite.homeY = def.y;
            sprite.lastFacing = NPC_FACE_ORDER[index % NPC_FACE_ORDER.length];
            self.applyNpcFacing(sprite);
            /* Bankers stand on staff WALL tiles behind the counter. */
            if (def.key !== 'banker') {
                self.physics.add.collider(sprite, self.ground);
            }
            var label = self.add.text(def.x, def.y - 14, def.name, {
                fontSize: '8px',
                fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
                color: '#ffe08a',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(7);
            sprite.nameLabel = label;
            self.floatLabels.push(label);
            if (def.questGiver) {
                sprite.questIcon = self.makeQuestHeadIcon();
                self.floatLabels.push(sprite.questIcon);
            }
            self.nudgeNpcOffTaggedTiles(sprite, zoneId);
        });
        this.assertNpcSpawnSafety(zoneId);
        this.refreshQuestIcons();

        (typeof mobDefsForZone === 'function'
            ? mobDefsForZone(zoneId, hero)
            : (MOB_DEFS[zoneId] || [])).forEach(function (def, index) {
            var sprite = self.physics.add.sprite(def.x, def.y, def.texture, def.frame || 0);
            self.mobs.add(sprite);
            if (def.tint && def.tint !== 0xffffff && !isUniqueMobTexture(def.texture)) {
                sprite.setTint(def.tint);
            }
            var scale = mobScaleFor(def.type, 'world');
            sprite.setScale(scale);
            applyMobWorldBody(sprite, def.type);
            sprite.mobDef = Object.assign({ id: zoneId + '-' + index }, def);
            if (typeof mobCombatClass === 'function') {
                sprite.mobDef.combatClass = mobCombatClass(sprite.mobDef);
            }
            if (typeof mobLevel === 'function' && typeof sprite.mobDef.level !== 'number') {
                sprite.mobDef.level = mobLevel(sprite.mobDef);
            }
            sprite.aliveMob = true;
            sprite.respawnAt = 0;
            sprite.homeX = def.x;
            sprite.homeY = def.y;
            sprite.leashReturning = false;
            if (isGiantMob(def.type)) {
                self.physics.add.collider(self.player, sprite);
            }
            var label = self.add.text(def.x, def.y - Math.round(8 * scale) - 6,
                typeof mobLabelText === 'function' ? mobLabelText(sprite.mobDef) : def.type, {
                fontSize: '8px',
                fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
                color: '#ffb0a0',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(7);
            sprite.nameLabel = label;
            self.floatLabels.push(label);
            self.physics.add.collider(sprite, self.ground);
            self.nudgeMobOffMapEdge(sprite);
            /* Adopt nudged spawn as home before restore (restore keeps home, moves x/y). */
            sprite.homeX = sprite.x;
            sprite.homeY = sprite.y;
            self.restoreMobState(sprite, zoneId, scale);
            self.nudgeMobOffMapEdge(sprite);
        });
    },

    /* Soft-push mobs out of the outer MOB_EDGE_MARGIN_TILES map border (and haven safe zone). */
    nudgeMobOffMapEdge: function (sprite) {
        var tile;
        var allowed;
        var center;
        var scale;
        var zoneId = this.zoneId;
        var forbidden = typeof mobForbiddenAt === 'function'
            ? mobForbiddenAt(zoneId, sprite.x, sprite.y)
            : (typeof mobEdgeForbiddenAt === 'function' && mobEdgeForbiddenAt(sprite.x, sprite.y));
        if (!sprite || !forbidden) {
            return;
        }
        tile = worldToTile(sprite.x, sprite.y);
        allowed = typeof nearestMobAllowedTile === 'function'
            ? nearestMobAllowedTile(this.tileGrid, tile.tx, tile.ty, zoneId)
            : (typeof clampMobTileToInner === 'function'
                ? clampMobTileToInner(tile.tx, tile.ty)
                : { tx: tile.tx, ty: tile.ty });
        if (!allowed || typeof tileCenter !== 'function') {
            return;
        }
        center = tileCenter(allowed.tx, allowed.ty);
        sprite.setPosition(center.x, center.y);
        if (sprite.body) {
            sprite.body.reset(center.x, center.y);
            sprite.body.setVelocity(0, 0);
        }
        if (sprite.nameLabel) {
            scale = sprite.scaleX || 1;
            sprite.nameLabel.setPosition(center.x, center.y - Math.round(8 * scale) - 6);
        }
    },

    npcTileBlocked: function (zoneId, tx, ty) {
        if (typeof tileHasTag === 'function' && tileHasTag(zoneId, tx, ty, 'blocked_npc')) {
            return true;
        }
        if (typeof tileHasTag === 'function' && tileHasTag(zoneId, tx, ty, 'counter_front')) {
            return true;
        }
        if (typeof tileHasTag === 'function' && tileHasTag(zoneId, tx, ty, 'stairs_down')) {
            return true;
        }
        return false;
    },

    nudgeNpcOffTaggedTiles: function (sprite, zoneId) {
        var tile;
        var dirs;
        var d;
        var nx;
        var ny;
        var center;
        if (!sprite || sprite.npcDef && sprite.npcDef.key === 'banker') {
            return;
        }
        tile = worldToTile(sprite.x, sprite.y);
        if (!this.npcTileBlocked(zoneId, tile.tx, tile.ty)) {
            return;
        }
        dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        for (d = 0; d < dirs.length; d++) {
            nx = tile.tx + dirs[d][0];
            ny = tile.ty + dirs[d][1];
            if (this.npcTileBlocked(zoneId, nx, ny)) {
                continue;
            }
            if (!tileWalkable(this.tileGrid, nx, ny)) {
                continue;
            }
            center = tileCenter(nx, ny);
            sprite.setPosition(center.x, center.y);
            sprite.homeX = center.x;
            sprite.homeY = center.y;
            if (sprite.nameLabel) {
                sprite.nameLabel.setPosition(center.x, center.y - 14);
            }
            return;
        }
    },

    assertNpcSpawnSafety: function (zoneId) {
        var bad = [];
        var self = this;
        this.npcs.children.iterate(function (npc) {
            var tile;
            if (!npc || !npc.active) {
                return;
            }
            if (npc.npcDef && npc.npcDef.key === 'banker') {
                return;
            }
            tile = worldToTile(npc.x, npc.y);
            if (self.npcTileBlocked(zoneId, tile.tx, tile.ty)) {
                bad.push((npc.npcDef && npc.npcDef.name) || 'npc');
            }
        });
        if (bad.length && typeof console !== 'undefined' && console.warn) {
            console.warn('[Emberwood] NPC spawn on blocked tile:', bad.join(', '), 'zone=' + zoneId);
        }
    },

    remainingOfTimer: function (timer) {
        if (!timer) {
            return 0;
        }
        if (timer.getRemaining) {
            return timer.getRemaining();
        }
        return Math.max(0, timer.delay - (timer.elapsed || 0));
    },

    findMobById: function (id) {
        var found = null;
        this.mobs.children.iterate(function (mob) {
            if (mob && mob.mobDef && mob.mobDef.id === id) {
                found = mob;
            }
        });
        return found;
    },

    rememberMob: function (mob, extra) {
        if (!mob || !mob.mobDef) {
            return null;
        }
        if (!this.mobZoneState) {
            this.mobZoneState = {};
        }
        var zoneId = extra && extra.zoneId != null ? extra.zoneId : this.zoneId;
        if (!this.mobZoneState[zoneId]) {
            this.mobZoneState[zoneId] = {};
        }
        var bag = this.mobZoneState[zoneId];
        var prev = bag[mob.mobDef.id] || {};
        var row = {
            alive: extra && extra.alive != null ? extra.alive : !!mob.aliveMob,
            respawnAt: extra && extra.respawnAt != null ? extra.respawnAt : (mob.respawnAt || prev.respawnAt || 0),
            respawnTicksLeft: extra && extra.respawnTicksLeft != null
                ? extra.respawnTicksLeft
                : (typeof mob.respawnTicksLeft === 'number' ? mob.respawnTicksLeft : (prev.respawnTicksLeft || 0)),
            x: extra && extra.x != null ? extra.x : mob.x,
            y: extra && extra.y != null ? extra.y : mob.y,
            timer: extra && extra.timer !== undefined ? extra.timer : (mob.respawnTimer || prev.timer || null)
        };
        bag[mob.mobDef.id] = row;
        return row;
    },

    clearMobZoneState: function () {
        var self = this;
        Object.keys(this.mobZoneState || {}).forEach(function (zoneId) {
            var bag = self.mobZoneState[zoneId] || {};
            Object.keys(bag).forEach(function (id) {
                if (bag[id] && bag[id].timer) {
                    bag[id].timer.remove(false);
                    bag[id].timer = null;
                }
            });
        });
        this.mobZoneState = {};
    },

    snapshotMobs: function () {
        if (!this.mobZoneState) {
            this.mobZoneState = {};
        }
        var self = this;
        this.mobs.children.iterate(function (mob) {
            self.rememberMob(mob);
        });
    },

    /* Restores live x/y / death timer only — homeX/homeY stay at spawn. */
    restoreMobState: function (sprite, zoneId, scale) {
        var bag = this.mobZoneState && this.mobZoneState[zoneId];
        var saved = bag && sprite.mobDef && bag[sprite.mobDef.id];
        var remain;
        var stillDead;
        if (!saved) {
            return;
        }
        var x = saved.x;
        var y = saved.y;
        if (x != null && y != null) {
            sprite.setPosition(x, y);
            if (sprite.body) {
                sprite.body.reset(x, y);
            }
            if (sprite.nameLabel) {
                sprite.nameLabel.setPosition(x, y - Math.round(8 * scale) - 6);
            }
        }
        remain = typeof saved.remain === 'number'
            ? Math.max(0, saved.remain)
            : this.remainingOfTimer(saved.timer);
        if (!remain && saved.respawnAt && saved.respawnAt > this.time.now) {
            remain = saved.respawnAt - this.time.now;
        }
        stillDead = saved.alive === false && remain > 0;
        if (stillDead) {
            this.hideMob(sprite);
            this.scheduleMobRespawn(sprite, remain);
        } else if (saved.alive === false && remain <= 0) {
            this.reviveMob(sprite);
            this.rememberMob(sprite, { alive: true, respawnAt: 0, timer: null, remain: 0 });
        }
    },

    hideMob: function (mob) {
        if (!mob) {
            return;
        }
        mob.aliveMob = false;
        mob.setVisible(false);
        if (mob.body) {
            mob.body.enable = false;
            mob.body.setVelocity(0, 0);
        }
        if (mob.nameLabel) {
            mob.nameLabel.setVisible(false);
        }
    },

    reviveMob: function (mob) {
        if (!mob || !mob.active) {
            return;
        }
        mob.aliveMob = true;
        mob.respawnAt = 0;
        if (mob.respawnTimer) {
            mob.respawnTimer.remove(false);
            mob.respawnTimer = null;
        }
        mob.setVisible(true);
        if (mob.body) {
            mob.body.enable = true;
        }
        if (mob.nameLabel) {
            if (typeof mobLabelText === 'function') {
                mob.nameLabel.setText(mobLabelText(mob.mobDef));
            }
            mob.nameLabel.setVisible(true);
        }
    },

    scheduleMobRespawn: function (mob, delay) {
        var waitMs = Math.max(0, delay);
        var waitSec = waitMs / 1000;
        var zoneId = this.zoneId;
        var id;
        if (!mob || !mob.mobDef) {
            return;
        }
        if (mob.respawnTimer) {
            mob.respawnTimer.remove(false);
            mob.respawnTimer = null;
        }
        id = mob.mobDef.id;
        mob.respawnAuthoredSec = waitSec;
        mob.respawnTicksLeft = waitSec > 0 ? this.secondsToSimTicks(waitSec) : 0;
        mob.respawnAt = this.time.now + waitMs;
        if (!(mob.respawnTicksLeft > 0)) {
            this.rememberMob(mob, { alive: true, respawnAt: 0, timer: null, zoneId: zoneId });
            this.reviveMob(mob);
            return;
        }
        this.rememberMob(mob, {
            alive: false,
            respawnAt: mob.respawnAt,
            respawnTicksLeft: mob.respawnTicksLeft,
            respawnAuthoredSec: waitSec,
            timer: null,
            zoneId: zoneId
        });
    },

    completeMobRespawn: function (mob) {
        var zoneId = this.zoneId;
        var id = mob && mob.mobDef && mob.mobDef.id;
        var bag = this.mobZoneState && this.mobZoneState[zoneId];
        var live;
        if (!mob) {
            return;
        }
        if (bag && id && bag[id]) {
            bag[id].alive = true;
            bag[id].respawnAt = 0;
            bag[id].respawnTicksLeft = 0;
            bag[id].timer = null;
        }
        live = id && this.zoneId === zoneId ? this.findMobById(id) : null;
        if (live) {
            live.respawnTicksLeft = 0;
            live.respawnTimer = null;
            this.reviveMob(live);
        } else if (mob.active) {
            mob.respawnTicksLeft = 0;
            mob.respawnTimer = null;
            this.reviveMob(mob);
        }
    },

    applyDayNightTint: function () {
        var hour = (new Date()).getHours();
        var tint = 0xffffff;
        var overlayColor = 0x223355;
        var overlayAlpha = 0;
        if (hour >= 20 || hour < 5) {
            tint = 0x8899cc;
            overlayColor = 0x102040;
            overlayAlpha = 0.28;
        } else if (hour >= 18 || hour < 7) {
            tint = 0xffddbb;
            overlayColor = 0x402010;
            overlayAlpha = 0.14;
        }
        this.cameras.main.setBackgroundColor(tint === 0xffffff ? '#1a1a22' : '#0a0a12');
        if (this.ground) {
            this.ground.setTint(tint);
        }
        /* Fill at full opacity; Game Object alpha carries the hour strength so day
           never leaves an opaque full-screen rect if fillAlpha were ignored. */
        if (!this.dayNightOverlay) {
            this.dayNightOverlay = this.add.rectangle(0, 0, 2048, 2048, overlayColor, 1)
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setDepth(40)
                .setName('dayNight');
        }
        this.dayNightOverlay.setFillStyle(overlayColor, 1);
        this.dayNightOverlay.setAlpha(overlayAlpha);
        this.dayNightOverlay.setVisible(overlayAlpha > 0.001);
    },

    playZoneMusic: function () {
        var zone = ZONES[this.zoneId];
        if (!window.Sfx || !Sfx.playBiome) {
            return;
        }
        Sfx.playBiome(zone && zone.biome ? zone.biome : this.zoneId);
    },

    clearBiomeFx: function () {
        if (this.biomeFx) {
            this.biomeFx.forEach(function (spr) {
                if (spr && spr.destroy) {
                    spr.destroy();
                }
            });
        }
        this.biomeFx = [];
        this.waterTiles = [];
    },

    buildBiomeFx: function () {
        var zone = ZONES[this.zoneId];
        var biome = zone && zone.biome ? zone.biome : '';
        var x;
        var y;
        var tile;
        var mist;
        var i;
        this.clearBiomeFx();
        if (!this.tileGrid) {
            return;
        }
        for (y = 0; y < this.tileGrid.length; y++) {
            for (x = 0; x < this.tileGrid[y].length; x++) {
                tile = this.tileGrid[y][x];
                if (tile === TILE.WATER) {
                    this.waterTiles.push({ x: x, y: y });
                }
            }
        }
        if (biome === 'shore' || biome === 'swamp' || this.zoneId === 'southshore' || this.zoneId === 'mire') {
            for (i = 0; i < this.waterTiles.length && i < 48; i++) {
                mist = this.add.rectangle(
                    this.waterTiles[i].x * 16 + 8,
                    this.waterTiles[i].y * 16 + 8,
                    16,
                    16,
                    0xa8c8ff,
                    0.12
                ).setDepth(5).setOrigin(0.5);
                mist._waterWash = true;
                mist._baseY = mist.y;
                mist._mistPhase = i * 0.35;
                this.biomeFx.push(mist);
            }
        }
        if (this.zoneId === 'southshore' && typeof SHORE_PROPS !== 'undefined' && SHORE_PROPS.spots) {
            for (i = 0; i < SHORE_PROPS.spots.length; i++) {
                mist = this.add.circle(
                    SHORE_PROPS.spots[i].x * 16 + 8,
                    SHORE_PROPS.spots[i].y * 16 + 8,
                    5,
                    0x7ec8ff,
                    0.45
                ).setDepth(6).setOrigin(0.5);
                mist._fishSpotPulse = true;
                mist._mistPhase = i * 1.1;
                this.biomeFx.push(mist);
            }
        }
        if (biome === 'swamp' || this.zoneId === 'mire') {
            for (i = 0; i < 10; i++) {
                mist = this.add.rectangle(
                    40 + (i * 53) % (MAP_W * 16),
                    30 + (i * 37) % (MAP_H * 16),
                    48 + (i % 3) * 16,
                    20 + (i % 2) * 10,
                    0xc8d8c8,
                    0.12 + (i % 4) * 0.03
                ).setDepth(6).setOrigin(0.5);
                mist._mistPhase = i * 0.7;
                mist._mistSpeed = 8 + (i % 5);
                this.biomeFx.push(mist);
            }
        }
    },

    tickBiomeFx: function (time) {
        var i;
        var mist;
        var wash;
        var t = (time || 0) / 1000;
        var pulse = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(t * 2.2));
        if (!this.biomeFx) {
            return;
        }
        for (i = 0; i < this.biomeFx.length; i++) {
            mist = this.biomeFx[i];
            if (!mist || !mist.active) {
                continue;
            }
            if (mist._waterWash) {
                mist.setAlpha(pulse);
                continue;
            }
            if (mist._fishSpotPulse) {
                mist.setAlpha(0.28 + 0.28 * (0.5 + 0.5 * Math.sin(t * 2.6 + mist._mistPhase)));
                mist.setScale(0.85 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2.1 + mist._mistPhase)));
                continue;
            }
            mist.x += Math.sin(t + mist._mistPhase) * 0.15;
            mist.y += Math.cos(t * 0.7 + mist._mistPhase) * 0.08;
            mist.setAlpha(0.1 + 0.08 * (0.5 + 0.5 * Math.sin(t * 0.9 + mist._mistPhase)));
        }
        /* keep a few shore washes drifting */
        for (i = 0; i < this.biomeFx.length; i++) {
            wash = this.biomeFx[i];
            if (wash && wash._waterWash) {
                wash.y = wash._baseY + Math.sin(t * 1.4 + wash._mistPhase) * 1.5;
            }
        }
    },

    noteVisitedZone: function (zoneId) {
        var hero = this.registry.get('hero');
        var keys;
        if (!hero || !zoneId || !ZONES[zoneId]) {
            return;
        }
        if (!hero.visitedZones) {
            hero.visitedZones = {};
        }
        if (hero.visitedZones[zoneId]) {
            return;
        }
        hero.visitedZones[zoneId] = true;
        keys = Object.keys(hero.visitedZones);
        if (keys.length >= 9) {
            hero.achievements = hero.achievements || {};
            if (!hero.achievements.nineLands) {
                hero.achievements.nineLands = true;
                Hud.log('Achievement: Visit all nine lands.');
            }
            this.checkDiaryComplete(hero);
        }
        this.registry.set('hero', hero);
    },

    noteTutorial: function (beat) {
        var hero = this.registry.get('hero');
        if (!hero) {
            return;
        }
        if (!hero.tutorials) {
            hero.tutorials = {};
        }
        if (hero.tutorials[beat]) {
            return;
        }
        hero.tutorials[beat] = true;
        this.registry.set('hero', hero);
        if (beat === 'walk') {
            Hud.log('Tutorial: You took your first steps.');
        } else if (beat === 'talk') {
            Hud.log('Tutorial: You spoke with a townsfolk.');
        } else if (beat === 'fight') {
            Hud.log('Tutorial: You won your first fight.');
        } else if (beat === 'loot') {
            Hud.log('Tutorial: You picked up loot.');
        } else if (beat === 'bury') {
            Hud.log('Tutorial: You buried bones for Prayer.');
        } else if (beat === 'shop') {
            Hud.log('Tutorial: You opened a shop.');
        }
    },

    checkDiaryComplete: function (hero) {
        var zones;
        if (!hero || !hero.diary || hero.diary.complete) {
            return;
        }
        zones = hero.visitedZones ? Object.keys(hero.visitedZones).length : 0;
        if (hero.diary.bram && hero.diary.eat && hero.diary.bury && zones >= 9) {
            hero.diary.complete = true;
            hero.achievements = hero.achievements || {};
            hero.achievements.easyDiary = true;
            addItem(hero, 'coins', 20);
            this.registry.set('hero', hero);
            Hud.log('Emberhaven diary complete. +20gp.');
        }
    },

    refreshHud: function () {
        var hero = this.registry.get('hero');
        var quest = this.registry.get('quest');
        var zone = ZONES[this.zoneId];
        var interior = this.interiorId ? interiorById(this.interiorId) : null;
        var questText = 'Talk to Guildmaster Bram in Emberhaven.';
        if (quest.stage === 1) {
            questText = 'Kill goblins in Northwood (' + quest.progress + '/' + quest.goal + ').';
        } else if (quest.stage === 2) {
            questText = 'Return to Guildmaster Bram for your reward.';
        } else if (quest.stage >= 3) {
            questText = 'Militia task complete. Explore the nine lands.';
        }
        if (typeof applyCombatLevel === 'function') {
            applyCombatLevel(hero, false);
        }
        Hud.setWorld({
            zone: this.zoneId === 'dungeon' && this.dungeonFloor
                ? ('Deep Mine F' + this.dungeonFloor)
                : (interior ? interior.name : (zone && zone.name) || this.zoneId),
            zoneId: this.zoneId,
            hp: hero.hp,
            maxHp: hero.maxHp,
            gold: hero.gold,
            xp: hero.xp,
            level: typeof combatLevel === 'function' ? combatLevel(hero) : hero.level,
            total: typeof skillTotal === 'function' ? skillTotal(hero) : 0,
            quest: questText,
            displayName: hero.displayName || 'Adventurer'
        });
        if (Hud.renderQuestJournal) {
            Hud.renderQuestJournal(quest);
        }
        this.refreshQuestIcons();
    },

    makeQuestHeadIcon: function () {
        var gfx = this.add.graphics();
        gfx.setDepth(8);
        gfx.setVisible(false);
        gfx.kind = null;
        gfx.iconColor = 0;
        return gfx;
    },

    drawBangHeadIcon: function (gfx, color) {
        gfx.fillStyle(color, 1);
        gfx.lineStyle(1, 0x403010, 0.95);
        gfx.fillRoundedRect(-2.2, -6.5, 4.4, 9.5, 1.2);
        gfx.strokeRoundedRect(-2.2, -6.5, 4.4, 9.5, 1.2);
        gfx.fillCircle(0, 5.2, 1.6);
        gfx.strokeCircle(0, 5.2, 1.6);
        gfx.fillStyle(0x2a1c08, 1);
        gfx.fillRoundedRect(-0.7, -5.2, 1.4, 6.2, 0.6);
    },

    drawQuestMarkHeadIcon: function (gfx, color) {
        gfx.fillStyle(color, 1);
        gfx.lineStyle(1, 0x202020, 0.95);
        gfx.beginPath();
        gfx.arc(0, -2.2, 3.4, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(20), false);
        gfx.lineTo(0.2, 1.2);
        gfx.strokePath();
        gfx.lineStyle(2.2, color, 1);
        gfx.beginPath();
        gfx.arc(0, -2.2, 3.4, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(20), false);
        gfx.lineTo(0.2, 1.2);
        gfx.strokePath();
        gfx.fillStyle(color, 1);
        gfx.fillCircle(0, 4.6, 1.5);
        gfx.lineStyle(1, 0x202020, 0.95);
        gfx.strokeCircle(0, 4.6, 1.5);
    },

    drawQuestHeadIcon: function (gfx, spec) {
        gfx.clear();
        if (!spec) {
            gfx.kind = null;
            gfx.iconColor = 0;
            gfx.setVisible(false);
            return;
        }
        gfx.kind = spec.kind;
        gfx.iconColor = spec.color;
        if (spec.kind === 'bang' || spec.kind === 'star') {
            this.drawBangHeadIcon(gfx, spec.color);
        } else {
            this.drawQuestMarkHeadIcon(gfx, spec.color);
        }
        gfx.setVisible(true);
    },

    refreshQuestIcons: function () {
        if (!this.npcs) {
            return;
        }
        var quest = this.registry.get('quest');
        var self = this;
        this.npcs.children.iterate(function (npc) {
            if (!npc || !npc.npcDef) {
                return;
            }
            var spec = typeof questHeadIconFor === 'function'
                ? questHeadIconFor(npc.npcDef, quest, self.registry.get('hero'))
                : null;
            if (!npc.questIcon) {
                if (!spec) {
                    return;
                }
                npc.questIcon = self.makeQuestHeadIcon();
                self.floatLabels.push(npc.questIcon);
            }
            self.drawQuestHeadIcon(npc.questIcon, spec);
            if (spec) {
                npc.questIcon.setPosition(npc.x, npc.y - 24);
            }
        });
    },

    isRightClick: function (pointer) {
        if (!pointer) {
            return false;
        }
        if (pointer.button === 2) {
            return true;
        }
        if (typeof pointer.rightButtonDown === 'function') {
            return !!pointer.rightButtonDown();
        }
        return false;
    },

    uiPaused: function () {
        return !!(window.Hud && Hud.interactionPaused && Hud.interactionPaused());
    },

    onClick: function (pointer) {
        if (Hud.mode === 'title') {
            this.cancelLongPress();
            return;
        }
        if (this.overworldFight) {
            this.cancelLongPress();
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            this.engageTarget = null;
            this._fightPlayerClose = false;
            this.talkTarget = null;
            this.clearGather();
            this.setWalk(pointer.worldX, pointer.worldY, { allowEnd: true, playerClick: true });
            return;
        }
        if (this.encounterLock || Hud.mode === 'battle') {
            this.cancelLongPress();
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            if (Hud.clearUseOn) {
                Hud.clearUseOn();
            }
            return;
        }
        if (Hud.dialogueOpen && Hud.dialogueOpen()) {
            this.cancelLongPress();
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            if (this.isRightClick(pointer)) {
                return;
            }
            /* Same NPC keeps the open dialogue; elsewhere ends talk then walks/acts as normal. */
            var talkNpc = this.dialogueNpc;
            var clickNpc = this.pickSprite(this.npcs, pointer.worldX, pointer.worldY, 18);
            if (talkNpc && clickNpc === talkNpc) {
                return;
            }
            if (Hud.hideDialogue) {
                Hud.hideDialogue();
            }
            /* Fall through so ground / other-NPC clicks still path. */
        }
        if (Hud.stationOpen && Hud.stationOpen()) {
            this.cancelLongPress();
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            return;
        }
        var x = pointer.worldX;
        var y = pointer.worldY;
        if (Hud.useOnId) {
            this.cancelLongPress();
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            if (this.isRightClick(pointer)) {
                if (Hud.clearUseOn) {
                    Hud.clearUseOn();
                }
                return;
            }
            var useScenery = this.pickScenery(x, y);
            if (Hud.finishUseOn) {
                Hud.finishUseOn(useScenery && useScenery.kind);
            }
            return;
        }
        if (this.isRightClick(pointer)) {
            this.cancelLongPress();
            var ev = pointer.event;
            var onMob = this.pickSprite(this.mobs, x, y, 18);
            var onNpc = this.pickSprite(this.npcs, x, y, 18);
            var onGrave = this.pickGravestone(x, y, 18);
            var lootPile = this.pickLootPile(x, y, 18);
            if (onGrave) {
                this.showGraveContextAt(onGrave, {
                    clientX: ev && ev.clientX != null ? ev.clientX : 16,
                    clientY: ev && ev.clientY != null ? ev.clientY : 16
                });
                return;
            }
            if (lootPile && lootPile.length) {
                this.showLootContextAt(lootPile, {
                    clientX: ev && ev.clientX != null ? ev.clientX : 16,
                    clientY: ev && ev.clientY != null ? ev.clientY : 16
                });
                return;
            }
            if (onMob && onMob.aliveMob) {
                if (Hud.showContextMenu) {
                    Hud.showContextMenu([
                        { label: 'Attack', action: 'attack' },
                        { label: 'Examine', action: 'examine' }
                    ], {
                        worldX: onMob.x,
                        worldY: onMob.y,
                        mob: onMob,
                        clientX: ev && ev.clientX != null ? ev.clientX : 16,
                        clientY: ev && ev.clientY != null ? ev.clientY : 16
                    });
                }
                return;
            }
            if (onNpc) {
                this.showNpcExamineMenu(onNpc, {
                    clientX: ev && ev.clientX != null ? ev.clientX : 16,
                    clientY: ev && ev.clientY != null ? ev.clientY : 16
                });
                return;
            }
            var scenery = this.pickScenery(x, y);
            var items = [];
            var primary = scenery && typeof sceneryPrimaryAction === 'function'
                ? sceneryPrimaryAction(scenery.kind)
                : (scenery && scenery.kind === 'fishspot' ? { label: 'Fish', action: 'fish' } : null);
            if (primary) {
                items.push(primary);
            }
            if (scenery) {
                items.push({ label: 'Examine', action: 'examine' });
            }
            items.push({ label: 'Walk here', action: 'walk-here' });
            if (Hud.showContextMenu) {
                Hud.showContextMenu(items, {
                    worldX: x,
                    worldY: y,
                    clientX: ev && ev.clientX != null ? ev.clientX : 16,
                    clientY: ev && ev.clientY != null ? ev.clientY : 16
                });
            }
            return;
        }
        if (Hud.hideContextMenu) {
            Hud.hideContextMenu();
        }
        var leftGrave = this.pickGravestone(x, y, 18);
        if (leftGrave) {
            this.clearFish();
            this.engageTarget = null;
            this.talkTarget = null;
            this.lootTarget = null;
            this.queueGraveReclaim(leftGrave);
            this.armLongPress(pointer);
            return;
        }
        var leftLootPile = this.pickLootPile(x, y, 18);
        if (leftLootPile && leftLootPile.length) {
            this.clearFish();
            this.engageTarget = null;
            this.talkTarget = null;
            this.queueLootTake(this.topLootFromPile(leftLootPile));
            this.armLongPress(pointer);
            return;
        }
        this.armLongPress(pointer);
        var hit = this.pickSprite(this.mobs, x, y, 18);
        if (hit && hit.aliveMob) {
            this.queueAttack(hit);
            return;
        }
        /* Stations / gather spots win over nearby NPCs so cook/range clicks open the UI. */
        var scenery = this.pickScenery(x, y);
        if (scenery && scenery.kind === 'fishspot') {
            this.clickFishSpot(scenery);
            return;
        }
        if (scenery && typeof isStationKind === 'function' && isStationKind(scenery.kind)) {
            this.clickStation(scenery);
            return;
        }
        if (scenery && (scenery.kind === 'stairs-down' || scenery.kind === 'stairs-up'
                || scenery.kind === 'surface-portal' || scenery.kind === 'dungeon-enter'
                || scenery.kind === 'dragon-den' || scenery.kind === 'dragon-den-exit')) {
            this.clickStairs(scenery);
            return;
        }
        if (scenery && scenery.kind === 'den-boulder') {
            this.clickMineBoulder(scenery);
            return;
        }
        if (scenery && scenery.kind === 'guild-post') {
            hit = this.findNpcByKey((scenery.interact && scenery.interact.npcKey) || 'guild');
            if (hit) {
                this.talkTarget = hit;
                this.engageTarget = null;
                this.clearFish();
                this.setWalk(hit.x, hit.y, { allowEnd: true });
                return;
            }
        }
        if (scenery && scenery.kind === 'tree' && typeof woodcutTreeAt === 'function'
                && woodcutTreeAt(scenery.tx, scenery.ty, this.zoneId, this.tileGrid)) {
            this.clickChopTree(scenery);
            return;
        }
        if (scenery && scenery.kind === 'rock' && typeof mineRockAt === 'function'
                && mineRockAt(scenery.tx, scenery.ty, this.zoneId, this.tileGrid, {
                    houseRects: this.houseRectsNow(),
                    interior: !!this.interiorId
                })) {
            this.clickMineRock(scenery);
            return;
        }
        hit = this.pickSprite(this.npcs, x, y, 18);
        if (hit) {
            this.talkTarget = hit;
            this.engageTarget = null;
            this.lootTarget = null;
            this.clearFish();
            this.setWalk(hit.x, hit.y, { allowEnd: true });
            return;
        }
        if (scenery && !(typeof isWalkableExamineKind === 'function' && isWalkableExamineKind(scenery.kind))) {
            this.engageTarget = null;
            this.talkTarget = null;
            this.lootTarget = null;
            this.clearFish();
            this.examineScenery(scenery);
            return;
        }
        this.engageTarget = null;
        this.talkTarget = null;
        this.lootTarget = null;
        this.clearFish();
        this.travelZoneId = null;
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 10) {
            this.clearWalk();
            return;
        }
        this.setWalk(x, y, { playerClick: true });
    },

    pickSprite: function (group, x, y, range) {
        var kids = group.getChildren();
        var best = null;
        var bestD = range;
        for (var i = 0; i < kids.length; i++) {
            var sprite = kids[i];
            if (!sprite.active) {
                continue;
            }
            var d = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
            if (d < bestD) {
                bestD = d;
                best = sprite;
            }
        }
        return best;
    },

    /* Nearest living mob within Chebyshev tile range of the player (auto-attack engage). */
    pickNearestAliveMobChebyshev: function (tiles) {
        var kids;
        var i;
        var sprite;
        var best;
        var bestD;
        var d;
        var a;
        var b;
        if (!(tiles >= 0) || !this.mobs || !this.player || typeof worldToTile !== 'function') {
            return null;
        }
        a = worldToTile(this.player.x, this.player.y);
        kids = this.mobs.getChildren();
        best = null;
        bestD = tiles + 1;
        for (i = 0; i < kids.length; i++) {
            sprite = kids[i];
            if (!sprite || !sprite.active || !sprite.aliveMob) {
                continue;
            }
            b = worldToTile(sprite.x, sprite.y);
            d = Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
            if (d <= tiles && d < bestD) {
                bestD = d;
                best = sprite;
            }
        }
        return best;
    },

    houseRectsNow: function () {
        if (this.interiorId) {
            return typeof INTERIOR_ROOM !== 'undefined' ? [INTERIOR_ROOM] : [];
        }
        var zone = ZONES[this.zoneId];
        return typeof housesForBiome === 'function' ? housesForBiome(zone && zone.biome) : [];
    },

    pickScenery: function (x, y) {
        var tile = worldToTile(x, y);
        var fire = this.groundFireAt(tile.tx, tile.ty);
        var interact;
        var kind;
        if (fire) {
            return { tx: tile.tx, ty: tile.ty, kind: 'fire', fire: fire };
        }
        kind = typeof sceneryKindAt === 'function'
            ? sceneryKindAt(this.tileGrid, tile.tx, tile.ty, {
                houseRects: this.houseRectsNow(),
                interior: !!this.interiorId,
                zoneId: this.zoneId
            })
            : null;
        if (!kind) {
            return null;
        }
        interact = typeof getTileInteract === 'function'
            ? getTileInteract(this.zoneId, tile.tx, tile.ty)
            : null;
        return { tx: tile.tx, ty: tile.ty, kind: kind, interact: interact };
    },

    ensureGroundFireTexture: function () {
        if (this.textures.exists('ground-fire')) {
            return;
        }
        var g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x3a2410, 1);
        g.fillRect(2, 10, 12, 4);
        g.fillStyle(0xc84a18, 1);
        g.fillTriangle(8, 2, 3, 11, 13, 11);
        g.fillStyle(0xf0c040, 1);
        g.fillTriangle(8, 5, 5, 11, 11, 11);
        g.generateTexture('ground-fire', 16, 16);
        g.destroy();
    },

    groundFireAt: function (tx, ty) {
        var i;
        var fire;
        if (!this.groundFires) {
            return null;
        }
        for (i = 0; i < this.groundFires.length; i++) {
            fire = this.groundFires[i];
            if (fire && fire.tx === tx && fire.ty === ty) {
                return fire;
            }
        }
        return null;
    },

    canLightFireAtPlayer: function () {
        if (!this.player || !this.tileGrid) {
            return false;
        }
        var tile = worldToTile(this.player.x, this.player.y);
        if (!tileWalkable(this.tileGrid, tile.tx, tile.ty)) {
            return false;
        }
        if (this.groundFireAt(tile.tx, tile.ty)) {
            return false;
        }
        return true;
    },

    spawnGroundFireAtPlayer: function (durationMs) {
        if (!this.player) {
            return null;
        }
        var tile = worldToTile(this.player.x, this.player.y);
        return this.spawnGroundFire(tile.tx, tile.ty, durationMs);
    },

    spawnGroundFire: function (tx, ty, durationMs, opts) {
        var pos;
        var sprite;
        var ms = typeof durationMs === 'number' ? durationMs : GROUND_FIRE_MS;
        var permanent;
        opts = opts || {};
        permanent = !!opts.permanent;
        if (!permanent && typeof FIRE_DURATION_MS === 'number') {
            ms = typeof durationMs === 'number' ? durationMs : FIRE_DURATION_MS;
        }
        if (!this.tileGrid || !tileWalkable(this.tileGrid, tx, ty)) {
            return null;
        }
        this.clearGroundFireAt(tx, ty);
        this.ensureGroundFireTexture();
        pos = tileCenter(tx, ty);
        sprite = this.add.image(pos.x, pos.y, 'ground-fire');
        sprite.setDepth(5);
        this.groundFires.push({
            tx: tx,
            ty: ty,
            sprite: sprite,
            until: permanent ? Number.POSITIVE_INFINITY : (this.time.now + ms),
            permanent: permanent,
            campfire: !!opts.campfire || permanent
        });
        return this.groundFires[this.groundFires.length - 1];
    },

    spawnZoneCampfires: function (zoneId) {
        var spots = typeof CAMPFIRE_SPOTS !== 'undefined' ? CAMPFIRE_SPOTS[zoneId] : null;
        var i;
        if (!spots || !spots.length) {
            return;
        }
        for (i = 0; i < spots.length; i++) {
            this.spawnGroundFire(spots[i].x, spots[i].y, null, { permanent: true, campfire: true });
        }
    },

    nearCampfire: function () {
        var i;
        var fire;
        var pos;
        var range = CAMPFIRE_REGEN_RANGE;
        if (!this.player || !this.groundFires) {
            return false;
        }
        for (i = 0; i < this.groundFires.length; i++) {
            fire = this.groundFires[i];
            if (!fire || (!fire.campfire && !fire.permanent)) {
                continue;
            }
            pos = fire.sprite ? fire.sprite : tileCenter(fire.tx, fire.ty);
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, pos.x, pos.y) <= range) {
                return true;
            }
        }
        return false;
    },

    nearTownCenter: function () {
        var center;
        var pos;
        if (this.zoneId !== 'haven' || !this.player) {
            return false;
        }
        center = typeof TOWN_CENTER_TILE !== 'undefined' ? TOWN_CENTER_TILE
            : (typeof TOWN_PROPS !== 'undefined' && TOWN_PROPS.campfire ? TOWN_PROPS.campfire : { x: 18, y: 15 });
        pos = tileCenter(center.x, center.y);
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, pos.x, pos.y) <= 72;
    },

    tickHpRegen: function (dtGameSec) {
        var hero;
        var rateSec;
        var gained = false;
        if (!dtGameSec || this.overworldFight || this.encounterLock) {
            return;
        }
        hero = this.registry.get('hero');
        if (!hero || hero.hp <= 0 || hero.hp >= hero.maxHp) {
            this._regenAcc = 0;
            return;
        }
        rateSec = HP_REGEN_BASE_SEC;
        if (this.nearCampfire()) {
            rateSec = HP_REGEN_CAMP_SEC;
        } else if (this.nearTownCenter()) {
            rateSec = HP_REGEN_TOWN_SEC;
        }
        this._regenAcc = (this._regenAcc || 0) + dtGameSec;
        while (this._regenAcc >= rateSec && hero.hp < hero.maxHp) {
            this._regenAcc -= rateSec;
            hero.hp += 1;
            gained = true;
        }
        if (gained) {
            this.registry.set('hero', hero);
            if (Hud.renderHero) {
                Hud.renderHero(hero);
            }
        }
    },

    clearGroundFireAt: function (tx, ty) {
        var i;
        var fire;
        if (!this.groundFires) {
            return;
        }
        for (i = this.groundFires.length - 1; i >= 0; i--) {
            fire = this.groundFires[i];
            if (!fire || fire.tx !== tx || fire.ty !== ty) {
                continue;
            }
            if (fire.sprite) {
                fire.sprite.destroy();
            }
            this.groundFires.splice(i, 1);
        }
    },

    clearGroundFires: function () {
        var i;
        var fire;
        if (!this.groundFires) {
            this.groundFires = [];
            this.clearEffectRadiusRings();
            return;
        }
        for (i = 0; i < this.groundFires.length; i++) {
            fire = this.groundFires[i];
            if (fire && fire.sprite) {
                fire.sprite.destroy();
            }
        }
        this.groundFires.length = 0;
        this.clearEffectRadiusRings();
    },

    pruneGroundFires: function () {
        var i;
        var fire;
        var now = this.time.now;
        if (!this.groundFires) {
            return;
        }
        for (i = this.groundFires.length - 1; i >= 0; i--) {
            fire = this.groundFires[i];
            if (!fire || fire.permanent || fire.until > now) {
                continue;
            }
            if (fire.sprite) {
                fire.sprite.destroy();
            }
            this.groundFires.splice(i, 1);
        }
    },

    sceneryWorldPos: function (hit) {
        if (!hit) {
            return null;
        }
        if (hit.x != null && hit.y != null) {
            return { x: hit.x, y: hit.y };
        }
        return typeof tileCenter === 'function' ? tileCenter(hit.tx, hit.ty) : null;
    },

    fishStandTile: function (hit) {
        if (!hit || !this.tileGrid) {
            return null;
        }
        if (typeof nearestStandTileInRange === 'function') {
            return nearestStandTileInRange(this.tileGrid, hit.tx, hit.ty, FISH_RANGE);
        }
        return typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
    },

    fishSpotInRange: function (hit) {
        if (!hit || !this.player) {
            return false;
        }
        var spot = this.sceneryWorldPos(hit);
        if (spot && Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.x, spot.y) < FISH_RANGE) {
            return true;
        }
        var near = this.fishStandTile(hit);
        if (!near) {
            return false;
        }
        var dest = tileCenter(near.tx, near.ty);
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, dest.x, dest.y) < 10;
    },

    clickFishSpot: function (hit) {
        this.engageTarget = null;
        this.talkTarget = null;
        if (!hit || hit.kind !== 'fishspot') {
            return false;
        }
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        var pos = this.sceneryWorldPos(hit);
        if (pos) {
            hit.x = pos.x;
            hit.y = pos.y;
        }
        this.clearFish();
        this.fishTarget = hit;
        if (this.fishSpotInRange(hit)) {
            return this.tryFishSpot(hit);
        }
        var near = this.fishStandTile(hit);
        if (!near) {
            this.clearFish();
            return this.examineScenery(hit);
        }
        var dest = tileCenter(near.tx, near.ty);
        this.setWalk(dest.x, dest.y, { allowEnd: true, keepFish: true });
        return true;
    },

    stationInRange: function (hit) {
        if (!hit || !this.player) {
            return false;
        }
        var spot = this.sceneryWorldPos(hit);
        if (spot && Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.x, spot.y) < STATION_RANGE) {
            return true;
        }
        var near = typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
        if (!near) {
            return false;
        }
        var dest = tileCenter(near.tx, near.ty);
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, dest.x, dest.y) < 10;
    },

    clearStationWalk: function () {
        this.stationTarget = null;
    },

    clickStation: function (hit) {
        this.engageTarget = null;
        this.talkTarget = null;
        if (!hit || !(typeof isStationKind === 'function' && isStationKind(hit.kind))) {
            return false;
        }
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        var pos = this.sceneryWorldPos(hit);
        if (pos) {
            hit.x = pos.x;
            hit.y = pos.y;
        }
        this.clearFish();
        this.clearChop();
        this.clearMine();
        this.stationTarget = hit;
        if (this.stationInRange(hit)) {
            return this.openStation(hit);
        }
        var near = typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
        if (!near) {
            this.clearStationWalk();
            return this.examineScenery(hit);
        }
        var dest = tileCenter(near.tx, near.ty);
        this.setWalk(dest.x, dest.y, { allowEnd: true });
        return true;
    },

    tryCompleteStation: function () {
        if (!this.stationTarget || !this.player) {
            return false;
        }
        if (!this.stationInRange(this.stationTarget)) {
            return false;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        return this.openStation(this.stationTarget);
    },

    openStation: function (hit) {
        var shopKey;
        var npcKey;
        var npc;
        this.stationTarget = null;
        if (!hit || this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (hit.kind === 'booth') {
            if (Hud.showBank) {
                Hud.showBank({ key: 'booth', name: 'Bank counter' });
            }
            return true;
        }
        if (hit.kind === 'shop-stall' || (hit.interact && hit.interact.verb === 'trade')) {
            shopKey = (hit.interact && hit.interact.shopKey) || 'mira';
            npcKey = hit.interact && hit.interact.npcKey;
            npc = npcKey ? this.findNpcByKey(npcKey) : null;
            if (Hud.showShop) {
                Hud.showShop((npc && npc.npcDef) || { name: 'Shopkeeper Mira', shopKey: shopKey });
            }
            return true;
        }
        if (hit.kind === 'ge' && Hud.showGrandExchange) {
            Hud.showGrandExchange();
            return true;
        }
        if (Hud.showStation) {
            Hud.showStation(hit.kind, hit.interact || {});
            return true;
        }
        return this.examineScenery(hit);
    },

    findNpcByKey: function (key) {
        var found = null;
        if (!key || !this.npcs) {
            return null;
        }
        this.npcs.children.iterate(function (npc) {
            if (npc && npc.npcDef && npc.npcDef.key === key) {
                found = npc;
            }
        });
        return found;
    },

    clickStairs: function (hit) {
        var interact;
        var pos;
        this.engageTarget = null;
        this.talkTarget = null;
        this.lootTarget = null;
        if (!hit) {
            return false;
        }
        interact = hit.interact || (typeof getTileInteract === 'function'
            ? getTileInteract(this.zoneId, hit.tx, hit.ty)
            : null);
        if (!interact) {
            interact = { kind: hit.kind };
        }
        if (this.stationInRange && this.stationInRange(hit)) {
            return this.useStairsInteract(interact);
        }
        pos = typeof tileCenter === 'function' ? tileCenter(hit.tx, hit.ty) : null;
        if (pos) {
            this.setWalk(pos.x, pos.y, { allowEnd: true });
        }
        return true;
    },

    clearFish: function () {
        this.fishAction = null;
        this.fishTarget = null;
    },

    clearGather: function () {
        this.clearFish();
        this.clearChop();
        this.clearMine();
        this.clearStationWalk();
    },

    clearChop: function () {
        this.chopAction = null;
        this.chopTarget = null;
    },

    clearMine: function () {
        this.mineAction = null;
        this.mineTarget = null;
        this.clearMineFx();
    },

    clearOreNodeMarkers: function () {
        var key;
        if (!this.oreNodeMarkers) {
            this.oreNodeMarkers = {};
            return;
        }
        for (key in this.oreNodeMarkers) {
            if (this.oreNodeMarkers[key] && this.oreNodeMarkers[key].destroy) {
                this.oreNodeMarkers[key].destroy();
            }
        }
        this.oreNodeMarkers = {};
    },

    clearShaftMarkers: function () {
        var i;
        var entry;
        if (!this.shaftMarkers) {
            this.shaftMarkers = [];
            return;
        }
        for (i = 0; i < this.shaftMarkers.length; i++) {
            entry = this.shaftMarkers[i];
            if (entry && entry.root && entry.root.destroy) {
                entry.root.destroy();
            }
            if (entry && this.ground && this.ground.getTileAt) {
                var tile = this.ground.getTileAt(entry.tx, entry.ty);
                if (tile) {
                    tile.tint = 0xffffff;
                }
            }
        }
        this.shaftMarkers = [];
    },

    paintShaftMarker: function (tx, ty, kind) {
        var style = typeof shaftMarkerStyle === 'function' ? shaftMarkerStyle(kind) : null;
        var pos;
        var root;
        var glow;
        var core;
        var rim;
        var glyph;
        var label;
        var depth;
        var tile;
        var labelText;
        if (!style || !this.tileGrid || !inBounds(tx, ty)) {
            return null;
        }
        pos = tileCenter(tx, ty);
        depth = (typeof DEPTH !== 'undefined' && DEPTH.LABEL) ? DEPTH.LABEL : 7;
        root = this.add.container(pos.x, pos.y);
        glow = this.add.circle(0, 2, 7, style.color, 0.38);
        core = this.add.circle(0, 2, 3.2, style.color, 0.92);
        rim = this.add.circle(0, 2, 5.5, style.color, 0);
        if (rim.setStrokeStyle) {
            rim.setStrokeStyle(1, 0xffffff, 0.5);
        }
        glyph = this.add.text(0, 1, style.glyph || '', {
            fontSize: '9px',
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        labelText = style.label;
        if (kind === 'stairs-up' && (this.dungeonFloor || 0) <= 1) {
            labelText = 'Exit';
        }
        label = this.add.text(0, (String(labelText).indexOf('\n') >= 0) ? -16 : -11, labelText, {
            fontSize: '8px',
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            color: style.labelColor || '#ffe08a',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        root.add([glow, core, rim, glyph, label]);
        root.setDepth(depth);
        root._shaftPulse = true;
        root._shaftGlow = glow;
        root._shaftCore = core;
        if (this.ground && this.ground.getTileAt) {
            tile = this.ground.getTileAt(tx, ty);
            if (tile) {
                tile.tint = style.color;
            }
        }
        this.shaftMarkers = this.shaftMarkers || [];
        this.shaftMarkers.push({
            tx: tx,
            ty: ty,
            kind: kind,
            root: root,
            approach: style.approach || ''
        });
        return root;
    },

    paintInteractMarkersForKinds: function (zoneId, kinds) {
        var bag;
        var key;
        var parts;
        var tx;
        var ty;
        var interact;
        var want = {};
        var i;
        if (!zoneId || !kinds || !kinds.length) {
            return;
        }
        for (i = 0; i < kinds.length; i++) {
            want[kinds[i]] = true;
        }
        bag = typeof ZONE_INTERACT !== 'undefined' ? ZONE_INTERACT[zoneId] : null;
        if (!bag) {
            return;
        }
        for (key in bag) {
            if (!Object.prototype.hasOwnProperty.call(bag, key)) {
                continue;
            }
            interact = bag[key];
            if (!interact || !interact.kind || !want[interact.kind]) {
                continue;
            }
            parts = String(key).split(',');
            tx = parseInt(parts[0], 10);
            ty = parseInt(parts[1], 10);
            if (!isNaN(tx) && !isNaN(ty)) {
                this.paintShaftMarker(tx, ty, interact.kind);
            }
        }
    },

    refreshShaftMarkers: function () {
        var meta;
        this.clearShaftMarkers();
        if (!this.tileGrid || this.interiorId) {
            return;
        }
        if (this.zoneId === 'darkmine') {
            this.paintInteractMarkersForKinds('darkmine', ['dungeon-enter']);
            return;
        }
        if (this.zoneId === 'highlands') {
            this.paintInteractMarkersForKinds('highlands', ['den-boulder', 'dragon-den']);
            return;
        }
        if (this.zoneId === 'dragonden') {
            this.paintInteractMarkersForKinds('dragonden', ['dragon-den-exit']);
            return;
        }
        if (this.zoneId !== 'dungeon') {
            return;
        }
        meta = this.dungeonMeta || {};
        if (meta.stairsUp) {
            this.paintShaftMarker(meta.stairsUp.x, meta.stairsUp.y, 'stairs-up');
        }
        if (meta.stairsDown) {
            this.paintShaftMarker(meta.stairsDown.x, meta.stairsDown.y, 'stairs-down');
        }
        if (meta.surface) {
            this.paintShaftMarker(meta.surface.x, meta.surface.y, 'surface-portal');
        }
    },

    clearZoneBorderLabels: function () {
        var i;
        var label;
        if (!this.zoneBorderLabels) {
            this.zoneBorderLabels = [];
            return;
        }
        for (i = 0; i < this.zoneBorderLabels.length; i++) {
            label = this.zoneBorderLabels[i];
            if (label && label.destroy) {
                label.destroy();
            }
        }
        this.zoneBorderLabels = [];
    },

    refreshZoneBorderLabels: function () {
        var zone;
        var dirs;
        var i;
        var dir;
        var nid;
        var text;
        var pos;
        var label;
        var depth;
        this.clearZoneBorderLabels();
        if (!this.tileGrid || this.interiorId) {
            return;
        }
        if (this.zoneId === 'dungeon' || this.zoneId === 'dragonden') {
            return;
        }
        zone = ZONES[this.zoneId];
        if (!zone || zone.hidden) {
            return;
        }
        dirs = ['n', 's', 'e', 'w'];
        depth = (typeof DEPTH !== 'undefined' && DEPTH.LABEL) ? DEPTH.LABEL : 7;
        for (i = 0; i < dirs.length; i++) {
            dir = dirs[i];
            nid = neighborId(zone, dir);
            if (!nid) {
                continue;
            }
            text = typeof zoneBorderLabelText === 'function'
                ? zoneBorderLabelText(nid)
                : ((ZONES[nid] && ZONES[nid].name) || nid);
            if (!text) {
                continue;
            }
            pos = typeof zoneExitLabelPos === 'function'
                ? zoneExitLabelPos(dir)
                : tileCenter(Math.floor(MAP_W / 2), Math.floor(MAP_H / 2));
            label = this.add.text(pos.x, pos.y, text, {
                fontSize: '9px',
                fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
                color: '#d8e6ff',
                stroke: '#0a1020',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setDepth(depth).setAlpha(0.52);
            this.zoneBorderLabels.push(label);
        }
    },

    tickShaftMarkers: function (time) {
        var i;
        var entry;
        var root;
        var t = (time || 0) / 1000;
        var pulse = 0.28 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.4));
        if (!this.shaftMarkers) {
            return;
        }
        for (i = 0; i < this.shaftMarkers.length; i++) {
            entry = this.shaftMarkers[i];
            root = entry && entry.root;
            if (!root || !root.active || !root._shaftPulse) {
                continue;
            }
            if (root._shaftGlow && root._shaftGlow.setAlpha) {
                root._shaftGlow.setAlpha(pulse);
            }
            if (root._shaftCore && root._shaftCore.setAlpha) {
                root._shaftCore.setAlpha(0.75 + 0.2 * (0.5 + 0.5 * Math.sin(t * 3.1 + i)));
            }
            root.y = tileCenter(entry.tx, entry.ty).y + Math.sin(t * 2.1 + i) * 0.6;
        }
    },

    tryShaftApproachChat: function () {
        var at;
        var i;
        var entry;
        var now;
        var key;
        var dist;
        if (!this.player || !this.shaftMarkers || !this.shaftMarkers.length) {
            return;
        }
        if (this.encounterLock || this.exitLock) {
            return;
        }
        at = worldToTile(this.player.x, this.player.y);
        now = this.time ? this.time.now : 0;
        for (i = 0; i < this.shaftMarkers.length; i++) {
            entry = this.shaftMarkers[i];
            if (!entry || !entry.approach) {
                continue;
            }
            dist = Math.abs(at.tx - entry.tx) + Math.abs(at.ty - entry.ty);
            if (dist > 2) {
                continue;
            }
            key = entry.kind + ':' + entry.tx + ',' + entry.ty;
            if (this.shaftChatKey === key && now && now < this.shaftChatUntil) {
                return;
            }
            this.shaftChatKey = key;
            this.shaftChatUntil = now + 4500;
            Hud.log(entry.approach);
            return;
        }
    },

    removeOreNodeMarker: function (tx, ty) {
        var key = this.depleteKey(tx, ty);
        var marker = this.oreNodeMarkers && this.oreNodeMarkers[key];
        var tile;
        if (marker && marker.destroy) {
            marker.destroy();
        }
        if (this.oreNodeMarkers) {
            delete this.oreNodeMarkers[key];
        }
        if (this.ground && this.ground.getTileAt) {
            tile = this.ground.getTileAt(tx, ty);
            if (tile) {
                tile.tint = 0xffffff;
            }
        }
    },

    paintOreNodeAt: function (tx, ty, ore) {
        var key = this.depleteKey(tx, ty);
        var color = typeof oreNodeColor === 'function' ? oreNodeColor(ore) : 0x9a9088;
        var pos;
        var marker;
        var tile;
        if (!this.tileGrid || !this.tileGrid[ty] || this.tileGrid[ty][tx] !== TILE.ROCK) {
            return;
        }
        if (this.isTileDepleted(tx, ty)) {
            return;
        }
        this.removeOreNodeMarker(tx, ty);
        pos = tileCenter(tx, ty);
        marker = this.add.container(pos.x, pos.y);
        marker.add([
            this.add.circle(0, 1, 5, color, 0.42),
            this.add.circle(-2, -1, 2, color, 0.9),
            this.add.circle(2, 0, 1.5, 0xffffff, 0.55)
        ]);
        marker.setDepth(3);
        this.oreNodeMarkers = this.oreNodeMarkers || {};
        this.oreNodeMarkers[key] = marker;
        if (this.ground && this.ground.getTileAt) {
            tile = this.ground.getTileAt(tx, ty);
            if (tile) {
                tile.tint = color;
            }
        }
    },

    refreshOreNodeMarkers: function () {
        var y;
        var x;
        var rock;
        this.clearOreNodeMarkers();
        if (!this.tileGrid || this.interiorId || this.zoneId === 'dungeon') {
            return;
        }
        for (y = 0; y < this.tileGrid.length; y++) {
            if (!this.tileGrid[y]) {
                continue;
            }
            for (x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x] !== TILE.ROCK) {
                    continue;
                }
                rock = typeof mineRockAt === 'function'
                    ? mineRockAt(x, y, this.zoneId, this.tileGrid, {
                        houseRects: this.houseRectsNow(),
                        interior: !!this.interiorId
                    })
                    : null;
                if (rock && rock.ore) {
                    this.paintOreNodeAt(x, y, rock.ore);
                }
            }
        }
    },

    clearMineFx: function () {
        var fx = this.mineFx;
        if (!fx) {
            return;
        }
        if (fx.sparkTimer && fx.sparkTimer.remove) {
            fx.sparkTimer.remove(false);
        }
        if (fx.flash && fx.flash.destroy) {
            fx.flash.destroy();
        }
        if (fx.bobTween) {
            if (fx.bobTween.stop) {
                fx.bobTween.stop();
            }
            if (this.player && typeof fx.baseX === 'number') {
                this.player.x = fx.baseX;
            }
        }
        this.mineFx = null;
    },

    spawnMineSpark: function (x, y, color) {
        var spark;
        var dx = Phaser.Math.Between(-5, 5);
        var dy = Phaser.Math.Between(-8, -2);
        spark = this.add.circle(x + dx * 0.2, y - 2, Phaser.Math.Between(1, 2), color, 0.95);
        spark.setDepth(12);
        this.tweens.add({
            targets: spark,
            x: x + dx,
            y: y + dy,
            alpha: 0,
            duration: 220,
            ease: 'Quad.easeOut',
            onComplete: function () {
                if (spark && spark.destroy) {
                    spark.destroy();
                }
            }
        });
    },

    startMineFx: function (hit, ore) {
        var self = this;
        var pos;
        var color;
        var baseX;
        this.clearMineFx();
        if (!hit || !this.player) {
            return;
        }
        pos = tileCenter(hit.tx, hit.ty);
        color = typeof oreNodeColor === 'function' ? oreNodeColor(ore) : 0xd4a35a;
        baseX = this.player.x;
        this.mineFx = {
            baseX: baseX,
            flash: this.add.rectangle(pos.x, pos.y, 14, 14, color, 0.18).setDepth(4),
            sparkTimer: this.time.addEvent({
                delay: 260,
                loop: true,
                callback: function () {
                    self.spawnMineSpark(pos.x, pos.y, color);
                    if (self.mineFx && self.mineFx.flash) {
                        self.mineFx.flash.setAlpha(0.28);
                        self.tweens.add({
                            targets: self.mineFx.flash,
                            alpha: 0.12,
                            duration: 140
                        });
                    }
                }
            }),
            bobTween: this.tweens.add({
                targets: this.player,
                x: baseX + 1.5,
                duration: 110,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        };
        this.spawnMineSpark(pos.x, pos.y, color);
    },

    depleteKey: function (tx, ty) {
        return (this.zoneId || '') + ':' + tx + ',' + ty;
    },

    depleteUntil: function (entry) {
        if (entry == null) {
            return 0;
        }
        if (typeof entry === 'number') {
            return entry;
        }
        return typeof entry.until === 'number' ? entry.until : 0;
    },

    isTileDepleted: function (tx, ty) {
        var key = this.depleteKey(tx, ty);
        var entry = this.depletedTiles && this.depletedTiles[key];
        var until;
        if (!entry) {
            return false;
        }
        if (typeof entry.ticksLeft === 'number') {
            if (entry.ticksLeft <= 0) {
                delete this.depletedTiles[key];
                return false;
            }
            return true;
        }
        until = this.depleteUntil(entry);
        if (!until) {
            return false;
        }
        if (this.time.now >= until) {
            delete this.depletedTiles[key];
            return false;
        }
        return true;
    },

    setTileIndex: function (tx, ty, index) {
        if (!this.tileGrid || !this.tileGrid[ty]) {
            return;
        }
        this.tileGrid[ty][tx] = index;
        if (this.ground) {
            this.ground.putTileAt(index, tx, ty);
        }
    },

    restoreDepletedTile: function (key, tx, ty, emptyIndex, fullIndex) {
        var rock;
        if (!this.tileGrid || this.zoneId !== key.split(':')[0]) {
            return;
        }
        if (this.depletedTiles) {
            delete this.depletedTiles[key];
        }
        if (this.tileGrid[ty] && this.tileGrid[ty][tx] === emptyIndex) {
            this.setTileIndex(tx, ty, fullIndex);
        }
        if (fullIndex === TILE.ROCK) {
            rock = typeof mineRockAt === 'function'
                ? mineRockAt(tx, ty, this.zoneId, this.tileGrid, {
                    houseRects: this.houseRectsNow(),
                    interior: !!this.interiorId
                })
                : null;
            if (rock && rock.ore) {
                this.paintOreNodeAt(tx, ty, rock.ore);
            }
        }
    },

    scheduleDepleteRestore: function (key, tx, ty, emptyIndex, fullIndex, ms) {
        /* Legacy wall-clock fallback for saves without ticksLeft. */
        var self = this;
        this.time.delayedCall(Math.max(0, ms), function () {
            var entry = self.depletedTiles && self.depletedTiles[key];
            if (entry && typeof entry.ticksLeft === 'number') {
                return;
            }
            self.restoreDepletedTile(key, tx, ty, emptyIndex, fullIndex);
        });
    },

    depleteResource: function (tx, ty, emptyIndex, respawnMs, fullIndex) {
        var key = this.depleteKey(tx, ty);
        var ms = typeof respawnMs === 'number' ? respawnMs : 10000;
        var sec = ms / 1000;
        this.depletedTiles = this.depletedTiles || {};
        this.depletedTiles[key] = {
            until: this.time.now + ms,
            authoredSec: sec,
            ticksLeft: this.secondsToSimTicks(sec),
            emptyIndex: emptyIndex,
            fullIndex: fullIndex,
            tx: tx,
            ty: ty
        };
        if (fullIndex === TILE.ROCK || (this.tileGrid && this.tileGrid[ty] && this.tileGrid[ty][tx] === TILE.ROCK)) {
            this.removeOreNodeMarker(tx, ty);
        }
        this.setTileIndex(tx, ty, emptyIndex);
    },

    reapplyDepletedTiles: function () {
        var self = this;
        var prefix;
        var now;
        if (!this.depletedTiles || !this.tileGrid || !this.zoneId) {
            return;
        }
        prefix = this.zoneId + ':';
        now = this.time.now;
        Object.keys(this.depletedTiles).forEach(function (key) {
            var entry;
            var until;
            var remain;
            var parts;
            var tx;
            var ty;
            var emptyIndex;
            var fullIndex;
            if (key.indexOf(prefix) !== 0) {
                return;
            }
            entry = self.depletedTiles[key];
            until = self.depleteUntil(entry);
            remain = until - now;
            if (!(remain > 0)) {
                delete self.depletedTiles[key];
                return;
            }
            parts = key.slice(prefix.length).split(',');
            tx = parseInt(parts[0], 10);
            ty = parseInt(parts[1], 10);
            if (!isFinite(tx) || !isFinite(ty) || !self.tileGrid[ty]) {
                return;
            }
            emptyIndex = entry && typeof entry.emptyIndex === 'number'
                ? entry.emptyIndex
                : (typeof TILE !== 'undefined' ? TILE.GRASS : 0);
            fullIndex = entry && typeof entry.fullIndex === 'number'
                ? entry.fullIndex
                : (typeof TILE !== 'undefined' ? TILE.TREE : emptyIndex);
            self.depletedTiles[key] = {
                until: now + remain,
                authoredSec: remain / 1000,
                ticksLeft: self.secondsToSimTicks(remain / 1000),
                emptyIndex: emptyIndex,
                fullIndex: fullIndex,
                tx: tx,
                ty: ty
            };
            self.setTileIndex(tx, ty, emptyIndex);
        });
    },

    exportWorldSave: function () {
        var now = this.time.now;
        var mobs = {};
        var loot = {};
        var depleted = {};
        var self = this;
        this.snapshotMobs();
        this.snapshotLoot();
        this.snapshotGraves();
        Object.keys(this.mobZoneState || {}).forEach(function (zoneId) {
            var bag = self.mobZoneState[zoneId] || {};
            var out = {};
            Object.keys(bag).forEach(function (id) {
                var row = bag[id] || {};
                var remain = 0;
                if (row.alive === false) {
                    if (typeof row.respawnTicksLeft === 'number' && row.respawnTicksLeft > 0
                            && window.GameClock && typeof GameClock.ticksToSeconds === 'function') {
                        remain = Math.max(0, Math.round(GameClock.ticksToSeconds(row.respawnTicksLeft) * 1000));
                    } else if (typeof row.remain === 'number') {
                        remain = Math.max(0, row.remain);
                    } else if (row.timer) {
                        remain = self.remainingOfTimer(row.timer);
                    } else if (row.respawnAt) {
                        remain = Math.max(0, row.respawnAt - now);
                    }
                }
                out[id] = {
                    alive: row.alive !== false,
                    x: typeof row.x === 'number' ? row.x : null,
                    y: typeof row.y === 'number' ? row.y : null,
                    remain: remain
                };
            });
            mobs[zoneId] = out;
        });
        Object.keys(this.lootZoneState || {}).forEach(function (zoneId) {
            var rows = self.lootZoneState[zoneId] || [];
            loot[zoneId] = rows.map(function (drop) {
                return {
                    id: drop.id,
                    qty: drop.qty,
                    x: drop.x,
                    y: drop.y,
                    remain: Math.max(0, (drop.until || 0) - now),
                    skipAuto: !!drop.skipAuto
                };
            }).filter(function (drop) {
                return drop.id && drop.remain > 0;
            });
        });
        var graves = {};
        Object.keys(this.graveZoneState || {}).forEach(function (zoneId) {
            var rows = self.graveZoneState[zoneId] || [];
            graves[zoneId] = rows.map(function (grave) {
                return {
                    x: grave.x,
                    y: grave.y,
                    items: (grave.items || []).map(function (row) {
                        return { id: row.id, qty: row.qty };
                    }).filter(function (row) {
                        return row.id && row.qty > 0;
                    })
                };
            }).filter(function (grave) {
                return grave.items && grave.items.length;
            });
        });
        Object.keys(this.depletedTiles || {}).forEach(function (key) {
            var entry = self.depletedTiles[key];
            var until = self.depleteUntil(entry);
            var remain = 0;
            if (entry && typeof entry.ticksLeft === 'number' && entry.ticksLeft > 0
                    && window.GameClock && typeof GameClock.ticksToSeconds === 'function') {
                remain = Math.max(0, Math.round(GameClock.ticksToSeconds(entry.ticksLeft) * 1000));
            } else {
                remain = until - now;
            }
            if (!(remain > 0)) {
                return;
            }
            depleted[key] = {
                remain: remain,
                emptyIndex: entry && typeof entry.emptyIndex === 'number' ? entry.emptyIndex : null,
                fullIndex: entry && typeof entry.fullIndex === 'number' ? entry.fullIndex : null
            };
        });
        return {
            mobZoneState: mobs,
            lootZoneState: loot,
            graveZoneState: graves,
            depletedTiles: depleted,
            unlockedDoors: JSON.parse(JSON.stringify(this.unlockedDoors || {}))
        };
    },

    importWorldSave: function (data) {
        var now;
        var self = this;
        if (!data || typeof data !== 'object') {
            return;
        }
        now = this.time.now;
        this.mobZoneState = {};
        Object.keys(data.mobZoneState || {}).forEach(function (zoneId) {
            var bag = data.mobZoneState[zoneId] || {};
            self.mobZoneState[zoneId] = {};
            Object.keys(bag).forEach(function (id) {
                var row = bag[id] || {};
                self.mobZoneState[zoneId][id] = {
                    alive: row.alive !== false,
                    x: row.x,
                    y: row.y,
                    remain: typeof row.remain === 'number' ? Math.max(0, row.remain) : 0,
                    respawnAt: 0,
                    timer: null
                };
            });
        });
        this.lootZoneState = {};
        Object.keys(data.lootZoneState || {}).forEach(function (zoneId) {
            var rows = data.lootZoneState[zoneId] || [];
            self.lootZoneState[zoneId] = rows.map(function (drop) {
                var remain = typeof drop.remain === 'number'
                    ? drop.remain
                    : Math.max(0, (drop.until || 0) - Date.now());
                return {
                    id: drop.id,
                    qty: drop.qty,
                    x: drop.x,
                    y: drop.y,
                    until: now + Math.max(0, remain),
                    skipAuto: !!drop.skipAuto
                };
            }).filter(function (drop) {
                return drop.id && drop.until > now;
            });
        });
        this.graveZoneState = {};
        Object.keys(data.graveZoneState || {}).forEach(function (zoneId) {
            var rows = data.graveZoneState[zoneId] || [];
            self.graveZoneState[zoneId] = rows.map(function (grave) {
                return {
                    x: grave.x,
                    y: grave.y,
                    items: (grave.items || []).map(function (row) {
                        return { id: row.id, qty: row.qty };
                    }).filter(function (row) {
                        return row.id && row.qty > 0;
                    })
                };
            }).filter(function (grave) {
                return grave.items && grave.items.length;
            });
        });
        this.depletedTiles = {};
        Object.keys(data.depletedTiles || {}).forEach(function (key) {
            var entry = data.depletedTiles[key];
            var remain;
            if (entry == null) {
                return;
            }
            if (typeof entry === 'number') {
                remain = Math.max(0, entry - Date.now());
                if (remain > 0) {
                    self.depletedTiles[key] = { until: now + remain };
                }
                return;
            }
            remain = typeof entry.remain === 'number'
                ? entry.remain
                : Math.max(0, (entry.until || 0) - Date.now());
            if (!(remain > 0)) {
                return;
            }
            self.depletedTiles[key] = {
                until: now + remain,
                emptyIndex: typeof entry.emptyIndex === 'number' ? entry.emptyIndex : null,
                fullIndex: typeof entry.fullIndex === 'number' ? entry.fullIndex : null
            };
        });
        this.unlockedDoors = data.unlockedDoors && typeof data.unlockedDoors === 'object'
            ? JSON.parse(JSON.stringify(data.unlockedDoors))
            : {};
    },

    tryCompleteFish: function () {
        if (!this.fishTarget) {
            return false;
        }
        if (!this.fishSpotInRange(this.fishTarget)) {
            return false;
        }
        if (this.fishAction) {
            return true;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        return this.tryFishSpot(this.fishTarget);
    },

    tryCompleteChop: function () {
        if (!this.chopTarget || this.chopAction) {
            return false;
        }
        if (!this.sceneryInRange(this.chopTarget, 28)) {
            return false;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        return this.tryChopTree(this.chopTarget);
    },

    tryCompleteMine: function () {
        if (!this.mineTarget || this.mineAction) {
            return false;
        }
        if (!this.sceneryInRange(this.mineTarget, 28)) {
            return false;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        if (this.mineTarget.denBoulder || this.mineTarget.kind === 'den-boulder') {
            return this.tryMineBoulder(this.mineTarget);
        }
        return this.tryMineRock(this.mineTarget);
    },

    checkDragonDenTiles: function () {
        var tile;
        var interact;
        if (this.exitLock || this.encounterLock || this.zoneId !== 'dragonden') {
            return;
        }
        tile = worldToTile(this.player.x, this.player.y);
        interact = typeof getTileInteract === 'function'
            ? getTileInteract(this.zoneId, tile.tx, tile.ty)
            : null;
        if (interact && interact.kind === 'dragon-den-exit') {
            this.useStairsInteract(interact);
        }
    },

    closeBankIfAway: function () {
        var npc;
        var booth;
        if (!window.Hud || !Hud.bankOpen || !Hud.bankOpen() || !this.player) {
            return;
        }
        npc = this.pickSprite(this.npcs, this.player.x, this.player.y, 64);
        if (npc && npc.npcDef && npc.npcDef.key === 'banker') {
            return;
        }
        booth = this.pickScenery(this.player.x, this.player.y);
        if (booth && booth.kind === 'booth' && this.stationInRange(booth)) {
            return;
        }
        if (typeof BANK_COUNTER !== 'undefined' && BANK_COUNTER.front) {
            booth = { tx: BANK_COUNTER.front.x, ty: BANK_COUNTER.front.y, kind: 'booth' };
            if (this.zoneId === 'haven' && this.stationInRange(booth)) {
                return;
            }
        } else if (typeof TOWN_PROPS !== 'undefined' && TOWN_PROPS.booth) {
            booth = { tx: TOWN_PROPS.booth.x, ty: TOWN_PROPS.booth.y, kind: 'booth' };
            if (this.zoneId === 'haven' && this.stationInRange(booth)) {
                return;
            }
        }
        if (Hud.hideBank) {
            Hud.hideBank();
        }
    },

    closeStationIfAway: function () {
        var kind;
        var props;
        var hit;
        if (!window.Hud || !Hud.stationOpen || !Hud.stationOpen() || !this.player) {
            return;
        }
        kind = Hud.stationKind;
        if (!kind || kind === 'booth') {
            return;
        }
        props = typeof TOWN_PROPS !== 'undefined' ? TOWN_PROPS : null;
        if (kind === 'fire') {
            if (this.groundFireAt && this.groundFires) {
                var i;
                for (i = 0; i < this.groundFires.length; i++) {
                    hit = this.groundFires[i];
                    if (hit && this.stationInRange({ tx: hit.tx, ty: hit.ty, kind: 'fire' })) {
                        return;
                    }
                }
            }
            if (Hud.hideStation) {
                Hud.hideStation();
            }
            return;
        }
        if (props && props[kind] && this.zoneId === 'haven') {
            hit = { tx: props[kind].x, ty: props[kind].y, kind: kind };
            if (this.stationInRange(hit)) {
                return;
            }
        }
        if (Hud.hideStation) {
            Hud.hideStation();
        }
    },

    closeShopIfAway: function () {
        var npc;
        if (!window.Hud || !Hud.shopOpen || !Hud.shopOpen() || !this.player) {
            return;
        }
        npc = this.pickSprite(this.npcs, this.player.x, this.player.y, 64);
        if (npc && npc.npcDef && (npc.npcDef.key === 'shopkeep' || npc.npcDef.options && npc.npcDef.options.indexOf('trade') !== -1)) {
            return;
        }
        if (Hud.hideShop) {
            Hud.hideShop();
        }
    },

    tryFishSpot: function (hit) {
        var ms;
        var self = this;
        var hero;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (!hit || hit.kind !== 'fishspot') {
            this.clearFish();
            return false;
        }
        if (this.fishAction) {
            return true;
        }
        hero = this.registry.get('hero');
        if (typeof hasTool === 'function' && typeof FISH_NET_ID !== 'undefined' && !hasTool(hero, FISH_NET_ID)) {
            Hud.log('You need a fishing net.');
            this.clearFish();
            return false;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        this.clearChop();
        this.clearMine();
        this.fishTarget = hit;
        ms = typeof fishActionMs === 'function' ? fishActionMs() : 4000;
        if (ms < 3000) {
            ms = 3000;
        }
        if (ms > 5000) {
            ms = 5000;
        }
        this.fishAction = {
            hit: hit,
            authoredSec: ms / 1000,
            ticksLeft: this.secondsToSimTicks(ms / 1000)
        };
        Hud.log('You fish…');
        return true;
    },

    finishFishAction: function () {
        var hit = this.fishTarget;
        var hero;
        var result;
        this.fishAction = null;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            this.fishTarget = null;
            return false;
        }
        if (!hit || !this.fishSpotInRange(hit)) {
            this.fishTarget = null;
            return false;
        }
        hero = this.registry.get('hero');
        result = typeof catchFish === 'function'
            ? catchFish(hero, {
                catchId: hit && hit.catchId
                    ? hit.catchId
                    : (typeof fishCatchForZone === 'function' ? fishCatchForZone(this.zoneId) : undefined)
            })
            : (typeof fishAtSpot === 'function' ? fishAtSpot(hero) : null);
        this.fishTarget = null;
        if (!result) {
            return this.examineScenery(hit);
        }
        if (result.need) {
            Hud.log(typeof needLevelChat === 'function' ? needLevelChat(result.need) : ('You need level ' + result.need + '.'));
            return true;
        }
        if (result.needTool) {
            Hud.log(result.toolName ? ('You need ' + result.toolName + '.') : 'You need a fishing net.');
            return true;
        }
        if (result.miss) {
            Hud.log('You fail to catch a fish.');
            return true;
        }
        if (result.full) {
            Hud.log('Your inventory is full.');
            return true;
        }
        if (!result.ok) {
            return true;
        }
        if (Hud.saveHero) {
            Hud.saveHero(hero);
        }
        this.refreshHud();
        if (window.Sfx && Sfx.gather) {
            Sfx.gather('fish');
        }
        Hud.log('You catch some raw shrimp.');
        return true;
    },

    sceneryInRange: function (hit, range) {
        var pos;
        var near;
        var dest;
        range = typeof range === 'number' ? range : 28;
        if (!hit || !this.player) {
            return false;
        }
        pos = this.sceneryWorldPos(hit);
        if (pos && Phaser.Math.Distance.Between(this.player.x, this.player.y, pos.x, pos.y) < range) {
            return true;
        }
        near = typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
        if (!near) {
            return false;
        }
        dest = tileCenter(near.tx, near.ty);
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, dest.x, dest.y) < 10;
    },

    clickChopTree: function (hit) {
        this.engageTarget = null;
        this.talkTarget = null;
        this.clearGather();
        if (!hit || this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (this.isTileDepleted(hit.tx, hit.ty)) {
            Hud.log('The tree is exhausted.');
            return false;
        }
        this.chopTarget = hit;
        if (this.sceneryInRange(hit, 28)) {
            return this.tryChopTree(hit);
        }
        var near = typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
        if (!near) {
            this.chopTarget = null;
            return this.examineScenery(hit);
        }
        var dest = tileCenter(near.tx, near.ty);
        this.setWalk(dest.x, dest.y, { allowEnd: true, keepChop: true });
        return true;
    },

    tryChopTree: function (hit) {
        var ms;
        var self = this;
        var hero = this.registry.get('hero');
        var tree;
        var gate;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (!hit) {
            this.clearChop();
            return false;
        }
        if (this.isTileDepleted(hit.tx, hit.ty)) {
            Hud.log('The tree is exhausted.');
            this.clearChop();
            return false;
        }
        tree = typeof woodcutTreeAt === 'function'
            ? woodcutTreeAt(hit.tx, hit.ty, this.zoneId, this.tileGrid)
            : null;
        if (tree && typeof resourceLevelGate === 'function') {
            gate = resourceLevelGate(hero, 'woodcutting', tree.log);
            if (!gate.ok) {
                Hud.log(typeof needLevelChat === 'function'
                    ? needLevelChat(gate.need)
                    : ('You need level ' + gate.need + '.'));
                this.clearChop();
                return false;
            }
        }
        if (typeof hasAnyToolKind === 'function' ? !hasAnyToolKind(hero, 'axe')
                : (typeof hasTool === 'function' && typeof WOODCUT_AXE_ID !== 'undefined' && !hasTool(hero, WOODCUT_AXE_ID))) {
            Hud.log('You need a stronger axe.');
            this.clearChop();
            return false;
        }
        if (this.chopAction) {
            return true;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        this.clearMine();
        if (this.fishAction) {
            this.clearFish();
        }
        this.chopTarget = hit;
        if (tree) {
            this.chopTarget.log = tree.log;
        }
        ms = typeof skillActionMs === 'function'
            ? skillActionMs(WOODCUT_ACTION_MS_MIN, WOODCUT_ACTION_MS_MAX)
            : 4000;
        this.chopAction = {
            hit: hit,
            authoredSec: ms / 1000,
            ticksLeft: this.secondsToSimTicks(ms / 1000)
        };
        Hud.log('You swing your axe…');
        return true;
    },

    finishChopAction: function () {
        var hit = this.chopTarget;
        var hero;
        var result;
        this.chopAction = null;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            this.chopTarget = null;
            return false;
        }
        if (!hit || !this.sceneryInRange(hit, 28) || this.isTileDepleted(hit.tx, hit.ty)) {
            this.chopTarget = null;
            return false;
        }
        hero = this.registry.get('hero');
        result = typeof chopAtTree === 'function'
            ? chopAtTree(hero, { log: hit.log || (typeof treeSpecForZone === 'function'
                ? treeSpecForZone(this.zoneId).log
                : 'logs') })
            : null;
        this.chopTarget = null;
        if (!result) {
            return this.examineScenery(hit);
        }
        if (result.need) {
            Hud.log(typeof needLevelChat === 'function'
                ? needLevelChat(result.need)
                : ('You need level ' + result.need + '.'));
            return true;
        }
        if (result.needTool) {
            Hud.log('You need a stronger axe.');
            return true;
        }
        if (result.full) {
            Hud.log('Your inventory is full.');
            return true;
        }
        if (!result.ok) {
            return true;
        }
        this.depleteResource(hit.tx, hit.ty, TILE.GRASS2, WOODCUT_RESPAWN_MS, TILE.TREE);
        if (Hud.saveHero) {
            Hud.saveHero(hero);
        }
        this.refreshHud();
        if (window.Sfx && Sfx.gather) {
            Sfx.gather('chop');
        }
        Hud.log('You chop some ' + (typeof itemName === 'function' ? itemName(result.id) : result.id) + '.');
        return true;
    },

    clickMineBoulder: function (hit) {
        this.engageTarget = null;
        this.talkTarget = null;
        this.clearGather();
        if (!hit || this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        this.mineTarget = hit;
        this.mineTarget.denBoulder = true;
        if (this.sceneryInRange(hit, 28)) {
            return this.tryMineBoulder(hit);
        }
        var near = typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
        if (!near) {
            this.mineTarget = null;
            return this.examineScenery(hit);
        }
        var dest = tileCenter(near.tx, near.ty);
        this.setWalk(dest.x, dest.y, { allowEnd: true, keepMine: true });
        return true;
    },

    tryMineBoulder: function (hit) {
        var ms;
        var self = this;
        var hero = this.registry.get('hero');
        var needTier = typeof DEN_BOULDER_PICK_TIER === 'number' ? DEN_BOULDER_PICK_TIER : 5;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (!hit) {
            this.clearMine();
            return false;
        }
        if (typeof isDragonDenOpen === 'function' && isDragonDenOpen(hero)) {
            Hud.log('The cave mouth is already clear.');
            this.clearMine();
            return false;
        }
        if (typeof hasDiamondPickOrBetter === 'function'
                ? !hasDiamondPickOrBetter(hero)
                : (typeof hasToolTierAtLeast === 'function' && !hasToolTierAtLeast(hero, 'pickaxe', needTier))) {
            Hud.log('You need a diamond pickaxe to mine this boulder.');
            this.clearMine();
            return false;
        }
        if (this.mineAction) {
            return true;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        this.clearChop();
        if (this.fishAction) {
            this.clearFish();
        }
        this.mineTarget = hit;
        this.mineTarget.denBoulder = true;
        ms = typeof skillActionMs === 'function'
            ? skillActionMs(MINE_ACTION_MS_MIN, MINE_ACTION_MS_MAX)
            : 4000;
        this.mineAction = {
            hit: hit,
            denBoulder: true,
            authoredSec: ms / 1000,
            ticksLeft: this.secondsToSimTicks(ms / 1000)
        };
        Hud.log('You chip at the sealing boulder…');
        return true;
    },

    finishMineBoulder: function () {
        var hit = this.mineTarget;
        var hero;
        this.mineAction = null;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            this.mineTarget = null;
            return false;
        }
        if (!hit || !this.sceneryInRange(hit, 28)) {
            this.mineTarget = null;
            return false;
        }
        hero = this.registry.get('hero');
        if (typeof hasDiamondPickOrBetter === 'function' && !hasDiamondPickOrBetter(hero)) {
            Hud.log('You need a diamond pickaxe to mine this boulder.');
            this.mineTarget = null;
            return true;
        }
        if (typeof markDragonDenOpen === 'function') {
            markDragonDenOpen(hero);
        } else {
            hero.flags = hero.flags || {};
            hero.flags.dragonDenOpen = true;
        }
        this.mineTarget = null;
        this.applyDragonDenGate();
        this.refreshOreNodeMarkers();
        this.refreshShaftMarkers();
        if (typeof gainSkillXp === 'function') {
            gainSkillXp(hero, 'mining', 80);
        }
        if (Hud.saveHero) {
            Hud.saveHero(hero);
        }
        this.refreshHud();
        Hud.log('The boulder shatters. A scorched cave mouth opens into the Dragon Den.');
        return true;
    },

    enterDragonDen: function () {
        var gate = DRAGON_DEN_GATE;
        var hero = this.registry.get('hero');
        var spawn;
        if (typeof isDragonDenOpen === 'function' && !isDragonDenOpen(hero)) {
            Hud.log('A boulder still seals the cave.');
            return false;
        }
        spawn = gate ? tileCenter(gate.denSpawn.x, gate.denSpawn.y) : tileCenter(18, 22);
        this.registry.set('resumeAt', { x: spawn.x, y: spawn.y, interiorId: null });
        this.enterZone('dragonden', null);
        Hud.log('Sulphur heat rolls over you.');
        return true;
    },

    leaveDragonDen: function () {
        var gate = DRAGON_DEN_GATE;
        var out = gate
            ? tileCenter(gate.returnSpawn.x, gate.returnSpawn.y)
            : tileCenter(28, 12);
        this.registry.set('resumeAt', { x: out.x, y: out.y, interiorId: null });
        this.enterZone('highlands', null);
        Hud.log('Cool highland wind replaces the den\'s heat.');
        return true;
    },

    clickMineRock: function (hit) {
        if (!hit || this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (this.mineAction && this.mineTarget
                && this.mineTarget.tx === hit.tx && this.mineTarget.ty === hit.ty) {
            return true;
        }
        this.engageTarget = null;
        this.talkTarget = null;
        this.clearGather();
        if (this.isTileDepleted(hit.tx, hit.ty)) {
            Hud.log('The rock is exhausted.');
            return false;
        }
        this.mineTarget = hit;
        if (this.sceneryInRange(hit, 28)) {
            return this.tryMineRock(hit);
        }
        var near = typeof nearestWalkableTile === 'function'
            ? nearestWalkableTile(this.tileGrid, hit.tx, hit.ty)
            : null;
        if (!near) {
            this.mineTarget = null;
            return this.examineScenery(hit);
        }
        var dest = tileCenter(near.tx, near.ty);
        this.setWalk(dest.x, dest.y, { allowEnd: true, keepMine: true });
        return true;
    },

    tryMineRock: function (hit) {
        var ms;
        var self = this;
        var hero = this.registry.get('hero');
        var rock = typeof mineRockAt === 'function'
            ? mineRockAt(hit.tx, hit.ty, this.zoneId, this.tileGrid, {
                houseRects: this.houseRectsNow(),
                interior: !!this.interiorId
            })
            : null;
        var ore = rock && rock.ore;
        var gate;
        var label;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            return false;
        }
        if (!hit || !rock) {
            this.clearMine();
            return false;
        }
        if (this.isTileDepleted(hit.tx, hit.ty)) {
            Hud.log('The rock is exhausted.');
            this.clearMine();
            return false;
        }
        gate = typeof resourceLevelGate === 'function' ? resourceLevelGate(hero, 'mining', ore) : { ok: true };
        if (gate && !gate.ok) {
            Hud.log(typeof needLevelChat === 'function'
                ? needLevelChat(gate.need)
                : ('You need level ' + gate.need + '.'));
            this.clearMine();
            return false;
        }
        if (typeof hasAnyToolKind === 'function' ? !hasAnyToolKind(hero, 'pickaxe')
                : (typeof hasTool === 'function' && typeof MINE_PICK_ID !== 'undefined' && !hasTool(hero, MINE_PICK_ID))) {
            Hud.log('You need a stronger pickaxe.');
            this.clearMine();
            return false;
        }
        if (this.mineAction) {
            return true;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        this.clearChop();
        if (this.fishAction) {
            this.clearFish();
        }
        this.mineTarget = hit;
        this.mineTarget.ore = ore;
        ms = typeof skillActionMs === 'function'
            ? skillActionMs(MINE_ACTION_MS_MIN, MINE_ACTION_MS_MAX)
            : 4000;
        this.mineAction = {
            hit: hit,
            ore: ore,
            authoredSec: ms / 1000,
            ticksLeft: this.secondsToSimTicks(ms / 1000)
        };
        this.startMineFx(hit, ore);
        label = typeof oreNodeLabel === 'function' ? oreNodeLabel(ore) : 'ore';
        Hud.log('You swing your pickaxe at the ' + label + ' rock…');
        return true;
    },

    finishMineAction: function () {
        var hit = this.mineTarget;
        var ore = hit && hit.ore;
        var hero;
        var result;
        var label;
        this.clearMineFx();
        this.mineAction = null;
        if (this.encounterLock || (window.Hud && Hud.mode === 'battle')) {
            this.mineTarget = null;
            return false;
        }
        if (!hit || !this.sceneryInRange(hit, 28) || this.isTileDepleted(hit.tx, hit.ty)) {
            this.mineTarget = null;
            return false;
        }
        hero = this.registry.get('hero');
        result = typeof mineAtRock === 'function' ? mineAtRock(hero, ore) : null;
        this.mineTarget = null;
        if (result && result.need && !result.ok) {
            Hud.log(typeof needLevelChat === 'function'
                ? needLevelChat(result.need)
                : ('You need level ' + result.need + '.'));
            return false;
        }
        if (!result) {
            return this.examineScenery(hit);
        }
        if (result.needTool) {
            Hud.log('You need a stronger pickaxe.');
            return true;
        }
        if (result.full) {
            Hud.log('Your inventory is full.');
            return true;
        }
        if (!result.ok) {
            return true;
        }
        this.depleteResource(hit.tx, hit.ty, TILE.GRASS, MINE_RESPAWN_MS, TILE.ROCK);
        if (Hud.saveHero) {
            Hud.saveHero(hero);
        }
        this.refreshHud();
        if (window.Sfx && Sfx.gather) {
            Sfx.gather('mine');
        }
        label = typeof itemName === 'function' ? itemName(ore) : (ore || 'ore');
        Hud.log('You mine some ' + label + '.');
        return true;
    },

    examineScenery: function (hit) {
        var line;
        var rock;
        if (!hit || !hit.kind) {
            return false;
        }
        if (hit.kind === 'rock') {
            rock = typeof mineRockAt === 'function'
                ? mineRockAt(hit.tx, hit.ty, this.zoneId, this.tileGrid, {
                    houseRects: this.houseRectsNow(),
                    interior: !!this.interiorId
                })
                : null;
            line = typeof examineMineRockText === 'function'
                ? examineMineRockText(rock && rock.ore)
                : (typeof examineSceneryText === 'function' ? examineSceneryText(hit.kind) : '');
        } else {
            line = typeof examineSceneryText === 'function' ? examineSceneryText(hit.kind) : '';
        }
        if (!line) {
            return false;
        }
        Hud.log(line);
        return true;
    },

    examineNpc: function (npc) {
        var def = npc && npc.npcDef;
        var line = typeof examineNpcText === 'function' ? examineNpcText(def) : (def && def.examine) || '';
        if (!line) {
            return false;
        }
        Hud.log(line);
        return true;
    },

    examineLoot: function (loot) {
        if (!loot || loot.taken) {
            return false;
        }
        var line = typeof itemExamineText === 'function' ? itemExamineText(loot.id) : '';
        if (!line) {
            return false;
        }
        Hud.log(line);
        return true;
    },

    examineAt: function (x, y) {
        var loot = this.pickLoot(x, y, 18);
        if (loot) {
            return this.examineLoot(loot);
        }
        var npc = this.pickSprite(this.npcs, x, y, 18);
        if (npc) {
            return this.examineNpc(npc);
        }
        return this.examineScenery(this.pickScenery(x, y));
    },

    showLootExamineMenu: function (loot, pos) {
        if (!loot || loot.taken) {
            return;
        }
        if (Hud.showContextMenu) {
            Hud.showContextMenu([
                { label: 'Take', action: 'take' },
                { label: 'Examine', action: 'examine' }
            ], {
                kind: 'loot',
                itemId: loot.id,
                loot: loot,
                worldX: loot.sprite ? loot.sprite.x : 0,
                worldY: loot.sprite ? loot.sprite.y : 0,
                clientX: pos && pos.clientX != null ? pos.clientX : 16,
                clientY: pos && pos.clientY != null ? pos.clientY : 16
            });
        }
    },

    topLootFromPile: function (pile) {
        if (!pile || !pile.length) {
            return null;
        }
        return pile[pile.length - 1];
    },

    showLootContextAt: function (pile, pos) {
        if (!pile || !pile.length) {
            return;
        }
        if (pile.length > 1) {
            this.showLootPileMenu(pile, pos);
            return;
        }
        this.showLootExamineMenu(pile[0], pos);
    },

    showNpcExamineMenu: function (npc, pos) {
        if (!npc) {
            return;
        }
        var items = [
            { label: 'Talk-to', action: 'talk' },
            { label: 'Examine', action: 'examine' }
        ];
        if (npc.npcDef && npc.npcDef.key === 'dummy') {
            items.push({ label: 'Duel', action: 'duel' });
        } else if (npc.npcDef && npc.npcDef.options && npc.npcDef.options.indexOf('trade') !== -1) {
            items.push({ label: 'Trade', action: 'trade-npc' });
        } else if (npc.npcDef && npc.npcDef.key !== 'banker') {
            items.push({ label: 'Pickpocket', action: 'pickpocket' });
        }
        if (Hud.showContextMenu) {
            Hud.showContextMenu(items, {
                worldX: npc.x,
                worldY: npc.y,
                npc: npc,
                clientX: pos && pos.clientX != null ? pos.clientX : 16,
                clientY: pos && pos.clientY != null ? pos.clientY : 16
            });
        }
    },

    armLongPress: function (pointer) {
        if (!pointer || this.isRightClick(pointer) || !pointer.event) {
            this.cancelLongPress();
            return;
        }
        var x = pointer.worldX;
        var y = pointer.worldY;
        var hasLoot = !!(this.pickLootPile(x, y, 18) || []).length;
        var hasNpc = !!this.pickSprite(this.npcs, x, y, 18);
        if (!hasLoot && !hasNpc && !this.pendingLootTake) {
            this.cancelLongPress();
            return;
        }
        this.cancelLongPress({ keepPendingLoot: true });
        var ev = pointer.event;
        this.longPressPtr = {
            x: x,
            y: y,
            clientX: ev.clientX != null ? ev.clientX : 16,
            clientY: ev.clientY != null ? ev.clientY : 16
        };
        this.longPressTimer = this.time.delayedCall(LONG_PRESS_MS, this.fireLongPress, [], this);
    },

    onLongPressMove: function (pointer) {
        if (!this.longPressPtr || !pointer) {
            return;
        }
        var dx = pointer.worldX - this.longPressPtr.x;
        var dy = pointer.worldY - this.longPressPtr.y;
        if ((dx * dx) + (dy * dy) > LONG_PRESS_SLOP * LONG_PRESS_SLOP) {
            /* Drop the hold-menu timer; pointerup can still take top loot. */
            if (this.longPressTimer) {
                this.longPressTimer.remove(false);
                this.longPressTimer = null;
            }
            this.longPressPtr = null;
        }
    },

    onPointerUp: function () {
        this.cancelLongPress({ takePendingLoot: true });
    },

    cancelLongPress: function (opts) {
        var pending;
        var pile;
        var top;
        opts = opts || {};
        if (this.longPressTimer) {
            this.longPressTimer.remove(false);
            this.longPressTimer = null;
        }
        this.longPressPtr = null;
        pending = this.pendingLootTake;
        if (opts.keepPendingLoot) {
            return;
        }
        this.pendingLootTake = null;
        if (opts.takePendingLoot && pending) {
            pile = this.pickLootPile(pending.x, pending.y, 18);
            top = this.topLootFromPile(pile);
            if (top) {
                this.queueLootTake(top);
            }
        }
    },

    fireLongPress: function () {
        var saved = this.longPressPtr;
        this.longPressTimer = null;
        this.longPressPtr = null;
        this.pendingLootTake = null;
        /* Hold opens the menu instead of finishing a queued take/attack walk. */
        this.lootTarget = null;
        if (saved && this.clearWalk) {
            this.clearWalk();
        }
        if (!saved) {
            return;
        }
        this.longPressAt(saved.x, saved.y, saved);
    },

    longPressAt: function (x, y, pos) {
        if (this.encounterLock || Hud.mode === 'battle' || Hud.mode === 'title') {
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            return;
        }
        var lootPile = this.pickLootPile(x, y, 18);
        if (lootPile && lootPile.length) {
            if (this.clearWalk) {
                this.clearWalk();
            }
            this.talkTarget = null;
            this.engageTarget = null;
            this.clearFish();
            this.showLootContextAt(lootPile, pos);
            return;
        }
        var npc = this.pickSprite(this.npcs, x, y, 18);
        if (!npc) {
            return;
        }
        if (this.clearWalk) {
            this.clearWalk();
        }
        this.talkTarget = null;
        this.engageTarget = null;
        this.clearFish();
        this.showNpcExamineMenu(npc, pos);
    },

    pickLoot: function (x, y, range) {
        var best = null;
        var bestD = range;
        for (var i = 0; i < this.groundLoot.length; i++) {
            var drop = this.groundLoot[i];
            if (!drop || drop.taken || !drop.sprite || !drop.sprite.visible) {
                continue;
            }
            var d = Phaser.Math.Distance.Between(x, y, drop.sprite.x, drop.sprite.y);
            if (d < bestD) {
                bestD = d;
                best = drop;
            }
        }
        return best;
    },

    makeDestX: function () {
        var arm = DEST_X_ARM;
        var mark = this.add.container(0, 0);
        var outlineA = this.add.line(0, 0, -arm, -arm, arm, arm, 0x221800, 0.95);
        var outlineB = this.add.line(0, 0, arm, -arm, -arm, arm, 0x221800, 0.95);
        var strokeA = this.add.line(0, 0, -arm, -arm, arm, arm, DEST_X_COLOR, 1);
        var strokeB = this.add.line(0, 0, arm, -arm, -arm, arm, DEST_X_COLOR, 1);
        outlineA.setLineWidth(5, 5);
        outlineB.setLineWidth(5, 5);
        strokeA.setLineWidth(2, 2);
        strokeB.setLineWidth(2, 2);
        mark.add([outlineA, outlineB, strokeA, strokeB]);
        mark.setDepth(9);
        mark.setVisible(false);
        mark.strokeColor = DEST_X_COLOR;
        mark.arm = arm;
        return mark;
    },

    placeWalkMarker: function (x, y) {
        if (this.marker) {
            this.marker.setPosition(x, y).setVisible(true);
        }
        if (this.destX) {
            this.destX.setPosition(Math.round(x), Math.round(y)).setVisible(true);
        }
    },

    setWalk: function (x, y, opts) {
        if (this.uiPaused()) {
            return;
        }
        opts = opts || {};
        if (!opts.keepFish) {
            this.clearFish();
        }
        if (!opts.keepChop) {
            this.clearChop();
        }
        if (!opts.keepMine) {
            this.clearMine();
        }
        /* Only player click-intent walks pause combat auto; engage/retaliate paths omit this. */
        if (opts.playerClick) {
            this.playerClickWalkActive = true;
        }
        this.walkTarget = { x: x, y: y };
        this.placeWalkMarker(x, y);
        this.pathCheckAt = 0;
        this.walkPath = this.computeWalkPath(x, y, opts);
        this.drawPathLine();
    },

    dirTowardZone: function (here, target) {
        if (!here || !target) {
            return null;
        }
        var dx = target.gx - here.gx;
        var dy = target.gy - here.gy;
        var horiz = dx === 0 ? null : (dx > 0 ? 'e' : 'w');
        var vert = dy === 0 ? null : (dy > 0 ? 's' : 'n');
        var horizOk = horiz && neighborId(here, horiz);
        var vertOk = vert && neighborId(here, vert);
        if (horizOk && vertOk) {
            return Math.abs(dx) >= Math.abs(dy) ? horiz : vert;
        }
        if (horizOk) {
            return horiz;
        }
        if (vertOk) {
            return vert;
        }
        return null;
    },

    exitWalkPoint: function (dir) {
        var cx = Math.floor(MAP_W / 2);
        var cy = Math.floor(MAP_H / 2);
        if (dir === 'n') {
            return tileCenter(cx, 0);
        }
        if (dir === 's') {
            return tileCenter(cx, MAP_H - 1);
        }
        if (dir === 'w') {
            return tileCenter(0, cy);
        }
        if (dir === 'e') {
            return tileCenter(MAP_W - 1, cy);
        }
        return tileCenter(cx, cy);
    },

    walkTowardZone: function (zoneId) {
        if (this.encounterLock || Hud.mode === 'battle' || Hud.mode === 'title' || Hud.mode === 'dead') {
            return;
        }
        if (this.interiorId) {
            return;
        }
        var here = ZONES[this.zoneId];
        var target = ZONES[zoneId];
        if (!here || !target) {
            return;
        }
        if (target.id === here.id) {
            this.travelZoneId = null;
            return;
        }
        var dir = this.dirTowardZone(here, target);
        if (!dir) {
            this.travelZoneId = null;
            return;
        }
        var dest = this.exitWalkPoint(dir);
        this.engageTarget = null;
        this.talkTarget = null;
        this.clearFish();
        this.travelZoneId = zoneId;
        this.setWalk(dest.x, dest.y);
    },

    clearWalk: function (opts) {
        opts = opts || {};
        if (!opts.keepTravel) {
            this.travelZoneId = null;
        }
        this.walkTarget = null;
        this.walkPath = null;
        this.walkBlocked = false;
        this.pathCheckAt = 0;
        this.playerClickWalkActive = false;
        if (this.marker) {
            this.marker.setVisible(false);
        }
        if (this.destX) {
            this.destX.setVisible(false);
        }
        this.clearPathLine();
    },

    clearPathLine: function () {
        if (this.pathGfx) {
            this.pathGfx.clear();
            this.pathGfx.setVisible(false);
        }
    },

    collectOccupiedTiles: function (destX, destY) {
        var occ = {};
        var size = typeof TILE_SIZE === 'number' ? TILE_SIZE : 16;
        var markSprite = function (sprite) {
            if (!sprite || !sprite.active) {
                return;
            }
            if (destX != null && Phaser.Math.Distance.Between(sprite.x, sprite.y, destX, destY) < 12) {
                return;
            }
            var left;
            var right;
            var top;
            var bottom;
            if (sprite.body) {
                left = sprite.body.x;
                right = sprite.body.x + sprite.body.width;
                top = sprite.body.y;
                bottom = sprite.body.y + sprite.body.height;
            } else {
                left = sprite.x - 6;
                right = sprite.x + 6;
                top = sprite.y - 6;
                bottom = sprite.y + 6;
            }
            var tx0 = Math.floor(left / size);
            var tx1 = Math.floor((right - 1) / size);
            var ty0 = Math.floor(top / size);
            var ty1 = Math.floor((bottom - 1) / size);
            var ty;
            var tx;
            for (ty = ty0; ty <= ty1; ty++) {
                for (tx = tx0; tx <= tx1; tx++) {
                    occ[tx + ',' + ty] = true;
                }
            }
            var type = sprite.mobDef && sprite.mobDef.type;
            if (isGiantMob(type)) {
                var extra = giantFootprintTiles(sprite.x, sprite.y);
                var i;
                for (i = 0; i < extra.length; i++) {
                    occ[extra[i].tx + ',' + extra[i].ty] = true;
                }
            }
        };
        /* Path around NPCs and living mobs; physics still phases through NPCs. */
        if (this.npcs) {
            this.npcs.children.iterate(markSprite);
        }
        if (this.mobs) {
            this.mobs.children.iterate(function (mob) {
                if (mob && mob.aliveMob) {
                    markSprite(mob);
                }
            });
        }
        return occ;
    },

    computeWalkPath: function (toX, toY, opts) {
        opts = opts || {};
        var grid = this.tileGrid;
        if (!grid) {
            return [{ x: toX, y: toY }];
        }
        var start = worldToTile(this.player.x, this.player.y);
        var end = worldToTile(toX, toY);
        if (!opts.allowEnd && !tileWalkable(grid, end.tx, end.ty)) {
            var near = nearestWalkableTile(grid, end.tx, end.ty);
            if (near) {
                end = near;
                var snapped = tileCenter(end.tx, end.ty);
                toX = snapped.x;
                toY = snapped.y;
                this.walkTarget = { x: toX, y: toY };
                this.placeWalkMarker(toX, toY);
            }
        }
        var occupied = this.collectOccupiedTiles(toX, toY);
        var tiles = findTilePath(grid, start.tx, start.ty, end.tx, end.ty, {
            avoid: occupied,
            allowEnd: true
        });
        this.walkBlocked = false;
        if (!tiles) {
            tiles = findTilePath(grid, start.tx, start.ty, end.tx, end.ty, {
                avoid: occupied,
                allowEnd: true,
                nearest: true
            });
            if (tiles && tiles.length) {
                var last = tiles[tiles.length - 1];
                if (last.tx !== end.tx || last.ty !== end.ty) {
                    this.walkBlocked = true;
                    var stop = tileCenter(last.tx, last.ty);
                    return tilesToWorldPath(tiles, stop.x, stop.y);
                }
            }
        }
        if (!tiles) {
            this.walkBlocked = true;
            return [];
        }
        return tilesToWorldPath(tiles, toX, toY);
    },

    pathUsesOccupied: function (path, destX, destY) {
        if (!path || !path.length) {
            return false;
        }
        var occ = this.collectOccupiedTiles(destX, destY);
        for (var i = 0; i < path.length; i++) {
            var tile = worldToTile(path[i].x, path[i].y);
            if (occ[tile.tx + ',' + tile.ty]) {
                return true;
            }
        }
        return false;
    },

    chaseWalkTarget: function () {
        if (this.engageTarget) {
            if (!this.engageTarget.active || !this.engageTarget.aliveMob) {
                this.engageTarget = null;
            } else if (this.overworldFight && this.overworldFight.mob === this.engageTarget) {
                /* In-fight chase only while already inside mob attack range. */
                var fightMobRange = typeof mobAttackRangePx === 'function'
                    ? mobAttackRangePx(this.engageTarget)
                    : MELEE_ENGAGE_PX;
                if (this.fightDistancePx(this.engageTarget) > fightMobRange) {
                    return null;
                }
                return this.engageTarget;
            } else {
                return this.engageTarget;
            }
        }
        if (this.talkTarget) {
            if (!this.talkTarget.active) {
                this.talkTarget = null;
            } else {
                return this.talkTarget;
            }
        }
        if (this.lootTarget) {
            if (this.lootTarget.taken || !this.lootTarget.sprite) {
                this.lootTarget = null;
            } else {
                return this.lootTarget.sprite;
            }
        }
        return null;
    },

    heroEngageRangePx: function () {
        var hero = this.registry.get('hero');
        if (typeof weaponAttackRangePx === 'function') {
            return weaponAttackRangePx(hero);
        }
        return MELEE_ENGAGE_PX;
    },

    fightDistancePx: function (mob) {
        if (!this.player || !mob) {
            return Infinity;
        }
        if (typeof combatDistancePx === 'function') {
            return combatDistancePx(this.player, mob);
        }
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, mob.x, mob.y);
    },

    chaseFightMob: function () {
        var fight = this.overworldFight;
        var mob = fight && fight.mob;
        var range;
        var dist;
        var speed;
        var dx;
        var dy;
        var len;
        var vx;
        var vy;
        var nextX;
        var nextY;
        if (!mob || !mob.aliveMob || !mob.body || !this.player) {
            return;
        }
        /* Player kited beyond leash / into haven safe zone → drop fight and return home. */
        if (this.mobTargetBeyondLeash(mob, this.player.x, this.player.y)
            || this.mobOutsideLeash(mob)
            || this.playerInHavenSafe()) {
            this.releaseMobFromLeash(mob);
            return;
        }
        range = typeof mobAttackRangePx === 'function' ? mobAttackRangePx(mob) : MELEE_ENGAGE_PX;
        dist = this.fightDistancePx(mob);
        if (dist <= range * 0.9) {
            mob.body.setVelocity(0, 0);
        } else {
            speed = typeof mobMovePxPerSec === 'function'
                ? mobMovePxPerSec(mob)
                : (typeof GameClock !== 'undefined' && GameClock.pxPerSec
                    ? GameClock.pxPerSec(typeof mobMoveSpeed === 'function' ? mobMoveSpeed(mob) : (WALK_TILES_PER_SEC / 2))
                    : (typeof MOB_MOVE_SPEED === 'number' ? MOB_MOVE_SPEED : WALK_SPEED / 2));
            dx = this.player.x - mob.x;
            dy = this.player.y - mob.y;
            len = dist || 1;
            vx = (dx / len) * speed;
            vy = (dy / len) * speed;
            nextX = mob.x + vx;
            nextY = mob.y + vy;
            if (this.mobBeyondLeashAt(mob, nextX, nextY)
                || this.mobStepForbidden(nextX, nextY)
                || this.mobStepForbidden(mob.x + vx * 0.2, mob.y + vy * 0.2)) {
                mob.body.setVelocity(0, 0);
            } else {
                mob.body.setVelocity(vx, vy);
            }
        }
        /* Player in-fight auto-close (weapon range) — gated below. */
        this.chaseFightPlayerClose(mob, dist, range);
    },

    /*
     * During overworldFight only: auto-path the player toward the fight mob when
     * out of weapon range, but ONLY if already inside mob attack range.
     * Safe ranging (outside mobAttackRangePx) stays put. Pre-fight queueRetaliate
     * engage is separate and unchanged.
     */
    chaseFightPlayerClose: function (mob, dist, mobRange) {
        var playerRange;
        var move;
        if (!mob || !mob.aliveMob || !this.player || !this.overworldFight) {
            return;
        }
        /* Click-path wins over in-fight retaliate close-in. */
        if (this.playerClickWalkActive) {
            return;
        }
        move = this.moveFlags ? this.moveFlags() : null;
        if (move && (move.left || move.right || move.up || move.down)) {
            if (this._fightPlayerClose) {
                this._fightPlayerClose = false;
            }
            return;
        }
        if (typeof dist !== 'number') {
            dist = this.fightDistancePx(mob);
        }
        if (typeof mobRange !== 'number') {
            mobRange = typeof mobAttackRangePx === 'function' ? mobAttackRangePx(mob) : MELEE_ENGAGE_PX;
        }
        playerRange = this.heroEngageRangePx();

        /* Gate: outside mob attack range → never auto-walk toward the fight mob. */
        if (dist > mobRange) {
            if (this._fightPlayerClose) {
                this._fightPlayerClose = false;
                if (this.engageTarget === mob) {
                    this.engageTarget = null;
                }
                this.clearWalk();
            } else if (this.engageTarget === mob) {
                this.engageTarget = null;
            }
            return;
        }

        /* Inside mob attack range but outside weapon range → close in when retaliating. */
        if (dist > playerRange) {
            if (!this.autoRetaliateOn()) {
                return;
            }
            /* Don't hijack a manual click-to-walk that the player started. */
            if (this.walkTarget && !this._fightPlayerClose) {
                return;
            }
            this._fightPlayerClose = true;
            this.engageTarget = mob;
            if (!this.walkTarget) {
                this.setWalk(mob.x, mob.y, { allowEnd: true });
            }
            return;
        }

        if (this._fightPlayerClose) {
            this._fightPlayerClose = false;
            if (this.engageTarget === mob) {
                this.engageTarget = null;
            }
            this.clearWalk();
        }
    },

    chaseInRange: function (chase) {
        if (!chase || !this.player) {
            return false;
        }
        var dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, chase.x, chase.y);
        if (this.engageTarget === chase) {
            return dist <= this.heroEngageRangePx();
        }
        if (this.talkTarget === chase) {
            return dist < 22 && !this.talkBlockedByWall(chase);
        }
        if (this.lootTarget && this.lootTarget.sprite === chase) {
            return this.playerLootInRange(this.lootTarget);
        }
        return false;
    },

    playerLootInRange: function (drop) {
        if (!drop || !drop.sprite || !this.player) {
            return false;
        }
        return Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            drop.sprite.x, drop.sprite.y
        ) <= LOOT_PICKUP_PX;
    },

    queueLootTake: function (drop) {
        if (!drop || drop.taken || !drop.sprite) {
            return false;
        }
        this.engageTarget = null;
        this.talkTarget = null;
        this.clearFish();
        if (this.playerLootInRange(drop)) {
            this.lootTarget = null;
            return this.tryPickup(drop, true);
        }
        this.lootTarget = drop;
        this.setWalk(drop.sprite.x, drop.sprite.y, { allowEnd: true });
        return true;
    },

    tryCompleteLootTake: function () {
        var drop = this.lootTarget;
        if (!drop) {
            return false;
        }
        if (drop.taken || !drop.sprite) {
            this.lootTarget = null;
            return false;
        }
        if (!this.playerLootInRange(drop)) {
            if (!this.walkTarget) {
                this.setWalk(drop.sprite.x, drop.sprite.y, { allowEnd: true });
            }
            return false;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        this.lootTarget = null;
        return this.tryPickup(drop, true);
    },

    queueAttack: function (mob, opts) {
        opts = opts || {};
        if (!mob || !mob.aliveMob) {
            return false;
        }
        this.lootTarget = null;
        this.talkTarget = null;
        this.clearFish();
        this.engageTarget = mob;
        if (this.fightDistancePx(mob) <= this.heroEngageRangePx()) {
            this.beginFight(mob);
            return true;
        }
        this.setWalk(mob.x, mob.y, { allowEnd: true });
        if (!opts.silent) {
            Hud.log('You target the ' + ((mob.mobDef && mob.mobDef.type) || 'foe') + '.');
        }
        return true;
    },

    /* Auto-retaliate: chase an agroing mob like click-to-attack (no spam log). */
    queueRetaliate: function (mob) {
        if (!this.autoRetaliateOn() || !mob || !mob.aliveMob) {
            return false;
        }
        if (this.playerClickWalkActive) {
            return false;
        }
        if (this.encounterLock || this.uiPaused() || this.time.now < this.engageGrace) {
            return false;
        }
        if (this.engageTarget && this.engageTarget.aliveMob && this.engageTarget !== mob) {
            return false;
        }
        if (this.engageTarget === mob) {
            if (this.fightDistancePx(mob) <= this.heroEngageRangePx()) {
                this.beginFight(mob);
                return true;
            }
            if (!this.walkTarget) {
                this.setWalk(mob.x, mob.y, { allowEnd: true });
            }
            return true;
        }
        return this.queueAttack(mob, { silent: true });
    },

    /* Mob can still hit while agroing even if the player does not auto-engage. */
    applyMobAgroHit: function (mob) {
        var hero;
        var dealt;
        var shot;
        if (!mob || !mob.aliveMob || !this.player || this.overworldFight || this.encounterLock) {
            return;
        }
        hero = this.registry.get('hero');
        if (!hero || hero.hp <= 0) {
            return;
        }
        if (mob._agroHitTicksLeft > 0) {
            return;
        }
        mob._agroHitTicksLeft = this.secondsToSimTicks(
            typeof OW_COMBAT_TICK_SEC === 'number' ? OW_COMBAT_TICK_SEC : 0.6
        );
        dealt = typeof rollOverworldDamage === 'function'
            ? rollOverworldDamage(mob, 'player', hero)
            : 1;
        if (dealt > 0) {
            if (typeof showCombatVisualsOn === 'function' ? showCombatVisualsOn(hero) : true) {
                shot = typeof combatProjectileKind === 'function'
                    ? combatProjectileKind(mob, hero)
                    : null;
                if (shot && typeof spawnCombatProjectile === 'function') {
                    spawnCombatProjectile(this, mob.x, mob.y, this.player.x, this.player.y, shot);
                }
            }
            hero.hp = Math.max(0, hero.hp - dealt);
            if (typeof showWorldHitSplat === 'function') {
                showWorldHitSplat(this, this.player.x, this.player.y, '-' + dealt, 'hit');
            }
            if (typeof applyHeroPoison === 'function') {
                applyHeroPoison(hero, mob.mobDef && mob.mobDef.type);
            }
            if (window.Sfx && Sfx.hit) {
                Sfx.hit();
            }
        }
        this.registry.set('hero', hero);
        if (Hud.renderHero) {
            Hud.renderHero(hero);
        }
        if (hero.hp <= 0) {
            this.encounterLock = false;
            if (this.spawnDeathGravestone) {
                this.spawnDeathGravestone();
            }
            this.goToGameOver();
        }
    },

    maybeRepath: function () {
        var chase = this.chaseWalkTarget();
        var now = this.time.now;
        var tx;
        var ty;
        var moved;
        if (this.pathCheckAt && now < this.pathCheckAt) {
            return;
        }
        this.pathCheckAt = now + 280;
        if (chase) {
            if (this.chaseInRange(chase)) {
                return;
            }
            tx = chase.x;
            ty = chase.y;
            moved = !this.walkTarget ||
                Phaser.Math.Distance.Between(this.walkTarget.x, this.walkTarget.y, tx, ty) > 8;
            if (moved || this.walkBlocked || !this.walkPath || !this.walkPath.length ||
                    this.pathUsesOccupied(this.walkPath, tx, ty)) {
                this.walkTarget = { x: tx, y: ty };
                this.placeWalkMarker(tx, ty);
                this.walkPath = this.computeWalkPath(tx, ty, { allowEnd: true });
                this.drawPathLine();
            }
            return;
        }
        if (!this.walkTarget) {
            return;
        }
        if (this.walkBlocked || !this.walkPath || !this.walkPath.length || this.pathUsesOccupied(this.walkPath, this.walkTarget.x, this.walkTarget.y)) {
            this.walkPath = this.computeWalkPath(this.walkTarget.x, this.walkTarget.y, { allowEnd: true });
            this.drawPathLine();
        }
    },

    nextStepOccupied: function (aim) {
        if (!aim || !this.walkTarget) {
            return false;
        }
        var occ = this.collectOccupiedTiles(this.walkTarget.x, this.walkTarget.y);
        var from = worldToTile(this.player.x, this.player.y);
        var to = worldToTile(aim.x, aim.y);
        var dx = to.tx === from.tx ? 0 : (to.tx > from.tx ? 1 : -1);
        var dy = to.ty === from.ty ? 0 : (to.ty > from.ty ? 1 : -1);
        if (!dx && !dy) {
            return false;
        }
        var stepTx = from.tx + dx;
        var stepTy = from.ty + dy;
        if (occ[stepTx + ',' + stepTy]) {
            return true;
        }
        if (dx && dy && occ[stepTx + ',' + from.ty] && occ[from.tx + ',' + stepTy]) {
            return true;
        }
        return false;
    },

    aimWalkPoint: function () {
        if (!this.walkPath || !this.walkPath.length) {
            if (this.walkBlocked) {
                return null;
            }
            return this.walkTarget;
        }
        var dest = this.walkTarget;
        while (this.walkPath.length) {
            var next = this.walkPath[0];
            var stepDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, next.x, next.y);
            if (stepDist < 6) {
                this.walkPath.shift();
                continue;
            }
            if (this.walkPath.length > 1 && dest) {
                var toNextX = next.x - this.player.x;
                var toNextY = next.y - this.player.y;
                var toDestX = dest.x - this.player.x;
                var toDestY = dest.y - this.player.y;
                if (toNextX * toDestX + toNextY * toDestY < 0) {
                    this.walkPath.shift();
                    continue;
                }
            }
            return next;
        }
        if (this.walkBlocked) {
            return null;
        }
        return dest;
    },

    drawPathLine: function () {
        if (!this.pathGfx) {
            return;
        }
        this.pathGfx.clear();
        if (!this.walkTarget || !this.walkPath || !this.walkPath.length) {
            this.pathGfx.setVisible(false);
            return;
        }
        this.pathGfx.setVisible(true);
        this.pathGfx.lineStyle(2, PATH_LINE_COLOR, 0.8);
        this.pathGfx.beginPath();
        this.pathGfx.moveTo(Math.round(this.player.x), Math.round(this.player.y));
        for (var i = 0; i < this.walkPath.length; i++) {
            this.pathGfx.lineTo(Math.round(this.walkPath[i].x), Math.round(this.walkPath[i].y));
        }
        this.pathGfx.strokePath();
    },

    talkBlockedByWall: function (npc) {
        if (!npc || !this.player || !this.tileGrid) {
            return false;
        }
        var x0 = this.player.x;
        var y0 = this.player.y;
        var x1 = npc.x;
        var y1 = npc.y;
        var dist = Phaser.Math.Distance.Between(x0, y0, x1, y1);
        if (!(dist > 0) || dist > TALK_WALL_PX) {
            return false;
        }
        var start = worldToTile(x0, y0);
        var end = worldToTile(x1, y1);
        var steps = Math.max(2, Math.ceil(dist / 4));
        var i;
        for (i = 1; i < steps; i++) {
            var t = i / steps;
            var tile = worldToTile(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
            if ((tile.tx === start.tx && tile.ty === start.ty) ||
                (tile.tx === end.tx && tile.ty === end.ty)) {
                continue;
            }
            var row = this.tileGrid[tile.ty];
            if (!row) {
                continue;
            }
            var index = row[tile.tx];
            if (index === TILE.TREE || index === TILE.ROCK || index === TILE.WALL) {
                return true;
            }
        }
        return false;
    },

    closeDialogueIfAway: function () {
        if (!this.player || !this.dialogueNpc || !Hud.dialogueOpen || !Hud.dialogueOpen()) {
            return;
        }
        var away = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, this.dialogueNpc.x, this.dialogueNpc.y
        );
        if (away > TALK_AWAY_PX && Hud.hideDialogue) {
            Hud.hideDialogue();
        }
    },

    tryTalk: function (npc) {
        if (!npc || this.encounterLock || Hud.mode === 'battle') {
            return;
        }
        if (this.talkBlockedByWall(npc)) {
            return;
        }
        var def = npc.npcDef;
        var hero = this.registry.get('hero');
        var quest = this.registry.get('quest');
        var pages;
        var afterTalk;
        this.noteTutorial('talk');
        if (!hero.sideQuests) {
            hero.sideQuests = {
                shipment: { stage: 0, progress: 0, goal: 3 },
                bats: { stage: 0, progress: 0, goal: 4 }
            };
        }
        if (!hero.diary) {
            hero.diary = { bram: false, eat: false, bury: false, complete: false };
        }
        if (!hero.tutorials) {
            hero.tutorials = {};
        }
        if (def.key === 'guild') {
            hero.diary.bram = true;
            if (quest.stage === 0) {
                quest.stage = 1;
                quest.progress = 0;
                this.registry.set('quest', quest);
                pages = ['Goblins plague Northwood. Bring me 5 kills.'];
            } else if (quest.stage === 1) {
                pages = [quest.progress + ' of ' + quest.goal + ' goblins down. Keep at it.'];
            } else if (quest.stage === 2) {
                quest.stage = 3;
                quest.points = (quest.points || 0) + 1;
                addItem(hero, 'coins', 50);
                hero.xp += 40;
                if (typeof gainSkillXp === 'function') {
                    gainSkillXp(hero, 'attack', 25);
                    gainSkillXp(hero, 'defence', 15);
                }
                this.registry.set('quest', quest);
                this.registry.set('hero', hero);
                pages = ['The militia thanks you. 50 gold and combat training.'];
                afterTalk = function () {
                    if (Hud.showQuestComplete) {
                        Hud.showQuestComplete('Quest complete', 'Militia task — 1 QP, 50gp, Attack + Defence XP.');
                    }
                    this.levelHero(hero);
                    this.checkDiaryComplete(hero);
                }.bind(this);
            } else {
                pages = ['Emberhaven stands because of you.'];
            }
            this.registry.set('hero', hero);
        } else if (def.key === 'fisher') {
            var ship = hero.sideQuests.shipment;
            if (ship.stage === 0) {
                ship.stage = 1;
                ship.progress = 0;
                pages = ['Crabs stole my lost shipment marks. Clear 3 crabs along the shore.'];
            } else if (ship.stage === 1) {
                pages = [ship.progress + ' of ' + ship.goal + ' crabs cleared. Keep hunting.'];
            } else if (ship.stage === 2) {
                ship.stage = 3;
                quest.points = (quest.points || 0) + 1;
                addItem(hero, 'coins', 25);
                if (typeof gainSkillXp === 'function') {
                    gainSkillXp(hero, 'fishing', 20);
                }
                this.registry.set('quest', quest);
                pages = ['That crate mark is enough. Take 25gp for your trouble.'];
                afterTalk = function () {
                    if (Hud.showQuestComplete) {
                        Hud.showQuestComplete('Quest complete', 'Lost Shipment — 1 QP, 25gp, Fishing XP.');
                    }
                };
            } else {
                pages = (def.lines || []).slice();
            }
            this.registry.set('hero', hero);
        } else if (def.key === 'miner') {
            var bats = hero.sideQuests.bats;
            if (bats.stage === 0) {
                bats.stage = 1;
                bats.progress = 0;
                pages = ['Bats choke the lower shaft. Slay 4 bats and return.'];
            } else if (bats.stage === 1) {
                pages = [bats.progress + ' of ' + bats.goal + ' bats down. Keep at it.'];
            } else if (bats.stage === 2) {
                bats.stage = 3;
                quest.points = (quest.points || 0) + 1;
                addItem(hero, 'coins', 30);
                if (typeof gainSkillXp === 'function') {
                    gainSkillXp(hero, 'mining', 20);
                }
                this.registry.set('quest', quest);
                pages = ['The shaft is quieter. 30gp and a miner\'s thanks.'];
                afterTalk = function () {
                    if (Hud.showQuestComplete) {
                        Hud.showQuestComplete('Quest complete', 'Bat Clearance — 1 QP, 30gp, Mining XP.');
                    }
                };
            } else {
                pages = (def.lines || []).slice();
            }
            this.registry.set('hero', hero);
        } else if (def.key === 'witch') {
            var cost = 10;
            if (hero.gold < cost) {
                pages = ['Come back with 10 gold.'];
            } else {
                takeItem(hero, 'coins', cost);
                hero.hp = hero.maxHp;
                this.registry.set('hero', hero);
                pages = ['Your wounds close. HP restored.'];
            }
        } else {
            pages = (def.lines || []).slice();
            if (typeof applyNpcTutor === 'function' && applyNpcTutor(hero, def)) {
                this.registry.set('hero', hero);
            }
        }
        this.talkTarget = null;
        this.dialogueNpc = npc;
        this.refreshHud();
        Hud.startDialogue(def.name, pages);
        if (afterTalk) {
            afterTalk();
        }
    },

    chooseDialogueOption: function (id) {
        if (this.encounterLock || Hud.mode === 'battle') {
            return;
        }
        var npc = this.dialogueNpc;
        var def = npc && npc.npcDef;
        if (!def) {
            return;
        }
        var options = typeof npcDialogueOptions === 'function' ? npcDialogueOptions(def) : [];
        var allowed = false;
        for (var i = 0; i < options.length; i++) {
            if (options[i].id === id) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            return;
        }
        if (id === 'talk') {
            this.talkTarget = null;
            var talkHero = this.registry.get('hero');
            if (typeof applyNpcTutor === 'function' && applyNpcTutor(talkHero, def)) {
                this.registry.set('hero', talkHero);
            }
            Hud.startDialogue(def.name, (def.lines || []).slice(), options);
            return;
        }
        if (id === 'quest') {
            this.tryTalk(npc);
            return;
        }
        if (id === 'bank') {
            if (Hud.showBank) {
                Hud.showBank(def);
            }
            return;
        }
        if (id === 'trade') {
            if (Hud.showShop) {
                Hud.showShop(def);
            }
        }
    },

    levelHero: function (hero) {
        var rank = 1 + Math.floor(hero.xp / 40);
        var nextDamage = 14 + rank * 2;
        if (nextDamage > hero.damage) {
            hero.damage = nextDamage;
        }
        if (typeof applyCombatLevel === 'function') {
            applyCombatLevel(hero, false);
        }
    },

    startOverworldFight: function (mob) {
        var def = mob.mobDef || {};
        var maxHp = typeof def.hp === 'number' ? def.hp : 20;
        var beatSec = typeof OW_COMBAT_TICK_SEC === 'number' ? OW_COMBAT_TICK_SEC : 0.6;
        this.overworldFight = {
            mob: mob,
            hp: maxHp,
            maxHp: maxHp,
            tickMs: typeof OW_COMBAT_TICK_MS === 'number' ? OW_COMBAT_TICK_MS : 600,
            beatSec: beatSec,
            ticksLeft: this.secondsToSimTicks(beatSec),
            firstSwingTicks: this.secondsToSimTicks(0.22),
            busy: false
        };
        if (this.overworldTick) {
            this.overworldTick.remove(false);
            this.overworldTick = null;
        }
        if (Hud.showOverworldBattle) {
            Hud.showOverworldBattle(this, mob, this.overworldFight);
        } else if (Hud.showBattle && Hud.setMode) {
            Hud.setMode('battle');
        }
    },

    tickOverworldFight: function (forcePlayer) {
        var fight = this.overworldFight;
        var mob = fight && fight.mob;
        var hero;
        var dealt;
        var hpBefore;
        var dist;
        var playerRange;
        var mobRange;
        var specialQueued;
        if (!fight || !mob || !mob.aliveMob || fight.busy) {
            return;
        }
        fight.busy = true;
        hero = this.registry.get('hero');
        if (!hero || hero.hp <= 0) {
            this.endOverworldFight('lose');
            return;
        }
        dist = this.fightDistancePx(mob);
        playerRange = typeof weaponAttackRangePx === 'function' ? weaponAttackRangePx(hero) : MELEE_ENGAGE_PX;
        mobRange = typeof mobAttackRangePx === 'function' ? mobAttackRangePx(mob) : MELEE_ENGAGE_PX;
        /*
         * Once a fight has started (manual click or engage), swing every tick while in
         * weapon range. autoAttack / autoRetaliate only control starting fights and
         * chase-into-range — not whether an active fight deals damage.
         */
        hpBefore = fight.hp;
        dealt = 0;
        specialQueued = !!fight.specialQueued;
        fight.specialQueued = false;
        if (dist > playerRange) {
            if (forcePlayer || specialQueued) {
                Hud.log('You are out of attack range.');
            }
        } else if (typeof magicWeaponEquipped === 'function' && magicWeaponEquipped(hero)) {
            if (typeof hasWindStrikeRunes === 'function' && !hasWindStrikeRunes(hero)) {
                Hud.log('You need Air and Mind runes to attack with a staff.');
            } else if (typeof consumeAirStrikeRunes === 'function' && consumeAirStrikeRunes(hero)) {
                dealt = rollOverworldDamage('player', mob, hero, { special: specialQueued });
            } else {
                Hud.log('You need Air and Mind runes to attack with a staff.');
            }
        } else if (typeof rangedWeaponEquipped === 'function' && rangedWeaponEquipped(hero)) {
            if (typeof canShoot === 'function' && !canShoot(hero)) {
                Hud.log('Your bow needs suitable arrows (or leave ammo empty for wooden shafts).');
            } else {
                dealt = rollOverworldDamage('player', mob, hero, { special: specialQueued });
                if (typeof consumeAmmo === 'function') {
                    consumeAmmo(hero);
                }
            }
        } else {
            dealt = rollOverworldDamage('player', mob, hero, { special: specialQueued });
        }
        if (dealt > 0) {
            if (typeof showCombatVisualsOn === 'function' ? showCombatVisualsOn(hero) : true) {
                var playerShot = typeof combatProjectileKind === 'function'
                    ? combatProjectileKind('player', hero)
                    : null;
                if (playerShot && typeof spawnCombatProjectile === 'function') {
                    spawnCombatProjectile(this, this.player.x, this.player.y, mob.x, mob.y, playerShot);
                }
            }
            fight.hp = Math.max(0, fight.hp - dealt);
            showWorldHitSplat(this, mob.x, mob.y, '-' + dealt, 'hit');
            grantOverworldHitXp(hero, fight, mob, dealt, hpBefore);
            ensureSpecialEnergy(hero);
            hero.specialEnergy = Math.min(100, hero.specialEnergy + 10);
        }
        this.registry.set('hero', hero);
        if (Hud.renderOverworldBattle) {
            Hud.renderOverworldBattle(fight);
        }
        if (Hud.renderHero) {
            Hud.renderHero(hero);
        }
        if (fight.hp <= 0) {
            this.endOverworldFight('win');
            fight.busy = false;
            return;
        }
        if (dist <= mobRange) {
            dealt = rollOverworldDamage(mob, 'player', hero);
            if (dealt > 0) {
                if (typeof showCombatVisualsOn === 'function' ? showCombatVisualsOn(hero) : true) {
                    var mobShot = typeof combatProjectileKind === 'function'
                        ? combatProjectileKind(mob, hero)
                        : null;
                    if (mobShot && typeof spawnCombatProjectile === 'function') {
                        spawnCombatProjectile(this, mob.x, mob.y, this.player.x, this.player.y, mobShot);
                    }
                }
                hero.hp = Math.max(0, hero.hp - dealt);
                showWorldHitSplat(this, this.player.x, this.player.y, '-' + dealt, 'hit');
                applyHeroPoison(hero, mob.mobDef && mob.mobDef.type);
                this.registry.set('hero', hero);
                if (Hud.renderHero) {
                    Hud.renderHero(hero);
                }
                if (window.Sfx && Sfx.hit) {
                    Sfx.hit();
                }
            }
            if (hero.hp <= 0) {
                this.endOverworldFight('lose');
                fight.busy = false;
                return;
            }
        }
        fight.busy = false;
    },

    endOverworldFight: function (outcome) {
        var fight = this.overworldFight;
        var mob = fight && fight.mob;
        if (this.overworldTick) {
            this.overworldTick.remove(false);
            this.overworldTick = null;
        }
        this.overworldFight = null;
        this._fightPlayerClose = false;
        this.clearCombatRangeRings();
        if (Hud.hideOverworldBattle) {
            Hud.hideOverworldBattle();
        }
        this.registry.set('battleOutcome', outcome);
        if (outcome === 'lose') {
            this.encounterLock = false;
            this.registry.set('battleOutcome', null);
            if (this.spawnDeathGravestone) {
                this.spawnDeathGravestone();
            }
            this.goToGameOver();
            return;
        }
        if (outcome === 'flee' || outcome === 'leash') {
            this.wake();
            return;
        }
        if (outcome === 'win') {
            this.wake();
        }
    },

    tryOverworldFlee: function () {
        var fight = this.overworldFight;
        if (!fight) {
            return false;
        }
        if (Phaser.Math.Between(0, 99) < 70) {
            Hud.log('You run from the fight.');
            this.endOverworldFight('flee');
        } else {
            Hud.log('You fail to get away!');
        }
        return true;
    },

    tryOverworldEat: function (itemId) {
        var fight = this.overworldFight;
        var hero;
        var eaten;
        if (!fight) {
            return false;
        }
        hero = this.registry.get('hero');
        if (hero.hp >= hero.maxHp) {
            Hud.log('You are already at full health.');
            return false;
        }
        eaten = itemId ? eatItem(hero, itemId) : eatBestFood(hero);
        if (!eaten) {
            Hud.log(itemId ? 'You do not have that.' : 'You have no food.');
            return false;
        }
        hero.hp = Math.min(hero.maxHp, hero.hp + eaten.amount);
        this.registry.set('hero', hero);
        showWorldHitSplat(this, this.player.x, this.player.y, '+' + eaten.amount, 'heal');
        Hud.log('You eat ' + eaten.name + ' and recover ' + eaten.amount + ' HP.');
        Hud.renderHero(hero);
        return true;
    },

    castOverworldSpell: function (spellId) {
        var fight = this.overworldFight;
        var mob;
        var hero;
        var fn;
        var dealt;
        var hpBefore;
        var range;
        if (!fight || !spellId) {
            return false;
        }
        mob = fight.mob;
        hero = this.registry.get('hero');
        range = typeof weaponAttackRangePx === 'function' ? weaponAttackRangePx(hero) : MELEE_ENGAGE_PX;
        if (this.fightDistancePx(mob) > range) {
            Hud.log('You are out of attack range.');
            return false;
        }
        fn = typeof spellCastFn === 'function' ? spellCastFn(spellId) : null;
        var cast = fn ? fn(hero) : null;
        if (!cast) {
            Hud.log('You do not have the runes for that spell.');
            return false;
        }
        this.registry.set('hero', hero);
        hpBefore = fight.hp;
        dealt = typeof cast.damage === 'number' ? cast.damage : 2;
        if (dealt > 0 && (typeof showCombatVisualsOn === 'function' ? showCombatVisualsOn(hero) : true)
            && typeof spawnCombatProjectile === 'function') {
            spawnCombatProjectile(this, this.player.x, this.player.y, mob.x, mob.y, 'magic');
        }
        fight.hp = Math.max(0, fight.hp - dealt);
        showWorldHitSplat(this, mob.x, mob.y, '-' + dealt, 'hit');
        if (cast.xp > 0) {
            gainSkillXp(hero, 'magic', cast.xp);
        }
        grantOverworldHitXp(hero, fight, mob, dealt, hpBefore);
        this.registry.set('hero', hero);
        Hud.log('You cast ' + cast.label + ' on ' + mob.mobDef.type + ' for ' + dealt + '.');
        Hud.renderHero(hero);
        if (Hud.renderOverworldBattle) {
            Hud.renderOverworldBattle(fight);
        }
        if (fight.hp <= 0) {
            this.endOverworldFight('win');
        }
        return true;
    },

    beginFight: function (mob, opts) {
        var range;
        var dist;
        var hero;
        opts = opts || {};
        if (this.uiPaused()) {
            return;
        }
        if (this.encounterLock || !mob || !mob.aliveMob) {
            return;
        }
        dist = this.fightDistancePx(mob);
        if (opts.fromMob) {
            hero = this.registry.get('hero');
            if (typeof mobShouldAgroHero === 'function' && !mobShouldAgroHero(mob.mobDef, hero)) {
                return;
            }
            range = typeof mobAttackRangePx === 'function' ? mobAttackRangePx(mob) : MELEE_ENGAGE_PX;
            if (dist > range) {
                return;
            }
        } else {
            range = this.heroEngageRangePx();
            if (dist > range) {
                this.queueAttack(mob);
                return;
            }
        }
        this.lootTarget = null;
        this.engageTarget = null;
        this.encounterLock = true;
        this.lastFought = mob;
        if (Hud.hideDialogue) {
            Hud.hideDialogue();
        }
        if (Hud.hideShop) {
            Hud.hideShop();
        }
        if (Hud.hideBank) {
            Hud.hideBank();
        }
        this.clearWalk();
        this.clearFish();
        this.player.body.setVelocity(0);
        this.registry.set('pendingEncounter', {
            enemies: [Object.assign({}, mob.mobDef)]
        });
        this.cameras.main.shake(160, 0.004);
        if (window.Sfx && Sfx.hit) {
            Sfx.hit();
        }
        var self = this;
        this.time.delayedCall(260, function () {
            self.startOverworldFight(mob);
        });
    },

    placeLoot: function (x, y, drop, until) {
        var now = this.time.now;
        var tex = typeof itemTextureKey === 'function' ? itemTextureKey(drop.id) : ('item-' + drop.id);
        if (!this.textures.exists(tex)) {
            tex = 'item-coins';
        }
        var sprite = this.add.image(x, y, tex);
        sprite.setDepth(5 + this.groundLoot.length * 0.01);
        sprite.setDisplaySize(16, 16);
        sprite.setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(-4, -4, 24, 24),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        var entry = {
            id: drop.id,
            qty: drop.qty,
            sprite: sprite,
            taken: false,
            until: until,
            privateUntil: now + 10000,
            skipAuto: !!drop.skipAuto
        };
        /* Left/right loot clicks are handled by scene onClick (top-of-stack / menus). */
        this.groundLoot.push(entry);
        this.applyLootVisibility(entry);
        return entry;
    },

    pickLootPile: function (x, y, range) {
        var out = [];
        var i;
        var drop;
        var d;
        range = typeof range === 'number' ? range : 14;
        for (i = 0; i < this.groundLoot.length; i++) {
            drop = this.groundLoot[i];
            if (!drop || drop.taken || !drop.sprite || !drop.sprite.visible) {
                continue;
            }
            d = Phaser.Math.Distance.Between(x, y, drop.sprite.x, drop.sprite.y);
            if (d < range) {
                out.push(drop);
            }
        }
        return out;
    },

    showLootPileMenu: function (pile, pos) {
        var items = [];
        var i;
        var drop;
        if (!pile || !pile.length || !Hud.showContextMenu) {
            return;
        }
        /* Newest / top of stack first. */
        for (i = pile.length - 1; i >= 0; i--) {
            drop = pile[i];
            items.push({
                label: 'Take ' + itemName(drop.id),
                action: 'take-loot',
                loot: drop,
                lootIndex: i
            });
        }
        items.push({ label: 'Examine', action: 'examine' });
        Hud.showContextMenu(items, {
            kind: 'loot-pile',
            worldX: pile[pile.length - 1].sprite ? pile[pile.length - 1].sprite.x : 0,
            worldY: pile[pile.length - 1].sprite ? pile[pile.length - 1].sprite.y : 0,
            clientX: pos && pos.clientX != null ? pos.clientX : 16,
            clientY: pos && pos.clientY != null ? pos.clientY : 16,
            lootPile: pile
        });
    },

    applyLootVisibility: function (drop) {
        var hero = this.registry.get('hero');
        if (!drop || !drop.sprite) {
            return;
        }
        if (hero && hero.hideBones && drop.id === 'bones') {
            drop.sprite.setVisible(false);
            drop.sprite.disableInteractive();
            return;
        }
        drop.sprite.setVisible(true);
        drop.sprite.setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(-4, -4, 24, 24),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        if (drop.privateUntil && this.time.now < drop.privateUntil) {
            drop.sprite.setTint(0xaaccff);
        } else {
            drop.sprite.clearTint();
        }
    },

    refreshLootVisibility: function () {
        var i;
        for (i = 0; i < this.groundLoot.length; i++) {
            this.applyLootVisibility(this.groundLoot[i]);
        }
    },

    /**
     * Snap a world point onto the nearest walkable ground tile (not scenery).
     * Falls back to player-adjacent ground, then player feet — never trees/rocks/etc.
     */
    lootGroundWorldAt: function (wx, wy) {
        var pos = typeof nearestGroundLootWorld === 'function'
            ? nearestGroundLootWorld(this.tileGrid, wx, wy)
            : null;
        if (pos) {
            return pos;
        }
        if (this.player && typeof nearestGroundLootWorld === 'function') {
            pos = nearestGroundLootWorld(this.tileGrid, this.player.x, this.player.y);
            if (pos) {
                return pos;
            }
            return { x: this.player.x, y: this.player.y };
        }
        return { x: wx, y: wy };
    },

    spawnLoot: function (x, y, drops) {
        var self = this;
        var now = this.time.now;
        drops.forEach(function (drop, index) {
            var ox = (index - (drops.length - 1) / 2) * 10;
            var pos = self.lootGroundWorldAt(x + ox, y + 4);
            self.placeLoot(pos.x, pos.y, drop, now + 20000);
        });
    },

    snapshotLoot: function () {
        if (!this.lootZoneState) {
            this.lootZoneState = {};
        }
        var now = this.time.now;
        var saved = [];
        var i;
        for (i = 0; i < this.groundLoot.length; i++) {
            var drop = this.groundLoot[i];
            if (!drop || drop.taken || now > drop.until) {
                continue;
            }
            saved.push({
                id: drop.id,
                qty: drop.qty,
                x: drop.sprite ? drop.sprite.x : drop.x,
                y: drop.sprite ? drop.sprite.y : drop.y,
                until: drop.until,
                skipAuto: !!drop.skipAuto
            });
        }
        this.lootZoneState[this.zoneId] = saved;
    },

    restoreLoot: function (zoneId) {
        var saved = this.lootZoneState && this.lootZoneState[zoneId];
        if (!saved || !saved.length) {
            return;
        }
        var now = this.time.now;
        var keep = [];
        var i;
        for (i = 0; i < saved.length; i++) {
            var drop = saved[i];
            if (!drop || now > drop.until) {
                continue;
            }
            this.placeLoot(drop.x, drop.y, drop, drop.until);
            keep.push(drop);
        }
        this.lootZoneState[zoneId] = keep;
    },

    tryPickup: function (drop, alreadyInRange) {
        if (this.encounterLock || Hud.mode === 'battle') {
            return false;
        }
        if (!drop || drop.taken) {
            return false;
        }
        if (!alreadyInRange && !this.playerLootInRange(drop)) {
            return this.queueLootTake(drop);
        }
        var hero = this.registry.get('hero');
        if (!addItem(hero, drop.id, drop.qty)) {
            if (!drop.fullTold) {
                Hud.log('inventory full');
                drop.fullTold = true;
            }
            return false;
        }
        this.registry.set('hero', hero);
        drop.taken = true;
        if (this.lootTarget === drop) {
            this.lootTarget = null;
        }
        if (drop.sprite) {
            drop.sprite.destroy();
            drop.sprite = null;
        }
        var label = itemName(drop.id);
        Hud.log('You pick up ' + (drop.qty > 1 ? drop.qty + ' ' : '') + label + '.');
        if (window.Sfx && Sfx.pickup) {
            Sfx.pickup();
        }
        this.noteTutorial('loot');
        this.refreshHud();
        return true;
    },

    dropFromInventory: function (id, qty) {
        qty = qty || 1;
        if (this.encounterLock || Hud.mode === 'battle' || Hud.mode === 'title' || Hud.mode === 'dead') {
            return false;
        }
        if (!id || qty < 1 || !this.player) {
            return false;
        }
        if (typeof isQuestItem === 'function' && isQuestItem(id)) {
            Hud.log('You cannot drop a quest item.');
            return false;
        }
        var hero = this.registry.get('hero');
        if (!takeItem(hero, id, qty)) {
            Hud.log('You do not have that.');
            return false;
        }
        this.registry.set('hero', hero);
        var dropPos = this.lootGroundWorldAt(this.player.x, this.player.y);
        var entry = this.placeLoot(dropPos.x, dropPos.y, {
            id: id,
            qty: qty,
            skipAuto: true
        }, this.time.now + 20000);
        Hud.log('You drop ' + (qty > 1 ? qty + ' ' : '') + itemName(id) + '.');
        this.refreshHud();
        return entry;
    },

    autoPickupOn: function () {
        var hero = this.registry.get('hero');
        return !!(hero && hero.autoPickup !== false);
    },

    collectNearbyLoot: function () {
        if (this.encounterLock || Hud.mode === 'battle' || !this.autoPickupOn()) {
            return;
        }
        var i;
        for (i = this.groundLoot.length - 1; i >= 0; i--) {
            var drop = this.groundLoot[i];
            if (!drop || drop.taken || !drop.sprite || drop.skipAuto) {
                continue;
            }
            if (this.playerLootInRange(drop)) {
                this.tryPickup(drop, true);
            }
        }
    },

    pruneLoot: function () {
        var now = this.time.now;
        var i;
        for (i = this.groundLoot.length - 1; i >= 0; i--) {
            var drop = this.groundLoot[i];
            if (!drop) {
                this.groundLoot.splice(i, 1);
                continue;
            }
            if (drop.taken || now > drop.until) {
                if (drop.sprite) {
                    drop.sprite.destroy();
                    drop.sprite = null;
                }
                this.groundLoot.splice(i, 1);
                continue;
            }
            if (drop.sprite && drop.privateUntil && now >= drop.privateUntil && drop.sprite.isTinted) {
                drop.sprite.clearTint();
            }
        }
    },

    clearLoot: function () {
        for (var i = 0; i < this.groundLoot.length; i++) {
            if (this.groundLoot[i] && this.groundLoot[i].sprite) {
                this.groundLoot[i].sprite.destroy();
            }
        }
        this.groundLoot.length = 0;
    },

    /* scene.start(GameOver) would shut down WorldScene and destroy grave sprites.
       Sleep + launch keeps graveZoneState / sprites until respawn wakes the world. */
    goToGameOver: function () {
        if (window.Sfx && Sfx.death) {
            Sfx.death();
        }
        this.scene.stop('UIScene');
        if (this.scene.isActive('GameOverScene') || this.scene.isSleeping('GameOverScene')) {
            if (this.scene.isSleeping('GameOverScene')) {
                this.scene.wake('GameOverScene');
            }
        } else {
            this.scene.launch('GameOverScene');
        }
        this.scene.sleep();
    },

    ensureGravestoneTexture: function () {
        if (this.textures.exists('playergrave')) {
            return;
        }
        var g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x1a1a22, 1);
        g.fillRect(2, 7, 12, 9);
        g.fillStyle(0xc8c8d4, 1);
        g.fillRect(3, 6, 10, 9);
        g.fillStyle(0xe8e8f0, 1);
        g.fillCircle(8, 6, 6);
        g.fillStyle(0x3a3a48, 1);
        g.fillRect(7, 7, 2, 7);
        g.fillRect(5, 10, 6, 2);
        g.lineStyle(1, 0xffe08a, 1);
        g.strokeRect(2, 5, 12, 11);
        g.generateTexture('playergrave', 16, 16);
        g.destroy();
    },

    clearGravestones: function () {
        var i;
        if (!this.gravestones) {
            this.gravestones = [];
            return;
        }
        for (i = 0; i < this.gravestones.length; i++) {
            if (this.gravestones[i] && this.gravestones[i].label) {
                this.gravestones[i].label.destroy();
            }
            if (this.gravestones[i] && this.gravestones[i].sprite) {
                this.gravestones[i].sprite.destroy();
            }
        }
        this.gravestones.length = 0;
        this.graveTarget = null;
    },

    snapshotGraves: function (opts) {
        var saved = [];
        var i;
        var grave;
        var force;
        opts = opts || {};
        force = !!opts.force;
        if (!this.graveZoneState) {
            this.graveZoneState = {};
        }
        if (!this.zoneId) {
            return;
        }
        for (i = 0; i < (this.gravestones || []).length; i++) {
            grave = this.gravestones[i];
            if (!grave || !(grave.items && grave.items.length)) {
                continue;
            }
            saved.push({
                x: grave.sprite ? grave.sprite.x : grave.x,
                y: grave.sprite ? grave.sprite.y : grave.y,
                items: (grave.items || []).map(function (row) {
                    return { id: row.id, qty: row.qty };
                })
            });
        }
        /* Live sprites are authoritative when present, or when force (zone leave / reclaim).
           An empty live list without force must NOT wipe graves queued only in state
           (death while asleep / shut down before draw). */
        if (force || (this.gravestones && this.gravestones.length > 0)) {
            this.graveZoneState[this.zoneId] = saved;
        } else if (!this.graveZoneState[this.zoneId]) {
            this.graveZoneState[this.zoneId] = [];
        }
    },

    restoreGraves: function (zoneId) {
        var saved = this.graveZoneState && this.graveZoneState[zoneId];
        var i;
        if (!saved || !saved.length) {
            return;
        }
        for (i = 0; i < saved.length; i++) {
            if (saved[i] && saved[i].items && saved[i].items.length) {
                this.placeGravestone(zoneId, saved[i].x, saved[i].y, saved[i].items, true);
            }
        }
    },

    placeGravestone: function (zoneId, x, y, items, fromRestore) {
        var sprite;
        var label;
        var entry;
        this.ensureGravestoneTexture();
        sprite = this.add.image(x, y, 'playergrave');
        sprite.setDepth(9);
        sprite.setDisplaySize(20, 20);
        sprite.setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(-6, -6, 28, 28),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        label = this.add.text(x, y - 14, 'Gravestone', {
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            fontSize: '8px',
            color: '#ffe08a'
        }).setOrigin(0.5, 1).setDepth(9.1);
        entry = {
            zoneId: zoneId || this.zoneId,
            x: x,
            y: y,
            items: (items || []).map(function (row) {
                return { id: row.id, qty: row.qty };
            }).filter(function (row) {
                return row.id && row.qty > 0;
            }),
            sprite: sprite,
            label: label
        };
        if (!this.gravestones) {
            this.gravestones = [];
        }
        this.gravestones.push(entry);
        if (!fromRestore) {
            this.snapshotGraves({ force: true });
        }
        return entry;
    },

    queueGraveData: function (zoneId, x, y, items) {
        var row;
        if (!this.graveZoneState) {
            this.graveZoneState = {};
        }
        if (!this.graveZoneState[zoneId]) {
            this.graveZoneState[zoneId] = [];
        }
        row = {
            x: x,
            y: y,
            items: (items || []).map(function (entry) {
                return { id: entry.id, qty: entry.qty };
            }).filter(function (entry) {
                return entry.id && entry.qty > 0;
            })
        };
        this.graveZoneState[zoneId].push(row);
        return row;
    },

    spawnDeathGravestone: function () {
        var hero = this.registry.get('hero');
        var items;
        var x;
        var y;
        var zoneId;
        var grave;
        var canPlace;
        if (!hero) {
            return null;
        }
        x = this.player ? this.player.x : this.registry.get('playerX');
        y = this.player ? this.player.y : this.registry.get('playerY');
        zoneId = this.zoneId || this.registry.get('zone') || 'haven';
        if (typeof x !== 'number' || typeof y !== 'number') {
            x = defaultWorldSpawn().x;
            y = defaultWorldSpawn().y;
        }
        items = typeof stripHeroForGravestone === 'function'
            ? stripHeroForGravestone(hero)
            : [];
        this.registry.set('hero', hero);
        if (window.Hud && Hud.renderHero) {
            Hud.renderHero(hero);
        }
        if (!items.length) {
            Hud.log('You leave no belongings behind.');
            if (typeof this.exportWorldSave === 'function') {
                this.registry.set('worldSave', this.exportWorldSave());
            }
            if (typeof writeSave === 'function') {
                writeSave(this.registry);
            }
            return null;
        }
        /* Always persist first — GameOver used to scene.start and shut World down,
           destroying any sprite before the player could see or restore it. */
        grave = this.queueGraveData(zoneId, x, y, items);
        canPlace = !!(this.add && this.sys && this.zoneId === zoneId
            && (this.sys.isActive() || this.sys.isSleeping()));
        if (canPlace) {
            /* Drop the state-only row; placeGravestone re-snapshots with a sprite. */
            this.graveZoneState[zoneId].pop();
            grave = this.placeGravestone(zoneId, x, y, items);
        }
        Hud.log('Your items tumble into a gravestone.');
        if (typeof this.exportWorldSave === 'function') {
            this.registry.set('worldSave', this.exportWorldSave());
        }
        this.registry.set('hero', hero);
        if (window.Hud && Hud.renderHero) {
            Hud.renderHero(hero);
        }
        /* Persist even if Hud.mode is battle (saveGame is gated). */
        if (typeof writeSave === 'function') {
            writeSave(this.registry);
        } else if (window.Hud && Hud.saveHero) {
            Hud.saveHero(hero);
        }
        return grave;
    },

    pickGravestone: function (x, y, range) {
        var best = null;
        var bestDist = range == null ? 18 : range;
        var i;
        var grave;
        var d;
        for (i = 0; i < (this.gravestones || []).length; i++) {
            grave = this.gravestones[i];
            if (!grave || !grave.sprite || !(grave.items && grave.items.length)) {
                continue;
            }
            d = Phaser.Math.Distance.Between(x, y, grave.sprite.x, grave.sprite.y);
            if (d < bestDist) {
                bestDist = d;
                best = grave;
            }
        }
        return best;
    },

    showGraveContextAt: function (grave, pos) {
        if (!grave || !Hud.showContextMenu) {
            return;
        }
        Hud.showContextMenu([
            { label: 'Reclaim items', action: 'reclaim-grave' },
            { label: 'Examine', action: 'examine-grave' }
        ], {
            kind: 'gravestone',
            grave: grave,
            worldX: grave.sprite ? grave.sprite.x : grave.x,
            worldY: grave.sprite ? grave.sprite.y : grave.y,
            clientX: pos && pos.clientX != null ? pos.clientX : 16,
            clientY: pos && pos.clientY != null ? pos.clientY : 16
        });
    },

    playerGraveInRange: function (grave) {
        if (!grave || !this.player) {
            return false;
        }
        var gx = grave.sprite ? grave.sprite.x : grave.x;
        var gy = grave.sprite ? grave.sprite.y : grave.y;
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, gx, gy) <= GRAVE_RANGE_PX;
    },

    queueGraveReclaim: function (grave) {
        if (!grave || !(grave.items && grave.items.length)) {
            return false;
        }
        this.engageTarget = null;
        this.talkTarget = null;
        this.lootTarget = null;
        this.clearGather();
        if (this.playerGraveInRange(grave)) {
            this.graveTarget = null;
            return this.tryReclaimGravestone(grave, true);
        }
        this.graveTarget = grave;
        this.setWalk(
            grave.sprite ? grave.sprite.x : grave.x,
            grave.sprite ? grave.sprite.y : grave.y,
            { allowEnd: true }
        );
        return true;
    },

    tryCompleteGraveReclaim: function () {
        var grave = this.graveTarget;
        if (!grave) {
            return false;
        }
        if (!(grave.items && grave.items.length) || (grave.sprite && !grave.sprite.active)) {
            this.graveTarget = null;
            return false;
        }
        if (!this.playerGraveInRange(grave)) {
            if (!this.walkTarget) {
                this.setWalk(
                    grave.sprite ? grave.sprite.x : grave.x,
                    grave.sprite ? grave.sprite.y : grave.y,
                    { allowEnd: true }
                );
            }
            return false;
        }
        this.player.body.setVelocity(0);
        this.clearWalk();
        this.graveTarget = null;
        return this.tryReclaimGravestone(grave, true);
    },

    tryReclaimGravestone: function (grave, alreadyInRange) {
        var hero;
        var remain;
        if (this.encounterLock || Hud.mode === 'battle' || Hud.mode === 'dead') {
            return false;
        }
        if (!grave || !(grave.items && grave.items.length)) {
            return false;
        }
        if (!alreadyInRange && !this.playerGraveInRange(grave)) {
            return this.queueGraveReclaim(grave);
        }
        hero = this.registry.get('hero');
        remain = typeof reclaimGravestoneItems === 'function'
            ? reclaimGravestoneItems(hero, grave.items)
            : grave.items.slice();
        this.registry.set('hero', hero);
        grave.items = remain;
        if (remain.length) {
            Hud.log('Your inventory is full. Some items remain on the gravestone.');
            this.snapshotGraves({ force: true });
            this.refreshHud();
            return false;
        }
        if (grave.label) {
            grave.label.destroy();
            grave.label = null;
        }
        if (grave.sprite) {
            grave.sprite.destroy();
            grave.sprite = null;
        }
        if (this.gravestones) {
            this.gravestones = this.gravestones.filter(function (row) {
                return row !== grave;
            });
        }
        this.snapshotGraves({ force: true });
        Hud.log('You reclaim everything from the gravestone.');
        if (window.Sfx && Sfx.pickup) {
            Sfx.pickup();
        }
        this.refreshHud();
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
        return true;
    },

    wake: function () {
        if (window.Hud && Hud.saveGame) {
            Hud.saveGame();
        }
        this.encounterLock = false;
        this.engageGrace = this.time.now + 700;
        this.player.body.setVelocity(0);
        this.clearWalk();
        var outcome = this.registry.get('battleOutcome');
        var hero = this.registry.get('hero');
        if (outcome === 'win' && this.lastFought) {
            var def = this.lastFought.mobDef;
            hero.xp += def.xp || 0;
            this.levelHero(hero);
            this.registry.set('hero', hero);
            Hud.log('The ' + def.type + ' collapses. +' + def.xp + ' xp. Loot drops to the ground.');
            if (def.type === 'Goblin') {
                var quest = this.registry.get('quest');
                if (quest.stage === 1) {
                    quest.progress += 1;
                    if (quest.progress >= quest.goal) {
                        quest.stage = 2;
                        Hud.log('That should be enough goblins. Return to Bram.');
                    }
                    this.registry.set('quest', quest);
                }
            }
            if (hero.sideQuests) {
                if (def.type === 'Crab' && hero.sideQuests.shipment && hero.sideQuests.shipment.stage === 1) {
                    hero.sideQuests.shipment.progress += 1;
                    if (hero.sideQuests.shipment.progress >= hero.sideQuests.shipment.goal) {
                        hero.sideQuests.shipment.stage = 2;
                        Hud.log('That should be enough crabs. Return to Ned.');
                    }
                    this.registry.set('hero', hero);
                }
                if (def.type === 'Bat' && hero.sideQuests.bats && hero.sideQuests.bats.stage === 1) {
                    hero.sideQuests.bats.progress += 1;
                    if (hero.sideQuests.bats.progress >= hero.sideQuests.bats.goal) {
                        hero.sideQuests.bats.stage = 2;
                        Hud.log('That should be enough bats. Return to Corb.');
                    }
                    this.registry.set('hero', hero);
                }
            }
            this.noteTutorial('fight');
            if (def.type === 'Rabbit' && typeof grantHunterXp === 'function') {
                grantHunterXp(hero, typeof HUNTER_KILL_XP === 'number' ? HUNTER_KILL_XP : 12);
                this.registry.set('hero', hero);
            }
            if (typeof noteSlayerKill === 'function') {
                var slayerDone = noteSlayerKill(hero, def.type);
                if (slayerDone) {
                    Hud.log('Your Slayer task is complete.');
                }
                this.registry.set('hero', hero);
            }
            if (hero.hiscores) {
                hero.hiscores.kills = (hero.hiscores.kills || 0) + 1;
            }
            this.spawnLoot(this.lastFought.x, this.lastFought.y, lootForMob(def));
            this.hideMob(this.lastFought);
            this.scheduleMobRespawn(this.lastFought, MOB_RESPAWN_MS);
        } else if (outcome === 'flee') {
            Hud.log('You break away from the fight.');
            this.pushOffMob(this.lastFought);
            this.engageGrace = this.time.now + FLEE_GRACE_MS;
        } else if (outcome === 'leash') {
            /* Mob dropped agro at leash — no player flee chat. */
            this.engageGrace = this.time.now + FLEE_GRACE_MS;
        }
        this.registry.set('battleOutcome', null);
        this.lastFought = null;
        this.engageTarget = null;
        this.refreshHud();
    },

    checkDoors: function () {
        if (this.exitLock || this.encounterLock || this.interiorId || this.zoneId === 'dungeon') {
            return;
        }
        var tile = worldToTile(this.player.x, this.player.y);
        var interact = typeof getTileInteract === 'function'
            ? getTileInteract(this.zoneId, tile.tx, tile.ty)
            : null;
        if (interact && (interact.kind === 'dungeon-enter' || interact.kind === 'stairs-down'
                || interact.kind === 'dragon-den')) {
            this.useStairsInteract(interact);
            return;
        }
        var spec = interiorAtDoor(tile.tx, tile.ty, this.zoneId);
        if (!spec) {
            return;
        }
        this.enterInterior(spec.id);
    },

    checkInteriorExit: function () {
        if (this.exitLock || this.encounterLock || !this.interiorId) {
            return;
        }
        var tile = worldToTile(this.player.x, this.player.y);
        if (tile.tx !== INTERIOR_EXIT_TILE.x || tile.ty !== INTERIOR_EXIT_TILE.y) {
            return;
        }
        this.leaveInterior();
    },

    useStairsInteract: function (interact) {
        var kind = interact && interact.kind;
        if (!kind || this.exitLock) {
            return false;
        }
        if (kind === 'dungeon-enter') {
            this.lockExits();
            this.enterDungeonFloor(this.rememberedDungeonEscapeFloor(), { from: 'surface' });
            return true;
        }
        if (kind === 'surface-portal') {
            this.lockExits();
            this.exitDungeonToSurface();
            return true;
        }
        if (kind === 'dragon-den') {
            this.lockExits();
            this.enterDragonDen();
            return true;
        }
        if (kind === 'dragon-den-exit') {
            this.lockExits();
            this.leaveDragonDen();
            return true;
        }
        if (kind === 'stairs-down' && this.zoneId === 'dungeon') {
            this.lockExits();
            this.enterDungeonFloor((this.dungeonFloor || 1) + 1, { from: 'up' });
            return true;
        }
        if (kind === 'stairs-up' && this.zoneId === 'dungeon') {
            this.lockExits();
            if ((this.dungeonFloor || 1) <= 1) {
                this.exitDungeonToSurface();
            } else {
                this.enterDungeonFloor(this.dungeonFloor - 1, { from: 'down' });
            }
            return true;
        }
        return false;
    },

    checkDungeonTiles: function () {
        var tile;
        var interact;
        if (this.exitLock || this.encounterLock || this.zoneId !== 'dungeon') {
            return;
        }
        tile = worldToTile(this.player.x, this.player.y);
        interact = typeof getTileInteract === 'function'
            ? getTileInteract(this.zoneId, tile.tx, tile.ty)
            : null;
        if (!interact) {
            return;
        }
        this.useStairsInteract(interact);
    },

    checkExits: function () {
        if (this.exitLock || this.encounterLock) {
            return;
        }
        if (this.interiorId) {
            this.checkInteriorExit();
            return;
        }
        if (this.zoneId === 'dungeon') {
            this.checkDungeonTiles();
            return;
        }
        if (this.zoneId === 'dragonden') {
            this.checkDragonDenTiles();
            return;
        }
        this.checkDoors();
        if (this.interiorId || this.exitLock || this.zoneId === 'dungeon' || this.zoneId === 'dragonden') {
            return;
        }
        var zone = ZONES[this.zoneId];
        var dir = null;
        if (!zone || zone.hidden) {
            return;
        }
        if (this.player.x < 30) {
            dir = 'w';
        } else if (this.player.x > this.map.widthInPixels - 30) {
            dir = 'e';
        } else if (this.player.y < 30) {
            dir = 'n';
        } else if (this.player.y > this.map.heightInPixels - 30) {
            dir = 's';
        }
        if (!dir) {
            return;
        }
        var next = neighborId(zone, dir);
        if (!next) {
            return;
        }
        this.lockExits();
        this.enterZone(next, dir);
    },

    mobHomeXY: function (mob) {
        return {
            x: mob && mob.homeX != null ? mob.homeX : (mob ? mob.x : 0),
            y: mob && mob.homeY != null ? mob.homeY : (mob ? mob.y : 0)
        };
    },

    /* Chebyshev tiles from mob home tile to world pixel (prefer clarity over Euclidean px). */
    mobLeashChebyshev: function (mob, wx, wy) {
        var home;
        var tile;
        if (!mob || typeof worldToTile !== 'function') {
            return 0;
        }
        home = this.mobHomeXY(mob);
        home = worldToTile(home.x, home.y);
        tile = worldToTile(wx, wy);
        return Math.max(Math.abs(tile.tx - home.tx), Math.abs(tile.ty - home.ty));
    },

    mobLeashLimit: function () {
        return typeof MOB_LEASH_TILES === 'number' ? MOB_LEASH_TILES : 4;
    },

    mobBeyondLeashAt: function (mob, wx, wy) {
        return this.mobLeashChebyshev(mob, wx, wy) > this.mobLeashLimit();
    },

    mobOutsideLeash: function (mob) {
        return !!(mob && this.mobBeyondLeashAt(mob, mob.x, mob.y));
    },

    /* True when the chase target itself sits outside the mob's home leash. */
    mobTargetBeyondLeash: function (mob, tx, ty) {
        return this.mobBeyondLeashAt(mob, tx, ty);
    },

    mobStepForbidden: function (wx, wy) {
        if (typeof mobForbiddenAt === 'function') {
            return mobForbiddenAt(this.zoneId, wx, wy);
        }
        return typeof mobEdgeForbiddenAt === 'function' && mobEdgeForbiddenAt(wx, wy);
    },

    /* Emberhaven courtyard sanctuary — player standing here should not drag mobs in. */
    playerInHavenSafe: function () {
        var tile;
        if (this.zoneId !== 'haven' || !this.player) {
            return false;
        }
        if (typeof havenSafeForbiddenTile === 'function' && typeof worldToTile === 'function') {
            tile = worldToTile(this.player.x, this.player.y);
            return havenSafeForbiddenTile(tile.tx, tile.ty);
        }
        return this.mobStepForbidden(this.player.x, this.player.y);
    },

    steerMobHome: function (mob) {
        var home;
        var dist;
        var speed;
        var dx;
        var dy;
        var len;
        var vx;
        var vy;
        if (!mob || !mob.body) {
            return;
        }
        home = this.mobHomeXY(mob);
        dist = Phaser.Math.Distance.Between(mob.x, mob.y, home.x, home.y);
        if (dist < 3) {
            mob.body.setVelocity(0, 0);
            if (mob.body.reset) {
                mob.body.reset(home.x, home.y);
            } else {
                mob.setPosition(home.x, home.y);
            }
            mob.leashReturning = false;
            return;
        }
        speed = typeof mobMovePxPerSec === 'function'
            ? mobMovePxPerSec(mob)
            : (typeof GameClock !== 'undefined' && GameClock.pxPerSec
                ? GameClock.pxPerSec(typeof mobMoveSpeed === 'function' ? mobMoveSpeed(mob) : (WALK_TILES_PER_SEC / 2))
                : (typeof MOB_MOVE_SPEED === 'number' ? MOB_MOVE_SPEED : WALK_SPEED / 2));
        dx = home.x - mob.x;
        dy = home.y - mob.y;
        len = dist || 1;
        vx = (dx / len) * speed;
        vy = (dy / len) * speed;
        if (this.mobStepForbidden(mob.x + vx, mob.y + vy)
            || this.mobStepForbidden(mob.x + vx * 0.2, mob.y + vy * 0.2)) {
            /* Inside a forbidden pocket — snap out, then resume home steer next frame. */
            if (this.mobStepForbidden(mob.x, mob.y)) {
                this.nudgeMobOffMapEdge(mob);
            }
            mob.body.setVelocity(0, 0);
            return;
        }
        mob.body.setVelocity(vx, vy);
    },

    /* Drop agro / fight and walk home when player kites past leash. */
    releaseMobFromLeash: function (mob) {
        var fight = this.overworldFight;
        if (!mob) {
            return;
        }
        this.clearMobAgroChase(mob);
        mob.leashReturning = true;
        this.steerMobHome(mob);
        if (this.engageTarget === mob) {
            this.engageTarget = null;
            this.clearWalk();
        }
        if (fight && fight.mob === mob) {
            this.endOverworldFight('leash');
        }
    },

    wanderMobs: function () {
        var grid = this.tileGrid;
        var zoneId = this.zoneId;
        var self = this;
        var fightMob = this.overworldFight && this.overworldFight.mob;
        this.mobs.children.iterate(function (mob) {
            var speed;
            var angle;
            var vx;
            var vy;
            var type;
            var nextX;
            var nextY;
            if (!mob || !mob.aliveMob || !mob.body) {
                return;
            }
            if (mob === fightMob || mob.agroChasing) {
                return;
            }
            if (mob.leashReturning || self.mobOutsideLeash(mob)) {
                mob.leashReturning = true;
                self.steerMobHome(mob);
                return;
            }
            if (Phaser.Math.Between(0, 80) !== 0) {
                return;
            }
            speed = typeof mobMovePxPerSec === 'function'
                ? mobMovePxPerSec(mob)
                : (typeof GameClock !== 'undefined' && GameClock.pxPerSec
                    ? GameClock.pxPerSec(typeof mobMoveSpeed === 'function' ? mobMoveSpeed(mob) : (WALK_TILES_PER_SEC / 2))
                    : (typeof MOB_MOVE_SPEED === 'number' ? MOB_MOVE_SPEED : WALK_SPEED / 2));
            angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed;
            nextX = mob.x + vx;
            nextY = mob.y + vy;
            type = mob.mobDef && mob.mobDef.type;
            if (self.mobBeyondLeashAt(mob, nextX, nextY)
                || self.mobStepForbidden(nextX, nextY)
                || self.mobStepForbidden(mob.x + vx * 0.2, mob.y + vy * 0.2)
                || self.mobStepForbidden(mob.x, mob.y)) {
                if (self.mobStepForbidden(mob.x, mob.y)) {
                    self.nudgeMobOffMapEdge(mob);
                }
                return;
            }
            if (isGiantMob(type) && giantBlockedAt(grid, nextX, nextY, zoneId)) {
                return;
            }
            mob.body.setVelocity(vx, vy);
        });
    },

    clearMobAgroChase: function (mob) {
        if (!mob) {
            return;
        }
        if (mob.agroChasing && mob.body) {
            mob.body.setVelocity(0, 0);
        }
        mob.agroChasing = false;
    },

    tickMobAgro: function () {
        var hero;
        var fightMob;
        var self = this;
        var agroRange;
        var attackRange;
        var dist;
        var speed;
        var dx;
        var dy;
        var len;
        var vx;
        var vy;
        var nextX;
        var nextY;
        var started = false;
        var retaliate;
        if (!this.player || !this.player.body || this.uiPaused()) {
            return;
        }
        if (this.encounterLock || this.time.now < this.engageGrace) {
            this.mobs.children.iterate(function (mob) {
                self.clearMobAgroChase(mob);
            });
            return;
        }
        hero = this.registry.get('hero');
        fightMob = this.overworldFight && this.overworldFight.mob;
        retaliate = this.autoRetaliateOn();
        agroRange = typeof MOB_AGGRO_RANGE_PX === 'number' ? MOB_AGGRO_RANGE_PX : 112;
        this.mobs.children.iterate(function (mob) {
            var shouldAgro;
            if (started || !mob || !mob.aliveMob || !mob.body || mob === fightMob) {
                self.clearMobAgroChase(mob);
                return;
            }
            if (mob.leashReturning) {
                self.clearMobAgroChase(mob);
                self.steerMobHome(mob);
                return;
            }
            if (self.mobOutsideLeash(mob)) {
                self.releaseMobFromLeash(mob);
                return;
            }
            shouldAgro = typeof mobShouldAgroHero === 'function'
                ? mobShouldAgroHero(mob.mobDef, hero)
                : false;
            if (!shouldAgro) {
                self.clearMobAgroChase(mob);
                return;
            }
            dist = self.fightDistancePx(mob);
            attackRange = typeof mobAttackRangePx === 'function' ? mobAttackRangePx(mob) : MELEE_ENGAGE_PX;
            if (dist > agroRange) {
                self.clearMobAgroChase(mob);
                return;
            }
            /* Player already outside this mob's home leash → never chase past spawn. */
            if (self.mobTargetBeyondLeash(mob, self.player.x, self.player.y)) {
                self.releaseMobFromLeash(mob);
                return;
            }
            /* Haven courtyard: drop agro at the safe rim instead of dragging mobs in. */
            if (self.playerInHavenSafe()) {
                self.releaseMobFromLeash(mob);
                return;
            }
            mob.agroChasing = true;
            /* Auto-retaliate: walk into weapon range like click-to-attack; never picks passive mobs. */
            if (retaliate && self.queueRetaliate(mob)) {
                if (self.encounterLock) {
                    started = true;
                    return;
                }
            }
            if (dist <= attackRange) {
                mob.body.setVelocity(0, 0);
                self.applyMobAgroHit(mob);
                return;
            }
            speed = typeof mobMovePxPerSec === 'function'
                ? mobMovePxPerSec(mob)
                : (typeof GameClock !== 'undefined' && GameClock.pxPerSec
                    ? GameClock.pxPerSec(typeof mobMoveSpeed === 'function' ? mobMoveSpeed(mob) : (WALK_TILES_PER_SEC / 2))
                    : (typeof MOB_MOVE_SPEED === 'number' ? MOB_MOVE_SPEED : WALK_SPEED / 2));
            dx = self.player.x - mob.x;
            dy = self.player.y - mob.y;
            len = dist || 1;
            vx = (dx / len) * speed;
            vy = (dy / len) * speed;
            nextX = mob.x + vx;
            nextY = mob.y + vy;
            if (self.mobBeyondLeashAt(mob, nextX, nextY)
                || self.mobStepForbidden(nextX, nextY)
                || self.mobStepForbidden(mob.x + vx * 0.2, mob.y + vy * 0.2)) {
                mob.body.setVelocity(0, 0);
                /* Stuck at leash/safe rim with player still out of step → drop chase. */
                if (self.mobTargetBeyondLeash(mob, self.player.x, self.player.y)
                    || self.playerInHavenSafe()) {
                    self.releaseMobFromLeash(mob);
                }
                return;
            }
            mob.body.setVelocity(vx, vy);
        });
    },

    wanderNpcs: function () {
        var self = this;
        var player = this.player;
        this.npcs.children.iterate(function (npc) {
            if (!npc || !npc.body || !npc.body.enable) {
                return;
            }
            var busy = npc === self.dialogueNpc || npc === self.talkTarget;
            if (!busy && player && player.body) {
                busy = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y) < NPC_BUSY_PX;
            }
            if (busy) {
                npc.body.setVelocity(0, 0);
                self.applyNpcFacing(npc);
                return;
            }
            var homeX = npc.homeX != null ? npc.homeX : npc.x;
            var homeY = npc.homeY != null ? npc.homeY : npc.y;
            var dist = Phaser.Math.Distance.Between(npc.x, npc.y, homeX, homeY);
            if (dist > NPC_LEASH_PX) {
                var dx = homeX - npc.x;
                var dy = homeY - npc.y;
                var len = dist || 1;
                npc.body.setVelocity((dx / len) * NPC_WANDER_SPEED, (dy / len) * NPC_WANDER_SPEED);
                self.applyNpcFacing(npc);
                return;
            }
            if (Phaser.Math.Between(0, NPC_WANDER_CHANCE) !== 0) {
                self.applyNpcFacing(npc);
                return;
            }
            var vx = Phaser.Math.Between(-NPC_WANDER_SPEED, NPC_WANDER_SPEED);
            var vy = Phaser.Math.Between(-NPC_WANDER_SPEED, NPC_WANDER_SPEED);
            npc.body.setVelocity(vx, vy);
            self.applyNpcFacing(npc);
        });
    },

    constrainGiantMobs: function () {
        var grid = this.tileGrid;
        var zoneId = this.zoneId;
        if (!grid) {
            return;
        }
        this.mobs.children.iterate(function (mob) {
            if (!mob || !mob.aliveMob || !mob.body) {
                return;
            }
            var type = mob.mobDef && mob.mobDef.type;
            if (!isGiantMob(type)) {
                return;
            }
            var vx = mob.body.velocity.x;
            var vy = mob.body.velocity.y;
            var lookX = mob.x + vx * 0.2;
            var lookY = mob.y + vy * 0.2;
            if (giantBlockedAt(grid, mob.x, mob.y, zoneId) ||
                ((vx || vy) && giantBlockedAt(grid, lookX, lookY, zoneId))) {
                mob.body.setVelocity(0, 0);
            }
        });
    },

    /* Keep all mobs out of the outer edge inset + Emberhaven safe courtyard. */
    constrainMobMapEdge: function () {
        var self = this;
        var zoneId = this.zoneId;
        var blockedAt = typeof mobForbiddenAt === 'function'
            ? function (wx, wy) { return mobForbiddenAt(zoneId, wx, wy); }
            : (typeof mobEdgeForbiddenAt === 'function'
                ? mobEdgeForbiddenAt
                : null);
        if (!blockedAt) {
            return;
        }
        this.mobs.children.iterate(function (mob) {
            var vx;
            var vy;
            var step;
            var t;
            if (!mob || !mob.aliveMob || !mob.body) {
                return;
            }
            /* Player collide can shove mobs into the courtyard — eject every frame. */
            if (blockedAt(mob.x, mob.y)) {
                self.nudgeMobOffMapEdge(mob);
                if (mob.agroChasing || (self.overworldFight && self.overworldFight.mob === mob)) {
                    self.releaseMobFromLeash(mob);
                }
                return;
            }
            vx = mob.body.velocity.x;
            vy = mob.body.velocity.y;
            if (!vx && !vy) {
                return;
            }
            /* Sample several look-aheads so coasting cannot cross a safe-zone tile. */
            for (step = 0; step < 4; step++) {
                t = (step + 1) * 0.08;
                if (blockedAt(mob.x + vx * t, mob.y + vy * t)) {
                    mob.body.setVelocity(0, 0);
                    return;
                }
            }
        });
    },

    autoAttackOn: function () {
        var hero = this.registry.get('hero');
        return typeof autoAttackOn === 'function' ? autoAttackOn(hero) : !!(hero && hero.autoAttack);
    },

    combatVisualsOn: function () {
        var hero = this.registry.get('hero');
        return typeof showCombatVisualsOn === 'function' ? showCombatVisualsOn(hero) : true;
    },

    rangeRingsOn: function () {
        var hero = this.registry.get('hero');
        return typeof showRangeRingsOn === 'function' ? showRangeRingsOn(hero) : true;
    },

    clearCombatRangeRings: function () {
        if (this.combatRangeGfx) {
            this.combatRangeGfx.clear();
        }
    },

    clearEffectRadiusRings: function () {
        if (this.effectRadiusGfx) {
            this.effectRadiusGfx.clear();
        }
    },

    updateEffectRadiusRings: function () {
        var i;
        var fire;
        var pos;
        var center;
        var safeR;
        var gfx = this.effectRadiusGfx;
        if (!gfx) {
            return;
        }
        gfx.clear();
        if (this.groundFires && this.groundFires.length) {
            gfx.lineStyle(1, 0xffb060, 0.28);
            for (i = 0; i < this.groundFires.length; i++) {
                fire = this.groundFires[i];
                if (!fire || (!fire.campfire && !fire.permanent)) {
                    continue;
                }
                pos = fire.sprite ? fire.sprite : tileCenter(fire.tx, fire.ty);
                if (!pos) {
                    continue;
                }
                gfx.strokeCircle(pos.x, pos.y, Math.max(8, CAMPFIRE_REGEN_RANGE));
            }
        }
        /* Faint haven safe-zone cue (Chebyshev radius drawn as circle). */
        if (this.zoneId === 'haven' && typeof havenSafeCenterTile === 'function') {
            center = tileCenter(havenSafeCenterTile().x, havenSafeCenterTile().y);
            safeR = typeof havenSafeRadiusPx === 'function'
                ? havenSafeRadiusPx()
                : ((typeof TILE_SIZE === 'number' ? TILE_SIZE : 16) * 5.5);
            gfx.lineStyle(1, 0x88ccaa, 0.18);
            gfx.strokeCircle(center.x, center.y, Math.max(8, safeR));
        }
    },

    updateCombatRangeRings: function () {
        var hero;
        var mob;
        var playerRange;
        var mobRange;
        var agroRange;
        var fightMob;
        var engageMob;
        var showPlayer;
        var drawn = [];
        var gfx = this.combatRangeGfx;
        /* Attack range = red; aggro/detection = orange (faint). */
        var ATTACK_RING = 0xff3b3b;
        var AGGRO_RING = 0xff8c20;
        var RING_ALPHA = 0.28;
        if (!gfx) {
            return;
        }
        gfx.clear();
        if (!this.rangeRingsOn() || !this.player) {
            return;
        }
        hero = this.registry.get('hero');
        fightMob = this.overworldFight && this.overworldFight.mob;
        engageMob = this.engageTarget && this.engageTarget.aliveMob ? this.engageTarget : null;
        mob = fightMob || engageMob;
        showPlayer = !!(fightMob || engageMob || this.overworldFight);
        if (!showPlayer && this.mobs) {
            this.mobs.children.iterate(function (m) {
                if (m && m.aliveMob && m.agroChasing) {
                    showPlayer = true;
                }
            });
        }
        if (!showPlayer) {
            return;
        }
        playerRange = typeof weaponAttackRangePx === 'function'
            ? weaponAttackRangePx(hero)
            : MELEE_ENGAGE_PX;
        gfx.lineStyle(1, ATTACK_RING, RING_ALPHA);
        gfx.strokeCircle(this.player.x, this.player.y, Math.max(8, playerRange));
        agroRange = typeof MOB_AGGRO_RANGE_PX === 'number' ? MOB_AGGRO_RANGE_PX : 112;
        function drawMobRings(target) {
            var i;
            if (!target || !target.active || !target.aliveMob) {
                return;
            }
            for (i = 0; i < drawn.length; i++) {
                if (drawn[i] === target) {
                    return;
                }
            }
            drawn.push(target);
            mobRange = typeof mobAttackRangePx === 'function'
                ? mobAttackRangePx(target)
                : MELEE_ENGAGE_PX;
            gfx.lineStyle(1, AGGRO_RING, RING_ALPHA);
            gfx.strokeCircle(target.x, target.y, Math.max(8, agroRange));
            gfx.lineStyle(1, ATTACK_RING, RING_ALPHA);
            gfx.strokeCircle(target.x, target.y, Math.max(8, mobRange));
        }
        if (mob) {
            drawMobRings(mob);
        }
        if (this.mobs) {
            this.mobs.children.iterate(function (m) {
                if (m && m.aliveMob && m.agroChasing) {
                    drawMobRings(m);
                }
            });
        }
    },

    autoRetaliateOn: function () {
        var hero = this.registry.get('hero');
        return typeof autoRetaliateOn === 'function' ? autoRetaliateOn(hero) : !!(hero && hero.autoRetaliate);
    },

    ensureRunState: function (hero) {
        if (!hero) {
            return hero;
        }
        if (hero.runEnergy == null || hero.runEnergy > RUN_ENERGY_MAX) {
            hero.runEnergy = RUN_ENERGY_MAX;
        }
        if (hero.runEnergy < 0) {
            hero.runEnergy = 0;
        }
        if (hero.running == null) {
            hero.running = false;
        }
        return hero;
    },

    moveTilesPerSec: function () {
        var hero = this.ensureRunState(this.registry.get('hero'));
        if (hero && hero.running && hero.runEnergy > 0) {
            return RUN_TILES_PER_SEC;
        }
        return WALK_TILES_PER_SEC;
    },

    moveSpeed: function () {
        var tiles = this.moveTilesPerSec();
        if (window.GameClock && typeof GameClock.pxPerSec === 'function') {
            return GameClock.pxPerSec(tiles);
        }
        return tiles * (typeof TILE_SIZE === 'number' ? TILE_SIZE : 16);
    },

    secondsToSimTicks: function (sec) {
        if (window.GameClock && typeof GameClock.secondsToTicks === 'function') {
            return GameClock.secondsToTicks(sec);
        }
        var tps = 60;
        return Math.max(1, Math.round(sec * tps));
    },

    tickRunEnergy: function (dtSec, moving) {
        var hero = this.ensureRunState(this.registry.get('hero'));
        if (!hero || !(dtSec > 0)) {
            return;
        }
        var actuallyRunning = !!(hero.running && moving && hero.runEnergy > 0);
        if (actuallyRunning) {
            hero.runEnergy = Math.max(0, hero.runEnergy - RUN_DRAIN_PER_SEC * dtSec);
            if (hero.runEnergy <= 0) {
                hero.runEnergy = 0;
                hero.running = false;
                Hud.log('You are too tired to run.');
            }
        } else {
            hero.runEnergy = Math.min(RUN_ENERGY_MAX, hero.runEnergy + RUN_RESTORE_PER_SEC * dtSec);
        }
        this.registry.set('hero', hero);
        if (window.Hud && Hud.renderRun) {
            Hud.renderRun(hero);
        }
    },

    clampWorldPoint: function (x, y) {
        var bounds = this.physics && this.physics.world && this.physics.world.bounds;
        var minX = 8;
        var minY = 8;
        var maxX = bounds ? bounds.x + bounds.width - 8 : 568;
        var maxY = bounds ? bounds.y + bounds.height - 8 : 440;
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    },

    fleeDestWalkable: function (x, y) {
        if (!this.tileGrid || typeof tileWalkable !== 'function' || typeof worldToTile !== 'function') {
            return true;
        }
        var tile = worldToTile(x, y);
        return tileWalkable(this.tileGrid, tile.tx, tile.ty);
    },

    pushOffMob: function (mob) {
        if (!this.player || !mob || typeof mob.x !== 'number' || typeof mob.y !== 'number') {
            return;
        }
        var dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, mob.x, mob.y);
        if (dist >= FLEE_PUSH_PX) {
            return;
        }
        var nx;
        var ny;
        if (dist < 1) {
            var face = this.lastFacing || 'down';
            nx = face === 'right' ? -1 : (face === 'left' ? 1 : 0);
            ny = face === 'down' ? -1 : (face === 'up' ? 1 : 0);
            if (!nx && !ny) {
                ny = -1;
            }
        } else {
            nx = (this.player.x - mob.x) / dist;
            ny = (this.player.y - mob.y) / dist;
        }
        var candidates = [
            { x: mob.x + nx * FLEE_PUSH_PX, y: mob.y + ny * FLEE_PUSH_PX },
            { x: mob.x - FLEE_PUSH_PX, y: mob.y },
            { x: mob.x + FLEE_PUSH_PX, y: mob.y },
            { x: mob.x, y: mob.y - FLEE_PUSH_PX },
            { x: mob.x, y: mob.y + FLEE_PUSH_PX }
        ];
        var i;
        for (i = 0; i < candidates.length; i++) {
            var dest = this.clampWorldPoint(candidates[i].x, candidates[i].y);
            if (Phaser.Math.Distance.Between(dest.x, dest.y, mob.x, mob.y) < 21) {
                continue;
            }
            if (this.fleeDestWalkable(dest.x, dest.y)) {
                this.placePlayer(dest.x, dest.y);
                return;
            }
        }
    },

    tryAutoEngage: function () {
        var range;
        var dist;
        if (this.encounterLock || this.uiPaused() || this.time.now < this.engageGrace) {
            return false;
        }
        /* Player click-walk pauses proximity auto-attack and engageTarget chase. */
        if (this.playerClickWalkActive) {
            return false;
        }
        range = this.heroEngageRangePx();
        if (this.engageTarget && this.engageTarget.aliveMob) {
            dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.engageTarget.x, this.engageTarget.y
            );
            if (dist <= range) {
                this.beginFight(this.engageTarget);
                return true;
            }
            if (!this.walkTarget) {
                this.setWalk(this.engageTarget.x, this.engageTarget.y, { allowEnd: true });
            }
            return false;
        }
        if (!this.autoAttackOn()) {
            return false;
        }
        /* Proximity auto-attack uses hero.autoAttackRange (Chebyshev tiles); click-target uses weapon range above. */
        var hero = this.registry.get('hero');
        var tiles = typeof autoAttackRangeTiles === 'function'
            ? autoAttackRangeTiles(hero)
            : (typeof DEFAULT_AUTO_ATTACK_RANGE_TILES === 'number' ? DEFAULT_AUTO_ATTACK_RANGE_TILES : 3);
        var near = this.pickNearestAliveMobChebyshev(tiles);
        if (near && near.aliveMob) {
            this.beginFight(near);
            return true;
        }
        return false;
    },

    recomputeSimCountdowns: function (fromTps, fromSpeed) {
        var clock = window.GameClock;
        var recompute;
        var self = this;
        if (!clock || typeof clock.recomputeTicks !== 'function') {
            return;
        }
        recompute = function (ticks) {
            return clock.recomputeTicks(ticks, fromTps, fromSpeed);
        };
        if (this.fishAction && this.fishAction.ticksLeft > 0) {
            this.fishAction.ticksLeft = recompute(this.fishAction.ticksLeft);
        }
        if (this.chopAction && this.chopAction.ticksLeft > 0) {
            this.chopAction.ticksLeft = recompute(this.chopAction.ticksLeft);
        }
        if (this.mineAction && this.mineAction.ticksLeft > 0) {
            this.mineAction.ticksLeft = recompute(this.mineAction.ticksLeft);
        }
        if (this.overworldFight) {
            if (this.overworldFight.ticksLeft > 0) {
                this.overworldFight.ticksLeft = recompute(this.overworldFight.ticksLeft);
            }
            if (this.overworldFight.firstSwingTicks > 0) {
                this.overworldFight.firstSwingTicks = recompute(this.overworldFight.firstSwingTicks);
            }
        }
        if (this.mobs && this.mobs.children) {
            this.mobs.children.iterate(function (mob) {
                if (mob && mob.respawnTicksLeft > 0) {
                    mob.respawnTicksLeft = recompute(mob.respawnTicksLeft);
                }
                if (mob && mob._agroHitTicksLeft > 0) {
                    mob._agroHitTicksLeft = recompute(mob._agroHitTicksLeft);
                }
            });
        }
        if (this.depletedTiles) {
            Object.keys(this.depletedTiles).forEach(function (key) {
                var entry = self.depletedTiles[key];
                if (entry && entry.ticksLeft > 0) {
                    entry.ticksLeft = recompute(entry.ticksLeft);
                }
            });
        }
    },

    simTickWorld: function () {
        var fight = this.overworldFight;
        var self = this;
        var keys;
        var i;
        var key;
        var entry;
        var parts;
        var tx;
        var ty;

        if (this.fishAction && this.fishAction.ticksLeft > 0) {
            this.fishAction.ticksLeft -= 1;
            if (this.fishAction.ticksLeft <= 0) {
                this.finishFishAction();
            }
        }
        if (this.chopAction && this.chopAction.ticksLeft > 0) {
            this.chopAction.ticksLeft -= 1;
            if (this.chopAction.ticksLeft <= 0) {
                this.finishChopAction();
            }
        }
        if (this.mineAction && this.mineAction.ticksLeft > 0) {
            this.mineAction.ticksLeft -= 1;
            if (this.mineAction.ticksLeft <= 0) {
                if (this.mineAction.denBoulder) {
                    this.finishMineBoulder();
                } else {
                    this.finishMineAction();
                }
            }
        }

        if (fight) {
            if (fight.firstSwingTicks > 0) {
                fight.firstSwingTicks -= 1;
                if (fight.firstSwingTicks <= 0) {
                    this.tickOverworldFight(true);
                }
            } else if (fight.ticksLeft > 0) {
                fight.ticksLeft -= 1;
                if (fight.ticksLeft <= 0) {
                    this.tickOverworldFight();
                    if (this.overworldFight) {
                        this.overworldFight.ticksLeft = this.secondsToSimTicks(
                            this.overworldFight.beatSec || OW_COMBAT_TICK_SEC || 0.6
                        );
                    }
                }
            }
        }

        if (this.mobs && this.mobs.children) {
            this.mobs.children.iterate(function (mob) {
                if (!mob) {
                    return;
                }
                if (mob._agroHitTicksLeft > 0) {
                    mob._agroHitTicksLeft -= 1;
                }
                if (mob.respawnTicksLeft > 0) {
                    mob.respawnTicksLeft -= 1;
                    if (mob.respawnTicksLeft <= 0) {
                        self.completeMobRespawn(mob);
                    }
                }
            });
        }

        if (this.depletedTiles) {
            keys = Object.keys(this.depletedTiles);
            for (i = 0; i < keys.length; i++) {
                key = keys[i];
                entry = this.depletedTiles[key];
                if (!entry || typeof entry.ticksLeft !== 'number') {
                    continue;
                }
                entry.ticksLeft -= 1;
                if (entry.ticksLeft <= 0) {
                    tx = entry.tx;
                    ty = entry.ty;
                    if (tx == null || ty == null) {
                        parts = key.split(':');
                        parts = (parts[1] || '').split(',');
                        tx = parseInt(parts[0], 10);
                        ty = parseInt(parts[1], 10);
                    }
                    this.restoreDepletedTile(key, tx, ty, entry.emptyIndex, entry.fullIndex);
                }
            }
        }

        this.tickHpRegen(
            window.GameClock && typeof GameClock.gameSecondsPerTick === 'function'
                ? GameClock.gameSecondsPerTick()
                : (1 / 60)
        );
    },

    update: function (time, delta) {
        var dt = (typeof delta === 'number' && isFinite(delta) && delta > 0) ? Math.min(delta, 80) / 1000 : 0;
        var simRan = 0;
        var simGameDt = 0;
        var si;
        if (!this.player || !this.player.body) {
            return;
        }
        if (this.encounterLock && !this.overworldFight) {
            return;
        }
        if (this.uiPaused()) {
            if (this.player.body) {
                this.player.body.setVelocity(0, 0);
            }
            if (Keys.justPressed('Escape')) {
                if (Hud.dialogueOpen && Hud.dialogueOpen() && Hud.hideDialogue) {
                    Hud.hideDialogue();
                }
                if (Hud.stationOpen && Hud.stationOpen() && Hud.hideStation) {
                    Hud.hideStation();
                }
                if (Hud.hideContextMenu) {
                    Hud.hideContextMenu();
                }
            }
            /* Space → Continue/Close is handled on keydown in Hud while dialogue is open. */
            this.npcs.children.iterate(function (npc) {
                if (!npc) {
                    return;
                }
                if (npc.nameLabel) {
                    npc.nameLabel.setPosition(npc.x, npc.y - 14);
                }
                if (npc.questIcon) {
                    npc.questIcon.setPosition(npc.x, npc.y - 24);
                }
            });
            if (this.nameplate && this.player) {
                var pausedName = this.registry.get('hero');
                this.nameplate.setText((pausedName && pausedName.displayName) || 'Adventurer');
                this.nameplate.setPosition(this.player.x, this.player.y - 12);
            }
            return;
        }
        if (this.overworldFight) {
            var heroPoison = this.registry.get('hero');
            if (heroPoison && typeof tickHeroPoison === 'function') {
                tickHeroPoison(heroPoison, this);
            }
            if (typeof this.tickPrayerDrainLite === 'function') {
                this.tickPrayerDrainLite(dt);
            }
            this.chaseFightMob();
            /* Fall through so the player can kite while the mob closes distance. */
        }

        this.mobs.children.iterate(function (mob) {
            if (mob && mob.nameLabel) {
                var lift = 8 + Math.round((mob.displayHeight || 16) / 2);
                mob.nameLabel.setPosition(mob.x, mob.y - lift);
            }
        });
        this.npcs.children.iterate(function (npc) {
            if (!npc) {
                return;
            }
            if (npc.nameLabel) {
                npc.nameLabel.setPosition(npc.x, npc.y - 14);
            }
            if (npc.questIcon) {
                npc.questIcon.setPosition(npc.x, npc.y - 24);
            }
        });

        if (window.Hud && Hud.mode === 'world' && Keys.runTogglePressed()) {
            Hud.toggleRun();
        }

        if (window.GameClock && typeof GameClock.advance === 'function') {
            simRan = GameClock.advance(typeof delta === 'number' ? Math.min(delta, 80) : 0);
            simGameDt = simRan * (typeof GameClock.gameSecondsPerTick === 'function'
                ? GameClock.gameSecondsPerTick()
                : 0);
            for (si = 0; si < simRan; si++) {
                this.simTickWorld();
            }
        } else {
            simGameDt = dt;
            this.tickHpRegen(dt);
        }

        var speed = this.moveSpeed();
        var vx = 0;
        var vy = 0;
        var move = this.moveFlags();
        if (Keys.justPressed('Escape')) {
            this.clearWalk();
            this.talkTarget = null;
            this.engageTarget = null;
            this.lootTarget = null;
            this.clearGather();
            if (window.Hud && Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            if (window.Hud && Hud.clearUseOn) {
                Hud.clearUseOn();
            }
        }
        if (move.left || move.right || move.up || move.down) {
            this.noteTutorial('walk');
            this.clearWalk();
            this.talkTarget = null;
            this.engageTarget = null;
            this.lootTarget = null;
            this.clearGather();
            if (window.Hud && Hud.bankOpen && Hud.bankOpen() && Hud.hideBank) {
                Hud.hideBank();
            }
            if (window.Hud && Hud.shopOpen && Hud.shopOpen() && Hud.hideShop) {
                Hud.hideShop();
            }
            if (move.left && !move.right) { vx = -speed; }
            else if (move.right && !move.left) { vx = speed; }
            if (move.up && !move.down) { vy = -speed; }
            else if (move.down && !move.up) { vy = speed; }
        } else {
            var chasing = this.playerClickWalkActive ? null : this.chaseWalkTarget();
            if (!this.walkTarget && chasing && !this.chaseInRange(chasing)) {
                this.setWalk(chasing.x, chasing.y, { allowEnd: true });
            }
            if (this.walkTarget) {
                this.maybeRepath();
                chasing = this.playerClickWalkActive ? null : this.chaseWalkTarget();
                var destDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.walkTarget.x, this.walkTarget.y);
                if (destDist < 6 && chasing && !this.chaseInRange(chasing)) {
                    this.walkTarget = { x: chasing.x, y: chasing.y };
                    this.placeWalkMarker(chasing.x, chasing.y);
                    this.walkPath = this.computeWalkPath(chasing.x, chasing.y, { allowEnd: true });
                    this.drawPathLine();
                    this.pathCheckAt = 0;
                    destDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.walkTarget.x, this.walkTarget.y);
                }
                if (destDist < 6 && !(chasing && !this.chaseInRange(chasing))) {
                    var keepTravel = !!(this.travelZoneId && this.travelZoneId !== this.zoneId);
                    this.clearWalk({ keepTravel: keepTravel });
                    this.player.body.setVelocity(0);
                } else if (destDist >= 6) {
                    var aim = this.aimWalkPoint();
                    if (!aim || this.nextStepOccupied(aim)) {
                        vx = 0;
                        vy = 0;
                        this.drawPathLine();
                    } else {
                        var dx = aim.x - this.player.x;
                        var dy = aim.y - this.player.y;
                        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        vx = (dx / dist) * speed;
                        vy = (dy / dist) * speed;
                        this.drawPathLine();
                    }
                }
            } else if (this.walkPath) {
                this.clearWalk();
            }
        }

        this.player.body.setVelocity(vx, vy);
        if (vx || vy) {
            var len = Math.sqrt(vx * vx + vy * vy) || 1;
            var nx = (vx / len) * speed;
            var ny = (vy / len) * speed;
            var cornerSafe = typeof clampMoveNoCornerCut === 'function'
                ? clampMoveNoCornerCut(this.tileGrid, this.player.x, this.player.y, nx, ny)
                : { vx: nx, vy: ny };
            var slid = slideIntoOneTileGap(
                this.tileGrid,
                this.player.x,
                this.player.y,
                this.player.body.width,
                this.player.body.height,
                cornerSafe.vx,
                cornerSafe.vy
            );
            if (slid.x !== this.player.x || slid.y !== this.player.y) {
                this.player.setPosition(slid.x, slid.y);
            }
            var slen = Math.sqrt(slid.vx * slid.vx + slid.vy * slid.vy);
            if (slen > 1) {
                this.player.body.velocity.x = (slid.vx / slen) * speed;
                this.player.body.velocity.y = (slid.vy / slen) * speed;
            } else {
                this.player.body.velocity.x = slid.vx;
                this.player.body.velocity.y = slid.vy;
            }
        }

        this.tickRunEnergy(simGameDt > 0 ? simGameDt : dt, !!(vx || vy));

        if (vx < -10) {
            this.player.anims.play('left', true);
            this.player.flipX = false;
            this.lastFacing = 'left';
        } else if (vx > 10) {
            this.player.anims.play('right', true);
            this.player.flipX = true;
            this.lastFacing = 'right';
        } else if (vy < -10) {
            this.player.anims.play('up', true);
            this.lastFacing = 'up';
        } else if (vy > 10) {
            this.player.anims.play('down', true);
            this.lastFacing = 'down';
        } else {
            this.player.anims.stop();
            this.applyIdleFacing();
        }

        if (typeof this.maybeRandomEvent === 'function') {
            this.maybeRandomEvent();
        }
        if (this.zoneId === 'graves' && this.wildSkull && this.player) {
            this.wildSkull.setPosition(this.player.x + 12, this.player.y - 22);
        }

        this.collectNearbyLoot();
        this.pruneLoot();
        this.pruneGroundFires();
        this.tickBiomeFx(time);
        this.tickShaftMarkers(time);
        this.tryShaftApproachChat();
        if (this.nameplate && this.player) {
            var heroName = this.registry.get('hero');
            this.nameplate.setText((heroName && heroName.displayName) || 'Adventurer');
            this.nameplate.setPosition(this.player.x, this.player.y - 12);
        }
        if ((vx || vy || this.walkTarget) && window.Sfx && Sfx.foot) {
            if (!this._footAt || time >= this._footAt) {
                Sfx.foot();
                this._footAt = time + ((Hud.hero && Hud.hero() && Hud.hero().running) ? 220 : 340);
            }
        }

        if (this.tryCompleteLootTake()) {
            return;
        }
        if (this.tryCompleteGraveReclaim()) {
            return;
        }
        if (this.tryAutoEngage()) {
            return;
        }
        if (this.talkTarget) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.talkTarget.x, this.talkTarget.y) < 22 &&
                !this.talkBlockedByWall(this.talkTarget)) {
                this.player.body.setVelocity(0);
                this.clearWalk();
                this.tryTalk(this.talkTarget);
            }
        }
        this.tryCompleteFish();
        this.tryCompleteChop();
        this.tryCompleteMine();
        this.tryCompleteStation();
        this.closeBankIfAway();
        this.closeShopIfAway();
        this.closeStationIfAway();

        if (Keys.justPressed('Space') && Hud.mode !== 'battle') {
            if (Hud.dialogueOpen && Hud.dialogueOpen()) {
                /* Continue/Close already handled by Hud keydown. */
            } else {
                var nearNpc = this.pickSprite(this.npcs, this.player.x, this.player.y, 28);
                if (nearNpc && !this.talkBlockedByWall(nearNpc)) {
                    this.tryTalk(nearNpc);
                }
            }
        }

        this.closeDialogueIfAway();

        this.tickMobAgro();
        this.wanderMobs();
        this.wanderNpcs();
        if (this.overworldFight) {
            this.chaseFightMob();
        }
        this.updateCombatRangeRings();
        this.updateEffectRadiusRings();
        this.constrainGiantMobs();
        this.constrainMobMapEdge();
        this.tryLockedDoor();
        this.tryAgilityShortcut();
        this.updateDoors();
        this.checkExits();
    },

    tickPrayerDrainLite: function (dt) {
        var hero = this.registry.get('hero');
        var anyOn;
        if (!hero || !hero.prayers) {
            return;
        }
        anyOn = hero.prayers.thickskin || hero.prayers.burststrength;
        if (!anyOn) {
            return;
        }
        this._prayerAcc = (this._prayerAcc || 0) + dt;
        if (this._prayerAcc < 3) {
            return;
        }
        this._prayerAcc = 0;
        hero.prayerPoints = Math.max(0, (hero.prayerPoints || 0) - 1);
        if (hero.prayerPoints < 1) {
            hero.prayers.thickskin = false;
            hero.prayers.burststrength = false;
            Hud.log('You run out of prayer points.');
        }
        this.registry.set('hero', hero);
        if (Hud.renderPrayers) {
            Hud.renderPrayers(hero);
        }
    },

    tryStretchSkillAction: function (skillId) {
        var hero = this.registry.get('hero');
        var ok = false;
        if (!hero) {
            return false;
        }
        if (skillId === 'runecraft' && typeof craftAirRune === 'function') {
            ok = craftAirRune(hero);
        } else if (skillId === 'farming' && typeof plantGuamSeed === 'function') {
            ok = plantGuamSeed(hero);
        } else if (skillId === 'herblore' && typeof mixAttackPotion === 'function') {
            ok = mixAttackPotion(hero);
        } else if (skillId === 'fletching' && typeof fletchShortbow === 'function') {
            ok = fletchShortbow(hero);
        } else if (skillId === 'construction' && typeof buildOakBench === 'function') {
            ok = buildOakBench(hero);
        } else if (skillId === 'slayer' && typeof assignSlayerTask === 'function') {
            ok = !!assignSlayerTask(hero);
        }
        if (ok) {
            this.registry.set('hero', hero);
            this.refreshHud();
        }
        return ok;
    },

    tryPickpocket: function (npc) {
        var hero = this.registry.get('hero');
        if (!npc || !hero || Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) > 24) {
            return false;
        }
        if (typeof pickpocketNpc !== 'function' || !pickpocketNpc(hero)) {
            Hud.log('You fail to pick the pocket.');
            return false;
        }
        this.registry.set('hero', hero);
        Hud.log('You pick a pocket for some coins.');
        this.refreshHud();
        return true;
    },

    refreshWildernessFlag: function () {
        if (this.wildSkull) {
            this.wildSkull.destroy();
            this.wildSkull = null;
        }
        if (this.zoneId !== 'graves') {
            return;
        }
        this.wildSkull = this.add.text(this.player.x + 12, this.player.y - 22, '☠', {
            fontSize: '10px',
            fontFamily: 'Alegreya Sans, Trebuchet MS, sans-serif',
            color: '#ff6666'
        }).setDepth(12);
    }
});
