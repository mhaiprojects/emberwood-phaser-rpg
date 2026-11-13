/**
 * Zone enter/leave helpers peeled from WorldScene.
 * WorldScene still owns map build; this centralizes id/surface rules.
 */
var ZoneRuntime = {
    surfaceFor: function (zoneId) {
        if (zoneId === 'dungeon') {
            return typeof DUNGEON_SURFACE_ZONE !== 'undefined' ? DUNGEON_SURFACE_ZONE : 'darkmine';
        }
        return zoneId;
    },

    isHiddenInteriorZone: function (zoneId) {
        return zoneId === 'dungeon' || zoneId === 'dragonden';
    },

    resolveEnterId: function (zoneId) {
        return this.surfaceFor(zoneId) || 'haven';
    },

    /** Call WorldScene.enterZone with surface normalization for dungeon resumes. */
    enter: function (world, zoneId, fromDir, opts) {
        if (!world || typeof world.enterZone !== 'function') {
            return false;
        }
        return world.enterZone(this.resolveEnterId(zoneId), fromDir, opts);
    }
};

window.ZoneRuntime = ZoneRuntime;
