// Shared helpers for fetch, toast notifications, form validation, and sticky-form support.

export async function api(path, { method = "GET", body, headers = {} } = {}) {
  const opts = {
    method,
    credentials: "same-origin",
    headers: { Accept: "application/json", ...headers },
  };
  if (body !== undefined) {
    if (body instanceof FormData) {
      opts.body = body; // let browser set Content-Type + boundary
    } else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(path, opts);
  let data = {};
  try { data = await res.json(); } catch (_) {}
  return { ok: res.ok, status: res.status, data };
}

let toastHost;
function ensureToastHost() {
  if (toastHost) return toastHost;
  toastHost = document.createElement("div");
  toastHost.className = "toast-host";
  document.body.appendChild(toastHost);
  return toastHost;
}

export function toast(message, type = "info", timeout = 3500) {
  const host = ensureToastHost();
  const el = document.createElement("div");
  el.className = `toast-msg ${type}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .2s";
    setTimeout(() => el.remove(), 220);
  }, timeout);
}

export async function getSession() {
  const { ok, data } = await api("/api/auth/me");
  return ok ? data : null;
}

export async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  window.location.href = "/index.html";
}

// Sticky form: persist input values so a refresh or validation error keeps the data.
export function makeFormSticky(form, storageKey) {
  const stored = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
  for (const [name, value] of Object.entries(stored)) {
    const el = form.elements.namedItem(name);
    if (el && el.type !== "password") el.value = value;
  }
  form.addEventListener("input", () => {
    const data = {};
    for (const el of form.elements) {
      if (el.name && el.type !== "password" && el.type !== "submit") {
        data[el.name] = el.value;
      }
    }
    sessionStorage.setItem(storageKey, JSON.stringify(data));
  });
  return () => sessionStorage.removeItem(storageKey);
}

export function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((n) => n.remove());
  form.querySelectorAll(".invalid").forEach((n) => n.classList.remove("invalid"));
}

export function showFieldError(form, fieldName, message) {
  const el = form.elements.namedItem(fieldName);
  if (!el) return;
  el.classList.add("invalid");
  const err = document.createElement("div");
  err.className = "field-error";
  err.textContent = message;
  el.insertAdjacentElement("afterend", err);
}

export const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email",
  required: (v) => (v && String(v).trim().length > 0) || "This field is required",
  minLen: (n) => (v) => (v && String(v).length >= n) || `Must be at least ${n} characters`,
  positiveNumber: (v) => (Number(v) > 0) || "Must be a positive number",
  nonNegativeInt: (v) => (Number.isInteger(Number(v)) && Number(v) >= 0) || "Must be a non-negative integer",
  futureOrTodayDate: (v) => {
    if (!v) return "Date required";
    return true; // expired highlighting is informational, expired dates are still allowed for inventory
  },
};

export function runValidation(form, rules) {
  clearFieldErrors(form);
  let ok = true;
  for (const [field, fns] of Object.entries(rules)) {
    const el = form.elements.namedItem(field);
    if (!el) continue;
    for (const fn of fns) {
      const result = fn(el.value);
      if (result !== true) {
        showFieldError(form, field, result);
        ok = false;
        break;
      }
    }
  }
  return ok;
}

export function formatMoney(value) {
  return Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export function expiryBadge(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return { text: "—", cls: "badge bg-secondary" };
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, cls: "badge badge-expired" };
  if (days === 0) return { text: "Expires today", cls: "badge badge-soon" };
  if (days <= 3) return { text: `${days} day(s) left`, cls: "badge badge-soon" };
  return { text: `${days} days left`, cls: "badge badge-ok" };
}

export function placeholderImage(title) {
  const t = encodeURIComponent((title || "Product").slice(0, 30));
  return `https://placehold.co/600x450/e2e8f0/0f766e?text=${t}`;
}

export async function requireRole(role) {
  const session = await getSession();
  if (!session || session.role !== role) {
    window.location.href = "/login.html";
    return null;
  }
  return session;
}

export function buildNavbar(session) {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  const role = session?.role;
  const name = session?.user?.name || session?.user?.full_name || "";
  const home = role === "market" ? "/market/dashboard.html"
            : role === "consumer" ? "/consumer/home.html"
            : "/index.html";
  const links = [];
  if (role === "consumer") {
    links.push(`<a class="nav-link" href="/consumer/home.html">Browse</a>`);
    links.push(`<a class="nav-link" href="/consumer/cart.html">Cart</a>`);
    links.push(`<a class="nav-link" href="/consumer/profile.html">Profile</a>`);
  } else if (role === "market") {
    links.push(`<a class="nav-link" href="/market/dashboard.html">Dashboard</a>`);
    links.push(`<a class="nav-link" href="/market/profile.html">Profile</a>`);
  }
  nav.innerHTML = `
    <a class="navbar-brand" href="${home}">
      <span class="brand-mark">Sustain</span>Mart
    </a>
    <div class="ms-auto d-flex align-items-center gap-2">
      ${links.join("")}
      ${role
        ? `<span class="text-muted small me-2">${name}</span>
           <button class="btn btn-sm btn-outline-secondary" data-logout>Logout</button>`
        : `<a class="btn btn-sm btn-outline-secondary" href="/login.html">Login</a>
           <a class="btn btn-sm btn-brand" href="/register.html">Register</a>`
      }
    </div>`;
  const logoutBtn = nav.querySelector("[data-logout]");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}
