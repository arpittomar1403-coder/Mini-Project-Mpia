// StudyMate AI - Clean Frontend-only JavaScript
// No demo academic data is preloaded. The student adds their own information.

const state = {
  tasks: [],
  subjects: [],
  profile: {name:"Student", college:"", course:"", semester:"", target:"", hours:""},
  dark:false
};

function $(id){ return document.getElementById(id); }

function showRegister(){ $("loginForm").classList.add("hidden"); $("registerForm").classList.remove("hidden"); }
function showLogin(){ $("registerForm").classList.add("hidden"); $("loginForm").classList.remove("hidden"); }

function togglePassword(id){
  const input=$(id);
  input.type=input.type==="password"?"text":"password";
}

function login(e){
  e.preventDefault();
  enterApp();
}

function register(e){
  e.preventDefault();
  const password=$("registerPassword").value;
  const confirm=$("confirmPassword").value;
  if(password!==confirm){ alert("Passwords do not match."); return; }
  state.profile.name=$("registerName").value || "Student";
  enterApp();
}

function enterApp(){
  $("authPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");
  renderPage("dashboard");
}

function logout(){
  $("appPage").classList.add("hidden");
  $("authPage").classList.remove("hidden");
  showLogin();
}

function daysUntil(date){
  if(!date) return 0;
  const now=new Date();
  return Math.max(0,Math.ceil((new Date(date+"T23:59:59")-now)/86400000));
}

function attendance(s){
  if(!s.total) return 0;
  return Math.round((s.attended/s.total)*100);
}

function overallAttendance(){
  if(!state.subjects.length) return 0;
  const total=state.subjects.reduce((a,s)=>a+s.total,0);
  const attended=state.subjects.reduce((a,s)=>a+s.attended,0);
  return total ? Math.round(attended/total*100) : 0;
}

function completedTasks(){ return state.tasks.filter(t=>t.done).length; }

function pageHeader(eyebrow,title,sub,button=""){
  return `<div class="page-head">
    <div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${sub}</p></div>${button}
  </div>`;
}

function stat(icon,label,value,meta){
  return `<div class="stat-card"><div class="stat-icon">${icon}</div><span>${label}</span><strong>${value}</strong><small>${meta}</small></div>`;
}

