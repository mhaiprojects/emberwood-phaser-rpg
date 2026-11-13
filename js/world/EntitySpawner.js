/**
 * Mob/NPC spawn density helpers (WorldScene still places sprites).
 */
var EntitySpawner = {
    spawnModifier: function (hero) {
        var mod = hero && typeof hero.mobSpawnModifier === 'number' ? hero.mobSpawnModifier : 1;
        if (!(mod > 0)) {
            mod = typeof MOB_SPAWN_MODIFIER === 'number' ? MOB_SPAWN_MODIFIER : 1;
        }
        return mod;
    },

    scaledCount: function (base, hero) {
        var n = typeof base === 'number' ? base : 0;
        var mod = this.spawnModifier(hero);
        return Math.max(0, Math.round(n * mod));
    }
};

window.EntitySpawner = EntitySpawner;
