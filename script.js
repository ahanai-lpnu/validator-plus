const panel = document.querySelector('.button-panel');
const screenImage = document.getElementById('screen-image');
const item = document.getElementById('draggable-item');
const zone = document.querySelector('.drop-zone');
let contactTimer = null;
let isTouching = false; 
let isLocked = false;
let currentScale = 1;

const systemMap = {
    'assets/main/main.svg': {
        buttons: [false, false, true, true, true],
        next: [null, null, 'assets/addt/addt.svg', 'assets/info/info.svg', 'assets/lang.svg'],
        hover: [null, null, 'assets/main/main-hovered-2.svg', 'assets/main/main-hovered-3.svg', null]
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
        hover: [null, null, null, null, null]
    }
};

let currentScreen = 'assets/main/main.svg';

function playSound(file) {
    const audio = new Audio(`assets/sounds/${file}`);
    audio.play().catch(e => console.log("Звук заблоковано браузером:", e));
}

function updateButtons() {
    const config = systemMap[currentScreen];
    const buttons = document.querySelectorAll('.control-btn');
    
    buttons.forEach((btn, index) => {
        const img = btn.querySelector('.btn-icon');
        if (config) {
            img.src = config.buttons[index] ? 'assets/button-on.svg' : 'assets/button-off.svg';
        }
    });
}

const screensWithDate = [
    'assets/main/main.svg', 
    'assets/main/main-hovered-2.svg', 
    'assets/main/main-hovered-3.svg'
];

function updateDateTimeVisibility(currentSrc) {
    const dateTimeDisplay = document.getElementById('date-time-display');
    const routeInfoDisplay = document.getElementById('route-info-display');
    
    if (screensWithDate.includes(currentSrc)) {
        dateTimeDisplay.classList.remove('hidden');
    } else {
        dateTimeDisplay.classList.add('hidden');
    }

    if (screensWithDate.includes(currentSrc)) {
        routeInfoDisplay.classList.remove('hidden');
    } else {
        routeInfoDisplay.classList.add('hidden');
    }
}

function changeScreen(newScreen) {
    if (newScreen && systemMap[newScreen]) {
        currentScreen = newScreen;
        screenImage.src = currentScreen;
        updateButtons();

        updateDateTimeVisibility(newScreen);
    }
}

function initPanel() {
    panel.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.dataset.index = i;
        
        const img = document.createElement('img');
        img.src = 'assets/button-off.svg';
        img.className = 'btn-icon';
        
        btn.appendChild(img);
        panel.appendChild(btn);
    }
}

function updateDateTime() {
    const timePart = document.getElementById('time-part');
    const datePart = document.getElementById('date-part');
    const now = new Date();
     
    timePart.innerText = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    datePart.innerText = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

setInterval(updateDateTime, 1000);
updateDateTime();

function checkContact() {
    if (!item || !zone || isLocked) return;

    const itemRect = item.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();

    const iCenter = { x: itemRect.left + itemRect.width / 2, y: itemRect.top + itemRect.height / 2 };
    const zCenter = { x: zoneRect.left + zoneRect.width / 2, y: zoneRect.top + zoneRect.height / 2 };
    const distance = Math.hypot(iCenter.x - zCenter.x, iCenter.y - zCenter.y);
    const threshold = 80;

    if (distance < threshold) {
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

const zoneImage = document.querySelector('#drop-zone-img'); 

function changeScreenWithTimeout(newScreen, soundFile, zoneIcon = 'assets/symbol-ctls.svg') {
    isLocked = true;

    if (zoneImage) {
        zoneImage.src = zoneIcon;
    }
    
    playSound(soundFile);
    changeScreen(newScreen);
    
    setTimeout(() => {
        changeScreen('assets/main/main.svg');
        if (zoneImage) {
            zoneImage.src = 'assets/symbol-ctls.svg';
        }
        isLocked = false;
    }, 2000);
}

item.addEventListener('pointerdown', (e) => {
    e.preventDefault(); 
    item.setPointerCapture(e.pointerId);
    item.classList.add('is-dragging');

    // 1. Отримуємо масштаб (наприклад, 0.75)
    const wrapper = document.querySelector('.main-wrapper');
    const scale = wrapper.getBoundingClientRect().width / 460;

    const rect = item.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / scale;
    const offsetY = (e.clientY - rect.top) / scale;

    const moveAt = (e) => {
        item.style.position = 'fixed';

        const x = (e.clientX / scale) - offsetX;
        const y = (e.clientY / scale) - offsetY;

        item.style.left = x + 'px';
        item.style.top = y + 'px';
        item.style.bottom = 'auto';
        item.style.zIndex = '1000';
        
        checkContact();
    };

    document.addEventListener('pointermove', moveAt);

    const stopDrag = () => {
        document.removeEventListener('pointermove', moveAt);
        document.removeEventListener('pointerup', stopDrag);
        
        item.classList.remove('is-dragging');

        item.style.position = '';
        item.style.left = '';
        item.style.top = '';
        item.style.bottom = '';
        item.style.zIndex = '';
        
        if (isTouching) {
            clearTimeout(contactTimer);
            isTouching = false;
        }
    };

    document.addEventListener('pointermove', moveAt);
    document.addEventListener('pointerup', stopDrag);
});

function scaleUI() {
    const wrapper = document.querySelector('.main-wrapper');
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    
    const scaleX = winW / 460;
    const scaleY = winH / 850;
    currentScale = Math.min(scaleX, scaleY, 1);
    
    wrapper.style.transform = `scale(${currentScale})`;
    wrapper.style.transformOrigin = 'center center';
}

const moveAt = (e) => {
    const x = (e.clientX - startX) / currentScale;
    const y = (e.clientY - startY) / currentScale;

    item.style.transform = `translate(${x}px, ${y}px)`;
    checkContact();
};


panel.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    
    e.preventDefault(); 
    
    const i = btn.dataset.index;
    const config = systemMap[currentScreen];
    
    if (config && config.hover && config.hover[i]) {
        screenImage.src = config.hover[i];
    }

    btn.dataset.pressed = "true";
});

panel.addEventListener('pointerup', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn || btn.dataset.pressed !== "true") return;
    
    btn.dataset.pressed = "false";

    const i = btn.dataset.index;
    const config = systemMap[currentScreen];
    
    if (config && config.next && config.next[i]) {
        changeScreen(config.next[i]);
    }
    
    resetScreen();
});

panel.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}, false);


initPanel();
updateButtons();