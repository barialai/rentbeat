const SOUNDIFY_CONFIG = {
  // Replace these 3 values before going live.
  WHATSAPP_NUMBER: '971544685090',
  UPI_ID: 'REPLACE_WITH_UPI_ID',
  RAZORPAY_PAYMENT_LINK: 'https://rzp.io/l/REPLACE_ME'
};

const CART_STORAGE_KEY = 'soundify_rental_cart_v3';
const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const toast = document.querySelector('.toast');
const dateInput = document.querySelector('#dateInput');
const datePickerTrigger = document.querySelector('#datePickerTrigger');
const datePickerPopover = document.querySelector('#datePickerPopover');
const dateDisplay = document.querySelector('#dateDisplay');
const datePickerMonth = document.querySelector('#datePickerMonth');
const datePickerGrid = document.querySelector('#datePickerGrid');
const datePickerPrev = document.querySelector('#datePickerPrev');
const datePickerNext = document.querySelector('#datePickerNext');
const datePickerToday = document.querySelector('#datePickerToday');
const datePickerClear = document.querySelector('#datePickerClear');
const locationInput = document.querySelector('#locationInput');
const locationDisplay = document.querySelector('#locationDisplay');
const locationPickerTrigger = document.querySelector('#locationPickerTrigger');
const locationPickerModal = document.querySelector('#locationPickerModal');
const locationPickerDialog = locationPickerModal?.querySelector('.location-picker-dialog');
const bookingForm = document.querySelector('#booking .hero-search, form.hero-search');
const checkoutDate = document.querySelector('#checkoutDate');
const rentalDaysInput = document.querySelector('#rentalDays');
const customerForm = document.querySelector('#customerForm');
const cartDrawer = document.querySelector('.cart-drawer');
const cartBackdrop = document.querySelector('.cart-backdrop');
const cartClose = document.querySelector('.cart-close');
const stickyCart = document.querySelector('#stickyCart');
const stickyCartBtn = document.querySelector('.sticky-cart-btn');
const checkoutModal = document.querySelector('#checkoutModal');
const checkoutClose = document.querySelector('.checkout-close');
const productSearch = document.querySelector('#productSearch');
const visibleProductCount = document.querySelector('#visibleProductCount');
const noProducts = document.querySelector('#noProducts');
const resetFiltersBtn = document.querySelector('#resetFilters');

let qrInstance = null;
let activeCategory = 'all';
let lastFocusedElement = null;
const cart = new Map();

function money(value) {
  if (value === null) return 'Price on request';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function todayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}


let datePickerView = new Date();
datePickerView = new Date(datePickerView.getFullYear(), datePickerView.getMonth(), 1);

function localIsoDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatHeroDate(value) {
  const date = parseIsoDate(value);
  if (!date) return 'Choose a date';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function syncHeroDateDisplay() {
  if (!dateDisplay || !datePickerTrigger) return;
  const hasValue = Boolean(dateInput?.value);
  dateDisplay.textContent = hasValue ? formatHeroDate(dateInput.value) : 'Choose a date';
  datePickerTrigger.classList.toggle('is-empty', !hasValue);
}

function renderHeroDatePicker() {
  if (!datePickerGrid || !datePickerMonth) return;

  const year = datePickerView.getFullYear();
  const month = datePickerView.getMonth();
  datePickerMonth.textContent = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric'
  }).format(datePickerView);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (datePickerPrev) datePickerPrev.disabled = datePickerView <= currentMonth;

  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  const selected = dateInput?.value || '';
  const todayIso = localIsoDate(today);

  datePickerGrid.innerHTML = '';
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    day.setHours(0, 0, 0, 0);
    const iso = localIsoDate(day);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-day';
    button.textContent = String(day.getDate());
    button.dataset.date = iso;
    button.setAttribute('aria-label', new Intl.DateTimeFormat('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(day));
    if (day.getMonth() !== month) button.classList.add('is-outside');
    if (iso === todayIso) button.classList.add('is-today');
    if (iso === selected) {
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
    }
    if (day < today) button.disabled = true;
    datePickerGrid.appendChild(button);
  }
}

function openHeroDatePicker() {
  if (!datePickerPopover || !datePickerTrigger) return;
  const selected = parseIsoDate(dateInput?.value || '');
  const baseDate = selected || new Date();
  datePickerView = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  renderHeroDatePicker();
  datePickerPopover.hidden = false;
  datePickerTrigger.setAttribute('aria-expanded', 'true');
}

