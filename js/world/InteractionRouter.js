/**
 * Pointer hit → gather/talk/combat intent routing helpers.
 * WorldScene keeps hit tests; this classifies interaction kinds.
 */
var InteractionRouter = {
    GATHER_KINDS: {
        fishspot: 'fish',
        tree: 'chop',
        rock: 'mine',
        boulder: 'mine'
    },

    gatherKindForHit: function (hit) {
        if (!hit || !hit.kind) {
            return null;
        }
        if (hit.denBoulder || hit.kind === 'boulder') {
            return 'mine';
        }
        return this.GATHER_KINDS[hit.kind] || null;
    },

    isGatherHit: function (hit) {
        return !!this.gatherKindForHit(hit);
    },

    clearGatherBeforeIntent: function (world) {
        if (world && typeof world.clearGather === 'function') {
            world.clearGather();
        } else if (typeof GatherController !== 'undefined' && GatherController.clearAll) {
            GatherController.clearAll(world);
        }
    }
};

window.InteractionRouter = InteractionRouter;
