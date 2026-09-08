/**
 * Shared headless Playwright session + owned-server cleanup.
 *
 * Loop ticks must not pop Glass, system Chrome, or headed windows.
 * Launch is always `{ headless: true }` — no `slowMo`, no `channel: 'chrome'`.
 *
 *   var session = require('./playwright-session');
 *   var result = await session.withGamePage(port, async function (page) {
 *       return await page.evaluate(function () { ... });
 *   });
 *
 * `withGamePage` / `open` always `close()` in `finally` (success, fail, or abort):
 * pages, context, browser, and — only if this process started it — the
 * `python3 -m http.server` PID. Unrelated servers are never killed.
 *
 * MCP `user-playwright` tabs are not this helper; ticks that called
 * `browser_navigate` must still `browser_tabs` close / `browser_close` in AGENT.md.
 */
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;

var REPO_ROOT = path.join(__dirname, '..');
var CHROME_FALLBACK = '/usr/bin/google-chrome-stable';
var HEADLESS_LAUNCH = { headless: true };

function loadPlaywright() {
    return Promise.resolve().then(function () {
        try {
            return require('playwright');
        } catch (err) {
            return import('playwright').then(function (pw) {
                return pw.default || pw;
            });
        }
    });
}

function probeServer(port) {
    return new Promise(function (resolve) {
        var req = http.get({
            hostname: '127.0.0.1',
            port: Number(port),
            path: '/',
            timeout: 800
        }, function (res) {
            res.resume();
            resolve(true);
        });
        req.on('error', function () {
            resolve(false);
        });
        req.on('timeout', function () {
            req.destroy();
            resolve(false);
        });
    });
}

function waitForServer(port, attempts) {
    attempts = attempts || 40;
    var i = 0;
    var tick = function () {
        return probeServer(port).then(function (up) {
            if (up) {
                return true;
            }
            i += 1;
            if (i >= attempts) {
                return false;
            }
            return new Promise(function (resolve) {
                setTimeout(resolve, 100);
            }).then(tick);
        });
    };
    return tick();
}

function reuseOrStartServer(port) {
    port = String(port || '8765');
    return probeServer(port).then(function (up) {
        if (up) {
            return { port: port, owned: false, child: null };
        }
        var child = spawn('python3', ['-m', 'http.server', port, '--bind', '127.0.0.1'], {
            cwd: REPO_ROOT,
            stdio: 'ignore'
        });
        var owned = { port: port, owned: true, child: child, pid: child.pid };
        return waitForServer(port).then(function (ready) {
            if (!ready) {
                return stopOwnedServer(owned).then(function () {
                    throw new Error('static server on 127.0.0.1:' + port + ' did not start');
                });
            }
            return owned;
        });
    });
}

function stopOwnedServer(server) {
    return new Promise(function (resolve) {
        if (!server || !server.owned || !server.child) {
            resolve();
            return;
        }
        var child = server.child;
        if (child.exitCode !== null || child.killed) {
            server.owned = false;
            resolve();
            return;
        }
        var done = false;
        var timer;
        var finish = function () {
            if (done) {
                return;
            }
            done = true;
            if (timer) {
                clearTimeout(timer);
            }
            server.owned = false;
            resolve();
        };
        child.once('exit', finish);
        try {
            child.kill('SIGTERM');
        } catch (err) {
            finish();
            return;
        }
        timer = setTimeout(function () {
            try {
                child.kill('SIGKILL');
            } catch (err) { /* already gone */ }
            finish();
        }, 1500);
    });
}

function launchHeadless(playwright) {
    return playwright.chromium.launch(HEADLESS_LAUNCH).catch(function () {
        return playwright.chromium.launch({
            headless: true,
            executablePath: CHROME_FALLBACK
        });
    });
}

function closeBrowser(browser) {
    if (!browser) {
        return Promise.resolve();
    }
    return Promise.resolve().then(function () {
        return browser.close();
    }).catch(function () { /* already closed */ });
}

function hookAbort(close) {
    var run = function (code) {
        close().then(function () {
            process.exit(code);
        }, function () {
            process.exit(code);
        });
    };
    process.once('SIGINT', function () {
        run(130);
    });
    process.once('SIGTERM', function () {
        run(143);
    });
}

function startGame(page, base) {
    return page.goto(base, { waitUntil: 'domcontentloaded' }).then(function () {
        return page.waitForFunction(function () {
            return window.Hud && window.Hud.el && window.Hud.el.start && !window.Hud.el.start.disabled && window.game;
        }, null, { timeout: 15000 });
    }).then(function () {
        return page.click('#btn-start');
    }).then(function () {
        return page.waitForFunction(function () {
            var world = window.game && window.game.scene && window.game.scene.getScene('WorldScene');
            return window.Hud && window.Hud.mode === 'world' && world && world.player;
        }, null, { timeout: 10000 });
    });
}

function open(port) {
    port = String(port || '8765');
    var base = 'http://127.0.0.1:' + port + '/';
    var closed = false;
    var browser = null;
    var page = null;
    var server = null;

    var close = function () {
        if (closed) {
            return Promise.resolve();
        }
        closed = true;
        return Promise.resolve().then(function () {
            if (!page) {
                return;
            }
            return page.close().catch(function () { /* browser may already be down */ });
        }).then(function () {
            return closeBrowser(browser);
        }).then(function () {
            return stopOwnedServer(server);
        });
    };

    hookAbort(close);

    return reuseOrStartServer(port).then(function (ownedServer) {
        server = ownedServer;
        return loadPlaywright();
    }).then(function (playwright) {
        return launchHeadless(playwright);
    }).then(function (launched) {
        browser = launched;
        return browser.newPage();
    }).then(function (newPage) {
        page = newPage;
        return {
            port: port,
            base: base,
            browser: browser,
            page: page,
            server: server,
            close: close
        };
    }).catch(function (err) {
        return close().then(function () {
            throw err;
        });
    });
}

function withGamePage(port, fn) {
    var session;
    return open(port).then(function (opened) {
        session = opened;
        return startGame(session.page, session.base);
    }).then(function () {
        return fn(session.page, session);
    }).then(function (result) {
        return session.close().then(function () {
            return result;
        });
    }, function (err) {
        var after = session ? session.close() : Promise.resolve();
        return after.then(function () {
            throw err;
        });
    });
}

module.exports = {
    HEADLESS_LAUNCH: HEADLESS_LAUNCH,
    loadPlaywright: loadPlaywright,
    probeServer: probeServer,
    reuseOrStartServer: reuseOrStartServer,
    stopOwnedServer: stopOwnedServer,
    launchHeadless: launchHeadless,
    closeBrowser: closeBrowser,
    startGame: startGame,
    open: open,
    withGamePage: withGamePage
};