function closeHeroDatePicker({ restoreFocus = false } = {}) {
  if (!datePickerPopover || !datePickerTrigger) return;
  datePickerPopover.hidden = true;
  datePickerTrigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) datePickerTrigger.focus();
}

function openLocationPicker() {
  if (!locationPickerModal || !locationPickerTrigger) return;
  lastFocusedElement = document.activeElement;
  locationPickerModal.classList.add('open');
  locationPickerModal.setAttribute('aria-hidden', 'false');
  locationPickerTrigger.setAttribute('aria-expanded', 'true');
  body.classList.add('location-picker-open');
  window.setTimeout(() => locationPickerDialog?.querySelector('[data-city="Bengaluru"]')?.focus(), 40);
}

function closeLocationPicker({ restoreFocus = true } = {}) {
  if (!locationPickerModal || !locationPickerTrigger) return;
  locationPickerModal.classList.remove('open');
  locationPickerModal.setAttribute('aria-hidden', 'true');
  locationPickerTrigger.setAttribute('aria-expanded', 'false');
  body.classList.remove('location-picker-open');
  if (restoreFocus) (lastFocusedElement || locationPickerTrigger).focus?.();
}

function selectLocation(city) {
  if (city !== 'Bengaluru') {
    showToast(`${city} is coming soon. Soundify is currently available in Bengaluru.`);
    return;
  }
  if (locationInput) locationInput.value = city;
  if (locationDisplay) locationDisplay.textContent = city;
  closeLocationPicker();
}

function setHeroDate(value) {
  if (!dateInput) return;
  dateInput.value = value;
  syncHeroDateDisplay();
  if (checkoutDate) checkoutDate.value = value;
  renderHeroDatePicker();
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__soundifyToast);
  window.__soundifyToast = setTimeout(() => toast.classList.remove('show'), 2300);
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return;
    saved.forEach(item => {
      if (item?.name && (item.price === null || Number(item.price) > 0) && Number(item.qty) > 0) {
        cart.set(item.name, {
          name: item.name,
          price: item.price === null ? null : Number(item.price),
          qty: Number(item.qty)
        });
      }
    });
  } catch (error) {
    console.warn('Could not restore Soundify cart.', error);
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...cart.values()]));
  } catch (error) {
    console.warn('Could not save Soundify cart.', error);
  }
}

function cartCount() {
  return [...cart.values()].reduce((sum, item) => sum + item.qty, 0);
}

function hasQuoteItems() {
  return [...cart.values()].some(item => item.price === null);
}

function baseCartTotal() {
  if (hasQuoteItems()) return null;
  return [...cart.values()].reduce((sum, item) => sum + item.price * item.qty, 0);
}

function rentalDays() {
  return Math.max(1, Number(rentalDaysInput?.value || 1));
}

function payableTotal() {
  return hasQuoteItems() ? null : baseCartTotal() * rentalDays();
}

function focusableInside(element) {
  if (!element) return [];
  return [...element.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.hasAttribute('hidden') && el.offsetParent !== null);
}

