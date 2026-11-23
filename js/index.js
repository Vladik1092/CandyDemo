let siteConfig = {};
try {
    siteConfig = JSON.parse(localStorage.getItem('siteConfig') || '{}');
} catch (e) {
    siteConfig = {};
}

const DELIVERY_RATE = typeof siteConfig.deliveryRate === 'number' ? siteConfig.deliveryRate : 500;

(function applySiteConfig() {
    // 1. Акцентный цвет
    if (siteConfig.accentColor) {
        document.documentElement.style.setProperty('--accent', siteConfig.accentColor);
    }

    // 2. Подстановка текстов по атрибуту data-cfg
    ['brandName', 'offerTitle', 'offerText', 'phone', 'address'].forEach(key => {
        if (siteConfig[key]) {
            document.querySelectorAll(`[data-cfg="${key}"]`).forEach(el => {
                el.textContent = siteConfig[key];
            });
        }
    });

    // 3. Отключение падающих сладостей
    if (siteConfig.sweetsEffect === false) {
        const sweetsEl = document.getElementById('sweets-canvas');
        if (sweetsEl) sweetsEl.remove();
    }

    // 4. Отключение онлайн-оплаты и корзины
    if (siteConfig.paymentEnabled === false) {
        document.querySelectorAll('.cart-widget, .add-to-cart-btn, .order-cta-block').forEach(el => {
            el.style.display = 'none';
        });
    }

    // 5. Отключение доставки или обновление тарифа
    const rateSpan = document.getElementById('delivery-rate-text');
    if (rateSpan) rateSpan.textContent = `+${DELIVERY_RATE} ₽ за км`;

    if (siteConfig.deliveryEnabled === false) {
        const deliveryLabel = document.getElementById('delivery-radio-label');
        if (deliveryLabel) deliveryLabel.style.display = 'none';
    }

        if (siteConfig.prices) {
        document.querySelectorAll('.product-card[data-product-key]').forEach(card => {
            const key = card.getAttribute('data-product-key');
            const newPrice = siteConfig.prices[key];
            if (typeof newPrice === 'number') {
                const priceEl = card.querySelector('.product-price');
                const titleEl = card.querySelector('.product-title');
                const btnEl = card.querySelector('.add-to-cart-btn');

                if (priceEl) priceEl.textContent = `${newPrice} ₽`;
                if (btnEl && titleEl) {
                    const title = titleEl.textContent.trim();
                    btnEl.setAttribute('onclick', `addToCart('${title.replace(/'/g, "\\'")}', ${newPrice})`);
                }
            }
        });
    }

})();

/* ===== Бургер-меню ===== */
const burger = document.querySelector('.burger');
const links = document.querySelector('.links');

if (burger && links) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
            burger.classList.remove('active');
            links.classList.remove('open');
        })
    );
}

/* ===== Canvas: падающие пирожные, тортики и ягоды ===== */
const canvas = document.getElementById('sweets-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, dpr;
    const particles = [];

    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 22 : 38;
    const TARGET_FPS = isMobile ? 30 : 60;
    const FRAME_TIME = 1000 / TARGET_FPS;
    let lastTime = 0;

    const SWEET_ITEMS = ['🧁', '🍰', '🍩', '🍪', '🍓', '🎂', '🥐'];
    const sprites = [];
    const SPRITE_SIZE = 72;

    function buildSweetSprites() {
        SWEET_ITEMS.forEach(emoji => {
            const sp = document.createElement('canvas');
            sp.width = SPRITE_SIZE;
            sp.height = SPRITE_SIZE;
            const sCtx = sp.getContext('2d');
            sCtx.font = '46px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
            sCtx.textAlign = 'center';
            sCtx.textBaseline = 'middle';
            sCtx.fillText(emoji, SPRITE_SIZE / 2, SPRITE_SIZE / 2 + 2);
            sprites.push(sp);
        });
    }
    buildSweetSprites();

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticle(randomY = false) {
        const scale = (isMobile ? 0.45 : 0.55) + Math.random() * 0.55;
        return {
            sprite: sprites[Math.floor(Math.random() * sprites.length)],
            x: Math.random() * W,
            y: randomY ? Math.random() * H : -60,
            vy: 0.55 + Math.random() * 0.95,
            sway: Math.random() * Math.PI * 2,
            swaySpeed: 0.01 + Math.random() * 0.015,
            swayAmp: 0.4 + Math.random() * 0.8,
            angle: Math.random() * Math.PI * 2,
            vAngle: (Math.random() - 0.5) * 0.018,
            scale,
            alpha: 0.22 + Math.random() * 0.25
        };
    }

    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle(true));
        }
    }

    function draw(currentTime) {
        if (currentTime - lastTime < FRAME_TIME) {
            requestAnimationFrame(draw);
            return;
        }
        lastTime = currentTime;

        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.sway += p.swaySpeed;
            p.x += Math.sin(p.sway) * p.swayAmp;
            p.y += p.vy;
            p.angle += p.vAngle;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.globalAlpha = p.alpha;

            const size = SPRITE_SIZE * p.scale;
            ctx.drawImage(p.sprite, -size / 2, -size / 2, size, size);
            ctx.restore();

            if (p.y > H + 60) {
                particles[i] = createParticle(false);
            }
        }

        requestAnimationFrame(draw);
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resize();
            initParticles();
        }, 200);
    });

    resize();
    initParticles();
    requestAnimationFrame(draw);
}

