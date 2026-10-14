// ===== State & helpers =====
let D = null, charts = [], calMonth = new Date(), calSel = today(), editTaskId = null, chat = [], planLoading = false, planDraft = null, taskFilter = 'All';
const $ = s => document.querySelector(s);
const toast = m => { const t = document.createElement('div'); t.textContent = m; $('#toast').append(t); setTimeout(() => t.remove(), 2600); };
const save = () => Store.set('data', D);
const user = () => (Store.get('users', {}) || {})[Store.get('session')];
document.documentElement.dataset.theme = Store.get('theme', 'light');
function loadData() {
  D = Store.get('data');

  if (!D) {
    D = {
      profile: {
        college: '',
        course: '',
        semester: '',
        targetCGPA: 0,
        targetPct: 0,
        preferred: 16,
        hours: 3
      },
      subjects: [],
      exams: [],
      tasks: [],
      attendance: [],
      timetable: [],
      attendanceLog: [],
      events: [],
      sessions: [],
      hours: [],
      marks: []
    };

    save();
  }
}
const toggleTheme = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; Store.set('theme', t); render(); };
const hoursToday = () => (D.hours.find(h => h.date === today()) || { hours: 0 }).hours;
const addHours = (mins) => { let h = D.hours.find(x => x.date === today()); if (!h) D.hours.push(h = { date: today(), hours: 0 }); h.hours = Math.max(0, +(h.hours + mins / 60).toFixed(2)); };
const streak = () => { let n = 0, i = 0; const has = d => (D.hours.find(h => h.date === d) || { hours: 0 }).hours > 0; if (!has(today())) i = 1; while (has(addDays(-i))) { n++; i++; } return n; };
const alerts = () => {
  const a = [], soon = D.tasks.filter(t => !t.done && daysLeft(t.deadline) >= 0 && daysLeft(t.deadline) <= 3).length;
  if (soon) a.push(`You have ${soon} assignment(s) due within 3 days.`);
  D.attendance.filter(x => attPct(x) < x.required).forEach(x => a.push(`Attendance shortage in ${x.name}.`));
  D.exams.filter(e => daysLeft(e.date) >= 0 && daysLeft(e.date) <= 7).forEach(e => a.push(`${e.name} in ${daysLeft(e.date)} days.`));
  return a;
};
const prioClass = p => `<span class="badge ${p}">${p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} ${p}</span>`;
const dayName = d => new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'long' });

// ===== Router =====
const PRIVATE = ['dashboard', 'planner', 'tasks', 'attendance', 'calendar', 'progress', 'assistant', 'profile'];
const NAV = [['dashboard', '🏠', 'Dashboard'], ['planner', '✨', 'AI Planner'], ['tasks', '✅', 'Tasks'], ['attendance', '📋', 'Attendance'], ['calendar', '📅', 'Calendar'], ['progress', '📈', 'Progress'], ['assistant', '🤖', 'AI Assistant'], ['profile', '⚙️', 'Profile & Settings']];
function render() {
  charts.forEach(c => c.destroy()); charts = [];
  const page = location.hash.replace('#/', '') || 'home';
  if (PRIVATE.includes(page) && !user()) { location.hash = '#/login'; return; }
  if (!PRIVATE.includes(page)) { $('#app').innerHTML = page === 'login' ? loginView() : page === 'register' ? registerView() : landingView(); return; }
  loadData();
  const u = user(), hr = new Date().getHours(), greet = hr < 12 ? 'Morning' : hr < 18 ? 'Afternoon' : 'Evening', n = alerts().length;
  const views = { dashboard, planner, tasks, attendance, calendar, progress, assistant, profile };
  $('#app').innerHTML = `<div class="shell">
   <aside class="side"><div class="logo"><b>MAYA</b></div>
    ${NAV.map(([k, i, l]) => `<a href="#/${k}" class="${page === k ? 'on' : ''}">${i} ${l}</a>`).join('')}
    <div style="margin-top:auto" class="row"><div class="avatar">${esc(u.name[0])}</div><div style="flex:1;min-width:0"><b style="font-size:.9rem">${esc(u.name)}</b></div><button class="icon" title="Logout" onclick="logout()">⏻</button></div></aside>
   <main class="main"><div class="top"><div><h1>Good ${greet}, ${esc(u.name.split(' ')[0])} 👋</h1><div class="mute">Here's your academic overview · ${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
    <div class="row"><button class="icon" title="Notifications" onclick="toast(alerts().join(' • ')||'No new notifications')">🔔${n ? `<span class="dot">${n}</span>` : ''}</button><button class="icon" title="Toggle theme" onclick="toggleTheme()">${document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'}</button><div class="avatar">${esc(u.name[0])}</div></div></div>
    <div id="view">${views[page]()}</div></main>
   <a class="fab" href="#/assistant">✨ AI Assistant</a>
   <nav class="bottom">${NAV.slice(0, 5).map(([k, i, l]) => `<a href="#/${k}" class="${page === k ? 'on' : ''}">${i}${l.split(' ').pop()}</a>`).join('')}<a href="#/profile" class="${page === 'profile' ? 'on' : ''}">⚙️More</a></nav></div>`;
  if (afterRender[page]) afterRender[page]();
}
window.addEventListener('hashchange', render); window.addEventListener('load', render);
const afterRender = {};
const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--mute') } } } };
const mkChart = (id, cfg) => { const el = document.getElementById(id); if (el && window.Chart) charts.push(new Chart(el, cfg)); };
const ccard = (id, title, h = 240) => `<div class="card"><h3 style="margin-bottom:12px">${title}</h3><div style="height:${h}px"><canvas id="${id}"></canvas></div></div>`;
const emptyState = (t, s, btn = '') => `<div class="empty"><h3>${t}</h3><p>${s}</p>${btn}</div>`;

