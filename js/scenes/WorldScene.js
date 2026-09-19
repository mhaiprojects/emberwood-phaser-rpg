var WALK_SPEED = 90;
var RUN_SPEED = 180;
var RUN_ENERGY_MAX = 100;
var RUN_DRAIN_PER_SEC = 25;
var RUN_RESTORE_PER_SEC = 15;
var DEST_X_COLOR = 0xf8ff38;
var DEST_X_ARM = 8;
var MOB_RESPAWN_MS = 18000;

var WorldScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function WorldScene() {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },

    create: function () {
        Keys.init();
        this.zoneId = this.registry.get('zone') || 'haven';
        this.interiorId = null;
        this.walkTarget = null;
        this.walkPath = null;
        this.walkBlocked = false;
        this.pathCheckAt = 0;
        this.tileGrid = null;
        this.engageTarget = null;
        this.talkTarget = null;
        this.exitLock = false;
        this.encounterLock = false;
        this.engageGrace = 0;
        this.lastFought = null;
        this.lastFacing = 'down';
        this.groundLoot = [];
        this.lootZoneState = {};
        this.mobZoneState = {};
        this.unlockedDoors = {};
        this.lockChatUntil = 0;

        this.marker = this.add.rectangle(0, 0, 6, 6, DEST_X_COLOR).setVisible(false).setDepth(8);
        this.destX = this.makeDestX();
        this.pathGfx = this.add.graphics();
        this.pathGfx.setDepth(4);
        this.pathGfx.setVisible(false);
        this.npcs = this.physics.add.group({ immovable: true });
        this.mobs = this.physics.add.group();
        this.floatLabels = [];

        var spawn0 = defaultWorldSpawn();
        this.player = this.physics.add.sprite(spawn0.x, spawn0.y, 'player', 0);
        this.player.setScale(PLAYER_WORLD_SCALE);
        applyPlayerWorldBody(this.player);
        this.player.setDepth(6);
        this.physics.add.collider(this.player, this.npcs);

        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.roundPixels = true;

        this.input.on('pointerdown', this.onClick, this);
        if (this.input.mouse && this.input.mouse.disableContextMenu) {
            this.input.mouse.disableContextMenu();
        }
        this.sys.events.off('wake', this.wake, this);
        this.sys.events.on('wake', this.wake, this);

        this.enterZone(this.zoneId, null);
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        Hud.log('You arrive in Emberhaven. WASD or arrows to walk, Ctrl to run, or click the ground.');
        Hud.log('Open Inventory (F4) for food. The Guildmaster by the courtyard has work.');
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

    applyTilemap: function (grid) {
        this.tileGrid = grid;
        var data = flattenMap(grid);
        this.map = this.make.tilemap({ data: data, tileWidth: 16, tileHeight: 16 });
        var tiles = this.map.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0, 1);
        this.ground = this.map.createLayer(0, tiles, 0, 0);
        this.ground.setCollision([
            TILE.WATER, TILE.TREE, TILE.ROCK, TILE.SHRINE,
            TILE.STALL, TILE.RANGE, TILE.ANVIL, TILE.BOOTH,
            TILE.DOCK, TILE.BOAT, TILE.TOMB, TILE.DOOR
        ]);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.groundCollider = this.physics.add.collider(this.player, this.ground);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(PLAYER_WORLD_SCALE);
        applyPlayerWorldBody(this.player);
        this.applyUnlockedDoors();
    },

    doorUnlockKey: function (tx, ty) {
        return (this.zoneId || '') + ':' + tx + ',' + ty;
    },

    applyUnlockedDoors: function () {
        this.unlockedDoors = this.unlockedDoors || {};
        if (!this.tileGrid || !this.ground) {
            return;
        }
        var prefix = (this.zoneId || '') + ':';
        var key;
        for (key in this.unlockedDoors) {
            if (!this.unlockedDoors[key] || key.indexOf(prefix) !== 0) {
                continue;
            }
            var parts = key.slice(prefix.length).split(',');
            var tx = parseInt(parts[0], 10);
            var ty = parseInt(parts[1], 10);
            if (!this.tileGrid[ty] || this.tileGrid[ty][tx] !== TILE.DOOR) {
                continue;
            }
            this.tileGrid[ty][tx] = TILE.PATH;
            this.ground.putTileAt(TILE.PATH, tx, ty);
        }
    },

    unlockDoor: function (tx, ty) {
        if (!this.tileGrid || !this.tileGrid[ty] || this.tileGrid[ty][tx] !== TILE.DOOR) {
            return false;
        }
        this.tileGrid[ty][tx] = TILE.PATH;
        if (this.ground) {
            this.ground.putTileAt(TILE.PATH, tx, ty);
        }
        this.unlockedDoors = this.unlockedDoors || {};
        this.unlockedDoors[this.doorUnlockKey(tx, ty)] = true;
        return true;
    },

    handleLockedDoor: function (tx, ty) {
        var hero = this.registry.get('hero');
        var keyId = (LOCKED_DOOR && LOCKED_DOOR.keyId) || 'key';
        if (heroHasItem(hero, keyId)) {
            if (this.unlockDoor(tx, ty)) {
                Hud.log('You unlock the door.');
            }
            return;
        }
        var now = this.time ? this.time.now : 0;
        if (now && now < this.lockChatUntil) {
            return;
        }
        this.lockChatUntil = now + 800;
        Hud.log('The door is locked.');
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

    lockExits: function () {
        this.exitLock = true;
        var self = this;
        this.time.delayedCall(400, function () {
            self.exitLock = false;
        });
    },

    enterZone: function (zoneId, fromDir) {
        var zone = ZONES[zoneId];
        if (!zone) {
            return;
        }
        var leavingInterior = !!this.interiorId;
        if (!leavingInterior) {
            if (fromDir && this.zoneId && this.zoneId !== zoneId) {
                this.snapshotMobs();
            } else if (!fromDir) {
                this.clearMobZoneState();
            }
            if (this.zoneId && this.zoneId !== zoneId) {
                this.snapshotLoot();
            }
        }
        this.interiorId = null;
        this.zoneId = zoneId;
        this.registry.set('zone', zoneId);
        this.clearWorldObjects();

        var neighbors = zoneNeighbors(zone);
        this.applyTilemap(generateMap(zone.seed, zone.biome, neighbors));

        var spawn = fromDir ? spawnPointForEntry(fromDir) : defaultWorldSpawn();
        this.placePlayer(spawn.x, spawn.y);
        this.clearWalk();

        this.spawnPeople(zoneId);
        this.restoreLoot(zoneId);
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        Hud.log('You enter ' + zone.name + '.');
    },

    enterInterior: function (interiorId) {
        var spec = interiorById(interiorId);
        if (!spec || this.interiorId === interiorId) {
            return;
        }
        if (!this.interiorId) {
            this.snapshotMobs();
            this.snapshotLoot();
        }
        this.interiorId = interiorId;
        this.clearWorldObjects();
        this.applyTilemap(generateInterior(interiorId));
        var spawn = interiorSpawnPoint();
        this.placePlayer(spawn.x, spawn.y);
        this.clearWalk();
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        Hud.log('You enter ' + spec.name + '.');
        this.lockExits();
    },

    leaveInterior: function () {
        var spec = interiorById(this.interiorId);
        var zone = ZONES[this.zoneId];
        if (!spec || !zone) {
            return;
        }
        this.interiorId = null;
        this.clearWorldObjects();
        this.applyTilemap(generateMap(zone.seed, zone.biome, zoneNeighbors(zone)));
        var out = tileCenter(spec.doorTx, spec.doorTy + 1);
        this.placePlayer(out.x, out.y);
        this.clearWalk();
        this.spawnPeople(this.zoneId);
        this.restoreLoot(this.zoneId);
        this.refreshHud();
        this.engageGrace = this.time.now + 800;
        Hud.log('You enter ' + zone.name + '.');
        this.lockExits();
    },

    clearWorldObjects: function () {
        this.clearWalk();
        this.engageTarget = null;
        this.talkTarget = null;
        this.tileGrid = null;
        if (this.groundCollider) {
            this.groundCollider.destroy();
            this.groundCollider = null;
        }
        for (var i = 0; i < this.floatLabels.length; i++) {
            this.floatLabels[i].destroy();
        }
        this.floatLabels.length = 0;
        this.clearLoot();
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
        (NPC_DEFS[zoneId] || []).forEach(function (def) {
            var sprite = self.npcs.create(def.x, def.y, def.texture || ('npc-' + def.key));
            if (def.tint && def.tint !== 0xffffff && !isUniqueMobTexture(def.texture || ('npc-' + def.key))) {
                sprite.setTint(def.tint);
            }
            sprite.setImmovable(true);
            sprite.body.setSize(12, 12);
            sprite.npcDef = def;
            var label = self.add.text(def.x, def.y - 14, def.name, {
                fontSize: '8px',
                fontFamily: 'Verdana, Geneva, sans-serif',
                color: '#ffe08a',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(7);
            sprite.nameLabel = label;
            self.floatLabels.push(label);
        });

        (MOB_DEFS[zoneId] || []).forEach(function (def, index) {
            var sprite = self.physics.add.sprite(def.x, def.y, def.texture, def.frame || 0);
            self.mobs.add(sprite);
            if (def.tint && def.tint !== 0xffffff && !isUniqueMobTexture(def.texture)) {
                sprite.setTint(def.tint);
            }
            var scale = mobScaleFor(def.type, 'world');
            sprite.setScale(scale);
            applyMobWorldBody(sprite, def.type);
            sprite.mobDef = Object.assign({ id: zoneId + '-' + index }, def);
            sprite.aliveMob = true;
            sprite.respawnAt = 0;
            var label = self.add.text(def.x, def.y - Math.round(8 * scale) - 6, def.type, {
                fontSize: '8px',
                fontFamily: 'Verdana, Geneva, sans-serif',
                color: '#ffb0a0',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(7);
            sprite.nameLabel = label;
            self.floatLabels.push(label);
            self.physics.add.collider(sprite, self.ground);
            self.restoreMobState(sprite, zoneId, scale);
        });
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

    restoreMobState: function (sprite, zoneId, scale) {
        var bag = this.mobZoneState && this.mobZoneState[zoneId];
        var saved = bag && sprite.mobDef && bag[sprite.mobDef.id];
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
        var remain = this.remainingOfTimer(saved.timer);
        var stillDead = !saved.alive && remain > 0;
        if (stillDead) {
            this.hideMob(sprite);
            sprite.respawnAt = saved.respawnAt || 0;
            sprite.respawnTimer = saved.timer;
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
            mob.nameLabel.setVisible(true);
        }
    },

    scheduleMobRespawn: function (mob, delay) {
        var self = this;
        if (!mob || !mob.mobDef) {
            return;
        }
        if (mob.respawnTimer) {
            mob.respawnTimer.remove(false);
            mob.respawnTimer = null;
        }
        var wait = Math.max(0, delay);
        var zoneId = this.zoneId;
        var id = mob.mobDef.id;
        mob.respawnAt = this.time.now + wait;
        if (wait <= 0) {
            this.rememberMob(mob, { alive: true, respawnAt: 0, timer: null, zoneId: zoneId });
            this.reviveMob(mob);
            return;
        }
        mob.respawnTimer = this.time.delayedCall(wait, function () {
            var bag = self.mobZoneState && self.mobZoneState[zoneId];
            if (bag && bag[id]) {
                bag[id].alive = true;
                bag[id].respawnAt = 0;
                bag[id].timer = null;
            }
            var live = self.zoneId === zoneId ? self.findMobById(id) : null;
            if (live) {
                live.respawnTimer = null;
                self.reviveMob(live);
            } else if (mob && mob.active) {
                mob.respawnTimer = null;
                self.reviveMob(mob);
            }
        });
        this.rememberMob(mob, {
            alive: false,
            respawnAt: mob.respawnAt,
            timer: mob.respawnTimer,
            zoneId: zoneId
        });
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
        Hud.setWorld({
            zone: interior ? interior.name : zone.name,
            zoneId: this.zoneId,
            hp: hero.hp,
            maxHp: hero.maxHp,
            gold: hero.gold,
            xp: hero.xp,
            level: hero.level,
            quest: questText
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

    onClick: function (pointer) {
        if (this.encounterLock || Hud.mode === 'battle' || Hud.mode === 'title') {
            if (Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
            return;
        }
        var x = pointer.worldX;
        var y = pointer.worldY;
        if (this.isRightClick(pointer)) {
            var ev = pointer.event;
            var onLoot = this.pickLoot(x, y, 18);
            var onMob = this.pickSprite(this.mobs, x, y, 18);
            var onNpc = this.pickSprite(this.npcs, x, y, 18);
            if (onLoot || (onMob && onMob.aliveMob) || onNpc) {
                if (Hud.hideContextMenu) {
                    Hud.hideContextMenu();
                }
                return;
            }
            var items = [];
            if (this.pickScenery(x, y)) {
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
        var loot = this.pickLoot(x, y, 18);
        if (loot) {
            this.tryPickup(loot);
            return;
        }
        var hit = this.pickSprite(this.mobs, x, y, 18);
        if (hit && hit.aliveMob) {
            this.engageTarget = hit;
            this.talkTarget = null;
            this.setWalk(hit.x, hit.y, { allowEnd: true });
            Hud.log('You target the ' + hit.mobDef.type + '.');
            return;
        }
        hit = this.pickSprite(this.npcs, x, y, 18);
        if (hit) {
            this.talkTarget = hit;
            this.engageTarget = null;
            this.setWalk(hit.x, hit.y, { allowEnd: true });
            return;
        }
        var scenery = this.pickScenery(x, y);
        if (scenery) {
            this.engageTarget = null;
            this.talkTarget = null;
            this.examineScenery(scenery);
            return;
        }
        this.engageTarget = null;
        this.talkTarget = null;
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 10) {
            this.clearWalk();
            return;
        }
        this.setWalk(x, y);
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

    houseRectsNow: function () {
        if (this.interiorId) {
            return typeof INTERIOR_ROOM !== 'undefined' ? [INTERIOR_ROOM] : [];
        }
        var zone = ZONES[this.zoneId];
        return typeof housesForBiome === 'function' ? housesForBiome(zone && zone.biome) : [];
    },

    pickScenery: function (x, y) {
        var tile = worldToTile(x, y);
        var kind = typeof sceneryKindAt === 'function'
            ? sceneryKindAt(this.tileGrid, tile.tx, tile.ty, {
                houseRects: this.houseRectsNow(),
                interior: !!this.interiorId
            })
            : null;
        if (!kind) {
            return null;
        }
        return { tx: tile.tx, ty: tile.ty, kind: kind };
    },

    examineScenery: function (hit) {
        if (!hit || !hit.kind) {
            return false;
        }
        var line = typeof examineSceneryText === 'function' ? examineSceneryText(hit.kind) : '';
        if (!line) {
            return false;
        }
        Hud.log(line);
        return true;
    },

    examineAt: function (x, y) {
        return this.examineScenery(this.pickScenery(x, y));
    },

    pickLoot: function (x, y, range) {
        var best = null;
        var bestD = range;
        for (var i = 0; i < this.groundLoot.length; i++) {
            var drop = this.groundLoot[i];
            if (!drop || drop.taken || !drop.sprite) {
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
        opts = opts || {};
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
        if (!here || !target || target.id === here.id) {
            return;
        }
        var dir = this.dirTowardZone(here, target);
        if (!dir) {
            return;
        }
        var dest = this.exitWalkPoint(dir);
        this.engageTarget = null;
        this.talkTarget = null;
        this.setWalk(dest.x, dest.y);
    },

    clearWalk: function () {
        this.walkTarget = null;
        this.walkPath = null;
        this.walkBlocked = false;
        this.pathCheckAt = 0;
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
        };
        if (this.npcs) {
            this.npcs.children.iterate(markSprite);
        }
        if (!this.mobs) {
            return occ;
        }
        this.mobs.children.iterate(function (mob) {
            if (mob && mob.aliveMob) {
                markSprite(mob);
            }
        });
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

    maybeRepath: function () {
        if (!this.walkTarget) {
            return;
        }
        var now = this.time.now;
        if (this.pathCheckAt && now < this.pathCheckAt) {
            return;
        }
        this.pathCheckAt = now + 280;
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

    tryTalk: function (npc) {
        if (this.encounterLock || Hud.mode === 'battle') {
            return;
        }
        var def = npc.npcDef;
        var hero = this.registry.get('hero');
        var quest = this.registry.get('quest');
        if (def.key === 'guild') {
            if (quest.stage === 0) {
                quest.stage = 1;
                quest.progress = 0;
                this.registry.set('quest', quest);
                Hud.log(def.name + ': Goblins plague Northwood. Bring me 5 kills.');
            } else if (quest.stage === 1) {
                Hud.log(def.name + ': ' + quest.progress + ' of ' + quest.goal + ' goblins down. Keep at it.');
            } else if (quest.stage === 2) {
                quest.stage = 3;
                addItem(hero, 'coins', 50);
                hero.xp += 40;
                this.levelHero(hero);
                this.registry.set('quest', quest);
                this.registry.set('hero', hero);
                Hud.log(def.name + ': The militia thanks you. 50 gold and combat training.');
            } else {
                Hud.log(def.name + ': Emberhaven stands because of you.');
            }
        } else if (def.key === 'banker' || def.key === 'witch') {
            var cost = def.key === 'witch' ? 10 : 0;
            if (hero.gold < cost) {
                Hud.log(def.name + ': Come back with 10 gold.');
            } else {
                if (cost) {
                    takeItem(hero, 'coins', cost);
                }
                hero.hp = hero.maxHp;
                this.registry.set('hero', hero);
                Hud.log(def.name + ': Your wounds close. HP restored.');
            }
        } else {
            Hud.log(def.name + ': ' + def.lines[Phaser.Math.Between(0, def.lines.length - 1)]);
        }
        this.talkTarget = null;
        this.refreshHud();
    },

    levelHero: function (hero) {
        var next = 1 + Math.floor(hero.xp / 40);
        if (next > hero.level) {
            hero.level = next;
            hero.maxHp = 90 + hero.level * 10;
            hero.hp = hero.maxHp;
            hero.damage = 14 + hero.level * 2;
            Hud.log('Your combat level is now ' + hero.level + '.');
        }
    },

    beginFight: function (mob) {
        if (this.encounterLock || !mob.aliveMob) {
            return;
        }
        this.encounterLock = true;
        this.lastFought = mob;
        this.clearWalk();
        this.player.body.setVelocity(0);
        this.registry.set('pendingEncounter', {
            enemies: [Object.assign({}, mob.mobDef)]
        });
        this.cameras.main.shake(220);
        var self = this;
        this.time.delayedCall(260, function () {
            self.scene.switch('BattleScene');
        });
    },

    placeLoot: function (x, y, drop, until) {
        var self = this;
        var sprite = this.add.image(x, y, 'item-' + drop.id);
        sprite.setDepth(5);
        sprite.setScale(1);
        sprite.setInteractive({ useHandCursor: true });
        var entry = {
            id: drop.id,
            qty: drop.qty,
            sprite: sprite,
            taken: false,
            until: until
        };
        sprite.on('pointerdown', function () {
            self.tryPickup(entry);
        });
        this.groundLoot.push(entry);
        return entry;
    },

    spawnLoot: function (x, y, drops) {
        var self = this;
        var now = this.time.now;
        drops.forEach(function (drop, index) {
            var ox = (index - (drops.length - 1) / 2) * 10;
            self.placeLoot(x + ox, y + 4, drop, now + 20000);
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
                until: drop.until
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

    tryPickup: function (drop) {
        if (this.encounterLock || Hud.mode === 'battle') {
            return false;
        }
        if (!drop || drop.taken) {
            return false;
        }
        var hero = this.registry.get('hero');
        addItem(hero, drop.id, drop.qty);
        this.registry.set('hero', hero);
        drop.taken = true;
        if (drop.sprite) {
            drop.sprite.destroy();
            drop.sprite = null;
        }
        var label = itemName(drop.id);
        Hud.log('You pick up ' + (drop.qty > 1 ? drop.qty + ' ' : '') + label + '.');
        this.refreshHud();
        return true;
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
            if (!drop || drop.taken || !drop.sprite) {
                continue;
            }
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, drop.sprite.x, drop.sprite.y) < 18) {
                this.tryPickup(drop);
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

    wake: function () {
        this.encounterLock = false;
        this.engageGrace = this.time.now + 700;
        this.player.body.setVelocity(0);
        this.clearWalk();
        var outcome = this.registry.get('battleOutcome');
        var hero = this.registry.get('hero');
        if (outcome === 'win' && this.lastFought) {
            var def = this.lastFought.mobDef;
            hero.xp += def.xp || 0;
            gainSkillXp(hero, combatSkill(hero), def.xp || 10);
            gainSkillXp(hero, 'hitpoints', Math.max(1, Math.ceil((def.xp || 10) / 3)));
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
            this.spawnLoot(this.lastFought.x, this.lastFought.y, lootForMob(def));
            this.hideMob(this.lastFought);
            this.scheduleMobRespawn(this.lastFought, MOB_RESPAWN_MS);
        } else if (outcome === 'flee') {
            Hud.log('You break away from the fight.');
        }
        this.registry.set('battleOutcome', null);
        this.lastFought = null;
        this.engageTarget = null;
        this.refreshHud();
    },

    checkDoors: function () {
        if (this.exitLock || this.encounterLock || this.interiorId) {
            return;
        }
        var tile = worldToTile(this.player.x, this.player.y);
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

    checkExits: function () {
        if (this.exitLock || this.encounterLock) {
            return;
        }
        if (this.interiorId) {
            this.checkInteriorExit();
            return;
        }
        this.checkDoors();
        if (this.interiorId || this.exitLock) {
            return;
        }
        var zone = ZONES[this.zoneId];
        var dir = null;
        if (this.player.x < 14) {
            dir = 'w';
        } else if (this.player.x > this.map.widthInPixels - 14) {
            dir = 'e';
        } else if (this.player.y < 14) {
            dir = 'n';
        } else if (this.player.y > this.map.heightInPixels - 14) {
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

    wanderMobs: function () {
        this.mobs.children.iterate(function (mob) {
            if (!mob || !mob.aliveMob || !mob.body) {
                return;
            }
            if (Phaser.Math.Between(0, 80) !== 0) {
                return;
            }
            mob.body.setVelocity(Phaser.Math.Between(-20, 20), Phaser.Math.Between(-20, 20));
        });
    },

    autoAttackOn: function () {
        var hero = this.registry.get('hero');
        return !!(hero && hero.autoAttack);
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

    moveSpeed: function () {
        var hero = this.ensureRunState(this.registry.get('hero'));
        if (hero && hero.running && hero.runEnergy > 0) {
            return RUN_SPEED;
        }
        return WALK_SPEED;
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

    tryAutoEngage: function () {
        if (this.encounterLock || this.time.now < this.engageGrace) {
            return false;
        }
        if (this.engageTarget && this.engageTarget.aliveMob) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.engageTarget.x, this.engageTarget.y) < 24) {
                this.beginFight(this.engageTarget);
                return true;
            }
        }
        if (!this.autoAttackOn()) {
            return false;
        }
        var near = this.pickSprite(this.mobs, this.player.x, this.player.y, 20);
        if (near && near.aliveMob) {
            this.beginFight(near);
            return true;
        }
        return false;
    },

    update: function (time, delta) {
        var dt = (typeof delta === 'number' && isFinite(delta) && delta > 0) ? Math.min(delta, 80) / 1000 : 0;
        if (!this.player || !this.player.body || this.encounterLock) {
            if (this.encounterLock) {
                this.tickRunEnergy(dt, false);
            }
            return;
        }

        this.mobs.children.iterate(function (mob) {
            if (mob && mob.nameLabel) {
                var lift = 8 + Math.round((mob.displayHeight || 16) / 2);
                mob.nameLabel.setPosition(mob.x, mob.y - lift);
            }
        });

        if (window.Hud && Hud.mode === 'world' && Keys.runTogglePressed()) {
            Hud.toggleRun();
        }

        var speed = this.moveSpeed();
        var vx = 0;
        var vy = 0;
        var move = this.moveFlags();
        if (Keys.justPressed('Escape')) {
            this.clearWalk();
            this.talkTarget = null;
            if (window.Hud && Hud.hideContextMenu) {
                Hud.hideContextMenu();
            }
        }
        if (move.left || move.right || move.up || move.down) {
            this.clearWalk();
            this.talkTarget = null;
            if (move.left && !move.right) { vx = -speed; }
            else if (move.right && !move.left) { vx = speed; }
            if (move.up && !move.down) { vy = -speed; }
            else if (move.down && !move.up) { vy = speed; }
        } else if (this.walkTarget) {
            this.maybeRepath();
            var destDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.walkTarget.x, this.walkTarget.y);
            if (destDist < 6) {
                this.clearWalk();
                this.player.body.setVelocity(0);
            } else {
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

        this.player.body.setVelocity(vx, vy);
        if (vx || vy) {
            var len = Math.sqrt(vx * vx + vy * vy) || 1;
            var nx = (vx / len) * speed;
            var ny = (vy / len) * speed;
            var slid = slideIntoOneTileGap(
                this.tileGrid,
                this.player.x,
                this.player.y,
                this.player.body.width,
                this.player.body.height,
                nx,
                ny
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

        this.tickRunEnergy(dt, !!(vx || vy));

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

        this.collectNearbyLoot();
        this.pruneLoot();

        if (this.tryAutoEngage()) {
            return;
        }
        if (this.talkTarget) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.talkTarget.x, this.talkTarget.y) < 22) {
                this.player.body.setVelocity(0);
                this.clearWalk();
                this.tryTalk(this.talkTarget);
            }
        }

        if (Keys.justPressed('Space') && Hud.mode !== 'battle') {
            var nearNpc = this.pickSprite(this.npcs, this.player.x, this.player.y, 28);
            if (nearNpc) {
                this.tryTalk(nearNpc);
            }
        }

        this.wanderMobs();
        this.tryLockedDoor();
        this.checkExits();
    }
});
