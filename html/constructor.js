const DEFAULT_CONFIG = {
    version: 2, // При изменении этого числа старый кэш сбросится автоматически
    brandName: 'Кондитерская',
    accentColor: '#d96b8a',
    offerTitle: 'Скидка 10% на первый торт!',
    offerText: 'Оставьте отзыв на 2ГИС или покажите подписку на нашу группу на кассе и получите сладкий бонус.',
    paymentEnabled: true,
    deliveryEnabled: true,
    sweetsEffect: true,
    deliveryRate: 500,
    phone: '+7‒927‒605‒98‒01',
    address: 'Зелёная ул.18',
    prices: {
        cheesecake: 320,
        macarons: 450,
        eclair: 210,
        cupcake: 240,
        tartlet: 290,
        bento: 1100
    }
};
let currentConfig = loadConfig();

function loadConfig() {
    try {
        const saved = JSON.parse(localStorage.getItem('siteConfig'));

        if (!saved || saved.version !== DEFAULT_CONFIG.version) {
            localStorage.setItem('siteConfig', JSON.stringify(DEFAULT_CONFIG));
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }

        if (saved && (saved.brandName === 'Кофейня' || saved.brandName === 'Шаурма №1')) {
            localStorage.setItem('siteConfig', JSON.stringify(DEFAULT_CONFIG));
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
        if (saved) {
            delete saved.supportChat;
            delete saved.smokeEffect;
            return {
                ...DEFAULT_CONFIG,
                ...saved,
                prices: { ...DEFAULT_CONFIG.prices, ...(saved.prices || {}) }
            };
        }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
}

function populateForm() {
    document.getElementById('cfg-brandName').value = currentConfig.brandName;
    document.getElementById('cfg-accentColor').value = currentConfig.accentColor;
    document.getElementById('color-hex').textContent = currentConfig.accentColor;
    document.getElementById('cfg-offerTitle').value = currentConfig.offerTitle;
    document.getElementById('cfg-offerText').value = currentConfig.offerText;

    document.getElementById('cfg-paymentEnabled').checked = currentConfig.paymentEnabled;
    document.getElementById('cfg-deliveryEnabled').checked = currentConfig.deliveryEnabled;
    document.getElementById('cfg-sweetsEffect').checked = currentConfig.sweetsEffect;

    document.getElementById('cfg-deliveryRate').value = currentConfig.deliveryRate;
    document.getElementById('cfg-phone').value = currentConfig.phone;
    document.getElementById('cfg-address').value = currentConfig.address;

    for (const [key, val] of Object.entries(currentConfig.prices)) {
        const input = document.getElementById(`price-${key}`);
        if (input) input.value = val;
    }
}

function readForm() {
    currentConfig = {
        brandName: document.getElementById('cfg-brandName').value.trim() || DEFAULT_CONFIG.brandName,
        accentColor: document.getElementById('cfg-accentColor').value,
        offerTitle: document.getElementById('cfg-offerTitle').value,
        offerText: document.getElementById('cfg-offerText').value,
        paymentEnabled: document.getElementById('cfg-paymentEnabled').checked,
        deliveryEnabled: document.getElementById('cfg-deliveryEnabled').checked,
        sweetsEffect: document.getElementById('cfg-sweetsEffect').checked,
        deliveryRate: Math.max(0, parseInt(document.getElementById('cfg-deliveryRate').value, 10) || 0),
        phone: document.getElementById('cfg-phone').value,
        address: document.getElementById('cfg-address').value,
        prices: {
            cheesecake: Math.max(0, parseInt(document.getElementById('price-cheesecake').value, 10) || 0),
            macarons: Math.max(0, parseInt(document.getElementById('price-macarons').value, 10) || 0),
            eclair: Math.max(0, parseInt(document.getElementById('price-eclair').value, 10) || 0),
            cupcake: Math.max(0, parseInt(document.getElementById('price-cupcake').value, 10) || 0),
            tartlet: Math.max(0, parseInt(document.getElementById('price-tartlet').value, 10) || 0),
            bento: Math.max(0, parseInt(document.getElementById('price-bento').value, 10) || 0)
        }
    };
}

function updatePreview() {
    document.documentElement.style.setProperty('--accent', currentConfig.accentColor);
    document.getElementById('color-hex').textContent = currentConfig.accentColor;

    document.getElementById('prev-brandName').textContent = currentConfig.brandName;
    document.getElementById('prev-offerTitle').textContent = currentConfig.offerTitle;
    document.getElementById('prev-offerText').textContent = currentConfig.offerText;
    document.getElementById('prev-contacts').textContent = `📞 ${currentConfig.phone} | 📍 ${currentConfig.address}`;

    const orderBtn = document.getElementById('prev-order-btn');
    const cartBadge = document.getElementById('prev-cart-badge');
    orderBtn.style.backgroundColor = currentConfig.accentColor;
    cartBadge.style.backgroundColor = currentConfig.accentColor;

    if (currentConfig.paymentEnabled) {
        orderBtn.style.display = 'inline-block';
        cartBadge.textContent = '🧁 Корзина: Вкл';
        cartBadge.style.opacity = '1';
    } else {
        orderBtn.style.display = 'none';
        cartBadge.textContent = '🧁 Корзина: Выкл';
        cartBadge.style.opacity = '0.5';
    }

    const pillDelivery = document.getElementById('pill-delivery');
    pillDelivery.textContent = currentConfig.deliveryEnabled
        ? `🚚 Доставка: ${currentConfig.deliveryRate} ₽/км`
        : '🚚 Доставка: Самовывоз';
    pillDelivery.classList.toggle('off', !currentConfig.deliveryEnabled);

    const pillSweets = document.getElementById('pill-sweets');
    pillSweets.textContent = currentConfig.sweetsEffect ? '🧁 Фон: Вкл' : '🧁 Фон: Выкл';
    pillSweets.classList.toggle('off', !currentConfig.sweetsEffect);

    document.getElementById('json-output').textContent = JSON.stringify(currentConfig, null, 2);
}

document.querySelectorAll('.builder-controls input, .builder-controls textarea').forEach(el => {
    el.addEventListener('input', () => {
        readForm();
        updatePreview();
    });
});

document.getElementById('btn-save').addEventListener('click', () => {
    readForm();
    localStorage.setItem('siteConfig', JSON.stringify(currentConfig));
    const btn = document.getElementById('btn-save');
    btn.textContent = '✓ Сохранено!';
    setTimeout(() => btn.textContent = 'Сохранить конфиг', 1500);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    localStorage.removeItem('siteConfig');
    currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    populateForm();
    updatePreview();
});

document.getElementById('btn-copy-json').addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(currentConfig, null, 2));
    const btn = document.getElementById('btn-copy-json');
    btn.textContent = 'Скопировано!';
    setTimeout(() => btn.textContent = 'Копировать', 1500);
});

populateForm();
updatePreview();
