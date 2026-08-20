/*
  LǐRénXīn API — docs playground
  Danzz For You 💌
*/
document.addEventListener('DOMContentLoaded', init);

let globalConfig = null;
let toastTimeout;

async function init() {
    if (!document.getElementById('term-logs')) return;

    try {
        const response = await fetch('/config');
        globalConfig = await response.json();

        setUi(globalConfig);
        loadEnd(globalConfig.tags);
        startWIBClock();
        await bootSequence(globalConfig);
        loadReminder();
        setSearch();
    } catch (e) {
        document.getElementById('term-logs').innerHTML =
            `<span class="text-red-400 font-bold">SYSTEM FAILURE</span><br><span class="text-gray-500">${e.message}</span>`;
    }
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

    const updateTime = () => {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        if (dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    updateTime();
    setInterval(updateTime, 1000);
}

async function loadReminder() {
    try {
        const req = await fetch('/src/reminder.json');
        const data = await req.json();
        if (data?.message) {
            const el = document.getElementById('running-text');
            if (el) el.innerText = data.message.toUpperCase();
        }
    } catch (e) { console.warn('No reminder config found'); }
}

function messeg(msg) {
    const toast = document.getElementById('custom-toast');
    const msgBox = document.getElementById('toast-message');
    if (!toast || !msgBox) return;

    msgBox.innerText = msg;
    toast.classList.remove('translate-y-32', 'opacity-0');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
    }, 3000);
}

function terminalLog(message, type = 'info') {
    const logs = document.getElementById('term-logs');
    if (!logs) return;

    const line = document.createElement('div');
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let prefix = `<span class="font-bold" style="color: var(--brand);">[${time}]</span>`;

    if (type === 'error') {
        prefix += ' <span class="text-red-500 font-bold">ERR</span>';
        line.className = 'text-red-400';
    } else if (type === 'success') {
        prefix += ' <span class="text-green-500 font-bold">OK</span>';
        line.className = 'text-green-400';
    } else if (type === 'warn') {
        prefix += ' <span class="text-yellow-500 font-bold">WARN</span>';
        line.className = 'text-yellow-400';
    } else if (type === 'req-success') {
        line.className = 'text-green-400';
    } else if (type === 'req-error') {
        line.className = 'text-red-400';
    } else {
        prefix += ' <span class="text-blue-400 font-bold">INFO</span>';
        line.className = 'text-gray-300';
    }

    line.innerHTML = `${prefix} ${message}`;
    logs.appendChild(line);
    logs.scrollTop = logs.scrollHeight;
}

/* Animasi ketik `npm run dev` di panel terminal sidebar. */
async function bootSequence(config) {
    const logs = document.getElementById('term-logs');
    if (!logs) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

    const cmdLine = document.createElement('div');
    cmdLine.className = 'mb-2 break-all flex flex-wrap items-center';

    const prompt = document.createElement('span');
    prompt.className = 'text-green-500 font-bold mr-2';
    prompt.innerText = 'root@LǐRénXīn~$';

    const inputCmd = document.createElement('span');
    inputCmd.className = 'text-gray-200 relative';

    const cursor = document.createElement('span');
    cursor.className = 'inline-block w-2.5 h-4 bg-green-500 align-middle ml-0.5';

    cmdLine.append(prompt, inputCmd);
    inputCmd.appendChild(cursor);
    logs.appendChild(cmdLine);

    await wait(500);
    for (const char of 'npm run dev') {
        await wait(Math.floor(Math.random() * 80) + 40);
        inputCmd.insertBefore(document.createTextNode(char), cursor);
    }
    await wait(400);
    cursor.remove();

    const printRaw = (text) => {
        const div = document.createElement('div');
        div.className = 'text-gray-400 text-xs ml-1';
        div.innerText = text;
        logs.appendChild(div);
        logs.scrollTop = logs.scrollHeight;
    };

    printRaw(`\n> lirenxin-api@${config.settings.apiVersion || '1.0.0'} dev`);
    await wait(180);
    printRaw('> node index.ts\n');
    await wait(320);

    const endpoints = Object.values(config.tags).flat();
    terminalLog(`Loading ${endpoints.length} routes...`, 'info');

    const maxShow = 3;
    for (let i = 0; i < Math.min(maxShow, endpoints.length); i++) {
        terminalLog(`Mapped {${endpoints[i].method}} ${endpoints[i].endpoint}`, 'success');
        await wait(50);
    }
    if (endpoints.length > maxShow) {
        terminalLog(`... +${endpoints.length - maxShow} endpoint lain termuat`, 'info');
    }

    await wait(250);
    terminalLog(`Server is running at ${window.location.origin}`, 'success');

    document.getElementById('term-input-line')?.classList.remove('hidden');
    document.getElementById('api-container')?.classList.remove('opacity-0');
}

