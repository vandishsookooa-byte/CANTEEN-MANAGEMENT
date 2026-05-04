/* =============================================
   CANTEEN MANAGEMENT – Core JavaScript
   ============================================= */

'use strict';

/* ---- Default menu data ---- */
const DEFAULT_MENU = [
  { id: 1,  name: 'Veg Burger',       category: 'Snacks',    price: 50,  emoji: '🍔', desc: 'Crispy veggie patty with fresh veggies',  type: 'veg',    available: true },
  { id: 2,  name: 'Chicken Burger',   category: 'Snacks',    price: 80,  emoji: '🍔', desc: 'Juicy chicken patty with special sauce',  type: 'nonveg', available: true },
  { id: 3,  name: 'Samosa (2 pcs)',   category: 'Snacks',    price: 20,  emoji: '🥟', desc: 'Crispy fried pastry with spiced filling', type: 'veg',    available: true },
  { id: 4,  name: 'French Fries',     category: 'Snacks',    price: 45,  emoji: '🍟', desc: 'Golden crispy fries with dipping sauce',  type: 'veg',    available: true },
  { id: 5,  name: 'Masala Dosa',      category: 'Breakfast', price: 60,  emoji: '🫓', desc: 'Thin crispy dosa with potato masala',    type: 'veg',    available: true },
  { id: 6,  name: 'Idli Sambar',      category: 'Breakfast', price: 40,  emoji: '🍚', desc: 'Steamed rice cakes with lentil soup',    type: 'veg',    available: true },
  { id: 7,  name: 'Poha',             category: 'Breakfast', price: 30,  emoji: '🥣', desc: 'Flattened rice with spices and peanuts', type: 'veg',    available: true },
  { id: 8,  name: 'Egg Sandwich',     category: 'Breakfast', price: 35,  emoji: '🥚', desc: 'Boiled egg with veggies in bread',       type: 'nonveg', available: true },
  { id: 9,  name: 'Veg Rice',         category: 'Meals',     price: 70,  emoji: '🍱', desc: 'Steamed rice with mixed vegetables',     type: 'veg',    available: true },
  { id: 10, name: 'Chicken Biryani',  category: 'Meals',     price: 110, emoji: '🍛', desc: 'Aromatic basmati rice with chicken',     type: 'nonveg', available: true },
  { id: 11, name: 'Dal Rice',         category: 'Meals',     price: 60,  emoji: '🍲', desc: 'Lentil curry with steamed rice',         type: 'veg',    available: true },
  { id: 12, name: 'Paneer Thali',     category: 'Meals',     price: 90,  emoji: '🍽️', desc: 'Full thali with paneer curry & rice',   type: 'veg',    available: true },
  { id: 13, name: 'Masala Chai',      category: 'Beverages', price: 15,  emoji: '☕', desc: 'Indian spiced tea with milk',            type: 'veg',    available: true },
  { id: 14, name: 'Cold Coffee',      category: 'Beverages', price: 40,  emoji: '🥤', desc: 'Chilled coffee blended with milk',       type: 'veg',    available: true },
  { id: 15, name: 'Fresh Lime Soda',  category: 'Beverages', price: 25,  emoji: '🍋', desc: 'Refreshing lime with soda water',        type: 'veg',    available: true },
  { id: 16, name: 'Mango Lassi',      category: 'Beverages', price: 35,  emoji: '🥭', desc: 'Creamy yoghurt with mango pulp',         type: 'veg',    available: true },
  { id: 17, name: 'Gulab Jamun',      category: 'Desserts',  price: 25,  emoji: '🍮', desc: 'Soft milk-solid balls in sugar syrup',   type: 'veg',    available: true },
  { id: 18, name: 'Ice Cream',        category: 'Desserts',  price: 30,  emoji: '🍨', desc: 'Scoops of creamy vanilla ice cream',     type: 'veg',    available: true },
  { id: 19, name: 'Kheer',            category: 'Desserts',  price: 35,  emoji: '🍚', desc: 'Rice pudding with cardamom & nuts',      type: 'veg',    available: true },
];

const CATEGORIES = ['All', 'Breakfast', 'Snacks', 'Meals', 'Beverages', 'Desserts'];

/* ---- State ---- */
let menu       = [];
let cart       = [];
let orders     = [];
let activeCategory = 'All';
let searchQuery    = '';

/* =============================================
   STORAGE HELPERS
   ============================================= */