// ===== Landing / Auth =====
function landingView() {
  const f = [['🧠', 'Smart Study Planner', 'AI-powered personalized study schedules.'], ['⏰', 'Deadline Reminders', 'Never miss assignments, projects, or exams.'], ['📋', 'Attendance Tracker', 'Monitor attendance and get shortage warnings.'], ['🤖', 'AI Study Assistant', 'Get personalized academic guidance.'], ['📈', 'Academic Progress', 'Understand your performance through analytics.'], ['🎯', 'Personalized Goals', 'Set and track your academic targets.']];
  const s = [['Enter Your Academic Data', '📝'], ['AI Analyzes Your Workload', '🔍'], ['Receive Your Personalized Plan', '🗓️'], ['Track Your Progress', '📊']];
  return `<div class="nav"><div class="logo" style="padding:0"><b>MAYA</b></div><nav><a href="#features">Features</a><a href="#how">How It Works</a><a href="#features">AI Planner</a><a href="#how">About</a></nav>
   <div class="row"><button class="icon" onclick="toggleTheme()">🌓</button><a class="btn ghost" href="#/login">Login</a><a class="btn" href="#/register">Get Started</a></div></div>
  <section class="hero"><div><h1>Your AI-Powered Academic Success Partner</h1><p>Plan smarter. Study better. Never miss a deadline.</p><div class="row"><a class="btn big" href="#/register">Get Started</a><a class="btn ghost big" href="#features" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'});return false">Explore Features</a></div></div>
   <div class="card"><div class="row between"><b>Today's plan</b><span class="badge">AI generated</span></div>
    ${[['4:00 PM', 'Data Structures', 'Linked Lists', 'High'], ['5:15 PM', 'Mathematics', 'Differential Equations', 'Medium'], ['7:30 PM', 'Operating Systems', 'Memory Management', 'High']].map(r => `<div class="sess"><div class="time">${r[0]}</div><div style="flex:1"><b>${r[1]}</b><div class="mute">${r[2]}</div></div>${prioClass(r[3])}</div>`).join('')}
    <div class="row mt"><div style="flex:1"><div class="mute">Attendance</div><div class="bar"><i style="width:78%"></i></div></div><div style="flex:1"><div class="mute">Tasks done</div><div class="bar"><i style="width:75%"></i></div></div></div></div></section>
  <section class="sec" id="features"><h2>Everything a student needs</h2><div class="grid g3">${f.map(x => `<div class="card"><div style="font-size:1.6rem">${x[0]}</div><h3 style="margin:8px 0 4px">${x[1]}</h3><p class="mute">${x[2]}</p></div>`).join('')}</div></section>
  <section class="sec" id="how"><h2>How it works</h2><div class="grid g5" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${s.map((x, i) => `<div class="card step"><b>0${i + 1}</b><div style="font-size:1.5rem">${x[1]}</div><h3>${x[0]}</h3></div>`).join('')}</div></section>
  <p class="mute" style="text-align:center;padding:30px">© MAYA · Frontend demo project</p>`;
}
const authBox = (title, body) => `<div class="auth"><div class="logo" style="text-align:center"><a href="#/"><b>MAYA</b></a></div><div class="card"><h2>${title}</h2>${body}</div></div>`;
const loginView = () => authBox('Welcome back', `<div><label>Email</label><input id="em" type="email" placeholder="you@college.edu"></div><div><label>Password</label><input id="pw" type="password"></div>
  <div class="row between"><label class="row" style="margin:0"><input type="checkbox" style="width:auto"> Remember me</label><a href="#/login" onclick="toast('Demo only: use Register to create a new account.');return false" style="color:var(--brand)">Forgot password?</a></div>
  <div id="err" style="color:var(--high);font-size:.9rem"></div><button class="btn" onclick="login()">Login</button><button class="btn ghost" onclick="toast('Google sign-in is not available in the demo.')">Continue with Google</button>
  <p class="mute">Don't have an account? <a href="#/register" style="color:var(--brand)">Create one</a></p><p class="mute" style="font-size:.75rem">Demo authentication only — not secure for real use.</p>`);
const registerView = () => authBox('Create your account', `${[['rn', 'Full Name', 'text'], ['re', 'Email', 'email'], ['rp', 'Password', 'password'], ['rc', 'Confirm Password', 'password'], ['rcol', 'College/School', 'text'], ['rcr', 'Course', 'text'], ['rs', 'Semester', 'number']].map(([i, l, t]) => `<div><label>${l}</label><input id="${i}" type="${t}"></div>`).join('')}
  <div id="err" style="color:var(--high);font-size:.9rem"></div><button class="btn" onclick="register()">Create account</button><p class="mute">Already registered? <a href="#/login" style="color:var(--brand)">Login</a></p>`);
