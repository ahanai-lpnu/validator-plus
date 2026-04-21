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
const zone = document.getElementById('drop-zone');
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
                changeScreenWithTimeout('assets/entry-suc.svg', 'success.ogg');
            }, 500);
        }
    } else if (isTouching) {
        isTouching = false;
        clearTimeout(contactTimer);
        
        // Тут додаємо перевірку: не викликати FAIL, якщо ми щойно успішно спрацювали
        if (!isLocked) {
            changeScreenWithTimeout('assets/entry-fal.svg', 'error.ogg');
        }
    }
}

function changeScreenWithTimeout(newScreen, soundFile) {
    isLocked = true;
    playSound(soundFile); // Граємо звук
    changeScreen(newScreen); // Міняємо екран
    
    // Через 1 секунду (1000 мс) повертаємось на головний
    setTimeout(() => {
        changeScreen('assets/main/main.svg');
        isLocked = false;
    }, 2000);
}

// --- ЛОГІКА ПЕРЕТЯГУВАННЯ ---
item.addEventListener('pointerdown', (e) => {
    e.preventDefault(); 
    item.setPointerCapture(e.pointerId);
    
    item.classList.add('is-dragging');
    
    // Початкові відступи
    const offsetX = e.clientX - item.getBoundingClientRect().left;
    const offsetY = e.clientY - item.getBoundingClientRect().top;

    const moveAt = (e) => {
        item.style.position = 'fixed'; 
        item.style.left = (e.clientX - offsetX) + 'px';
        item.style.top = (e.clientY - offsetY) + 'px';
        item.style.bottom = 'auto';
        item.style.zIndex = '1000';
        
        checkContact();
    };

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

// Логіка подій для панелі (делегування)
panel.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    
    const i = btn.dataset.index;
    const config = systemMap[currentScreen];
    
    // Візуальний ефект при натисканні (hovered екран)
    if (config && config.hover && config.hover[i]) {
        screenImage.src = config.hover[i];
    }
});

panel.addEventListener('mouseup', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    
    // Повертаємо основний екран
    screenImage.src = currentScreen;
});

panel.addEventListener('mouseleave', (e) => {
    // Якщо вивели курсор за межі кнопки під час натискання
    screenImage.src = currentScreen;
}, true);

panel.addEventListener('click', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    
    const i = btn.dataset.index;
    const config = systemMap[currentScreen];
    
    // Виконуємо перехід, якщо він заданий
    if (config && config.next && config.next[i]) {
        changeScreen(config.next[i]);
    }
});

// Запуск
initPanel();
updateButtons();