function emptyState(icon,title,text,buttonText="",action=""){
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p>${buttonText?`<button class="primary-btn" onclick="${action}">${buttonText}</button>`:""}</div>`;
}

function renderPage(page){
  document.querySelectorAll(".nav-item[data-page]").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.page===page);
  });

  const content=$("pageContent");
  if(page==="dashboard") content.innerHTML=dashboardPage();
  if(page==="planner") content.innerHTML=plannerPage();
  if(page==="tasks") content.innerHTML=tasksPage();
  if(page==="attendance") content.innerHTML=attendancePage();
  if(page==="calendar") content.innerHTML=calendarPage();
  if(page==="progress") content.innerHTML=progressPage();
  if(page==="profile") content.innerHTML=profilePage();
  attachPageEvents();
}

function dashboardPage(){
  const overall=overallAttendance();
  return `
  ${pageHeader("YOUR OVERVIEW",`Welcome, ${state.profile.name} 👋`,"Your academic workspace is ready. Add your information to get started.",
    `<button class="primary-btn" onclick="renderPage('planner')">✦ Create Study Plan</button>`)}
  <div class="stats-grid">
    ${stat("□","Today's Classes","0","Add your classes")}
    ${stat("◷","Study Hours Today","0h","No sessions added")}
    ${stat("▣","Overall Attendance",state.subjects.length?overall+"%":"—",state.subjects.length?"Calculated from your data":"Add subjects")}
    ${stat("✓","Tasks Completed",state.tasks.length?`${completedTasks()}/${state.tasks.length}`:"0","Add your first task")}
  </div>
  <div class="dashboard-grid">
    <section class="panel">
      <div class="panel-head"><div><h2>Today’s Plan</h2><p>Your study sessions will appear here.</p></div></div>
      ${emptyState("✦","No study plan yet","Tell StudyMate about your subjects, available hours and goals to create a personalized plan.","Create Study Plan","renderPage('planner')")}
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>AI Insights</h2><p>Personalized recommendations</p></div><span>✦</span></div>
      ${emptyState("🤖","No insights yet","Add academic information and your AI recommendations will appear here.")}
    </section>
  </div>
  <div class="two-grid">
    <section class="panel">
      <div class="panel-head"><div><h2>Upcoming Deadlines</h2><p>Your assignments and exams will appear here.</p></div><button class="text-btn" onclick="renderPage('tasks')">Manage tasks →</button></div>
      ${state.tasks.length ? state.tasks.filter(t=>!t.done).map(t=>`<div class="deadline-row"><div class="deadline-icon">📚</div><div class="grow"><b>${t.title}</b><span>${t.subject} · Due in ${daysUntil(t.deadline)} days</span></div><span class="pill ${t.priority.toLowerCase()}">${t.priority}</span></div>`).join("") : emptyState("📅","No deadlines","Add an assignment, exam or task to see it here.","Add Task","openTaskModal()")}
    </section>
    <section class="panel chart-panel">
      <div class="panel-head"><div><h2>Study Hours</h2><p>Your weekly study activity will appear here.</p></div></div>
      ${emptyState("📊","No study data","Complete study sessions to build your progress chart.")}
    </section>
  </div>`;
}

function plannerPage(){
  const hasSubjects=state.subjects.length>0;
  return `
  ${pageHeader("SMART PLANNING","AI Study Planner","Enter your own academic information to create a personalized plan.",`<button class="primary-btn" onclick="generatePlan()">✦ Generate Plan</button>`)}
  <div class="planner-grid">
    <section class="panel">
      <div class="ai-banner"><span>✦</span><div><b>AI planning engine</b><p>Uses your exams, difficulty, preparation and available time.</p></div></div>
      <h2>Your preferences</h2>
      <div class="mini-grid">
        <label>Available hours/day<input id="plannerHours" value="${state.profile.hours}" placeholder="e.g. 3"></label>
        <label>Preferred study time<select id="plannerTime"><option>Morning</option><option>Afternoon</option><option selected>Evening</option></select></label>
        <label>Target CGPA<input id="plannerTarget" value="${state.profile.target}" placeholder="e.g. 8.5"></label>
        <label>Preparation days<input id="plannerDays" value="" placeholder="e.g. 30"></label>
      </div>
      <div class="focus-list"><b>Your subjects</b>
        ${hasSubjects?state.subjects.map((s,i)=>`<div><span>${i+1}</span>${s.name}<em>${s.difficulty||"Not set"}</em></div>`).join(""):emptyState("📚","No subjects added","Add your subjects from the Attendance page or Profile before generating a plan.")}
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>Your AI Study Plan</h2><p>Personalized sessions will appear here.</p></div></div>
      ${emptyState("✦","No plan generated","Your plan will be created from the information you enter.")}
    </section>
  </div>`;
}

function generatePlan(){
  if(!state.subjects.length){
    alert("Please add at least one subject first.");
    renderPage("attendance");
    return;
  }
  alert("Your plan inputs are ready. Connect an AI API/backend later to generate real AI recommendations.");
}

function tasksPage(){
  return `
  ${pageHeader("TASKS & DEADLINES","Stay ahead of every deadline","Add your own assignments, exams and study tasks.",`<button class="primary-btn" onclick="openTaskModal()">＋ Add Task</button>`)}
  <section class="panel task-list">
    ${state.tasks.length?state.tasks.map(t=>`<div class="task-row ${t.done?"done":""}">
      <button class="task-check" onclick="toggleTask(${t.id})">${t.done?"✓":"<span></span>"}</button>
      <div class="grow"><b>${t.title}</b><span>${t.subject}</span></div>
      <span class="due">${t.deadline?`Due in ${daysUntil(t.deadline)} days`:"No deadline"}</span>
      <span class="pill ${t.priority.toLowerCase()}">${t.priority}</span>
    </div>`).join(""):emptyState("✓","No tasks yet","Your task list is empty. Add an assignment or exam deadline to get started.","Add Task","openTaskModal()")}
  </section>`;
}

function toggleTask(id){
  state.tasks=state.tasks.map(t=>t.id===id?{...t,done:!t.done}:t);
  renderPage("tasks");
}

function attendancePage(){
  return `
  ${pageHeader("ATTENDANCE TRACKER","Know where you stand","Add your subjects and attendance details to calculate your percentage.",`<button class="primary-btn" onclick="openAttendanceModal()">＋ Add Subject</button>`)}
  <div class="attendance-grid">
    ${state.subjects.length?state.subjects.map(s=>{
      const a=attendance(s),safe=a>=s.required;
      let needed=0;
      if(a<s.required){
        while((s.attended+needed)/(s.total+needed)*100<s.required) needed++;
      }
      return `<div class="attendance-card"><div class="card-title"><div><b>${s.name}</b><span>${s.attended}/${s.total} classes attended</span></div><span class="status ${safe?"safe":"shortage"}">${safe?"Safe":"Shortage"}</span></div>
      <div class="attendance-number">${a}% <small>/ ${s.required}% required</small></div>
      <div class="progress"><span style="width:${a}%"></span></div>
      <div class="attendance-foot"><span>${safe?"You’re on track":"Attend the next "+needed+" class(es) without missing to reach the requirement."}</span></div></div>`;
    }).join(""):emptyState("▣","No attendance records","Add your subjects, total classes and attended classes to calculate attendance.","Add Subject","openAttendanceModal()")}
  </div>
  <section class="panel">
    <div class="panel-head"><div><h2>Attendance Trend</h2><p>Your attendance trend will appear after adding records.</p></div></div>
    ${emptyState("📈","No trend data","Add or update attendance records to see your trend.")}
  </section>`;
}

function calendarPage(){
  const days=Array.from({length:31},(_,i)=>i+1);
  return `
  ${pageHeader("ACADEMIC CALENDAR","Your month at a glance","Your exams, assignments and study sessions will appear here.",`<button class="primary-btn" onclick="alert('Calendar event form can be connected to your backend later.')">＋ Add Event</button>`)}
  <section class="panel calendar">
    <div class="calendar-head"><button>‹</button><h2>August 2026</h2><button>›</button></div>
    <div class="week">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<b>${d}</b>`).join("")}</div>
    <div class="days">${Array(6).fill("").map(()=>"<div></div>").join("")}${days.map(d=>`<div class="day"><b>${d}</b></div>`).join("")}</div>
  </section>`;
}