/* ===== ЛОГИКА КОРЗИНЫ И ДОСТАВКИ ===== */
let cart = JSON.parse(localStorage.getItem('bakeryCart')) || [];

function updateCartUI() {
    const cartCountEl = document.querySelector('.cart-count');
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    const deliveryOptionsEl = document.getElementById('delivery-options');

    if (cartCountEl) {
        cartCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    if (cartItemsEl && cartTotalEl) {
        cartItemsEl.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Корзина пуста</p>';
            if (deliveryOptionsEl) deliveryOptionsEl.style.display = 'none';
        } else {
            if (deliveryOptionsEl) deliveryOptionsEl.style.display = 'block';
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                cartItemsEl.innerHTML += `
                    <div class="cart-item">
                        <div>
                            <p class="cart-item-title">${item.title} <span style="font-weight:normal; font-size:0.9rem;">x${item.quantity}</span></p>
                        </div>
                        <div>
                            <span class="cart-item-price">${item.price * item.quantity} ₽</span>
                            <button onclick="removeFromCart(${index})" style="background:none; border:none; cursor:pointer; color:#d96b8a; margin-left:10px;">✕</button>
                        </div>
                    </div>
                `;
            });
        }
        cartTotalEl.textContent = total;
    }
}

function addToCart(title, price) {
    const existingItem = cart.find(item => item.title === title);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ title, price, quantity: 1 });
    }
    localStorage.setItem('bakeryCart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('bakeryCart', JSON.stringify(cart));
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) return alert('Корзина пуста');

    const deliveryTypeElement = document.querySelector('input[name="delivery"]:checked');
    const deliveryType = deliveryTypeElement ? deliveryTypeElement.value : 'pickup';
    const addressInput = document.getElementById('delivery-address');
    const address = addressInput ? addressInput.value.trim() : '';

    if (deliveryType === 'delivery' && !address) {
        return alert('Пожалуйста, укажите адрес доставки');
    }

    let itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let deliveryCost = 0;
    if (deliveryType === 'delivery') {
        const savedDistance = parseFloat(localStorage.getItem('deliveryDistance')) || 3;
        deliveryCost = Math.round(savedDistance * DELIVERY_RATE);
        deliveryCost = Math.ceil(deliveryCost / 10) * 10;
    }

    const grandTotal = itemsTotal + deliveryCost;

    const orderData = {
        items: cart,
        itemsTotal: itemsTotal,
        deliveryType: deliveryType,
        address: address,
        deliveryCost: deliveryCost,
        grandTotal: grandTotal
    };

    localStorage.setItem('bakeryOrder', JSON.stringify(orderData));
    localStorage.removeItem('deliveryDistance');

    cart = [];
    localStorage.setItem('bakeryCart', JSON.stringify(cart));
    updateCartUI();

    window.location.href = 'success.html';
}

document.addEventListener('change', function(e) {
    if (e.target.name === 'delivery') {
        const mapWrapper = document.getElementById('map-wrapper');
        if (mapWrapper) {
            mapWrapper.style.display = e.target.value === 'delivery' ? 'block' : 'none';
        }
        const addressInput = document.getElementById('delivery-address');
        if (addressInput && e.target.value === 'pickup') {
            addressInput.value = '';
            localStorage.removeItem('deliveryDistance');
            updateDeliveryPriceInfo(0);
        }
    }
});