function trapFocus(event, container) {
  if (event.key !== 'Tab' || !container) return;
  const items = focusableInside(container);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openCart() {
  if (!cartDrawer || !cartBackdrop) return;
  lastFocusedElement = document.activeElement;
  cartDrawer.classList.add('open');
  cartBackdrop.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartBackdrop.setAttribute('aria-hidden', 'false');
  body.classList.add('cart-open');
  setTimeout(() => cartClose?.focus(), 50);
}

function closeCart({ restoreFocus = true } = {}) {
  if (!cartDrawer || !cartBackdrop) return;
  cartDrawer.classList.remove('open');
  cartBackdrop.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartBackdrop.setAttribute('aria-hidden', 'true');
  body.classList.remove('cart-open');
  if (restoreFocus) lastFocusedElement?.focus?.();
}

function openCheckout() {
  if (!checkoutModal) return;
  if (!cartCount()) {
    showToast('Add at least one item to your cart first.');
    return;
  }
  lastFocusedElement = document.activeElement;
  closeCart({ restoreFocus: false });
  if (dateInput?.value && checkoutDate && !checkoutDate.value) checkoutDate.value = dateInput.value;
  renderCheckout();
  checkoutModal.classList.add('open');
  checkoutModal.setAttribute('aria-hidden', 'false');
  body.classList.add('checkout-open');
  setTimeout(() => checkoutClose?.focus(), 60);
}

function closeCheckout() {
  if (!checkoutModal) return;
  checkoutModal.classList.remove('open');
  checkoutModal.setAttribute('aria-hidden', 'true');
  body.classList.remove('checkout-open');
  lastFocusedElement?.focus?.();
}

function addProduct(card) {
  if (!card) return;
  const name = card.dataset.product;
  const price = card.dataset.quote === 'true' ? null : Number(card.dataset.price);
  if (!name || (price !== null && !(price > 0))) return;

  const existing = cart.get(name);
  if (existing) existing.qty += 1;
  else cart.set(name, { name, price, qty: 1 });

  saveCart();
  renderCart();
  showToast(`${name} added to your cart.`);
}

function updateQty(name, delta) {
  const item = cart.get(name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(name);
  saveCart();
  renderCart();
  renderCheckout();
}

function removeProduct(name) {
  cart.delete(name);
  saveCart();
  renderCart();
  renderCheckout();
}

function renderCart() {
  const count = cartCount();
  const total = baseCartTotal();

  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
  const cartTotal = document.querySelector('#cartTotal');
  const stickyCount = document.querySelector('#stickyCartCount');
  const stickyTotal = document.querySelector('#stickyCartTotal');
  if (cartTotal) cartTotal.textContent = money(total);
  if (stickyCount) stickyCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  if (stickyTotal) stickyTotal.textContent = money(total);

  const itemsEl = document.querySelector('#cartItems');
  const emptyEl = document.querySelector('#cartEmpty');
  const checkoutBtn = document.querySelector('#startCheckout');

  if (itemsEl && emptyEl && checkoutBtn) {
    if (!count) {
      itemsEl.innerHTML = '';
      emptyEl.hidden = false;
      checkoutBtn.disabled = true;
      stickyCart?.classList.remove('show');
      stickyCart?.setAttribute('aria-hidden', 'true');
    } else {
      emptyEl.hidden = true;
      checkoutBtn.disabled = false;
      stickyCart?.classList.add('show');
      stickyCart?.setAttribute('aria-hidden', 'false');
      itemsEl.innerHTML = [...cart.values()].map(item => `
        <div class="cart-line">
          <div class="cart-line-copy">
            <strong>${escapeHtml(item.name)}</strong>
            <small>${money(item.price)} / day</small>
          </div>
          <div class="qty-control" aria-label="Quantity for ${escapeHtml(item.name)}">
            <button type="button" data-cart-action="minus" data-name="${encodeURIComponent(item.name)}" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" data-cart-action="plus" data-name="${encodeURIComponent(item.name)}" aria-label="Increase quantity">+</button>
          </div>
          <strong class="cart-line-price">${money(item.price === null ? null : item.price * item.qty)}</strong>
          <button type="button" class="remove-line" data-cart-action="remove" data-name="${encodeURIComponent(item.name)}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
        </div>`).join('');
    }
  }

  document.querySelectorAll('.product-card').forEach(card => {
    const button = card.querySelector('.add-btn');
    if (!button) return;
    const item = cart.get(card.dataset.product);
    button.classList.toggle('added', Boolean(item));
    button.textContent = item ? `Added · ${item.qty}` : 'Add to cart';
  });
}

function renderCheckout() {
  const quotePending = hasQuoteItems();
  checkoutModal?.classList.toggle('quote-pending', quotePending);
  const quoteNote = document.querySelector('.quote-checkout-note');
  if (quoteNote) quoteNote.hidden = !quotePending;
  const count = cartCount();
  const days = rentalDays();
  const total = payableTotal();
  const checkoutItems = document.querySelector('#checkoutItems');
  if (!checkoutItems) return;

  checkoutItems.innerHTML = [...cart.values()].map(item => `
    <div class="checkout-line">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${item.qty} × ${money(item.price)} × ${days} ${days === 1 ? 'day' : 'days'}</small>
      </div>
      <strong>${money(item.price === null ? null : item.qty * item.price * days)}</strong>
    </div>`).join('');

  const summaryCount = document.querySelector('#summaryCount');
  const checkoutTotal = document.querySelector('#checkoutTotal');
  const paymentAmount = document.querySelector('#paymentAmount');
  const razorpayAmount = document.querySelector('#razorpayAmount');
  const upiIdLabel = document.querySelector('#upiIdLabel');
  if (summaryCount) summaryCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  if (checkoutTotal) checkoutTotal.textContent = money(total);
  if (paymentAmount) paymentAmount.textContent = money(total);
  if (razorpayAmount) razorpayAmount.textContent = money(total);
  if (upiIdLabel) upiIdLabel.textContent = SOUNDIFY_CONFIG.UPI_ID;
  renderUpiPayment();
}

function getUpiUri() {
  if (hasQuoteItems()) return '#';
  const amount = payableTotal().toFixed(2);
  const note = encodeURIComponent('Soundify equipment rental');
  return `upi://pay?pa=${encodeURIComponent(SOUNDIFY_CONFIG.UPI_ID)}&pn=${encodeURIComponent('Soundify')}&am=${amount}&cu=INR&tn=${note}`;
}

function renderUpiPayment() {
  if (hasQuoteItems()) {
    document.querySelector('#upiPayLink')?.setAttribute('href', '#');
    const qr = document.querySelector('#upiQr');
    if (qr) qr.innerHTML = '';
    return;
  }
  const upiLink = document.querySelector('#upiPayLink');
  const qrBox = document.querySelector('#upiQr');
  if (upiLink) upiLink.href = getUpiUri();
  if (!qrBox) return;
  qrBox.innerHTML = '';

  if (window.QRCode && SOUNDIFY_CONFIG.UPI_ID !== 'REPLACE_WITH_UPI_ID') {
    qrInstance = new QRCode(qrBox, {
      text: getUpiUri(),
      width: 110,
      height: 110,
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrBox.innerHTML = '<span>ADD<br>UPI ID<br>TO SHOW QR</span>';
  }
}

function selectedPaymentMethod() {
  if (hasQuoteItems()) return 'To be confirmed after quotation';
  return customerForm?.querySelector('input[name="payment"]:checked')?.value || 'UPI / Google Pay';
}

function createWhatsAppMessage(data) {
  const days = rentalDays();
  const items = [...cart.values()].map((item, index) =>
    `${index + 1}. ${item.name}\n   Qty: ${item.qty} | ${money(item.price)}/day | ${days} ${days === 1 ? 'day' : 'days'} | ${money(item.price === null ? null : item.price * item.qty * days)}`
  ).join('\n');
  const bookingId = `SF-${Date.now().toString().slice(-6)}`;
  const paymentDone = hasQuoteItems() ? 'Awaiting quotation — no payment requested' : document.querySelector('#paymentCompleted')?.checked
    ? 'Customer marked as PAID – please verify'
    : 'Payment pending';
  const pageLocation = document.querySelector('#locationInput')?.value.trim() || 'Bengaluru';
  const eventType = document.querySelector('#eventType')?.value || 'Not specified';

  return `Hi Soundify, I would like to book the following equipment.\n\n*BOOKING REQUEST: ${bookingId}*\n\n*CUSTOMER*\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\n\n*EVENT / DELIVERY*\nEvent type: ${eventType}\nCity: ${pageLocation}\nEvent date: ${data.eventDate}\nRental period: ${days} ${days === 1 ? 'day' : 'days'}\nDelivery address: ${data.deliveryAddress}\nExact location: ${data.exactLocation}\n\n*EQUIPMENT*\n${items}\n\n*EQUIPMENT TOTAL: ${money(payableTotal())}*\nDelivery / setup / deposit: To be confirmed\n\n*PAYMENT*\nMethod: ${selectedPaymentMethod()}\nStatus: ${paymentDone}\n\nPlease verify availability, payment and delivery charges. I understand the booking is final only after Soundify confirms the request.`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function setCategoryFilter(category) {
  activeCategory = category || 'all';
  document.querySelectorAll('[data-filter-btn]').forEach(button => {
    const active = button.dataset.filterBtn === activeCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  applyProductFilters();
}

function applyProductFilters() {
  const query = (productSearch?.value || '').trim().toLowerCase();
  const cards = [...document.querySelectorAll('#productGrid .product-card')];
  if (!cards.length) return;

  let visible = 0;
  cards.forEach(card => {
    const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
    const haystack = `${card.dataset.product || ''} ${card.textContent || ''}`.toLowerCase();
    const searchMatch = !query || haystack.includes(query);
    const show = categoryMatch && searchMatch;
    card.classList.toggle('filtered-out', !show);
    if (show) visible += 1;
  });

  if (visibleProductCount) visibleProductCount.textContent = visible;
  if (noProducts) noProducts.hidden = visible !== 0;
}

function initializeFiltersFromUrl() {
  if (!document.querySelector('#productGrid')) return;
  const url = new URL(window.location.href);
  const category = url.searchParams.get('category');
  const valid = ['speakers', 'microphones', 'dj', 'mixers', 'lighting', 'staging', 'effects'];
  if (valid.includes(category)) setCategoryFilter(category);
  else setCategoryFilter('all');
}

function initializeReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  elements.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    observer.observe(el);
  });
}

function closeMobileMenu() {
  body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
}

// Dates
if (checkoutDate) checkoutDate.min = todayString();
syncHeroDateDisplay();

// Hero date picker
if (datePickerTrigger && datePickerPopover) {
  datePickerTrigger.addEventListener('click', () => {
    const isOpen = !datePickerPopover.hidden;
    if (isOpen) closeHeroDatePicker();
    else openHeroDatePicker();
  });

  datePickerPrev?.addEventListener('click', () => {
    datePickerView = new Date(datePickerView.getFullYear(), datePickerView.getMonth() - 1, 1);
    renderHeroDatePicker();
  });

  datePickerNext?.addEventListener('click', () => {
    datePickerView = new Date(datePickerView.getFullYear(), datePickerView.getMonth() + 1, 1);
    renderHeroDatePicker();
  });

  datePickerGrid?.addEventListener('click', event => {
    const button = event.target.closest('.date-day[data-date]');
    if (!button || button.disabled) return;
    setHeroDate(button.dataset.date);
    closeHeroDatePicker({ restoreFocus: true });
  });

  datePickerToday?.addEventListener('click', () => {
    setHeroDate(todayString());
    closeHeroDatePicker({ restoreFocus: true });
  });

  datePickerClear?.addEventListener('click', () => {
    setHeroDate('');
    closeHeroDatePicker({ restoreFocus: true });
  });

  document.addEventListener('click', event => {
    if (datePickerPopover.hidden) return;
    const dateField = datePickerTrigger.closest('.date-field');
    if (!dateField?.contains(event.target)) closeHeroDatePicker();
  });
}

// Hero location picker
if (locationPickerTrigger && locationPickerModal) {
  locationPickerTrigger.addEventListener('click', openLocationPicker);
  locationPickerModal.querySelectorAll('[data-location-close]').forEach(el => {
    el.addEventListener('click', () => closeLocationPicker());
  });
  locationPickerModal.querySelectorAll('[data-city]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      selectLocation(button.dataset.city || 'Bengaluru');
    });
  });
}
locationPickerDialog?.addEventListener('keydown', event => trapFocus(event, locationPickerDialog));

// Navigation
menuToggle?.addEventListener('click', () => {
  const open = body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  mobileMenu?.setAttribute('aria-hidden', String(!open));
});
document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', closeMobileMenu));

// Hero planner
bookingForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!dateInput?.value) {
    showToast('Choose your event date first.');
    datePickerTrigger?.focus();
    openHeroDatePicker();
    return;
  }
  if (checkoutDate) checkoutDate.value = dateInput.value;
  const eventType = document.querySelector('#eventType')?.value || 'your event';
  const target = document.querySelector('#catalog');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`Showing popular gear for ${eventType.toLowerCase()}.`);
});