function register() {
  const v = i => $('#' + i).value.trim(), users = Store.get('users', {}), em = v('re').toLowerCase();
  const err = m => $('#err').textContent = m;
  if (!v('rn') || !em || !v('rp')) return err('Name, email and password are required.');
  if (v('rp').length < 6) return err('Password must be at least 6 characters.');
  if (v('rp') !== v('rc')) return err('Passwords do not match.');
  if (users[em]) return err('An account with this email already exists.');
  users[em] = { name: v('rn'), email: em, password: v('rp') }; Store.set('users', users); Store.set('session', em);
  const d = {
  profile: {
    college: v('rcol'),
    course: v('rcr'),
    semester: v('rs'),
    targetCGPA: 0,
    targetPct: 0,
    preferred: 16,
    hours: 3
  },
  subjects: [],
  exams: [],
  tasks: [],
  attendance: [],
  events: [],
  sessions: [],
  hours: [],
  marks: []
};

Store.set('data', d);

  location.hash = '#/dashboard';
}
function login() {
  const em = $('#em').value.trim().toLowerCase(), u = Store.get('users', {})[em];
  if (!u || u.password !== $('#pw').value) return $('#err').textContent = 'Incorrect email or password.';
  Store.set('session', em); location.hash = '#/dashboard';
}
const logout = () => { Store.remove('session'); location.hash = '#/login'; };

