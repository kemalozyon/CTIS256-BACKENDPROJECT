import {
  api, toast, requireRole, buildNavbar,
  formatMoney, expiryBadge, daysUntil, placeholderImage
} from "/js/common.js";

const session = await requireRole("consumer");
if (!session) throw new Error("not consumer");
buildNavbar(session);

document.getElementById("locale-meta").textContent =
  `Showing products from all markets — priority to ${session.user.district}, then ${session.user.city}`;

const form = document.getElementById("search-form");
const results = document.getElementById("results");
const pager = document.getElementById("pager");

const params = new URLSearchParams(location.search);
form.elements.q.value = params.get("q") || "";
let currentPage = parseInt(params.get("page")) || 1;

const cartByProduct = new Map();   // product_id -> quantity
const productsById = new Map();    // product_id -> product (current page)
const pendingByProduct = new Map(); // product_id -> Promise (in-flight request)

form.addEventListener("submit", (e) => {
  e.preventDefault();
  currentPage = 1;
  syncUrl();
  load();
});

function syncUrl() {
  const q = form.elements.q.value.trim();
  const u = new URLSearchParams();
  if (q) u.set("q", q);
  u.set("page", currentPage);
  history.replaceState(null, "", `?${u}`);
}

async function fetchCart() {
  const res = await api("/api/cart");
  cartByProduct.clear();
  if (res.ok) {
    for (const item of res.data.cart?.items || []) {
      cartByProduct.set(item.product_id, item.quantity);
    }
  }
}

async function load() {
  results.innerHTML = `<div class="col-12 empty-state"><span class="spinner-inline"></span>Loading…</div>`;
  pager.innerHTML = "";

  const q = form.elements.q.value.trim();
  const url = `/api/market/search?q=${encodeURIComponent(q)}&page=${currentPage}`;
  const [searchRes] = await Promise.all([api(url), fetchCart()]);
  if (!searchRes.ok) {
    results.innerHTML = `<div class="col-12 empty-state">Failed to load.</div>`;
    return;
  }
  const { products, totalPages, total } = searchRes.data;
  productsById.clear();
  for (const p of products) productsById.set(p.id, p);

  if (products.length === 0) {
    results.innerHTML = `<div class="col-12 empty-state">No products found${q ? ` for "${escapeHtml(q)}"` : ""}.</div>`;
    return;
  }

  results.innerHTML = products.map(renderCard).join("");
  attachAllControls();
  renderPager(totalPages, total);
}

function renderCard(p) {
  const badge = expiryBadge(p.exp_date);
  const img = p.image_url || placeholderImage(p.title);
  const sameDistrict = p.market_city === session.user.city && p.market_district === session.user.district;
  const sameCity = p.market_city === session.user.city;
  const district = sameDistrict
    ? `<span class="badge bg-success-subtle text-success-emphasis">Same district</span>`
    : sameCity
      ? `<span class="badge bg-info-subtle text-info-emphasis">${escapeHtml(p.market_district)} · same city</span>`
      : `<span class="text-muted small">${escapeHtml(p.market_district)}, ${escapeHtml(p.market_city)}</span>`;
  return `
    <div class="col-12 col-sm-6 col-lg-3">
      <div class="card-product">
        <img class="thumb" src="${img}" alt="${escapeHtml(p.title)}">
        <div class="body">
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="market">${escapeHtml(p.market_name)} · ${district}</div>
          <div class="price">
            ${daysUntil(p.exp_date) <= 3
              ? `<span class="new">${formatMoney(p.discount_price)}</span>
                 <span class="old">${formatMoney(p.normal_price)}</span>`
              : `<span class="new">${formatMoney(p.normal_price)}</span>`
            }
          </div>
          <div class="meta">
            <span class="${badge.cls}">${badge.text}</span>
            <span>Stock: ${p.stock}</span>
          </div>
          <div class="cart-controls mt-2" data-controls="${p.id}">
            ${renderControls(p)}
          </div>
        </div>
      </div>
    </div>`;
}