function setUi(config) {
    const s = config.settings;
    const stats = config.stats || {};

    const navTitle = document.getElementById('nav-title');
    if (navTitle) navTitle.innerText = s.apiName || 'API';

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setText('stat-endpoints', stats.endpoints ?? '–');
    setText('stat-categories', stats.categories ?? '–');
    setText('stat-uptime', humanUptime(stats.uptimeSeconds));

    if (s.favicon) {
        let link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = s.favicon;
        document.head.appendChild(link);
    }
}

function setSearch() {
    const input = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    if (!input) return;

    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const isSearching = val.length > 0;
        let anyVisible = false;

        document.querySelectorAll('.api-section').forEach(section => {
            const grid = section.querySelector('.api-section-grid');
            const arrow = section.querySelector('.cat-arrow');
            let matches = 0;

            section.querySelectorAll('.api-card-wrapper').forEach(card => {
                const txt = card.getAttribute('data-search').toLowerCase();
                const hit = txt.includes(val);
                card.classList.toggle('hidden', !hit);
                if (hit) matches++;
            });

            if (matches > 0) {
                section.classList.remove('hidden');
                anyVisible = true;
                grid.classList.toggle('hidden', !isSearching);
                arrow.classList.toggle('rotate-180', isSearching);
            } else {
                section.classList.add('hidden');
            }
        });

        if (noResults) {
            noResults.classList.toggle('hidden', anyVisible);
            noResults.classList.toggle('flex', !anyVisible);
        }
    });
}

