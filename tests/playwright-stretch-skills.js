/**
 * Playwright proof: from spawn (328, 248), all 23 skills ship with stretch backlog cleared.
 *   node tests/playwright-stretch-skills.js [port]
 */
(async function () {
    var port = process.argv[2] || '8765';
    var session = require('./playwright-session');

    async function runOnly(page, opened, onlyName) {
        var only = encodeURIComponent(onlyName);
        await page.goto(opened.base + 'tests/run.html?only=' + only, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(function () {
            var title = document.title || '';
            return title.indexOf('PASS') === 0 || title.indexOf('FAIL') === 0;
        }, null, { timeout: 90000 });
        var suiteTitle = await page.title();
        if (suiteTitle.indexOf('PASS') !== 0) {
            throw new Error(onlyName + ' failed: ' + suiteTitle);
        }
        return suiteTitle;
    }

    var result = await session.withGamePage(port, async function (page, opened) {
        var live = await page.evaluate(function () {
            var world = window.game.scene.getScene('WorldScene');
            var hero = window.makeHero();
            window.game.registry.set('hero', hero);
            if (!window.STRETCH_SKILL_NAMES || window.STRETCH_SKILL_NAMES.length !== 0) {
                throw new Error('STRETCH_SKILL_NAMES not cleared');
            }
            if (window.SKILL_NAMES.length !== 23) {
                throw new Error('skills are ' + window.SKILL_NAMES.length + ' not 23');
            }
            if (window.skillTotal(hero) !== 32) {
                throw new Error('starter total is ' + window.skillTotal(hero) + ' not 32');
            }
            world.tryStretchSkillAction('runecraft');
            return {
                stretch: window.STRETCH_SKILL_NAMES.length,
                skills: window.SKILL_NAMES.length,
                total: window.skillTotal(hero),
                runecraftXp: hero.skills.runecraft.xp
            };
        });
        var dedicated = await runOnly(page, opened, 'skills: all 23 skills listed with playable stretch mini-loops');
        return { live: live, dedicated: dedicated };
    });

    if (result.live.stretch !== 0 || result.live.skills !== 23 || result.live.total !== 32) {
        throw new Error('live stretch skills were ' + JSON.stringify(result.live));
    }
    console.log('PASS 1/1 stretch skills', result.dedicated, JSON.stringify(result.live));
}()).catch(function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
