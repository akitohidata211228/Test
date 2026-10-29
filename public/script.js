document.addEventListener('DOMContentLoaded', init);

let globalConfig = null;
let toastTimeout;
const blobUrls = new Map();

async function init() {
    if (!document.getElementById('api-container')) return;

    try {
        const res = await fetch('/config');
        globalConfig = await res.json();

        setUi(globalConfig);
        renderSections(globalConfig.tags);
        renderSideNav(globalConfig.tags);
        setSearch();
        startWIBClock();
        await bootConsole(globalConfig);
        window.LirenxinMotion.revealAll();
    } catch (e) {
        const term = document.getElementById('term-logs');
        if (term) {
            term.innerHTML = '<div class="console-body"><span class="err">SYSTEM FAILURE</span><br><span class="cmt">' + escapeHtml(e.message) + '</span></div>';
        }
        const box = document.getElementById('api-container');
        if (box) {
            box.innerHTML =
                '<div class="card" style="padding:40px; text-align:center;">' +
                '<p style="font-weight:600; margin:0 0 6px;">Server sedang tidak merespons</p>' +
                '<p style="font-size:14px; color:var(--ink-faint); margin:0 0 18px;">Cek koneksi, atau jalankan server dengan <code class="mono">npm run dev</code>.</p>' +
                '<button onclick="location.reload()" class="btn btn-ghost btn-sm">Coba lagi</button>' +
                '</div>';
        }
    }
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function humanUptime(sec) {
    if (sec == null) return '–';
    if (sec < 60) return sec + 's';
    if (sec < 3600) return Math.floor(sec / 60) + 'm';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h';
    return Math.floor(sec / 86400) + 'd';
}

function startWIBClock() {
    const timeEl = document.getElementById('server-time');
    const dateEl = document.getElementById('server-date');
    if (!timeEl) return;

    const tick = () => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', {
            timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric'
        });
    };
    tick();
    setInterval(tick, 1000);
}

function toast(msg) {
    const el = document.getElementById('custom-toast');
    if (!el) return;
    document.getElementById('toast-message').textContent = msg;
    el.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 2600);
}

function termLog(message, type) {
    const logs = document.getElementById('term-logs');
    if (!logs) return;

    let wrap = logs.querySelector('.console-body');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'console-body';
        logs.appendChild(wrap);
    }

    const line = document.createElement('div');
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const tag = type === 'error' ? '<span class="err">ERR</span> '
        : type === 'success' ? '<span class="ok">OK</span> '
        : type === 'notice' ? '<span class="warn">INFO</span> '
        : '<span class="cmt">·</span> ';
    line.innerHTML = tag + '<span class="cmt">' + time + '</span> ' + escapeHtml(message);
    wrap.appendChild(line);
    logs.scrollTop = logs.scrollHeight;
}

async function bootConsole(config) {
    const logs = document.getElementById('term-logs');
    if (!logs) return;

    const M = window.LirenxinMotion;
    const reduce = M.reduce;
    const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

    const wrap = document.createElement('div');
    wrap.className = 'console-body';
    logs.appendChild(wrap);

    const cmdLine = document.createElement('div');
    cmdLine.innerHTML = '<span class="accent">$ </span><span class="cmd"></span><span class="cursor"></span>';
    wrap.appendChild(cmdLine);
    await M.types(cmdLine.querySelector('.cmd'), 'node index.ts', 30);
    cmdLine.querySelector('.cursor').remove();
    await wait(250);

    const endpoints = Object.values(config.tags || {}).flat();
    const row = (cls, text) => {
        const div = document.createElement('div');
        div.className = cls;
        div.textContent = text;
        wrap.appendChild(div);
        logs.scrollTop = logs.scrollHeight;
    };

    row('cmt', '> lirenxin-api@' + (config.settings.apiVersion || '1.1') + ' dev');
    row('cmt', '> node index.ts');
    await wait(200);
    row('ok', 'routes loaded: ' + endpoints.length);
    await wait(120);
    const rem = await loadReminder();
    if (rem) row('warn', rem);
    row('cmt', 'server running at ' + (window.location.origin.match(/^http/) ? window.location.origin : 'http://localhost:3000'));
    document.getElementById('term-host').textContent =
        window.location.origin.match(/^http/) ? window.location.hostname : 'localhost:3000';
}

async function loadReminder() {
    try {
        const data = await (await fetch('/src/reminder.json')).json();
        return data && data.message ? data.message : null;
    } catch (e) {
        return null;
    }
}

function setUi(config) {
    const s = config.settings || {};
    const stats = config.stats || {};
    const M = window.LirenxinMotion;

    const navTitle = document.getElementById('nav-title');
    if (navTitle) navTitle.textContent = s.apiName || 'LǐRénXīn API';

    M.countUp(document.getElementById('stat-endpoints'), stats.endpoints);
    M.countUp(document.getElementById('stat-categories'), stats.categories);
    document.getElementById('stat-uptime').textContent = humanUptime(stats.uptimeSeconds);

    if (s.github) {
        const gh = document.getElementById('nav-github');
        if (gh) gh.href = s.github;
    }
}

