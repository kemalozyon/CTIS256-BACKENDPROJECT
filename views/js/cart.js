import {
  api, toast, requireRole, buildNavbar,
  formatMoney, daysUntil, placeholderImage
} from "/js/common.js";

const session = await requireRole("consumer");
if (!session) throw new Error("not consumer");
buildNavbar(session);

const area = document.getElementById("cart-area");
let debounceTimer;

async function load() {
  const res = await api("/api/cart");
  if (!res.ok) {
    area.innerHTML = `<div class="empty-state">Failed to load cart.</div>`;
    return;
  }
  render(res.data.cart || { items: [] });
}

function render(cart) {
  const items = cart.items || [];
  if (items.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <a class="btn btn-brand" href="/consumer/home.html">Browse products</a>
      </div>`;
    return;
  }

  const total = items.reduce(
    (sum, i) => sum + effectivePrice(i) * Number(i.quantity), 0
  );

  area.innerHTML = `
    <div class="bg-white border rounded-3 overflow-hidden">
      <table class="table align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th style="width:64px"></th>
            <th>Product</th>
            <th>Unit price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(renderRow).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-end fw-bold">Grand total</td>
            <td class="fw-bold" id="grand-total">${formatMoney(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="d-flex justify-content-end mt-3 gap-2">
      <a class="btn btn-outline-secondary" href="/consumer/home.html">Continue shopping</a>
      <button class="btn btn-brand" id="purchase-btn">Purchase</button>
    </div>`;

  area.querySelectorAll("[data-qty]").forEach((input) => {
    input.addEventListener("input", () => onQtyChange(input));
  });
  area.querySelectorAll("[data-remove]").forEach((b) => {
    b.addEventListener("click", () => onRemove(b.dataset.remove));
  });
  document.getElementById("purchase-btn").addEventListener("click", onPurchase);
}

function effectivePrice(item) {
  return daysUntil(item.exp_date) <= 3 ? Number(item.discount_price) : Number(item.normal_price);
}

function renderRow(item) {
  const img = item.image_url || placeholderImage(item.title);
  const unitPrice = effectivePrice(item);
  const subtotal = unitPrice * Number(item.quantity);
  return `
    <tr data-row="${item.product_id}">
      <td><img src="${img}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:.4rem"></td>
      <td>
        <div class="fw-semibold">${escapeHtml(item.title)}</div>
        <div class="text-muted small">${escapeHtml(item.market_name || "")}</div>
      </td>
      <td>${formatMoney(unitPrice)}</td>
      <td>
        <input class="form-control qty-input" type="number" min="1" max="${item.stock}"
               value="${item.quantity}" data-qty="${item.product_id}" />
      </td>
      <td data-subtotal="${item.product_id}">${formatMoney(subtotal)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" data-remove="${item.product_id}">Remove</button>
      </td>
    </tr>`;
}

function onQtyChange(input) {
  const productId = input.dataset.qty;
  const value = Math.max(1, parseInt(input.value) || 1);
  if (input.value !== String(value)) input.value = value;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const res = await api("/api/cart/items", {
      method: "POST",
      body: { product_id: productId, quantity: value },
    });
    if (!res.ok) {
      toast(res.data.message || "Update failed", "error");
      load();
      return;
    }
    refreshTotalsFromCart(res.data.cart);
  }, 300);
}

function refreshTotalsFromCart(cart) {
  if (!cart) return;
  const items = cart.items || [];
  let total = 0;
  for (const item of items) {
    const subtotal = effectivePrice(item) * Number(item.quantity);
    total += subtotal;
    const cell = document.querySelector(`[data-subtotal="${item.product_id}"]`);
    if (cell) cell.textContent = formatMoney(subtotal);
  }
  const totalEl = document.getElementById("grand-total");
  if (totalEl) totalEl.textContent = formatMoney(total);
}

async function onRemove(productId) {
  const res = await api(`/api/cart/items/${productId}`, { method: "DELETE" });
  if (!res.ok) {
    toast(res.data.message || "Remove failed", "error");
    return;
  }
  toast("Removed from cart", "ok");
  render(res.data.cart || { items: [] });
}

async function onPurchase() {
  if (!confirm("Confirm purchase? Your cart will be cleared and the products will be removed from the system.")) return;
  const res = await api("/api/cart/purchase", { method: "POST" });
  if (!res.ok) {
    toast(res.data.message || "Purchase failed", "error");
    return;
  }
  toast(`Purchased ${res.data.count} product(s). Thank you!`, "ok");
  load();
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

load();
