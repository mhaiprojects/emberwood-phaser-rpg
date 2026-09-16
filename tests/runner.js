(function () {
    var frame = document.getElementById('game');
    var logEl = document.getElementById('log');
    var statusEl = document.getElementById('status');
    var runBtn = document.getElementById('btn-run');
    var running = false;
    var firstLoad = true;

    function write(line, className) {
        var row = document.createElement('div');
        if (className) {
            row.className = className;
        }
        row.textContent = line;
        logEl.appendChild(row);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function gameWindow() {
        return frame.contentWindow;
    }

    function prepareGame(reload) {
        if (!reload) {
            return EmberwoodHarness.waitReady(gameWindow());
        }
        return new Promise(function (resolve, reject) {
            var onLoad = function () {
                frame.removeEventListener('load', onLoad);
                EmberwoodHarness.waitReady(gameWindow()).then(resolve).catch(reject);
            };
            frame.addEventListener('load', onLoad);
            frame.src = '../index.html?t=' + Date.now();
        });
    }

    function run(reload) {
        if (running) {
            return Promise.resolve();
        }
        running = true;
        runBtn.disabled = true;
        logEl.textContent = '';
        statusEl.textContent = 'Running…';
        statusEl.className = '';
        return prepareGame(reload).then(function () {
            var onlyMatch = /[?&]only=([^&]*)/.exec(location.search);
            var only = onlyMatch ? decodeURIComponent(onlyMatch[1].replace(/\+/g, ' ')) : '';
            return EmberwoodTests.run(gameWindow(), function (row) {
                write((row.ok ? 'PASS' : 'FAIL') + '  ' + row.name + '  (' + row.ms + 'ms)' + (row.error ? '\n    ' + row.error : ''), row.ok ? 'ok' : 'bad');
            }, only);
        }).then(function (report) {
            var line = report.passed + '/' + report.total + ' passed';
            statusEl.textContent = line;
            statusEl.className = report.failed ? 'fail' : 'pass';
            document.title = (report.failed ? 'FAIL' : 'PASS') + ' — Emberwood tests';
            write('\n' + line, report.failed ? 'bad' : 'ok');
            running = false;
            runBtn.disabled = false;
            return report;
        }).catch(function (err) {
            statusEl.textContent = 'Runner error';
            statusEl.className = 'fail';
            write(String(err && err.stack ? err.stack : err), 'bad');
            running = false;
            runBtn.disabled = false;
        });
    }

    window.runEmberwoodTests = function () {
        return run(true);
    };
    runBtn.addEventListener('click', function () {
        run(true);
    });

    frame.addEventListener('load', function () {
        if (!firstLoad) {
            return;
        }
        firstLoad = false;
        statusEl.textContent = 'Game loaded. Starting tests…';
        if (/autorun=0/.test(location.search)) {
            EmberwoodHarness.waitReady(gameWindow()).then(function () {
                statusEl.textContent = 'Ready. Click Run tests.';
            }).catch(function (err) {
                statusEl.textContent = 'Game failed to load';
                statusEl.className = 'fail';
                write(String(err), 'bad');
            });
            return;
        }
        run(false);
    });
})();
