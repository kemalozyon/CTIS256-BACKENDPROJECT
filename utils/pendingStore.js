const store = new Map();
const TTL = 10 * 60 * 1000; // 10 minutes

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function savePending(email, data) {
  const code = generateCode();
  store.set(email.toLowerCase(), { ...data, code, expires: Date.now() + TTL });
  return code;
}

export function getPending(email) {
  const entry = store.get(email.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(email.toLowerCase());
    return null;
  }
  return entry;
}

export function deletePending(email) {
  store.delete(email.toLowerCase());
}

export function refreshPendingCode(email) {
  const entry = store.get(email.toLowerCase());
  if (!entry) return null;
  const code = generateCode();
  store.set(email.toLowerCase(), { ...entry, code, expires: Date.now() + TTL });
  return code;
}
