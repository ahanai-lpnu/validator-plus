/* ═══════════════════════════════════════════════════════════════════
   SVG LOADER
   XHR-based (works on file:// AND http://).
   Falls back to <img src> if loading or parsing fails so nothing
   is ever invisible.
   ═══════════════════════════════════════════════════════════════════ */
const svgCache = new Map();

function loadSVG(url) {
    if (svgCache.has(url)) return Promise.resolve(svgCache.get(url));
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
            // status 0 = success on file:// in Firefox/older Chrome
            if (this.status === 200 || this.status === 0) {
                const clean = (this.responseText || '')
                    .replace(/<\?xml[\s\S]*?\?>/gi, '')
                    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
                    .trim();
                svgCache.set(url, clean || null);
            } else {
                svgCache.set(url, null);
            }
            resolve(svgCache.get(url));
        };
        xhr.onerror = () => { svgCache.set(url, null); resolve(null); };
        xhr.send();
    });
}

function imgFallback(container, url) {
    container.innerHTML = '';
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'width:100%;height:100%;display:block;object-fit:contain;';
    container.appendChild(img);
}

async function setSVG(container, url) {
    if (!container || !url) return;

    const text = await loadSVG(url);

    if (!text) {
        imgFallback(container, url);
        return;
    }

    const parser = new DOMParser();
    const doc    = parser.parseFromString(text, 'image/svg+xml');
    const svgEl  = doc.documentElement;

    if (!svgEl || svgEl.nodeName === 'parsererror' ||
        (svgEl.querySelector && svgEl.querySelector('parsererror'))) {
        imgFallback(container, url);
        return;
    }

    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.cssText = 'display:block;width:100%;height:100%;';

    container.innerHTML = '';
    container.appendChild(document.importNode(svgEl, true));
}


const panel           = document.querySelector('.button-panel');
const screenContainer = document.getElementById('screen-container');
const zoneContainer   = document.getElementById('drop-zone-container');
const cardContainer   = document.getElementById('card-container');
const item            = document.getElementById('draggable-item');
const zone            = document.querySelector('.drop-zone');


const systemMap = {
    'assets/main/main.svg': {
        buttons: [false, false, true, true, true],
        next: [null, null, 'assets/addt/addt.svg', 'assets/info/info.svg', 'assets/lang/lang.svg'],
        hover: [null, null, 'assets/main/main-hovered-2.svg', 'assets/main/main-hovered-3.svg', 'assets/main/main-hovered-4.svg']
    },
    'assets/entry-suc.svg': {
        buttons: [false, false, false, false, false],
        next: [null, null, null, null, null],
        hover: [null, null, null, null, null]
    },
    'assets/entry-fal.svg': {
        buttons: [false, false, false, false, false],
        next: [null, null, null, null, null],
        hover: [null, null, null, null, null]
    },
    'assets/addt/addt.svg': {
        buttons: [true, true, true, true, false],
        next: ['assets/main/main.svg', 'assets/addt/addt-1m.svg', null, null, null],
        hover: ['assets/addt/addt-hovered-0.svg', null, null, null, null]
    },
    'assets/addt/addt-1m.svg': {
        buttons: [true, true, true, true, false],
        next: ['assets/main/main.svg', 'assets/addt/addt.svg', null, null, null],
        hover: ['assets/addt/addt-1m-hovered-0.svg', null, null, null, null]
    },
    'assets/info/info.svg': {
        buttons: [true, false, false, false, false],
        next: ['assets/main/main.svg', null, null, null, null],
        hover: ['assets/info/info-hovered-0.svg', null, null, null, null]
    },
    'assets/lang/lang.svg': {
        buttons: [false, false, true, true, false],
        next: [null, null, 'assets/main/main.svg', null, null],
        hover: [null, null, 'assets/lang/lang-hovered-2.svg', null, null]
    }
};

let currentScreen = 'assets/main/main.svg';
let contactTimer  = null;
let isTouching    = false;
let isLocked      = false;
let currentScale  = 1;

function playSound(file) {
    const audio = new Audio(`assets/sounds/${file}`);
    audio.play().catch(e => console.log('Звук заблоковано:', e));
}

const screensWithDate = [
    'assets/main/main.svg',
    'assets/main/main-hovered-2.svg',
    'assets/main/main-hovered-3.svg'
];

