// Smart prioritisation + plan generation (pure functions, no UI)
function scoreSubjects(D) {
  const pending = D.tasks.filter(t => !t.done);
  return D.subjects.map(s => {
    const exams = D.exams.filter(e => e.subject === s.name && daysLeft(e.date) >= 0).map(e => daysLeft(e.date));
    const ed = exams.length ? Math.min(...exams) : 999;
    const tdl = pending.filter(t => t.subject === s.name).map(t => daysLeft(t.deadline));
    const td = tdl.length ? Math.min(...tdl) : 999;
    const examUrgency = ed <= 3 ? 40 : ed <= 7 ? 30 : ed <= 14 ? 20 : ed <= 30 ? 10 : 0;
    const difficulty = s.difficulty * 4;                 // max 20
    const lowPrep = (100 - s.prep) * 0.2;                // max 20
    const deadlineUrgency = td <= 2 ? 15 : td <= 7 ? 8 : 0;
    const targetImportance = s.target / 10;              // max 10
    const score = examUrgency + difficulty + lowPrep + deadlineUrgency + targetImportance;
    const reasons = [];
    if (examUrgency >= 20) reasons.push(`exam in ${ed} days`);
    if (s.prep < 50) reasons.push(`low preparation (${s.prep}%)`);
    if (deadlineUrgency >= 8) reasons.push('assignment deadline near');
    if (s.difficulty >= 4) reasons.push('difficult subject');
    return { ...s, score, reason: reasons.length ? reasons.join(' + ') : 'Steady revision' };
  }).sort((a, b) => b.score - a.score);
}

// Is there more work than study time? Returns {needed, available, tooMuch}
function workloadCheck(D, hoursPerDay, days = 7) {
  const needed = D.subjects.reduce((sum, s) => sum + ((100 - s.prep) / 100) * (s.difficulty + 1) * 1.5, 0)
    + D.tasks.filter(t => !t.done).reduce((sum, t) => sum + Number(t.hours || 0), 0);
  const available = hoursPerDay * days;
  return { needed: +needed.toFixed(1), available, tooMuch: needed > available };
}

function generatePlan(D, hoursPerDay, startHour, days = 7) {
  const ranked = scoreSubjects(D);
  if (!ranked.length) return [];
  const total = ranked.reduce((s, r) => s + r.score, 0);
  const sessions = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(d);
    const dayName = new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'long' });
    let free = Math.round(hoursPerDay * 60) - 15; // reserve 15 min for quiz
    let cursor = startHour * 60;
    for (const r of ranked) {
      if (free < 30) break;
      let mins = Math.round((r.score / total) * hoursPerDay * 60 / 15) * 15;
      mins = Math.min(Math.max(mins, 30), free, 120);
      const topic = (r.topics && r.topics.length ? r.topics : ['Core concepts', 'Practice problems', 'Revision'])[(d + ranked.indexOf(r)) % (r.topics?.length || 3)];
      sessions.push({ id: uid(), date, dayName, start: cursor, end: cursor + mins, subject: r.name, topic, mins,
        priority: r.score >= 60 ? 'High' : r.score >= 45 ? 'Medium' : 'Low', reason: r.reason, done: false });
      cursor += mins + 15; free -= mins + 15;
    }
    sessions.push({ id: uid(), date, dayName, start: cursor, end: cursor + 15, subject: 'Quick Revision + Quiz', topic: 'Review the day', mins: 15, priority: 'Low', reason: 'Active recall', done: false });
  }
  return sessions;
}
const fmtTime = m => { const h = Math.floor(m / 60), mm = m % 60; return `${pad(((h + 11) % 12) + 1)}:${pad(mm)} ${h >= 12 ? 'PM' : 'AM'}`; };
