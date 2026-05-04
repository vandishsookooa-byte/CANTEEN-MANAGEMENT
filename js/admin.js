/* =============================================
   CANTEEN MANAGEMENT – Admin JavaScript
   ============================================= */

'use strict';

/* ---- Shared storage keys ---- */
const STORAGE_KEY_MENU   = 'cm_menu';
const STORAGE_KEY_ORDERS = 'cm_orders';

const DEFAULT_MENU_ADMIN = [
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

/* ---- State ---- */
let adminMenu   = [];
let adminOrders = [];
let editingId   = null;

/* =============================================
   STORAGE
   ============================================= */
function loadAdminStorage() {
  try {
    adminMenu   = JSON.parse(localStorage.getItem(STORAGE_KEY_MENU))   || [...DEFAULT_MENU_ADMIN];
    adminOrders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS)) || [];
  } catch {
    adminMenu = [...DEFAULT_MENU_ADMIN]; adminOrders = [];
  }
}

function saveAdminMenu() {
  localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(adminMenu));
}

/* =============================================
   STATS
   ============================================= */
function renderStats() {
  const totalItems     = adminMenu.length;
  const availableItems = adminMenu.filter(m => m.available).length;
  const totalOrders    = adminOrders.length;
  const totalRevenue   = adminOrders.reduce((s, o) => s + (o.total || 0), 0);

  setStatEl('statItems',    totalItems);
  setStatEl('statAvail',    availableItems);
  setStatEl('statOrders',   totalOrders);
  setStatEl('statRevenue',  `₹${totalRevenue}`);
}

function setStatEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* =============================================
   TABLE
   ============================================= */
function renderTable() {
  const tbody = document.getElementById('menuTableBody');
  if (!tbody) return;

  if (adminMenu.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#777;padding:1.5rem">No menu items yet. Add one!</td></tr>`;
    return;
  }

  tbody.innerHTML = adminMenu.map(item => `
    <tr>
      <td class="emoji-col">${item.emoji}</td>
      <td>${escAdminHtml(item.name)}</td>
      <td>${escAdminHtml(item.category)}</td>
      <td>₹${item.price}</td>
      <td><span class="badge-${item.type}">${item.type === 'veg' ? 'Veg' : 'Non-Veg'}</span></td>
      <td>
        <label class="toggle-switch" title="${item.available ? 'Available' : 'Unavailable'}">
          <input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleAvailability(${item.id})">
          <span class="toggle-label">${item.available ? '✅ Yes' : '❌ No'}</span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-edit"   onclick="editItem(${item.id})">✏️ Edit</button>
          <button class="btn-delete" onclick="deleteItem(${item.id})">🗑 Del</button>
        </div>
      </td>
    </tr>`).join('');
}

/* =============================================
   TOGGLE AVAILABILITY
   ============================================= */
function toggleAvailability(id) {
  const item = adminMenu.find(m => m.id === id);
  if (!item) return;
  item.available = !item.available;
  saveAdminMenu();
  renderTable();
  renderStats();
  showAdminToast(`${item.name} marked ${item.available ? 'available' : 'unavailable'}`, 'info');
}

/* =============================================
   ADD / EDIT ITEM FORM
   ============================================= */
function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const name     = form.itemName.value.trim();
  const category = form.itemCategory.value;
  const price    = parseFloat(form.itemPrice.value);
  const type     = form.itemType.value;
  const emoji    = form.itemEmoji.value.trim() || '🍽️';
  const desc     = form.itemDesc.value.trim();

  if (!name || !category || isNaN(price) || price <= 0) {
    showAdminToast('Please fill in all required fields correctly.', 'error');
    return;
  }

  if (editingId !== null) {
    // Update existing
    const item = adminMenu.find(m => m.id === editingId);
    if (item) { Object.assign(item, { name, category, price, type, emoji, desc }); }
    editingId = null;
    document.getElementById('formTitle').textContent = '➕ Add New Item';
    document.getElementById('submitBtn').textContent = '➕ Add Item';
    showAdminToast(`${name} updated successfully`, 'success');
  } else {
    // Add new
    const newId = adminMenu.length > 0 ? Math.max(...adminMenu.map(m => m.id)) + 1 : 1;
    adminMenu.push({ id: newId, name, category, price, type, emoji, desc, available: true });
    showAdminToast(`${name} added to menu`, 'success');
  }

  saveAdminMenu();
  renderTable();
  renderStats();
  form.reset();
}

function editItem(id) {
  const item = adminMenu.find(m => m.id === id);
  if (!item) return;

  editingId = id;

  const form = document.getElementById('menuForm');
  form.itemName.value     = item.name;
  form.itemCategory.value = item.category;
  form.itemPrice.value    = item.price;
  form.itemType.value     = item.type;
  form.itemEmoji.value    = item.emoji;
  form.itemDesc.value     = item.desc;

  document.getElementById('formTitle').textContent = `✏️ Edit – ${item.name}`;
  document.getElementById('submitBtn').textContent  = '💾 Save Changes';

  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showAdminToast(`Editing: ${item.name}`, 'info');
}

function deleteItem(id) {
  const item = adminMenu.find(m => m.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}" from the menu?`)) return;
  adminMenu = adminMenu.filter(m => m.id !== id);
  if (editingId === id) { resetForm(); }
  saveAdminMenu();
  renderTable();
  renderStats();
  showAdminToast(`${item.name} removed from menu`, 'error');
}

function resetForm() {
  editingId = null;
  document.getElementById('menuForm')?.reset();
  document.getElementById('formTitle').textContent = '➕ Add New Item';
  document.getElementById('submitBtn').textContent  = '➕ Add Item';
}

/* =============================================
   TOAST
   ============================================= */
function showAdminToast(message, type = 'info') {
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
function escAdminHtml(str) {
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
function adminInit() {
  loadAdminStorage();
  renderStats();
  renderTable();

  const form = document.getElementById('menuForm');
  if (form) form.addEventListener('submit', handleFormSubmit);

  document.getElementById('resetFormBtn')?.addEventListener('click', resetForm);
}

document.addEventListener('DOMContentLoaded', adminInit);
