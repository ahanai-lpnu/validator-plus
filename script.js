// Обираємо елементи
const panel = document.querySelector('.button-panel');
const screenImage = document.getElementById('screen-image');

// Мапа системи: стани екранів та логіка кнопок
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

// Функція програвання звуку
function playSound(file) {
    const audio = new Audio(`assets/sounds/${file}`);
    audio.play().catch(e => console.log("Звук заблоковано браузером:", e));
}
// Функція оновлення іконок кнопок
function updateButtons() {
    const config = systemMap[currentScreen];
    const buttons = document.querySelectorAll('.control-btn');
    
    buttons.forEach((btn, index) => {
        const img = btn.querySelector('.btn-icon');
        // Якщо конфіг дозволяє, ставимо іконку ON/OFF
        if (config) {
            img.src = config.buttons[index] ? 'assets/button-on.svg' : 'assets/button-off.svg';
        }
    });
}

// Список екранів, на яких має бути дата/час
const screensWithDate = [
    'assets/main/main.svg', 
    'assets/main/main-hovered-2.svg', 
    'assets/main/main-hovered-3.svg'
];

function updateDateTimeVisibility(currentSrc) {
    const dateTimeDisplay = document.getElementById('date-time-display');
    const routeInfoDisplay = document.getElementById('route-info-display');
    
    // Перевіряємо, чи є поточний екран у списку
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

// Оновлюємо функцію перемикання екрана
function changeScreen(newScreen) {
    if (newScreen && systemMap[newScreen]) {
        currentScreen = newScreen;
        screenImage.src = currentScreen;
        updateButtons();
        
        // Викликаємо перевірку видимості при кожній зміні екрана
        updateDateTimeVisibility(newScreen);
    }
}

// Створення кнопок на старті
function initPanel() {
    panel.innerHTML = ''; // Очистка перед генерацією
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

// Функція оновлення часу
function updateDateTime() {
    const timePart = document.getElementById('time-part');
    const datePart = document.getElementById('date-part');
    const now = new Date();
     
    timePart.innerText = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    datePart.innerText = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Запускаємо оновлення часу кожну секунду
setInterval(updateDateTime, 1000);
updateDateTime(); // Виклик одразу при старті

// --- ГЛОБАЛЬНІ ЗМІННІ ---
const item = document.getElementById('draggable-item');
const zone = document.querySelector('.drop-zone');
let contactTimer = null;
let isTouching = false; 
let isLocked = false;

// --- ФУНКЦІЯ ПЕРЕВІРКИ (тільки логіка зіткнення) ---
function checkContact() {
    // Якщо інтерфейс "заблокований" — нічого не робимо
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
        
        // Тут додаємо перевірку: не викликати FAIL, якщо ми щойно успішно спрацювали
        if (!isLocked) {
            changeScreenWithTimeout('assets/entry-fal.svg', 'error.ogg', 'assets/symbol-ctls-fal.svg');
        }
    }
}

// Знаходимо елемент зони в DOM (переконайся, що він має ID="drop-zone-img")
const zoneImage = document.querySelector('#drop-zone-img'); 

function changeScreenWithTimeout(newScreen, soundFile, zoneIcon = 'assets/symbol-ctls.svg') {
    isLocked = true;
    
    // Міняємо іконку зони, якщо вона була передана
    if (zoneImage) {
        zoneImage.src = zoneIcon;
    }
    
    playSound(soundFile);
    changeScreen(newScreen);
    
    setTimeout(() => {
        changeScreen('assets/main/main.svg');
        // Повертаємо зону до стандартного вигляду
        if (zoneImage) {
            zoneImage.src = 'assets/symbol-ctls.svg';
        }
        isLocked = false;
    }, 2000);
}

// --- ЛОГІКА ПЕРЕТЯГУВАННЯ ---
item.addEventListener('pointerdown', (e) => {
    e.preventDefault(); 
    item.setPointerCapture(e.pointerId);
    item.classList.add('is-dragging');

    // 1. Отримуємо масштаб (наприклад, 0.75)
    const wrapper = document.querySelector('.main-wrapper');
    const scale = wrapper.getBoundingClientRect().width / 460; // 460 - твоя базова ширина

    // 2. Рахуємо offsetX/Y з урахуванням того, що картка вже масштабована
    const rect = item.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / scale;
    const offsetY = (e.clientY - rect.top) / scale;

    const moveAt = (e) => {
        item.style.position = 'fixed';
        
        // 3. Компенсуємо скейл у координатах руху
        // Ділимо координати миші на scale, щоб вони збіглися з "віртуальним" простором
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
        
        // Ось тут ми повертаємо картку на базу:
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

// Змінна масштабу
let currentScale = 1;

function scaleUI() {
    const wrapper = document.querySelector('.main-wrapper');
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    
    // Розраховуємо масштаб, щоб вписати 460x850 в екран
    const scaleX = winW / 460;
    const scaleY = winH / 850;
    currentScale = Math.min(scaleX, scaleY, 1);
    
    wrapper.style.transform = `scale(${currentScale})`;
    wrapper.style.transformOrigin = 'center center';
}

// У логіці перетягування ділимо координати на масштаб!
const moveAt = (e) => {
    // ДІЛИМО зміщення на масштаб, щоб картка рухалася за курсором синхронно
    const x = (e.clientX - startX) / currentScale;
    const y = (e.clientY - startY) / currentScale;

    item.style.transform = `translate(${x}px, ${y}px)`;
    checkContact();
};

// Логіка подій для панелі (делегування)
// Ми використовуємо pointer-події, які універсальні для миші та пальця
panel.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    
    // ПРИМУСОВО: скасовуємо будь-яку реакцію ОС
    e.preventDefault(); 
    
    const i = btn.dataset.index;
    const config = systemMap[currentScreen];
    
    // Миттєва зміна іконки (hover)
    if (config && config.hover && config.hover[i]) {
        screenImage.src = config.hover[i];
    }

    // ТУТ ВАЖЛИВИЙ КРОК:
    // Ми не чекаємо "click", а виконуємо перехід одразу,
    // якщо це "швидке" натискання, або робимо його на pointerup
    btn.dataset.pressed = "true";
});

panel.addEventListener('pointerup', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn || btn.dataset.pressed !== "true") return;
    
    btn.dataset.pressed = "false";
    
    // Виконуємо дію кліка примусово тут, якщо pointerup пройшов
    const i = btn.dataset.index;
    const config = systemMap[currentScreen];
    
    if (config && config.next && config.next[i]) {
        changeScreen(config.next[i]);
    }
    
    // Повертаємо іконку
    resetScreen();
});


// Забороняємо виклик стандартного контекстного меню на всій панелі
panel.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}, false);



// Запуск
initPanel();
updateButtons();