// Product interactions
document.addEventListener('click', event => {
  const addButton = event.target.closest('.add-btn');
  if (addButton) {
    addProduct(addButton.closest('.product-card'));
    return;
  }

  const wishlist = event.target.closest('.wishlist');
  if (wishlist) {
    wishlist.classList.toggle('active');
    wishlist.textContent = wishlist.classList.contains('active') ? '♥' : '♡';
    return;
  }

  const cartAction = event.target.closest('[data-cart-action]');
  if (cartAction) {
    const name = decodeURIComponent(cartAction.dataset.name || '');
    const action = cartAction.dataset.cartAction;
    if (action === 'plus') updateQty(name, 1);
    if (action === 'minus') updateQty(name, -1);
    if (action === 'remove') removeProduct(name);
    return;
  }

  const filterButton = event.target.closest('[data-filter-btn]');
  if (filterButton) {
    setCategoryFilter(filterButton.dataset.filterBtn);
  }
});

productSearch?.addEventListener('input', applyProductFilters);
resetFiltersBtn?.addEventListener('click', () => {
  if (productSearch) productSearch.value = '';
  setCategoryFilter('all');
});

// Cart / checkout
for (const trigger of document.querySelectorAll('.cart-trigger')) trigger.addEventListener('click', openCart);
stickyCartBtn?.addEventListener('click', openCart);
cartClose?.addEventListener('click', () => closeCart());
cartBackdrop?.addEventListener('click', () => closeCart());
document.querySelector('#startCheckout')?.addEventListener('click', openCheckout);
checkoutClose?.addEventListener('click', closeCheckout);
checkoutModal?.addEventListener('click', event => {
  if (event.target === checkoutModal) closeCheckout();
});
cartDrawer?.addEventListener('keydown', event => trapFocus(event, cartDrawer));
checkoutModal?.addEventListener('keydown', event => trapFocus(event, checkoutModal));
rentalDaysInput?.addEventListener('input', renderCheckout);

