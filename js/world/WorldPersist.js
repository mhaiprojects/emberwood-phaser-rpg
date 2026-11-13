/**
 * World save blob glue. Bodies remain on WorldScene; this is the stable API surface.
 */
var WorldPersist = {
    exportFrom: function (world) {
        if (!world || typeof world.exportWorldSave !== 'function') {
            return null;
        }
        return world.exportWorldSave();
    },

    importInto: function (world, data) {
        if (!world || typeof world.importWorldSave !== 'function') {
            return false;
        }
        return world.importWorldSave(data);
    },

    stashOnRegistry: function (world) {
        var blob;
        if (!world || !world.registry) {
            return null;
        }
        blob = this.exportFrom(world);
        if (blob) {
            world.registry.set('worldSave', blob);
        }
        return blob;
    },

    loadFromRegistry: function (world) {
        var blob;
        if (!world || !world.registry) {
            return false;
        }
        blob = world.registry.get('worldSave');
        if (!blob) {
            return false;
        }
        return this.importInto(world, blob);
    }
};

window.WorldPersist = WorldPersist;