function loadEnd(tags) {
    const container = document.getElementById('api-container');
    if (!container) return;

    container.innerHTML = '';

    for (const [cat, routes] of Object.entries(tags)) {
        const section = document.createElement('div');
        section.className = 'api-section w-full';

        const catId = `cat-${cat.replace(/\s+/g, '-')}`;

        const headerBtn = `
            <button onclick="toggleCategory('${catId}')" aria-expanded="false" aria-controls="grid-${catId}"
                class="press w-full flex items-center justify-between p-4 rounded-lg border-2 mb-4"
                style="border-color: var(--line); background: var(--surface); box-shadow: var(--shadow); color: var(--brand);">
                <span class="flex items-center gap-3">
                    <i class="fa-solid fa-folder-open text-xl"></i>
                    <span class="text-lg font-display font-bold uppercase tracking-wider">${cat}</span>
                </span>
                <span class="flex items-center gap-3">
                    <span class="chip">${routes.length} EP</span>
                    <i id="arrow-${catId}" class="cat-arrow fa-solid fa-chevron-down transition-transform duration-300"></i>
                </span>
            </button>`;

        const grid = document.createElement('div');
        grid.id = `grid-${catId}`;
        grid.className = 'api-section-grid grid grid-cols-1 gap-4 hidden mb-8';

        routes.forEach((route, idx) => {
            const id = `${cat}-${idx}`.replace(/\s+/g, '-');
            const searchTerms = `${route.name} ${route.endpoint} ${cat}`;

            let inputsHtml = '';
            if (route.params?.length) {
                inputsHtml = `<div class="p-4 border-t-2 grid gap-3" style="border-color: var(--line-soft); background: var(--surface-sunk);">` +
                    route.params.map(p => `
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <label for="input-${id}-${p.name}" class="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2" style="color: var(--brand);">
                                    <span class="w-1.5 h-1.5 rounded-full inline-block" style="background: var(--brand);"></span> ${p.name.toUpperCase()}
                                </label>
                                <span class="text-[9px] font-bold ${p.required ? 'text-red-500' : 'text-ink-faint'}">${p.required ? 'REQ' : 'OPT'}</span>
                            </div>
                            <input type="text" id="input-${id}-${p.name}" class="field" placeholder="${p.description || 'Value...'}">
                        </div>`).join('') + `</div>`;
            }

            const methodColor = route.method === 'GET' ? 'bg-sky-500'
                : route.method === 'POST' ? 'bg-green-500'
                : route.method === 'DELETE' ? 'bg-red-500' : 'bg-orange-500';

            const card = document.createElement('div');
            card.className = 'api-card-wrapper w-full rounded-lg border-2 transition-colors';
            card.style.cssText = 'border-color: var(--line-soft); background: var(--surface);';
            card.setAttribute('data-search', searchTerms);

            card.innerHTML = `
                <div class="p-3 cursor-pointer select-none" onclick="toggle('${id}')">
                    <div class="flex justify-between items-center gap-3">
                        <span class="flex items-center gap-2 overflow-hidden">
                            <span class="px-1.5 py-0.5 text-[10px] font-bold text-white ${methodColor} rounded">${route.method}</span>
                            <code class="font-bold text-xs sm:text-sm truncate text-ink">${route.endpoint}</code>
                        </span>
                        <i id="icon-${id}" class="fa-solid fa-plus text-xs transition-transform duration-300" style="color: var(--brand);"></i>
                    </div>
                    <p class="text-[10px] mt-2 truncate text-ink-faint">${route.name}</p>
                </div>

                <div id="body-${id}" class="hidden">
                    ${inputsHtml}

                    <div class="p-3 flex gap-2 border-t-2" style="border-color: var(--line-soft); background: var(--surface-sunk);">
                        <button id="btn-exec-${id}" onclick="testReq(this, '${route.endpoint}', '${route.method}', '${id}')"
                            class="press flex-1 text-white font-bold py-2 text-[10px] tracking-widest uppercase rounded border-2 min-w-[100px]"
                            style="border-color: var(--line); background: var(--brand); box-shadow: var(--shadow-sm);">
                            Execute
                        </button>
                        <button onclick="copy('${route.endpoint}')" title="Copy URL" aria-label="Copy URL"
                            class="px-3 border-2 rounded transition-colors" style="border-color: var(--line-soft); background: var(--surface); color: var(--brand);">
                            <i class="fa-regular fa-copy text-xs"></i>
                        </button>
                    </div>

                    <div id="res-area-${id}" class="hidden border-t-4 relative rounded-b-lg overflow-hidden"
                         style="border-color: var(--brand); background: var(--term-bg);">
                        <div class="flex justify-between items-center px-3 py-2 border-b border-white/10 bg-black/40">
                            <span class="flex gap-2 items-center">
                                <span class="w-2 h-2 rounded-full bg-yellow-400" id="status-dot-${id}"></span>
                                <span id="status-${id}" class="text-gray-400 font-bold text-[11px]">WAITING</span>
                            </span>
                            <span id="time-${id}" class="text-gray-500 text-[10px]">--ms</span>
                        </div>

                        <div class="absolute top-9 right-2 flex gap-1 z-20">
                            <a id="dl-btn-${id}" class="hidden bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-0.5 rounded cursor-pointer" title="Download"><i class="fa-solid fa-download"></i></a>
                            <button onclick="copyRes('${id}')" class="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-2 py-0.5 rounded" title="Copy response"><i class="fa-regular fa-clone"></i></button>
                            <button onclick="reset('${id}')" class="bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded" title="Tutup"><i class="fa-solid fa-xmark"></i></button>
                        </div>

                        <div id="output-${id}" class="text-[10px] overflow-x-auto whitespace-pre-wrap break-all max-h-[400px] p-4 pt-10 min-h-[80px] leading-relaxed text-gray-300"></div>
                    </div>
                </div>`;
            grid.appendChild(card);
        });

        section.innerHTML = headerBtn;
        section.appendChild(grid);
        container.appendChild(section);
    }
}

window.toggleCategory = (catId) => {
    const grid = document.getElementById(`grid-${catId}`);
    const arrow = document.getElementById(`arrow-${catId}`);
    const open = grid.classList.toggle('hidden') === false;
    arrow.classList.toggle('rotate-180', open);
    arrow.closest('button')?.setAttribute('aria-expanded', String(open));
};