function loadStorage() {
  try {
    menu   = JSON.parse(localStorage.getItem('cm_menu'))   || [...DEFAULT_MENU];
    cart   = JSON.parse(localStorage.getItem('cm_cart'))   || [];
    orders = JSON.parse(localStorage.getItem('cm_orders')) || [];
  } catch {
    menu = [...DEFAULT_MENU]; cart = []; orders = [];
  }
}

function saveMenu()   { localStorage.setItem('cm_menu',   JSON.stringify(menu));   }
function saveCart()   { localStorage.setItem('cm_cart',   JSON.stringify(cart));   }
function saveOrders() { localStorage.setItem('cm_orders', JSON.stringify(orders)); }

/* =============================================
   CART HELPERS
   ============================================= */
function getCartItem(id) { return cart.find(c => c.id === id); }

function addToCart(id) {
  const item = menu.find(m => m.id === id);
  if (!item || !item.available) return;
  const existing = getCartItem(id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 });
  }
  saveCart();
  renderMenuGrid();
  renderCart();
  updateCartCount();
  showToast(`${item.emoji} ${item.name} added to cart`, 'success');
}

function decreaseQty(id) {
  const existing = getCartItem(id);
  if (!existing) return;
  existing.qty -= 1;
  if (existing.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  renderMenuGrid();
  renderCart();
  updateCartCount();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  renderMenuGrid();
  renderCart();
  updateCartCount();
}

function clearCart() {
  cart = [];
  saveCart();
  renderMenuGrid();
  renderCart();
  updateCartCount();
}

function cartTotal() { return cart.reduce((s, c) => s + c.price * c.qty, 0); }
function cartCount() { return cart.reduce((s, c) => s + c.qty, 0); }

/* =============================================
   RENDER – CATEGORY SIDEBAR
   ============================================= */
function renderCategories() {
  const list = document.getElementById('categoryList');
  if (!list) return;
  list.innerHTML = CATEGORIES.map(cat => {
    const emoji = { All:'🍽️', Breakfast:'🌅', Snacks:'🥨', Meals:'🍱', Beverages:'🥤', Desserts:'🍰' }[cat] || '•';
    return `<li class="${cat === activeCategory ? 'active' : ''}" onclick="filterCategory('${cat}')">
              ${emoji} ${cat}
            </li>`;
  }).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  renderCategories();
  renderMenuGrid();
}

/* =============================================
   RENDER – MENU GRID
   ============================================= */
function filteredMenu() {
  return menu.filter(item => {
    const matchCat    = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = !searchQuery   || item.name.toLowerCase().includes(searchQuery) || item.category.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch && item.available;
  });
}

function renderMenuGrid() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  const items = filteredMenu();

  if (items.length === 0) {
    grid.innerHTML = `<div class="no-results">😕 No items found. Try a different search or category.</div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const cartItem = getCartItem(item.id);
    const qtyCtrl = cartItem
      ? `<div class="qty-control">
           <button onclick="decreaseQty(${item.id})" aria-label="Decrease">−</button>
           <span>${cartItem.qty}</span>
           <button onclick="addToCart(${item.id})" aria-label="Increase">+</button>
         </div>`
      : `<button class="add-btn" onclick="addToCart(${item.id})">＋ Add</button>`;

    return `
      <div class="menu-card">
        <div class="menu-card-img" role="img" aria-label="${item.name}">${item.emoji}</div>
        <div class="menu-card-body">
          <h4>${escHtml(item.name)}</h4>
          <p class="desc">${escHtml(item.desc)}</p>
        </div>
        <div class="menu-card-footer">
          <div>
            <span class="price">₹${item.price}</span>
            <span class="badge-${item.type}" style="margin-left:.4rem">${item.type === 'veg' ? 'Veg' : 'Non-Veg'}</span>
          </div>
          ${qtyCtrl}
        </div>
      </div>`;
  }).join('');
}

/* =============================================
   RENDER – CART PANEL
   ============================================= */
function renderCart() {
  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl  = document.getElementById('cartSubtotal');
  const taxEl       = document.getElementById('cartTax');
  const totalEl     = document.getElementById('cartTotal');
  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div class="cart-empty"><i>🛒</i><p>Your cart is empty</p></div>`;
  } else {
    cartItemsEl.innerHTML = cart.map(c => `
      <div class="cart-item">
        <span class="cart-item-emoji">${c.emoji}</span>
        <div class="cart-item-info">
          <h5>${escHtml(c.name)}</h5>
          <span class="item-price">₹${c.price} × ${c.qty} = ₹${c.price * c.qty}</span>
          <div class="cart-item-actions">
            <button onclick="decreaseQty(${c.id})" aria-label="Decrease quantity">−</button>
            <span class="cart-item-qty">${c.qty}</span>
            <button onclick="addToCart(${c.id})" aria-label="Increase quantity">+</button>
            <button class="remove-item" onclick="removeFromCart(${c.id})" aria-label="Remove item">🗑</button>
          </div>
        </div>
      </div>`).join('');
  }

  const subtotal = cartTotal();
  const tax      = Math.round(subtotal * 0.05);
  const total    = subtotal + tax;
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (taxEl)      taxEl.textContent      = `₹${tax}`;
  if (totalEl)    totalEl.textContent    = `₹${total}`;
}