function renderSideNav(tags) {
    const nav = document.getElementById('side-nav');
    if (!nav) return;
    nav.innerHTML = '';
    Object.entries(tags).forEach(([cat, routes]) => {
        const a = document.createElement('a');
        a.className = 'side-link';
        a.href = '#cat-' + slug(cat);
        a.innerHTML = escapeHtml(cat) + '<span class="count">' + routes.length + '</span>';
        nav.appendChild(a);
    });
}

function slug(s) {
    return String(s).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

function renderSections(tags) {
    const container = document.getElementById('api-container');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(tags).forEach(([cat, routes]) => {
        const group = document.createElement('div');
        group.className = 'ep-group reveal';
        group.id = 'cat-' + slug(cat);

        const head = document.createElement('div');
        head.className = 'ep-group-head';
        head.innerHTML =
            '<h2>' + escapeHtml(cat) + '</h2>' +
            '<span class="chip">' + routes.length + ' endpoint</span>';
        group.appendChild(head);

        const list = document.createElement('div');
        list.className = 'ep-list';
        group.appendChild(list);

        routes.forEach(route => {
            list.appendChild(buildRow(route, cat));
        });

        container.appendChild(group);
    });
}

function buildRow(route, cat) {
    const id = slug(cat) + '-' + slug(route.name);
    const M = window.LirenxinMotion;
    const reduce = M.reduce;

    const row = document.createElement('div');
    row.className = 'ep-row';
    row.setAttribute('data-search', (route.name + ' ' + route.endpoint + ' ' + cat).toLowerCase());

    const methodCls = route.method === 'GET' ? 'method-GET'
        : route.method === 'POST' ? 'method-POST'
        : route.method === 'DELETE' ? 'method-DELETE'
        : route.method === 'PUT' ? 'method-PUT' : 'method-GET';

    const summary = document.createElement('button');
    summary.type = 'button';
    summary.className = 'ep-summary';
    summary.setAttribute('aria-expanded', 'false');
    summary.innerHTML =
        '<span class="method ' + methodCls + '">' + escapeHtml(route.method) + '</span>' +
        '<span class="ep-path">' + escapeHtml(route.endpoint) + '</span>' +
        '<span class="ep-name">' + escapeHtml(route.name) + '</span>' +
        '<span class="ep-chev"><svg class="ep-chevron"><use href="#i-chevron"/></svg></span>';

    const detail = document.createElement('div');
    detail.className = 'ep-detail';

    const detailIn = document.createElement('div');
    detailIn.className = 'ep-detail-in';

    let paramsHtml = '';
    if (route.params && route.params.length) {
        paramsHtml = route.params.map(p => {
            const pid = 'input-' + id + '-' + p.name;
            return '<div>' +
                '<label for="' + pid + '" class="field-label"><span>' + escapeHtml(p.name) + '</span>' +
                '<span class="' + (p.required ? 'req' : 'opt') + '">' + (p.required ? 'required' : 'optional') + '</span></label>' +
                '<input type="text" id="' + pid + '" data-param="' + p.name + '" class="field" placeholder="' + escapeHtml(p.description || '') + '">' +
                '</div>';
        }).join('');
    }
    detailIn.innerHTML = paramsHtml ? '<div style="display:flex; flex-direction:column; gap:12px;">' + paramsHtml + '</div>' : '';

    const actions = document.createElement('div');
    actions.className = 'ep-actions';

    const exec = document.createElement('button');
    exec.type = 'button';
    exec.className = 'btn btn-primary btn-sm';
    exec.innerHTML = 'Jalankan<span class="spinner" aria-hidden="true" style="display:none"><svg class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-9-9"/></svg></span>';
    exec.addEventListener('click', () => testReq(row, exec, route, reduce));

    const copyUrl = document.createElement('button');
    copyUrl.type = 'button';
    copyUrl.className = 'icon-btn';
    copyUrl.title = 'Salin URL endpoint';
    copyUrl.style.minHeight = '40px';
    copyUrl.innerHTML = '<svg><use href="#i-copy"/></svg>';
    copyUrl.addEventListener('click', () => {
        const origin = window.location.origin.match(/^http/) ? window.location.origin : 'https://lirenxin-api.my.id';
        navigator.clipboard && navigator.clipboard.writeText(origin + route.endpoint);
        toast('URL endpoint tersalin');
        termLog('Copied URL: ' + route.endpoint);
    });

    actions.append(exec, copyUrl);
    detailIn.appendChild(actions);

    const response = document.createElement('div');
    response.className = 'ep-response';
    response.innerHTML =
        '<div class="res-bar">' +
        '<span class="res-status wait" id="status-' + id + '"><span class="status-dot" style="background:var(--warn)"></span>waiting</span>' +
        '<span class="res-actions">' +
        '<a id="dl-btn-' + id + '" class="icon-btn" style="display:none; text-decoration:none;" title="Unduh">' +
        '<svg><use href="#i-download"/></svg></a>' +
        '<button type="button" id="copyres-' + id + '" class="icon-btn" title="Salin response">' +
        '<svg><use href="#i-copy"/></svg></button>' +
        '<button type="button" id="clear-' + id + '" class="icon-btn" title="Tutup response">' +
        '<svg><use href="#i-x"/></svg></button>' +
        '</span></div>' +
        '<span id="time-' + id + '" style="display:none"></span>' +
        '<div class="res-body" id="res-' + id + '" style="display:none"></div>';

    detail.appendChild(detailIn);
    response.querySelector('#copyres-' + id).addEventListener('click', () => {
        const out = document.getElementById('res-' + id);
        if (!out || !out.textContent) return;
        navigator.clipboard && navigator.clipboard.writeText(out.textContent);
        toast('Response tersalin');
    });
    response.querySelector('#clear-' + id).addEventListener('click', () => {
        row.classList.remove('has-result');
        response.querySelector('.res-body').innerHTML = '';
    });

    detail.appendChild(response);

    summary.addEventListener('click', () => {
        const open = row.classList.toggle('open');
        summary.setAttribute('aria-expanded', String(open));
            });

    row.append(summary, detail);
    return row;
}

async function testReq(row, btn, route, reduce) {
    const id = slug(route.name);
    const response = row.querySelector('.ep-response');
    const status = response.querySelector('.res-status');
    const out = response.querySelector('.res-body');
    const timeEl = response.querySelector('#time-' + id);
    const dl = response.querySelector('#dl-btn-' + id);
    const spinner = btn.querySelector('.spinner');

    btn.disabled = true;
    if (spinner) spinner.style.display = '';

    const started = Date.now();
    out.style.display = '';
    row.classList.add('has-result', 'open');

    status.className = 'res-status wait';
    status.innerHTML = '<span class="status-dot" style="background:var(--warn)"></span>processing...';
    out.innerHTML = '<span class="cmt">executing...</span>';

    if (dl) {
        dl.style.display = 'none';
        dl.removeAttribute('href');
        dl.removeAttribute('download');
    }

    const params = {};
    row.querySelectorAll('[id^="input-"]').forEach(i => {
        if (i.value) params[i.dataset.param] = i.value;
    });

    const qs = route.method === 'GET' && Object.keys(params).length
        ? '?' + new URLSearchParams(params)
        : '';
    const fetchUrl = route.endpoint + qs;
    const opts = route.method === 'GET'
        ? {}
        : { method: route.method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) };

    try {
        const res = await fetch(fetchUrl, opts);
        const duration = Date.now() - started;

        status.className = 'res-status ' + (res.ok ? 'ok' : 'err');
        status.innerHTML = '<span class="status-dot" style="background:' + (res.ok ? 'var(--ok)' : 'var(--bad)') + '"></span>' +
            res.status + ' ' + (res.statusText || '') + ' · ' + duration + 'ms';

        termLog('[' + res.status + '] ' + route.endpoint + ' — ' + duration + 'ms', res.ok ? 'req-success' : 'req-error');

        const old = blobUrls.get(route.endpoint);
        if (old) { URL.revokeObjectURL(old); blobUrls.delete(route.endpoint); }

        const type = res.headers.get('content-type') || '';
        if (type.includes('json')) {
            out.innerHTML = syntaxHighlight(await res.json());
        } else if (type.startsWith('image')) {
            const objURL = URL.createObjectURL(await res.blob());
            blobUrls.set(route.endpoint, objURL);
            if (dl) {
                dl.style.display = '';
                dl.href = objURL;
                dl.download = 'lirenxin-' + Date.now() + '.jpg';
            }
            out.innerHTML = '<img src="' + objURL + '" alt="Response preview">';
        } else if (type.includes('audio')) {
            out.innerHTML = '<audio controls src="' + URL.createObjectURL(await res.blob()) + '"></audio>';
        } else {
            out.textContent = await res.text();
        }
    } catch (err) {
        status.className = 'res-status err';
        status.innerHTML = '<span class="status-dot" style="background:var(--bad)"></span>failed';
        out.innerHTML = '<span class="err">CONNECTION_FAILED</span><br><span class="cmt">' + escapeHtml(err.message) + '</span>';
        termLog('Fetch failed: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
    }
}

function setSearch() {
    const input = document.getElementById('search-input');
    const noResultEl = document.getElementById('no-results');
    if (!input) return;

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        let anyVisible = false;

        document.querySelectorAll('.ep-group').forEach(group => {
            let groupHits = 0;
            group.querySelectorAll('.ep-row').forEach(row => {
                const hit = row.getAttribute('data-search').includes(val);
                row.style.display = hit ? '' : 'none';
                if (hit) groupHits++;
            });

            const visible = groupHits > 0;
            group.style.display = visible ? '' : 'none';
            if (visible) anyVisible = true;
        });

        if (noResultEl) noResultEl.style.display = anyVisible ? 'none' : '';
    });
}

function syntaxHighlight(json) {
    let str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
    str = str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