function renderControls(p) {
  const qty = cartByProduct.get(p.id) || 0;
  if (qty === 0) {
    return `<button class="btn btn-sm btn-brand w-100" data-add="${p.id}">Add to cart</button>`;
  }
  const atMax = qty >= p.stock;
  return `
    <div class="d-flex align-items-center gap-1 qty-row">
      <div class="btn-group flex-grow-1" role="group" aria-label="Quantity">
        <button class="btn btn-sm btn-outline-secondary" data-minus="${p.id}" aria-label="Decrease">−</button>
        <span class="btn btn-sm btn-light disabled qty-display">${qty}</span>
        <button class="btn btn-sm btn-outline-secondary" data-plus="${p.id}" ${atMax ? "disabled" : ""} aria-label="Increase">+</button>
      </div>
      <button class="btn btn-sm btn-outline-danger" data-remove="${p.id}" title="Remove from cart" aria-label="Remove">×</button>
    </div>`;
}

function attachAllControls() {
  for (const slot of results.querySelectorAll("[data-controls]")) {
    bindControlsIn(slot);
  }
}

function bindControlsIn(slot) {
  const add = slot.querySelector("[data-add]");
  const plus = slot.querySelector("[data-plus]");
  const minus = slot.querySelector("[data-minus]");
  const remove = slot.querySelector("[data-remove]");
  if (add) add.addEventListener("click", () => guard(add.dataset.add, () => onChangeQty(add.dataset.add, +1, true)));
  if (plus) plus.addEventListener("click", () => guard(plus.dataset.plus, () => onChangeQty(plus.dataset.plus, +1, false)));
  if (minus) minus.addEventListener("click", () => guard(minus.dataset.minus, () => onChangeQty(minus.dataset.minus, -1, false)));
  if (remove) remove.addEventListener("click", () => guard(remove.dataset.remove, () => onRemove(remove.dataset.remove)));
}

function guard(productId, fn) {
  // serialize per-product to avoid out-of-order writes when clicking quickly
  const prev = pendingByProduct.get(productId) || Promise.resolve();
  const next = prev.then(fn).catch(() => {}).finally(() => {
    if (pendingByProduct.get(productId) === next) pendingByProduct.delete(productId);
  });
  pendingByProduct.set(productId, next);
  setBusy(productId, true);
  return next.finally(() => setBusy(productId, false));
}

function setBusy(productId, busy) {
  const slot = results.querySelector(`[data-controls="${productId}"]`);
  if (!slot) return;
  for (const btn of slot.querySelectorAll("button")) {
    btn.classList.toggle("is-busy", busy);
    if (busy) btn.setAttribute("disabled", "disabled");
  }
  if (!busy) {
    // re-render to restore correct disabled states based on quantity vs stock
    rerenderCardControls(productId);
  }
}

function rerenderCardControls(productId) {
  const slot = results.querySelector(`[data-controls="${productId}"]`);
  if (!slot) return;
  const p = productsById.get(productId);
  if (!p) return;
  slot.innerHTML = renderControls(p);
  bindControlsIn(slot);
}

async function onChangeQty(productId, delta, isFirstAdd) {
  const current = cartByProduct.get(productId) || 0;
  const next = current + delta;
  if (next <= 0) {
    await onRemove(productId);
    return;
  }
  const res = await api("/api/cart/items", {
    method: "POST",
    body: { product_id: productId, quantity: next },
  });
  if (!res.ok) {
    toast(res.data.message || "Could not update cart", "error");
    return;
  }
  cartByProduct.set(productId, next);
  if (isFirstAdd && current === 0) toast("Added to cart", "ok");
}

async function onRemove(productId) {
  const res = await api(`/api/cart/items/${productId}`, { method: "DELETE" });
  if (!res.ok) {
    toast(res.data.message || "Could not remove", "error");
    return;
  }
  cartByProduct.delete(productId);
  toast("Removed from cart", "ok");
}

function renderPager(totalPages, total) {
  if (totalPages <= 1) {
    pager.innerHTML = `<li class="text-muted small">${total} result(s)</li>`;
    return;
  }
  const items = [];
  items.push(pageItem("«", currentPage - 1, currentPage === 1));
  for (let p = 1; p <= totalPages; p++) {
    items.push(`<li class="page-item ${p === currentPage ? "active" : ""}">
      <a class="page-link" href="#" data-page="${p}">${p}</a>
    </li>`);
  }
  items.push(pageItem("»", currentPage + 1, currentPage === totalPages));
  pager.innerHTML = items.join("");
  pager.querySelectorAll("[data-page]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const p = Number(a.dataset.page);
      if (p >= 1 && p <= totalPages) {
        currentPage = p;
        syncUrl();
        load();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

function pageItem(label, page, disabled) {
  return `<li class="page-item ${disabled ? "disabled" : ""}">
    <a class="page-link" href="#" data-page="${page}">${label}</a>
  </li>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

load();