function updateDateTime() {
    const now = new Date();
    document.getElementById('time-part').innerText =
        now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date-part').innerText =
        now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
setInterval(updateDateTime, 1000);
updateDateTime();

function updateDateTimeVisibility(src) {
    const show = screensWithDate.includes(src);
    document.getElementById('date-time-display').classList.toggle('hidden', !show);
    document.getElementById('route-info-display').classList.toggle('hidden', !show);
}

async function updateButtons() {
    const config  = systemMap[currentScreen];
    const buttons = document.querySelectorAll('.control-btn');
    await Promise.all(Array.from(buttons).map((btn, i) => {
        const cont = btn.querySelector('.btn-icon-container');
        const url  = (config && config.buttons[i]) ? 'assets/button-on.svg' : 'assets/button-off.svg';
        return setSVG(cont, url);
    }));
}

async function initPanel() {
    panel.innerHTML = '';
    const tasks = [];
    for (let i = 0; i < 5; i++) {
        const btn = document.createElement('button');
        btn.className     = 'control-btn';
        btn.dataset.index = i;

        const cont = document.createElement('div');
        cont.className = 'btn-icon-container';

        btn.appendChild(cont);
        panel.appendChild(btn);
        tasks.push(setSVG(cont, 'assets/button-off.svg'));
    }
    await Promise.all(tasks);
}

async function changeScreen(newScreen) {
    if (!newScreen || !systemMap[newScreen]) return;
    currentScreen = newScreen;
    await setSVG(screenContainer, currentScreen);
    await updateButtons();
    updateDateTimeVisibility(newScreen);
}

async function resetScreen() {
    await setSVG(screenContainer, currentScreen);
}

async function changeScreenWithTimeout(newScreen, soundFile, zoneIcon = 'assets/symbol-ctls.svg') {
    isLocked = true;
    await setSVG(zoneContainer, zoneIcon);
    playSound(soundFile);
    await changeScreen(newScreen);

    setTimeout(async () => {
        await changeScreen('assets/main/main.svg');
        await setSVG(zoneContainer, 'assets/symbol-ctls.svg');
        isLocked = false;
    }, 2000);
}

function checkContact() {
    if (!item || !zone || isLocked) return;
    const ir   = item.getBoundingClientRect();
    const zr   = zone.getBoundingClientRect();
    const dist = Math.hypot(
        (ir.left + ir.width  / 2) - (zr.left + zr.width  / 2),
        (ir.top  + ir.height / 2) - (zr.top  + zr.height / 2)
    );

    if (dist < 80) {
        if (!isTouching) {
            isTouching = true;
            contactTimer = setTimeout(() => {
                changeScreenWithTimeout('assets/entry-suc.svg', 'success.ogg', 'assets/symbol-ctls-suc.svg');
            }, 500);
        }
    } else if (isTouching) {
        isTouching = false;
        clearTimeout(contactTimer);
        if (!isLocked) {
            changeScreenWithTimeout('assets/entry-fal.svg', 'error.ogg', 'assets/symbol-ctls-fal.svg');
        }
    }
}

item.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    item.setPointerCapture(e.pointerId);
    item.classList.add('is-dragging');

    const wrapper = document.querySelector('.main-wrapper');
    const scale = wrapper.getBoundingClientRect().width / 460;

    const startX = e.clientX;
    const startY = e.clientY;

    const style = window.getComputedStyle(item);
    const matrix = new DOMMatrix(style.transform);
    const initialX = matrix.m41;
    const initialY = matrix.m42;

    const moveAt = (ev) => {
        const dx = (ev.clientX - startX) / scale;
        const dy = (ev.clientY - startY) / scale;

        item.style.transform = `translate(${initialX + dx}px, ${initialY + dy}px)`;
        checkContact();
    };

    const stopDrag = () => {
        document.removeEventListener('pointermove', moveAt);
        document.removeEventListener('pointerup', stopDrag);
        
        item.classList.remove('is-dragging');

        item.style.transform = ''; 
        
        if (isTouching) {
            clearTimeout(contactTimer);
            isTouching = false;
        }
    };

    document.addEventListener('pointermove', moveAt);
    document.addEventListener('pointerup', stopDrag);
});

panel.addEventListener('pointerdown', async (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    e.preventDefault();

    btn.dataset.pressed = 'true';

    const i      = Number(btn.dataset.index);
    const config = systemMap[currentScreen];
    if (config?.hover?.[i]) {
        await setSVG(screenContainer, config.hover[i]);
    }
});

panel.addEventListener('pointerup', async (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn || btn.dataset.pressed !== 'true') return;
    btn.dataset.pressed = 'false';

    const i      = Number(btn.dataset.index);
    const config = systemMap[currentScreen];
    if (config?.next?.[i]) {
        await changeScreen(config.next[i]);
    } else {
        await resetScreen();
    }
});

panel.addEventListener('contextmenu', (e) => e.preventDefault(), false);

function scaleUI() {
    const wrapper = document.querySelector('.main-wrapper');
    currentScale  = Math.min(window.innerWidth / 460, window.innerHeight / 850, 1);
    wrapper.style.transform       = `scale(${currentScale})`;
    wrapper.style.transformOrigin = 'center center';
}
window.addEventListener('resize', scaleUI);
scaleUI();

(async () => {
    await Promise.all([
        setSVG(screenContainer, currentScreen),
        setSVG(zoneContainer,   'assets/symbol-ctls.svg'),
        setSVG(cardContainer,   'assets/card.svg')
    ]);
    updateDateTimeVisibility(currentScreen);
    await initPanel();
    await updateButtons();
})();
