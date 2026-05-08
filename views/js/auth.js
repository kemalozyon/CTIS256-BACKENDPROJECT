import {
  api, toast, getSession, buildNavbar,
  makeFormSticky, runValidation, validators, clearFieldErrors, showFieldError
} from "/js/common.js";

(async () => buildNavbar(await getSession()))();

const path = location.pathname;

function selectRole(role) {
  document.querySelectorAll("#role-tabs .nav-link").forEach((b) => {
    b.classList.toggle("active", b.dataset.role === role);
  });
  const hidden = document.querySelector('input[name="role"]');
  if (hidden) hidden.value = role;
  const nameLabel = document.querySelector("[data-name-label]");
  if (nameLabel) nameLabel.textContent = role === "market" ? "Market name" : "Full name";
}

document.querySelectorAll("#role-tabs .nav-link").forEach((b) => {
  b.addEventListener("click", () => selectRole(b.dataset.role));
});

const params = new URLSearchParams(location.search);
const initialRole = params.get("role") === "market" ? "market" : "consumer";
selectRole(initialRole);

if (path.endsWith("/login.html")) initLogin();
if (path.endsWith("/register.html")) initRegister();

function initLogin() {
  const form = document.getElementById("login-form");
  const clearSticky = makeFormSticky(form, "sticky:login");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = form.elements.role.value;
    const ok = runValidation(form, {
      email: [validators.required, validators.email],
      password: [validators.required],
    });
    if (!ok) return;

    const body = {
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    };
    const endpoint = role === "market" ? "/api/auth/login/market" : "/api/auth/login/consumer";
    const res = await api(endpoint, { method: "POST", body });
    if (!res.ok) {
      toast(res.data.message || "Login failed", "error");
      return;
    }
    clearSticky();
    toast("Logged in", "ok");
    location.href = role === "market" ? "/market/dashboard.html" : "/consumer/home.html";
  });
}

function initRegister() {
  const form = document.getElementById("register-form");
  const verifySection = document.getElementById("verify-section");
  const verifyForm = document.getElementById("verify-form");
  const verifyEmailDisplay = document.getElementById("verify-email-display");
  const resendLink = document.getElementById("resend-link");
  let pendingEmail = "";
  let pendingRole = "";

  const clearSticky = makeFormSticky(form, "sticky:register");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(form);
    const role = form.elements.role.value;
    const ok = runValidation(form, {
      email: [validators.required, validators.email],
      name: [validators.required, validators.minLen(2)],
      password: [validators.required, validators.minLen(4)],
      city: [validators.required],
      district: [validators.required],
    });
    if (!ok) return;

    const body = {
      email: form.elements.email.value.trim(),
      name: form.elements.name.value.trim(),
      password: form.elements.password.value,
      city: form.elements.city.value.trim(),
      district: form.elements.district.value.trim(),
    };
    const endpoint = role === "market" ? "/api/auth/register/market" : "/api/auth/register/consumer";
    const res = await api(endpoint, { method: "POST", body });
    if (!res.ok) {
      toast(res.data.message || "Registration failed", "error");
      return;
    }
    pendingEmail = body.email;
    pendingRole = role;
    clearSticky();

    // Hide form and role tabs, show email verification step
    document.getElementById("role-tabs").classList.add("d-none");
    form.classList.add("d-none");
    verifyEmailDisplay.textContent = pendingEmail;
    verifySection.classList.remove("d-none");
  });

  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(verifyForm);
    const code = verifyForm.elements.code.value.trim();
    if (!/^\d{6}$/.test(code)) {
      showFieldError(verifyForm, "code", "Enter the 6-digit code from your email");
      return;
    }
    const res = await api("/api/auth/verify-email", {
      method: "POST",
      body: { email: pendingEmail, code, role: pendingRole },
    });
    if (!res.ok) {
      toast(res.data.message || "Invalid or expired code", "error");
      return;
    }
    toast("Email verified! You can now log in.", "ok");
    location.href = `/login.html?role=${pendingRole}`;
  });

  resendLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const res = await api("/api/auth/resend-code", {
      method: "POST",
      body: { email: pendingEmail, role: pendingRole },
    });
    toast(
      res.ok ? "Code resent — check your inbox" : (res.data.message || "Could not resend"),
      res.ok ? "ok" : "error"
    );
  });
}