window.toggle = (id) => {
    const body = document.getElementById(`body-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    const open = body.classList.toggle('hidden') === false;
    icon.classList.toggle('rotate-45', open);
};

window.copy = (txt) => {
    navigator.clipboard.writeText(window.location.origin + txt);
    messeg('ENDPOINT COPIED');
    terminalLog(`Copied URL: ${txt}`);
};

window.copyRes = (id) => {
    const out = document.getElementById(`output-${id}`);
    if (!out.innerText) return;
    navigator.clipboard.writeText(out.innerText);
    messeg('RESPONSE COPIED');
};

window.reset = (id) => {
    document.getElementById(`res-area-${id}`).classList.add('hidden');
    document.getElementById(`output-${id}`).innerHTML = '';
    document.getElementById(`dl-btn-${id}`)?.classList.add('hidden');
    document.querySelectorAll(`[id^="input-${id}-"]`).forEach(i => i.value = '');
    terminalLog(`Console cleared for ${id}`);
};

window.testReq = async (btn, url, method, id) => {
    if (btn.disabled) return;

    const out = document.getElementById(`output-${id}`);
    const status = document.getElementById(`status-${id}`);
    const statusDot = document.getElementById(`status-dot-${id}`);
    const time = document.getElementById(`time-${id}`);
    const dlBtn = document.getElementById(`dl-btn-${id}`);

    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
        btn.innerHTML = `<span>${Date.now() - startTime}ms...</span>`;
    }, 75);

    document.getElementById(`res-area-${id}`).classList.remove('hidden');

    if (dlBtn) {
        dlBtn.classList.add('hidden');
        dlBtn.removeAttribute('href');
    }

    status.innerText = 'PROCESSING...';
    status.className = 'text-yellow-400 font-bold text-[11px]';
    statusDot.className = 'w-2 h-2 rounded-full bg-yellow-400';
    out.innerHTML = '<span class="text-gray-500 italic">executing...</span>';

    const params = {};
    document.querySelectorAll(`[id^="input-${id}-"]`).forEach(i => {
        if (i.value) params[i.id.split(`input-${id}-`)[1]] = i.value;
    });

    const fetchUrl = url + (method === 'GET' && Object.keys(params).length ? '?' + new URLSearchParams(params) : '');
    const opts = { method, ...(method !== 'GET' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) } : {}) };
    const fullUrl = window.location.origin + fetchUrl;

    try {
        const req = await fetch(fetchUrl, opts);
        clearInterval(timerInterval);

        const duration = Date.now() - startTime;

        status.innerText = `${req.status} ${req.statusText}`;
        status.className = `${req.ok ? 'text-green-400' : 'text-red-400'} font-bold text-[11px]`;
        statusDot.className = `w-2 h-2 rounded-full ${req.ok ? 'bg-green-400' : 'bg-red-400'}`;
        time.innerText = `${duration}ms`;

        terminalLog(`[${req.status}] ${fullUrl} (${duration}ms)`, req.ok ? 'req-success' : 'req-error');

        const type = req.headers.get('content-type');
        if (type?.includes('json')) {
            out.innerHTML = syntaxHighlight(await req.json());
        } else if (type?.startsWith('image')) {
            const urlObj = URL.createObjectURL(await req.blob());
            if (dlBtn) {
                dlBtn.href = urlObj;
                dlBtn.download = `img-${Date.now()}.jpg`;
                dlBtn.classList.remove('hidden');
            }
            out.innerHTML = `<div class="border border-dashed border-gray-600 p-4 bg-black/20 rounded-lg flex justify-center">
                    <img src="${urlObj}" alt="Response preview" class="max-w-full max-h-[400px] rounded border border-gray-700">
                </div>`;
        } else if (type?.includes('audio')) {
            out.innerHTML = `<audio controls src="${URL.createObjectURL(await req.blob())}" class="w-full mt-2 rounded"></audio>`;
        } else {
            out.innerText = await req.text();
        }
    } catch (err) {
        clearInterval(timerInterval);
        out.innerHTML = `<span class="text-red-400 font-bold">CONNECTION_REFUSED</span><br><span class="text-gray-500">${err.message}</span>`;
        status.innerText = 'ERR';
        status.className = 'text-red-400 font-bold text-[11px]';
        statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
        terminalLog(`Fetch Failed: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Execute';
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};

function syntaxHighlight(json) {
    if (typeof json != 'string') json = JSON.stringify(json, undefined, 2);
    return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
}