// ===== Dashboard =====
function dashboard() {
  const ts = D.sessions.filter(s => s.date === today()), pend = D.tasks.filter(t => !t.done).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const overall = overallAttendance().p, done = D.tasks.filter(t => t.done).length;
  const cards = [['📚', "Today's Sessions", ts.length, 'planned today'], ['⏳', 'Upcoming Deadlines', pend.filter(t => daysLeft(t.deadline) <= 7).length, 'in next 7 days'], ['📋', 'Overall Attendance', overall.toFixed(0) + '%', overall >= 75 ? '↑ above 75%' : '↓ below 75%'], ['🕒', 'Study Hours Today', hoursToday().toFixed(1) + ' hrs', 'logged'], ['✅', 'Tasks Completed', `${done} / ${D.tasks.length}`, 'overall']];
  return `<div class="grid g5">${cards.map(c => `<div class="card stat"><span>${c[0]}</span><span class="mute">${c[1]}</span><span class="n">${c[2]}</span><span class="mute" style="font-size:.8rem">${c[3]}</span></div>`).join('')}</div>
  <div class="grid g2 mt"><div class="card"><div class="row between"><h3>Today's study plan</h3><a href="#/planner" class="btn sm ghost">Open planner</a></div>
    ${ts.length ? ts.map(sessionRow).join('') : emptyState('No sessions today', 'Generate a plan in the AI Study Planner.', '<a class="btn" href="#/planner">Generate plan</a>')}</div>
   <div class="card"><h3>✨ AI insights</h3>${buildInsights(D).map(i => `<div class="insight">💡 ${esc(i)}</div>`).join('')}</div></div>
  <div class="card mt"><h3 style="margin-bottom:8px">Upcoming deadlines</h3>${pend.length ? `<table class="resp"><thead><tr><th>Task</th><th>Subject</th><th>Due</th><th>Remaining</th><th>Priority</th></tr></thead>${pend.slice(0, 5).map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.subject)}</td><td>${t.deadline}</td><td>${dueText(t.deadline)}</td><td>${prioClass(t.priority)}</td></tr>`).join('')}</table>` : emptyState('All caught up', 'No pending deadlines.')}</div>`;
}
function sessionRow(s, editable = false) {
  return `<div class="sess ${s.done ? 'done' : ''}"><input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleSession('${s.id}')"><div class="time">${fmtTime(s.start)} – ${fmtTime(s.end)}</div>
   <div style="flex:1"><b class="t">${esc(s.subject)}</b><div class="mute">Topic: ${esc(s.topic)}${editable ? ` · ${esc(s.reason)}` : ''}</div></div>${prioClass(s.priority)}
   ${editable ? `<button class="btn sm ghost" onclick="editSession('${s.id}')">Edit</button><button class="btn sm ghost" onclick="delSession('${s.id}')">Delete</button>` : ''}</div>`;
}
function toggleSession(id) { const s = D.sessions.find(x => x.id === id); s.done = !s.done; if (s.date === today()) addHours(s.done ? s.mins : -s.mins); save(); render(); }
function editSession(id) { const s = D.sessions.find(x => x.id === id), t = prompt('Topic for this session:', s.topic); if (t) { s.topic = t; save(); render(); toast('Session updated'); } }
function delSession(id) { if (confirm('Delete this session?')) { D.sessions = D.sessions.filter(x => x.id !== id); save(); render(); } }

// ===== AI Study Planner =====
function planner() {
  if (!planDraft) planDraft = { subjects: JSON.parse(JSON.stringify(D.subjects)), exams: JSON.parse(JSON.stringify(D.exams)) };
  const p = D.profile, wc = workloadCheck(D, p.hours), days = [...new Set(D.sessions.map(s => s.date))].sort();
  return `<div class="card"><h3>Your academic inputs</h3><p class="mute" style="margin-bottom:10px">Assignments come from the Tasks page.</p>
   <table class="resp"><thead><tr><th>Subject</th><th>Difficulty (1-5)</th><th>Preparation %</th><th>Target marks</th><th></th></tr></thead>
   ${planDraft.subjects.map((s, i) => `<tr><td><input value="${esc(s.name)}" onchange="planDraft.subjects[${i}].name=this.value"></td><td><input type="number" min="1" max="5" value="${s.difficulty}" onchange="planDraft.subjects[${i}].difficulty=+this.value"></td><td><input type="number" min="0" max="100" value="${s.prep}" onchange="planDraft.subjects[${i}].prep=+this.value"></td><td><input type="number" min="0" max="100" value="${s.target}" onchange="planDraft.subjects[${i}].target=+this.value"></td><td><button class="btn sm danger" onclick="planDraft.subjects.splice(${i},1);render()">✕</button></td></tr>`).join('')}</table>
   <button class="btn sm ghost mt" onclick="planDraft.subjects.push({name:'New Subject',difficulty:3,prep:50,target:75,topics:[]});render()">+ Add subject</button>
   <h3 class="mt">Exams</h3>${planDraft.exams.map((e, i) => `<div class="row" style="margin:6px 0"><input style="flex:2" value="${esc(e.name)}" onchange="planDraft.exams[${i}].name=this.value"><select style="flex:2" onchange="planDraft.exams[${i}].subject=this.value">${planDraft.subjects.map(s => `<option ${s.name === e.subject ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select><input style="flex:1" type="date" value="${e.date}" onchange="planDraft.exams[${i}].date=this.value"><button class="btn sm danger" onclick="planDraft.exams.splice(${i},1);render()">✕</button></div>`).join('')}
   <button class="btn sm ghost" onclick="planDraft.exams.push({id:uid(),name:'New Exam',subject:planDraft.subjects[0]?.name||'',date:addDays(14)});render()">+ Add exam</button>
   <h3 class="mt">Availability & goals</h3><div class="form"><div><label>Study hours per day</label><input id="ph" type="number" step="0.5" min="1" max="12" value="${p.hours}"></div>
   <div><label>Preferred study time</label><select id="pt">${[[8, 'Morning (8 AM)'], [14, 'Afternoon (2 PM)'], [16, 'Evening (4 PM)'], [19, 'Night (7 PM)']].map(([v, l]) => `<option value="${v}" ${p.preferred == v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
   <div><label>Target CGPA</label><input id="pc" type="number" step="0.1" value="${p.targetCGPA}"></div><div><label>Target percentage</label><input id="pp" type="number" value="${p.targetPct}"></div></div>
   <button class="btn big mt" onclick="runPlanner()">✨ Generate My AI Study Plan</button></div>
  <div id="planOut" class="mt">${planLoading ? '<div class="card"><div class="spin"></div><p class="mute" style="text-align:center">Analyzing your workload…</p></div>' : planOutput(wc, days)}</div>`;
}
function planOutput(wc, days) {
  if (!days.length) return emptyState('No plan yet', 'Fill in your inputs and generate your plan.');
  return `${wc.tooMuch ? `<div class="warn">⚠️ <b>Time Constraint Detected</b><br>You have more academic workload (~${wc.needed}h) than available study time (${wc.available}h this week). We've prioritized your most urgent subjects and deadlines.</div>` : ''}
   <div class="row between"><h2>Your AI study plan</h2><button class="btn ghost" onclick="runPlanner()">🔄 Regenerate</button></div>
   ${days.map(d => `<div class="card mt"><h3>${dayName(d)} <span class="mute">${d}</span></h3>${D.sessions.filter(s => s.date === d).map(s => sessionRow(s, true)).join('')}</div>`).join('')}`;
}
function runPlanner() {
  D.subjects = planDraft.subjects.filter(s => s.name.trim()); D.exams = planDraft.exams;
  Object.assign(D.profile, { hours: +$('#ph').value || 3, preferred: +$('#pt').value, targetCGPA: +$('#pc').value, targetPct: +$('#pp').value });
  planLoading = true; render();
  setTimeout(() => { D.sessions = generatePlan(D, D.profile.hours, D.profile.preferred); save(); planLoading = false; planDraft = null; render(); toast('Study plan generated'); }, 1400);
}

// ===== Tasks =====
function tasks() {
  const t = editTaskId ? D.tasks.find(x => x.id === editTaskId) : null, cat = x => x.done ? 'Completed' : daysLeft(x.deadline) <= 0 ? 'Today' : daysLeft(x.deadline) === 1 ? 'Tomorrow' : daysLeft(x.deadline) <= 7 ? 'This Week' : 'Later';
  const cats = ['Today', 'Tomorrow', 'This Week', 'Later', 'Completed'];
  const shown = cats.filter(c => taskFilter === 'All' || taskFilter === c);
  return `<div class="card"><h3>${t ? 'Edit task' : 'Add task'}</h3><div class="form mt">
   <div><label>Task name</label><input id="tn" value="${esc(t?.name)}"></div><div><label>Subject</label><select id="ts">${D.subjects.map(s => `<option ${t?.subject === s.name ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
   <div><label>Deadline</label><input id="td" type="date" value="${t?.deadline || addDays(3)}"></div><div><label>Priority</label><select id="tp">${['High', 'Medium', 'Low'].map(p => `<option ${t?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
   <div><label>Estimated hours</label><input id="th" type="number" step="0.5" value="${t?.hours || 2}"></div><div><label>Description</label><input id="tdesc" value="${esc(t?.desc)}"></div></div>
   <div class="row mt"><button class="btn" onclick="saveTask()">${t ? 'Save changes' : 'Add Task'}</button>${t ? '<button class="btn ghost" onclick="editTaskId=null;render()">Cancel</button>' : ''}</div></div>
  <div class="row mt tabs">${['All', ...cats].map(c => `<button style="${taskFilter === c ? 'background:var(--brand);color:#fff' : ''}" onclick="taskFilter='${c}';render()">${c}</button>`).join('')}</div>
  ${D.tasks.length ? shown.map(c => { const l = D.tasks.filter(x => cat(x) === c).sort((a, b) => a.deadline.localeCompare(b.deadline)); return l.length ? `<div class="card mt"><h3>${c} <span class="mute">(${l.length})</span></h3>${l.map(x => `<div class="sess ${x.done ? 'done' : ''}"><input type="checkbox" ${x.done ? 'checked' : ''} onchange="toggleTask('${x.id}')"><div style="flex:1"><b class="t">${esc(x.name)}</b><div class="mute">${esc(x.subject)} · ${dueText(x.deadline)} · ~${x.hours}h${x.desc ? ' · ' + esc(x.desc) : ''}</div></div>${prioClass(x.priority)}<button class="btn sm ghost" onclick="editTaskId='${x.id}';render();scrollTo(0,0)">Edit</button><button class="btn sm ghost" onclick="delTask('${x.id}')">Delete</button></div>`).join('')}</div>` : ''; }).join('') : `<div class="card mt">${emptyState('No tasks yet', 'Add your first assignment or study task to get started.')}</div>`}`;
}
function saveTask() {
  const name = $('#tn').value.trim(); if (!name) return toast('Enter a task name');
  const obj = { name, subject: $('#ts').value, deadline: $('#td').value, priority: $('#tp').value, hours: +$('#th').value || 1, desc: $('#tdesc').value };
  if (editTaskId) Object.assign(D.tasks.find(x => x.id === editTaskId), obj); else D.tasks.push({ id: uid(), done: false, ...obj });
  editTaskId = null; save(); render(); toast('Task saved');
}
const toggleTask = id => { const t = D.tasks.find(x => x.id === id); t.done = !t.done; save(); render(); };
const delTask = id => { if (confirm('Delete this task?')) { D.tasks = D.tasks.filter(x => x.id !== id); save(); render(); } };

// ===== Attendance =====
let attendanceDay = today();

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dayNumber = date => new Date(date + 'T00:00:00').getDay();
const dateForDayInWeek = (weekDate, targetDay) => {
  const d = new Date(weekDate + 'T00:00:00');
  d.setDate(d.getDate() + (targetDay - d.getDay()));
  return iso(d);
};
const weekStart = date => {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay());
  return iso(d);
};
const attSubject = name => D.attendance.find(a => a.name.toLowerCase() === name.toLowerCase());
const scheduleForDay = date => (D.timetable || []).filter(x => +x.day === dayNumber(date)).sort((a,b) => a.time.localeCompare(b.time));
const attendanceStats = () => {
  const rows = D.attendance || [];
  return rows.map(a => {
    const total = Number(a.total) || 0, attended = Number(a.attended) || 0;
    const p = total ? (attended / total) * 100 : 0;
    return { ...a, total, attended, p };
  });
};
const overallAttendance = () => {
  const rows = attendanceStats();
  const total = rows.reduce((s,a) => s + a.total, 0);
  const attended = rows.reduce((s,a) => s + a.attended, 0);
  return { total, attended, p: total ? attended / total * 100 : 0 };
};
const attNeededNew = (attended, total, required) => {
  const r = Number(required) / 100;
  if (r <= 0) return 0;
  if ((attended / Math.max(total,1)) >= r) return 0;
  return Math.max(0, Math.ceil((r * total - attended) / (1 - r)));
};
const attCanSkipNew = (attended, total, required) => {
  const r = Number(required) / 100;
  if (r >= 1) return 0;
  if (total === 0) return 0;
  return Math.max(0, Math.floor((attended - r * total) / r));
};

function attendance() {
  if (!Array.isArray(D.timetable)) D.timetable = [];
  if (!Array.isArray(D.attendanceLog)) D.attendanceLog = [];

  const days = Array.from({length:7}, (_,i) => {
    const date = dateForDayInWeek(attendanceDay, i);
    const active = date === attendanceDay;
    return `<button type="button" class="btn sm ${active ? '' : 'ghost'}" onclick="selectAttendanceDay('${date}')">${DAY_NAMES[i].slice(0,3)}<br><span style="font-size:.72rem">${date.slice(8,10)}</span></button>`;
  }).join('');

  const classes = scheduleForDay(attendanceDay);
  const stats = attendanceStats();
  const overall = overallAttendance();

  const classCards = classes.length ? classes.map(c => {
    const log = D.attendanceLog.find(x => x.scheduleId === c.id && x.date === attendanceDay);
    const marked = log?.status || '';
    return `<div class="card">
      <div class="row between">
        <div><b>${esc(c.subject)}</b><div class="mute">${esc(c.time)}</div></div>
        <span class="badge">${marked ? (marked === 'present' ? '✓ Marked Present' : '✕ Marked Absent') : 'Not marked'}</span>
      </div>
      <div class="row mt">
        <button type="button" class="btn sm ${marked === 'present' ? '' : 'ghost'}" onclick="setClassAttendance('${c.id}','${attendanceDay}','present')">✓ Present</button>
        <button type="button" class="btn sm ${marked === 'absent' ? 'danger' : 'ghost'}" onclick="setClassAttendance('${c.id}','${attendanceDay}','absent')">✕ Absent</button>
      </div>
    </div>`;
  }).join('') : `<div class="card">${emptyState('No classes scheduled', 'Add your weekly timetable above and your classes will appear here automatically.')}</div>`;

  const subjectCards = stats.length ? stats.map(a => {
    const st = a.total === 0 ? 'No data' : a.p >= a.required + 5 ? 'Safe' : a.p >= a.required ? 'Risk' : 'Shortage';
    const need = attNeededNew(a.attended, a.total, a.required);
    const skip = attCanSkipNew(a.attended, a.total, a.required);
    return `<div class="card">
      <div class="row between"><b>${esc(a.name)}</b><span class="badge ${st}">${st === 'Safe' ? '🟢 Safe' : st === 'Risk' ? '🟡 At Risk' : st === 'Shortage' ? '🔴 Shortage' : '⚪ No data'}</span></div>
      <div class="n" style="font-size:1.8rem;font-weight:800">${a.p.toFixed(1)}%</div>
      <div class="bar"><i style="width:${Math.min(a.p,100)}%"></i></div>
      <div class="mute mt">Present ${a.attended} · Absent ${a.total - a.attended} · Total ${a.total} · Required ${a.required}%</div>
      <p style="margin:10px 0">${a.total === 0 ? 'Mark classes as Present or Absent to start calculating.' : a.p >= a.required ? `You can miss ${skip} more class(es) and stay at ${a.required}%.` : `Attend the next ${need} class(es) without missing one to reach ${a.required}%.`}</p>
    </div>`;
  }).join('') : `<div class="card">${emptyState('No subjects yet', 'Add your weekly timetable. Subjects will be created automatically.')}</div>`;

  const scheduleRows = [1,2,3,4,5,6,0].flatMap(day => (D.timetable || []).filter(x => +x.day === day).sort((a,b)=>a.time.localeCompare(b.time)).map(c => `
    <div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)">
      <div><b>${DAY_NAMES[c.day]}</b> · ${esc(c.subject)} <span class="mute">· ${esc(c.time)}</span></div>
      <button type="button" class="btn sm ghost" onclick="deleteTimetable('${c.id}')">Delete</button>
    </div>`)).join('');

  return `
    <div class="card">
      <div class="row between"><div><h3>Weekly Timetable</h3><div class="mute">Enter your regular classes once. Then mark each class Present or Absent every day.</div></div></div>
      <form class="form mt" onsubmit="addTimetable(event)">
        <div><label>Day</label><select id="td"><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option></select></div>
        <div><label>Subject</label><input id="ts" required placeholder="e.g. Data Structures"></div>
        <div><label>Class time</label><input id="tt" required placeholder="09:00 AM"></div>
        <div><label>Minimum required %</label><input id="tr" type="number" min="0" max="100" value="75"></div>
        <button type="submit" class="btn">+ Add Class</button>
      </form>
      ${D.timetable.length ? `<div class="mt">${scheduleRows}</div>` : ''}
    </div>

    <div class="card mt">
      <div class="row between"><div><h3>Mark Attendance</h3><div class="mute">Choose a day and mark every scheduled class.</div></div><input id="attDate" type="date" value="${attendanceDay}" onchange="selectAttendanceDay(this.value)"></div>
      <div class="row mt">${days}</div>
      <h4 class="mt">${new Date(attendanceDay+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'short'})}</h4>
      <div class="grid g2 mt">${classCards}</div>
    </div>

    <div class="card mt">
      <div class="row between"><div><h3>Attendance Overview</h3><div class="mute">Calculated from every class you mark.</div></div>
        <div style="text-align:right"><div class="n" style="font-size:1.8rem;font-weight:800">${overall.p.toFixed(1)}%</div><div class="mute">${overall.attended}/${overall.total} classes present</div></div>
      </div>
      <div class="bar mt"><i style="width:${Math.min(overall.p,100)}%"></i></div>
    </div>

    <div class="grid g3 mt">${subjectCards}</div>
  `;
}
function addTimetable(e) {
  e.preventDefault();
  const day = +$('#td').value, subject = $('#ts').value.trim(), time = $('#tt').value.trim(), required = Math.max(0, Math.min(100, +$('#tr').value || 75));
  if (!subject || !time) return toast('Enter subject and class time');
  if (!Array.isArray(D.timetable)) D.timetable = [];
  D.timetable.push({ id: uid(), day, subject, time, required });
  if (!D.attendance) D.attendance = [];
  if (!attSubject(subject)) D.attendance.push({ id: uid(), name: subject, total: 0, attended: 0, required });
  save(); render(); toast('Class added to timetable');
}
function selectAttendanceDay(date) {
  if (!date) return;
  attendanceDay = date;
  render();
}
function setClassAttendance(scheduleId, date, status) {
  const c = (D.timetable || []).find(x => x.id === scheduleId);
  if (!c) return;
  if (!Array.isArray(D.attendanceLog)) D.attendanceLog = [];
  if (!Array.isArray(D.attendance)) D.attendance = [];
  let subject = attSubject(c.subject);
  if (!subject) {
    subject = { id: uid(), name: c.subject, total: 0, attended: 0, required: c.required || 75 };
    D.attendance.push(subject);
  }
  let log = D.attendanceLog.find(x => x.scheduleId === scheduleId && x.date === date);
  if (log && log.status === status) return;
  if (log) {
    if (log.status === 'present') subject.attended = Math.max(0, subject.attended - 1);
  } else {
    subject.total = Number(subject.total || 0) + 1;
  }
  if (status === 'present') subject.attended = Number(subject.attended || 0) + 1;
  log = log || { id: uid(), scheduleId, date };
  log.status = status;
  if (!D.attendanceLog.some(x => x.id === log.id)) D.attendanceLog.push(log);
  save(); render(); toast(status === 'present' ? 'Marked Present ✓' : 'Marked Absent ✕');
}
function deleteTimetable(id) {
  const c = (D.timetable || []).find(x => x.id === id);
  if (!c || !confirm(`Delete ${c.subject} from the weekly timetable? Existing attendance history will remain.`)) return;
  D.timetable = D.timetable.filter(x => x.id !== id);
  save(); render(); toast('Class removed from timetable');
}
afterRender.attendance = () => {};
// ===== Calendar =====
function calEvents(date) {
  return [...D.events.filter(e => e.date === date).map(e => ({ ...e, own: true })),
    ...D.exams.filter(e => e.date === date).map(e => ({ title: e.name, type: 'Exam' })),
    ...D.tasks.filter(t => t.deadline === date && !t.done).map(t => ({ title: t.name, type: 'Deadline' })),
    ...D.sessions.filter(s => s.date === date).map(s => ({ title: `${s.subject} (study)`, type: 'Study' }))];
}
function calendar() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(), cells = [];
  for (let i = 0; i < first; i++) cells.push('<div style="border:0;cursor:default"></div>');
  for (let d = 1; d <= n; d++) { const date = `${y}-${pad(m + 1)}-${pad(d)}`; cells.push(`<div class="${date === calSel ? 'sel' : ''} ${date === today() ? 'td' : ''}" onclick="calSel='${date}';render()">${d}<br>${[...new Set(calEvents(date).map(e => e.type))].map(t => `<span class="pip ${t}"></span>`).join('')}</div>`); }
  const ev = calEvents(calSel);
  return `<div class="grid g2"><div class="card"><div class="row between"><button class="btn sm ghost" onclick="calMonth=new Date(${y},${m - 1},1);render()">‹</button><h3>${calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3><button class="btn sm ghost" onclick="calMonth=new Date(${y},${m + 1},1);render()">›</button></div>
   <div class="cal mt">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="h">${d}</div>`).join('')}${cells.join('')}</div>
   <div class="row mt mute">${['Exam', 'Deadline', 'Class', 'Study'].map(t => `<span><span class="pip ${t}"></span>${t}</span>`).join('')}</div></div>
   <div class="card"><h3>${dayName(calSel)}, ${calSel}</h3>${ev.length ? ev.map(e => `<div class="sess"><span class="pip ${e.type}" style="margin-top:8px"></span><div style="flex:1"><b>${esc(e.title)}</b><div class="mute">${e.type}</div></div>${e.own ? `<button class="btn sm ghost" onclick="editEvent('${e.id}')">Edit</button><button class="btn sm ghost" onclick="delEvent('${e.id}')">Delete</button>` : ''}</div>`).join('') : '<p class="mute">Nothing scheduled.</p>'}
   <h3 class="mt">Add event</h3><div class="form mt"><div><label>Title</label><input id="et"></div><div><label>Type</label><select id="ety">${['Class', 'Study', 'Exam', 'Assignment'].map(t => `<option>${t}</option>`).join('')}</select></div></div><button class="btn mt" onclick="addEvent()">Add event</button></div></div>`;
}
function addEvent() { const t = $('#et').value.trim(); if (!t) return toast('Enter a title'); D.events.push({ id: uid(), title: t, date: calSel, type: $('#ety').value }); save(); render(); toast('Event added'); }
function editEvent(id) { const e = D.events.find(x => x.id === id), t = prompt('Event title:', e.title); if (t) { e.title = t; save(); render(); } }
function delEvent(id) { if (confirm('Delete this event?')) { D.events = D.events.filter(x => x.id !== id); save(); render(); } }

// ===== Progress =====
function progress() {
  const wk = D.hours.slice(-7).reduce((s, h) => s + h.hours, 0), done = D.tasks.filter(t => t.done).length, pend = D.tasks.length - done, prod = D.tasks.length ? Math.round(done / D.tasks.length * 100) : 0;
  const st = [['Today', hoursToday().toFixed(1) + ' h'], ['This week', wk.toFixed(1) + ' h'], ['Tasks done', done], ['Tasks pending', pend], ['Productivity', prod + '%']];
  return `<div class="grid g5">${st.map(s => `<div class="card stat"><span class="mute">${s[0]}</span><span class="n">${s[1]}</span></div>`).join('')}</div>
  <div class="card mt row" style="font-size:1.1rem"><span style="font-size:2rem">🔥</span><div><b>${streak()} Day Study Streak</b><div class="mute">Keep going! You're building a strong study habit.</div></div></div>
  <div class="grid g2 mt">${ccard('p1', 'Weekly study hours')}${ccard('p2', 'Subject-wise study time')}${ccard('p3', 'Completed vs pending tasks')}${ccard('p4', 'Academic progress (internal tests %)')}</div>`;
}
afterRender.progress = () => {
  const l = D.hours.slice(-7), by = {}; D.sessions.forEach(s => by[s.subject] = (by[s.subject] || 0) + s.mins / 60);
  delete by['Quick Revision + Quiz'];
  mkChart('p1', { type: 'bar', data: { labels: l.map(h => dayName(h.date).slice(0, 3)), datasets: [{ label: 'Hours', data: l.map(h => h.hours), backgroundColor: '#0f766e', borderRadius: 6 }] }, options: chartOpts });
  mkChart('p2', { type: 'doughnut', data: { labels: Object.keys(by), datasets: [{ data: Object.values(by).map(v => +v.toFixed(1)), backgroundColor: ['#0f766e', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#64748b'] }] }, options: chartOpts });
  const done = D.tasks.filter(t => t.done).length;
  mkChart('p3', { type: 'doughnut', data: { labels: ['Completed', 'Pending'], datasets: [{ data: [done, D.tasks.length - done], backgroundColor: ['#16a34a', '#d97706'] }] }, options: chartOpts });
  mkChart('p4', { type: 'line', data: { labels: D.marks.map((_, i) => 'Test ' + (i + 1)), datasets: [{ label: 'Score %', data: D.marks, borderColor: '#0f766e', tension: .3, fill: false }] }, options: chartOpts });
};

// ===== AI Assistant =====
function assistant() {
  if (!chat.length) chat.push({ r: 'a', t: "Hi! I'm your study assistant. Try one of the suggestions below." });
  return `<div class="card"><div class="chat" id="chat">${chat.map(m => `<div class="msg ${m.r === 'u' ? 'u' : 'a'}">${esc(m.t)}</div>`).join('')}</div>
   <div class="row mt">${['I have 3 hours today. What should I study?', 'My attendance is low. What should I do?', 'Help me revise Data Structures in 7 days.', 'Show my deadlines', 'Quiz me'].map(q => `<button class="btn sm ghost" onclick="send('${q}')">${q}</button>`).join('')}</div>
   <div class="row mt"><input id="msg" style="flex:1" placeholder="Ask about your plan, attendance, deadlines…" onkeydown="if(event.key==='Enter')send()"><button class="btn" onclick="send()">Send</button></div></div>`;
}
afterRender.assistant = () => { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; };
async function send(text) {
  text = text || $('#msg').value.trim(); if (!text) return;
  chat.push({ r: 'u', t: text }); chat.push({ r: 'a', t: '…thinking' }); render();
  const reply = await askAI(text, D); chat.pop(); chat.push({ r: 'a', t: reply }); if (location.hash === '#/assistant') render();
}

// ===== Profile & Settings =====
function profile() {
  const u = user(), p = D.profile;
  return `<div class="card"><h3>Profile & academic settings</h3><div class="form mt">
   <div><label>Full name</label><input id="fn" value="${esc(u.name)}"></div><div><label>College/School</label><input id="fc" value="${esc(p.college)}"></div><div><label>Course</label><input id="fr" value="${esc(p.course)}"></div><div><label>Semester</label><input id="fs" value="${esc(p.semester)}"></div>
   <div><label>Target CGPA</label><input id="fg" type="number" step="0.1" value="${p.targetCGPA}"></div><div><label>Target percentage</label><input id="fp" type="number" value="${p.targetPct}"></div>
   <div><label>Preferred study time</label><select id="fo">${[[8, 'Morning'], [14, 'Afternoon'], [16, 'Evening'], [19, 'Night']].map(([v, l]) => `<option value="${v}" ${p.preferred == v ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div><label>Daily study hours</label><input id="fh" type="number" step="0.5" value="${p.hours}"></div></div>
   <div class="mt"><label>Subjects</label><div class="row">${D.subjects.map(s => `<span class="badge">${esc(s.name)}</span>`).join('')}</div><p class="mute">Edit subjects on the AI Study Planner page.</p></div><button class="btn mt" onclick="saveProfile()">Save changes</button></div>
  <div class="card mt"><h3>Settings</h3><div class="row mt"><button class="btn ghost" onclick="toggleTheme()">Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode</button>
   <label class="row" style="margin:0"><input type="checkbox" style="width:auto" ${Store.get('notif', true) ? 'checked' : ''} onchange="Store.set('notif',this.checked);toast('Preference saved')"> Notifications</label></div>
   <div class="row mt"><button class="btn ghost" onclick="resetDemo()">Reset Demo Data</button><button class="btn danger" onclick="clearData()">Clear all local data</button><button class="btn ghost" onclick="logout()">Logout</button></div>
   <p class="mute mt">Login here is a demo using localStorage. It is not secure authentication.</p></div>`;
}
function saveProfile() {
  const u = user(), users = Store.get('users', {}); u.name = $('#fn').value.trim() || u.name; users[u.email] = u; Store.set('users', users);
  Object.assign(D.profile, { college: $('#fc').value, course: $('#fr').value, semester: $('#fs').value, targetCGPA: +$('#fg').value, targetPct: +$('#fp').value, preferred: +$('#fo').value, hours: +$('#fh').value || 3 });
  save(); render(); toast('Profile saved');
}
function resetDemo() { if (confirm('Replace all your data with the demo data?')) { D = demoData(); D.sessions = generatePlan(D, D.profile.hours, D.profile.preferred); save(); planDraft = null; render(); toast('Demo data restored'); } }
function clearData() { if (confirm('This deletes ALL data including your account. Continue?')) { Store.clearAll(); location.hash = '#/'; location.reload(); } }
