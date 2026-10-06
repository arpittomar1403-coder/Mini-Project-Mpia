// Tiny localStorage helper. Replace with API calls when a backend exists.
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem('sm_' + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem('sm_' + key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem('sm_' + key); },
  clearAll() { Object.keys(localStorage).filter(k => k.startsWith('sm_')).forEach(k => localStorage.removeItem(k)); }
};

// Date helpers
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const daysLeft = date => Math.round((new Date(date + 'T00:00') - new Date(today() + 'T00:00')) / 864e5);
const dueText = date => { const n = daysLeft(date); return n < 0 ? `Overdue by ${-n}d` : n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : `Due in ${n} days`; };
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