function progressPage(){
  return `
  ${pageHeader("PROGRESS","See your momentum","Your progress will build as you complete real study sessions and tasks.")}
  <div class="stats-grid">
    ${stat("🔥","Study Streak","0 days","Start your first session")}
    ${stat("◷","Weekly Study","0h","No sessions recorded")}
    ${stat("✓","Tasks Completed",completedTasks(),"Complete your first task")}
    ${stat("🎯","Productivity","—","Not enough data yet")}
  </div>
  <section class="panel chart-panel"><h2>Weekly Study Hours</h2><p class="muted">No study data yet</p>
    ${emptyState("📊","Your chart is empty","Study hours will appear here after you record your sessions.")}
  </section>`;
}

function profilePage(){
  return `
  ${pageHeader("PROFILE","Your academic profile","Enter your own information for personalized planning.")}
  <section class="panel">
    <div class="profile-cover"><div class="big-avatar">${state.profile.name.charAt(0).toUpperCase()}</div><div><h2>${state.profile.name}</h2><p>${state.profile.course||"Course not added"} · ${state.profile.semester||"Semester not added"}</p></div></div>
    <form class="form-grid" onsubmit="saveProfile(event)">
      <label>Full name<input id="profileName" value="${state.profile.name}"></label>
      <label>College / School<input id="profileCollege" value="${state.profile.college}" placeholder="Enter college"></label>
      <label>Course<input id="profileCourse" value="${state.profile.course}" placeholder="Enter course"></label>
      <label>Semester<input id="profileSemester" value="${state.profile.semester}" placeholder="Enter semester"></label>
      <label>Target CGPA<input id="profileTarget" value="${state.profile.target}" placeholder="e.g. 8.5"></label>
      <label>Daily study hours<input id="profileHours" value="${state.profile.hours}" placeholder="e.g. 3"></label>
      <button class="primary-btn full">Save Changes</button>
    </form>
  </section>`;
}

