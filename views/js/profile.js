import {
  api, toast, requireRole, buildNavbar,
  runValidation, validators, clearFieldErrors
} from "/js/common.js";

const role = document.currentScript?.dataset.role
  || (document.querySelector('script[data-role]')?.dataset.role);

const session = await requireRole(role);
if (!session) throw new Error("not " + role);
buildNavbar(session);

const form = document.getElementById("profile-form");
const u = session.user;
form.elements.email.value = u.email || "";
if (role === "market") {
  form.elements.name.value = u.name || "";
} else {
  form.elements.name.value = u.full_name || "";
}
form.elements.city.value = u.city || "";
form.elements.district.value = u.district || "";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFieldErrors(form);
  const ok = runValidation(form, {
    name: [validators.required, validators.minLen(2)],
    city: [validators.required],
    district: [validators.required],
  });
  if (!ok) return;

  const body = role === "market"
    ? {
        name: form.elements.name.value.trim(),
        city: form.elements.city.value.trim(),
        district: form.elements.district.value.trim(),
      }
    : {
        full_name: form.elements.name.value.trim(),
        city: form.elements.city.value.trim(),
        district: form.elements.district.value.trim(),
      };

  const endpoint = role === "market" ? "/api/auth/market/profile" : "/api/auth/consumer/profile";
  const res = await api(endpoint, { method: "PUT", body });
  if (!res.ok) {
    toast(res.data.message || "Save failed", "error");
    return;
  }
  toast("Profile updated", "ok");
});