function initDeliveryMap() {
        const addressInput = document.getElementById('delivery-address');
    if (addressInput) {
    addressInput.addEventListener('input', function() {
    const address = this.value.trim();
    const infoEl = document.getElementById('delivery-info');
    if (address.length > 3) {
    const simulatedDistance = (Math.random() * 6 + 1).toFixed(1);
    localStorage.setItem('deliveryDistance', simulatedDistance);
    const cost = Math.ceil((simulatedDistance * DELIVERY_RATE) / 10) * 10;
    if (infoEl) {
    infoEl.innerHTML = `<strong>Расстояние:</strong> ~${simulatedDistance} км <br> <strong>Стоимость доставки:</strong> ${cost} ₽`;
    }
    } else {
    localStorage.removeItem('deliveryDistance');
    if (infoEl) {
    infoEl.innerHTML = 'Введите адрес для расчета стоимости доставки';
}
}
});
}
}
function updateDeliveryPriceInfo(distKm) {
    const infoEl = document.getElementById('delivery-info');
    if (infoEl) {
        const cost = Math.ceil((distKm * DELIVERY_RATE) / 10) * 10;
        infoEl.innerHTML = `<strong>Расстояние:</strong> ${distKm.toFixed(1)} км <br> <strong>Стоимость доставки:</strong> ${cost} ₽`;
}
}
    document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initDeliveryMap();
});

(function initOfferSlider() {
    const slider = document.getElementById('offer-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.offer-slide');
    const dotsContainer = document.getElementById('slider-dots');
    const prevBtn = slider.querySelector('.slider-btn.prev');
    const nextBtn = slider.querySelector('.slider-btn.next');

    if (slides.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    let current = 0;

    // Создаём точки под количество фотографий
    slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Фото ${idx + 1}`);
        dot.addEventListener('click', () => goToSlide(idx));
        dotsContainer.appendChild(dot);
    });

const dots = dotsContainer.querySelectorAll('.slider-dot');

function goToSlide(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    prevBtn.addEventListener('click', () => goToSlide(current - 1));
    nextBtn.addEventListener('click', () => goToSlide(current + 1));

    // Поддержка свайпа пальцем на телефоне
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 40) {
            goToSlide(diff > 0 ? current + 1 : current - 1);
        }
    }, { passive: true });
})();

function openCakeDialog() {
    const dialog = document.getElementById('cake-dialog');
    if (dialog) dialog.showModal();
}

function closeCakeDialog() {
    const dialog = document.getElementById('cake-dialog');
    if (dialog) dialog.close();
}

// Закрытие по клику на тёмный фон вокруг окна
document.addEventListener('click', e => {
    const dialog = document.getElementById('cake-dialog');
    if (dialog && e.target === dialog) {
        dialog.close();
    }
});

(function initCustomCakeForm() {
    const form = document.getElementById('custom-cake-form');
    const fileInput = document.getElementById('cake-photos');
    const dropZone = document.getElementById('photo-drop-zone');
    const previewList = document.getElementById('photo-preview-list');

    if (!form || !fileInput) return;

    let selectedFiles = [];

    function renderPreviews() {
        previewList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = e => {
                const item = document.createElement('div');
                item.className = 'photo-preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Пример торта">
                    <button type="button" class="photo-remove-btn" title="Удалить фото">✕</button>
                `;
                item.querySelector('.photo-remove-btn').addEventListener('click', () => {
                    selectedFiles.splice(index, 1);
                    renderPreviews();
                });
                previewList.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    function addFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                selectedFiles.push(file);
            }
        });
        renderPreviews();
    }

    fileInput.addEventListener('change', e => {
        addFiles(e.target.files);
    });

    if (dropZone) {
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            addFiles(e.dataTransfer.files);
        });
    }

    form.addEventListener('submit', e => {
        e.preventDefault();

        const requestData = {
            name: document.getElementById('cake-client-name').value.trim(),
            phone: document.getElementById('cake-client-phone').value.trim(),
            address: document.getElementById('cake-address').value.trim(),
            description: document.getElementById('cake-description').value.trim(),
            photosCount: selectedFiles.length
        };

        localStorage.setItem('lastCakeRequest', JSON.stringify(requestData));
        window.location.href = 'successCake.html';
    });
})();