/* =============================================
   RENDER – ORDER HISTORY
   ============================================= */
function renderOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<p class="no-orders">📭 No orders placed yet.</p>`;
    return;
  }

  container.innerHTML = [...orders].reverse().map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <span>Order #${order.id}</span>
        <span>${new Date(order.timestamp).toLocaleString()}</span>
        <span class="order-status">${order.status}</span>
      </div>
      <div class="order-card-body">
        <ul class="order-items-list">
          ${order.items.map(i => `<li><span>${i.emoji} ${escHtml(i.name)} × ${i.qty}</span><span>₹${i.price * i.qty}</span></li>`).join('')}
        </ul>
      </div>
      <div class="order-card-footer">
        Total: <strong>₹${order.total}</strong>
      </div>
    </div>`).join('');
}

/* =============================================
   UPDATE CART COUNT BADGE
   ============================================= */
function updateCartCount() {
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = cartCount();
}

/* =============================================
   CART PANEL OPEN / CLOSE
   ============================================= */
function openCart() {
  document.getElementById('cartPanel')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartPanel')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* =============================================
   CHECKOUT
   ============================================= */
function checkout() {
  if (cart.length === 0) { showToast('Your cart is empty!', 'error'); return; }

  const subtotal = cartTotal();
  const tax      = Math.round(subtotal * 0.05);
  const total    = subtotal + tax;

  // Populate confirm modal
  const tbody = document.getElementById('modalOrderItems');
  if (tbody) {
    tbody.innerHTML = cart.map(c => `
      <tr>
        <td>${c.emoji} ${escHtml(c.name)}</td>
        <td>${c.qty}</td>
        <td>₹${c.price * c.qty}</td>
      </tr>`).join('');
  }

  const modalTax   = document.getElementById('modalTax');
  const modalTotal = document.getElementById('modalTotal');
  if (modalTax)   modalTax.textContent   = `₹${tax}`;
  if (modalTotal) modalTotal.textContent = `₹${total}`;

  closeCart();
  document.getElementById('confirmModal')?.classList.add('show');
}

function placeOrder() {
  const subtotal = cartTotal();
  const tax      = Math.round(subtotal * 0.05);
  const total    = subtotal + tax;

  const order = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    items:     [...cart],
    subtotal,
    tax,
    total,
    status:    'Confirmed ✅',
  };

  orders.push(order);
  saveOrders();
  clearCart();
  closeModal('confirmModal');
  renderOrders();
  showToast('🎉 Order placed successfully!', 'success');
}

/* =============================================
   MODAL HELPERS
   ============================================= */
function closeModal(id) {
  document.getElementById(id)?.classList.remove('show');
}

/* =============================================
   SEARCH
   ============================================= */
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  renderMenuGrid();
}

/* =============================================
   TOAST NOTIFICATION
   ============================================= */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* =============================================
   UTILITY
   ============================================= */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =============================================
   INIT
   ============================================= */
function init() {
  loadStorage();
  renderCategories();
  renderMenuGrid();
  renderCart();
  renderOrders();
  updateCartCount();

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', handleSearch);

  // Cart open/close
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('closeCart')?.addEventListener('click', closeCart);

  // Checkout & order
  document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
  document.getElementById('clearCartBtn')?.addEventListener('click', () => { clearCart(); showToast('Cart cleared', 'info'); });
  document.getElementById('confirmOrderBtn')?.addEventListener('click', placeOrder);
  document.getElementById('cancelOrderBtn')?.addEventListener('click',  () => closeModal('confirmModal'));

  // Close modal on backdrop click
  document.getElementById('confirmModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('confirmModal')) closeModal('confirmModal');
  });

  // Keyboard: ESC closes panels
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCart();
      closeModal('confirmModal');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
