import {
  api, toast, requireRole, buildNavbar,
  runValidation, validators, clearFieldErrors,
  formatMoney, expiryBadge, daysUntil, placeholderImage
} from "/js/common.js";

const session = await requireRole("market");
if (!session) throw new Error("not market");
buildNavbar(session);

const meta = document.getElementById("market-meta");
meta.textContent = `${session.user.name} · ${session.user.city}, ${session.user.district}`;

const rowsEl = document.getElementById("rows");
const alertExpired = document.getElementById("alert-expired");
const modalEl = document.getElementById("product-modal");
const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
const form = document.getElementById("product-form");
const titleEl = document.getElementById("product-modal-title");
const addBtn = document.getElementById("add-btn");
const imgPreviewWrap = document.getElementById("img-preview-wrap");
const imgPreview = document.getElementById("img-preview");
const removeImgBtn = document.getElementById("remove-img");
const imageInput = form.elements.image;

function clearImagePreview() {
  imageInput.value = "";
  form.elements.image_url.value = "";
  imgPreview.src = "";
  imgPreviewWrap.classList.add("d-none");
}

function showImagePreview(src) {
  imgPreview.src = src;
  imgPreviewWrap.classList.remove("d-none");
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    showImagePreview(URL.createObjectURL(file));
    form.elements.image_url.value = "";
  }
});

removeImgBtn.addEventListener("click", clearImagePreview);

addBtn.addEventListener("click", () => {
  form.reset();
  form.elements.id.value = "";
  titleEl.textContent = "Add product";
  clearFieldErrors(form);
  clearImagePreview();
});

async function loadProducts() {
  rowsEl.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5"><span class="spinner-inline"></span>Loading…</td></tr>`;
  const res = await api("/api/market/my/products");
  if (!res.ok) {
    toast(res.data.message || "Failed to load", "error");
    rowsEl.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5">Failed to load.</td></tr>`;
    return;
  }
  const products = res.data.products || [];
  if (products.length === 0) {
    rowsEl.innerHTML = `<tr><td colspan="8" class="empty-state">No products yet. Click <strong>Add product</strong> to get started.</td></tr>`;
    alertExpired.classList.add("d-none");
    return;
  }
  const anyExpired = products.some((p) => daysUntil(p.exp_date) < 0);
  alertExpired.classList.toggle("d-none", !anyExpired);
  rowsEl.innerHTML = products.map(renderRow).join("");

  rowsEl.querySelectorAll("[data-edit]").forEach((b) => {
    b.addEventListener("click", () => openEdit(JSON.parse(b.dataset.edit)));
  });
  rowsEl.querySelectorAll("[data-delete]").forEach((b) => {
    b.addEventListener("click", () => onDelete(b.dataset.delete, b.dataset.title));
  });
}

function renderRow(p) {
  const badge = expiryBadge(p.exp_date);
  const expired = daysUntil(p.exp_date) < 0;
  const img = p.image_url || placeholderImage(p.title);
  const data = JSON.stringify(p).replace(/"/g, "&quot;");
  return `
    <tr class="${expired ? "row-expired" : ""}">
      <td><img src="${img}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:.4rem"></td>
      <td>${escapeHtml(p.title)}</td>
      <td>${p.stock}</td>
      <td>${formatMoney(p.normal_price)}</td>
      <td><strong>${formatMoney(p.discount_price)}</strong></td>
      <td>${p.exp_date?.slice(0, 10) || "—"}</td>
      <td><span class="${badge.cls}">${badge.text}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary" data-edit="${data}">Edit</button>
        <button class="btn btn-sm btn-outline-danger" data-delete="${p.id}" data-title="${escapeHtml(p.title)}">Delete</button>
      </td>
    </tr>`;
}

function openEdit(p) {
  form.elements.id.value = p.id;
  form.elements.title.value = p.title;
  form.elements.stock.value = p.stock;
  form.elements.normal_price.value = p.normal_price;
  form.elements.discount_price.value = p.discount_price;
  form.elements.exp_date.value = p.exp_date?.slice(0, 10) || "";
  form.elements.image_url.value = p.image_url || "";
  imageInput.value = "";
  if (p.image_url) {
    showImagePreview(p.image_url);
  } else {
    imgPreviewWrap.classList.add("d-none");
    imgPreview.src = "";
  }
  titleEl.textContent = "Edit product";
  clearFieldErrors(form);
  modal.show();
}

async function onDelete(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  const res = await api(`/api/market/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    toast(res.data.message || "Delete failed", "error");
    return;
  }
  toast("Product deleted", "ok");
  loadProducts();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ok = runValidation(form, {
    title: [validators.required],
    stock: [validators.nonNegativeInt],
    normal_price: [validators.positiveNumber],
    discount_price: [validators.positiveNumber],
    exp_date: [validators.required],
  });
  if (!ok) return;

  const normal = Number(form.elements.normal_price.value);
  const discount = Number(form.elements.discount_price.value);
  if (discount > normal) {
    toast("Discount price must not exceed normal price", "warn");
    return;
  }

  const id = form.elements.id.value;

  const fd = new FormData();
  fd.append("title", form.elements.title.value.trim());
  fd.append("stock", form.elements.stock.value);
  fd.append("normal_price", form.elements.normal_price.value);
  fd.append("discount_price", form.elements.discount_price.value);
  fd.append("exp_date", form.elements.exp_date.value);
  const imageFile = imageInput.files[0];
  if (imageFile) {
    fd.append("image", imageFile);
  } else if (form.elements.image_url.value) {
    fd.append("image_url", form.elements.image_url.value);
  }

  const res = id
    ? await api(`/api/market/products/${id}`, { method: "PUT", body: fd })
    : await api("/api/market/products", { method: "POST", body: fd });

  if (!res.ok) {
    toast(res.data.message || "Save failed", "error");
    return;
  }
  toast(id ? "Product updated" : "Product added", "ok");
  modal.hide();
  loadProducts();
});

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

loadProducts();