function saveProfile(e){
  e.preventDefault();
  state.profile={
    name:$("profileName").value||"Student",college:$("profileCollege").value,
    course:$("profileCourse").value,semester:$("profileSemester").value,
    target:$("profileTarget").value,hours:$("profileHours").value
  };
  alert("Profile updated successfully.");
  renderPage("profile");
}

function openTaskModal(){
  $("modalTitle").textContent="Add Assignment / Task";
  $("modalBody").innerHTML=`<form class="form-grid" onsubmit="addTask(event)">
    <label>Task name<input id="newTitle" required placeholder="e.g. DBMS assignment"></label>
    <label>Subject<input id="newSubject" required placeholder="Subject"></label>
    <label>Deadline<input id="newDeadline" type="date"></label>
    <label>Priority<select id="newPriority"><option>High</option><option selected>Medium</option><option>Low</option></select></label>
    <button class="primary-btn full">Add Task</button>
  </form>`;
  $("modal").classList.remove("hidden");
}

function addTask(e){
  e.preventDefault();
  state.tasks.push({
    id:Date.now(),title:$("newTitle").value,subject:$("newSubject").value,
    deadline:$("newDeadline").value,priority:$("newPriority").value,done:false
  });
  closeModal();renderPage("tasks");
}

function openAttendanceModal(){
  $("modalTitle").textContent="Add Attendance Record";
  $("modalBody").innerHTML=`<form class="form-grid" onsubmit="addSubject(event)">
    <label>Subject<input id="subjectName" required placeholder="e.g. Data Structures"></label>
    <label>Total classes<input id="totalClasses" type="number" min="1" required></label>
    <label>Classes attended<input id="attendedClasses" type="number" min="0" required></label>
    <label>Required %<input id="requiredPercent" type="number" value="75" min="1" max="100" required></label>
    <button class="primary-btn full">Add Subject</button>
  </form>`;
  $("modal").classList.remove("hidden");
}

function addSubject(e){
  e.preventDefault();
  const total=Number($("totalClasses").value),attended=Number($("attendedClasses").value);
  if(attended>total){alert("Attended classes cannot be greater than total classes.");return;}
  state.subjects.push({
    name:$("subjectName").value,total,attended,
    required:Number($("requiredPercent").value)
  });
  closeModal();renderPage("attendance");
}

function closeModal(){ $("modal").classList.add("hidden"); }

function attachPageEvents(){
  document.querySelectorAll(".nav-item[data-page]").forEach(btn=>{
    btn.onclick=()=>{
      renderPage(btn.dataset.page);
      $("sidebar").classList.remove("open");
    };
  });
}

$("themeButton").onclick=()=>{
  state.dark=!state.dark;
  document.body.classList.toggle("dark",state.dark);
  $("themeButton").innerHTML=state.dark?"☀ Light Mode":"☾ Dark Mode";
};

$("logoutButton").onclick=logout;
$("menuButton").onclick=()=>$("sidebar").classList.toggle("open");

document.addEventListener("keydown",e=>{
  if(e.key==="Escape")closeModal();
});