// Payment switching
document.querySelectorAll('input[name="payment"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.payment-card').forEach(card => {
      const input = card.querySelector('input[name="payment"]');
      card.classList.toggle('selected', Boolean(input?.checked));
    });
    const isUpi = radio.value === 'UPI / Google Pay';
    document.querySelector('#upiPanel')?.classList.toggle('hidden', !isUpi);
    document.querySelector('#razorpayPanel')?.classList.toggle('hidden', isUpi);
  });
});

document.querySelector('#razorpayPay')?.addEventListener('click', () => {
  if (hasQuoteItems()) return;
  if (!SOUNDIFY_CONFIG.RAZORPAY_PAYMENT_LINK || SOUNDIFY_CONFIG.RAZORPAY_PAYMENT_LINK.includes('REPLACE_ME')) {
    showToast('Add your Razorpay payment link in script.js first.');
    return;
  }
  window.open(SOUNDIFY_CONFIG.RAZORPAY_PAYMENT_LINK, '_blank', 'noopener');
});

customerForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!cartCount()) {
    showToast('Your cart is empty.');
    return;
  }
  if (!customerForm.reportValidity()) return;
  const data = {
    name: document.querySelector('#customerName')?.value.trim() || '',
    phone: document.querySelector('#customerPhone')?.value.trim() || '',
    email: document.querySelector('#customerEmail')?.value.trim() || '',
    eventDate: checkoutDate?.value || '',
    deliveryAddress: document.querySelector('#deliveryAddress')?.value.trim() || '',
    exactLocation: document.querySelector('#exactLocation')?.value.trim() || ''
  };
  const message = createWhatsAppMessage(data);
  const url = `https://wa.me/${SOUNDIFY_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
  showToast('Booking request opened in WhatsApp.');
});

// Keyboard escape
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (locationPickerModal?.classList.contains('open')) closeLocationPicker();
  else if (datePickerPopover && !datePickerPopover.hidden) closeHeroDatePicker({ restoreFocus: true });
  else if (checkoutModal?.classList.contains('open')) closeCheckout();
  else if (cartDrawer?.classList.contains('open')) closeCart();
  else if (body.classList.contains('menu-open')) closeMobileMenu();
});

// Start
loadCart();
renderCart();
initializeFiltersFromUrl();
initializeReveal();


// Contact shortcuts and callback requests use the same configured destination.
const contactNumber = SOUNDIFY_CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
document.querySelectorAll('[data-contact-call]').forEach(link => {
  link.href = `tel:+${contactNumber}`;
});
document.querySelectorAll('[data-contact-whatsapp]').forEach(link => {
  link.href = `https://wa.me/${contactNumber}?text=${encodeURIComponent('Hi Soundify, I would like help with equipment rental for my event.')}`;
});
const callbackForm = document.querySelector('#callbackForm');
const callbackPhone = document.querySelector('#callbackPhone');
callbackPhone?.addEventListener('input', () => callbackPhone.setCustomValidity(''));
callbackForm?.addEventListener('submit', event => {
  event.preventDefault();
  const phone = callbackPhone.value.replace(/[\s()-]/g, '');
  callbackPhone.setCustomValidity(/^[6-9]\d{9}$/.test(phone) ? '' : 'Please enter a valid 10-digit Indian mobile number.');
  if (!callbackForm.reportValidity()) return;
  const message = `Hi Soundify, I would like to request a callback.\n\nMy mobile number: +91 ${phone}\nPlease call me to discuss sound equipment for my event in Bengaluru.`;
  window.open(`https://wa.me/${contactNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});
