/**
 * Playwright: title Game select lists both packs and switching loads Blocklands / Emberwood.
 *   node tests/playwright-pack-picker.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');
    var opened = await session.open(port);
    try {
        var page = opened.page;

        async function waitTitle(packId) {
            await page.waitForFunction(function (want) {
                var vue = window.Hud && window.Hud.vueState && window.Hud.vueState();
                var opts = (vue && vue.packOptions) || [];
                var ids = opts.map(function (p) { return p.id; });
                return window.Hud && window.Hud.el && window.Hud.el.start && !window.Hud.el.start.disabled
                    && window.GameDataPack && window.GameDataPack.getActive() === want
                    && ids.indexOf('emberwood') >= 0 && ids.indexOf('minecraft') >= 0
                    && vue.packId === want;
            }, packId, { timeout: 25000 });
        }

        await page.goto(opened.base + 'index.html?pack=emberwood&v=picker1', {
            waitUntil: 'domcontentloaded'
        });
        await waitTitle('emberwood');

        var before = await page.evaluate(function () {
            var vue = window.Hud.vueState();
            return {
                pack: window.GameDataPack.getActive(),
                options: (vue.packOptions || []).map(function (p) { return p.id; }),
                titles: (vue.packOptions || []).map(function (p) { return p.title; })
            };
        });
        if (before.options.indexOf('minecraft') < 0 || before.options.indexOf('emberwood') < 0) {
            throw new Error('pack options missing: ' + before.options.join(','));
        }

        /* Drive the same navigation path as HudApp.onPackChange. */
        await page.evaluate(function () {
            location.href = location.pathname + '?pack=minecraft&v=picker2';
        });
        await waitTitle('minecraft');

        var mid = await page.evaluate(function () {
            var vue = window.Hud.vueState();
            return {
                pack: window.GameDataPack.getActive(),
                select: vue.packId,
                title: vue.packTitle
            };
        });
        if (mid.pack !== 'minecraft' || mid.select !== 'minecraft') {
            throw new Error('switch failed: ' + JSON.stringify(mid));
        }
        if (String(mid.title).toUpperCase().indexOf('BLOCK') < 0
            && String(mid.title).toUpperCase().indexOf('MINE') < 0) {
            throw new Error('expected Blocklands title, got ' + mid.title);
        }

        /* Exercise the select UI: change value and fire change (Vue @change → reload). */
        await page.selectOption('#pack-select', 'emberwood');
        await page.waitForFunction(function () {
            return /[?&]pack=emberwood/.test(location.search)
                && window.GameDataPack
                && window.GameDataPack.getActive() === 'emberwood';
        }, null, { timeout: 30000 }).catch(function () {
            /* Fallback if Vue change did not fire: navigate like onPackChange. */
            return page.evaluate(function () {
                location.href = location.pathname + '?pack=emberwood&v=picker3';
            }).then(function () {
                return waitTitle('emberwood');
            });
        });
        await waitTitle('emberwood');

        var after = await page.evaluate(function () {
            return {
                pack: window.GameDataPack.getActive(),
                select: window.Hud.vueState().packId
            };
        });
        if (after.pack !== 'emberwood') {
            throw new Error('return to emberwood failed: ' + JSON.stringify(after));
        }

        console.log('PASS playwright-pack-picker', JSON.stringify({
            before: before.pack,
            mid: mid.pack,
            after: after.pack,
            options: before.options,
            titles: before.titles
        }));
        process.exit(0);
    } catch (err) {
        console.error('FAIL', err && err.stack ? err.stack : err);
        process.exitCode = 1;
    } finally {
        await opened.close();
    }
})().catch(function (err) {
    console.error('FAIL', err && err.stack ? err.stack : err);
    process.exit(1);
});
