// Frontend "AI" — keyword rules over the student's data.
// To use a real LLM later, replace the body of askAI() with a fetch() to your API.
const attNeeded = (a, t, req) => req >= 100 ? Infinity : Math.max(0, Math.ceil((req * t - 100 * a) / (100 - req)));
const attCanSkip = (a, t, req) => Math.max(0, Math.floor((100 * a - req * t) / req));
const attPct = a => a.total ? (a.attended / a.total) * 100 : 0;

async function askAI(text, D) {
  await new Promise(r => setTimeout(r, 700)); // fake thinking time
  const q = text.toLowerCase();
  const ranked = scoreSubjects(D);
  const named = D.subjects.find(s => q.includes(s.name.toLowerCase()) || q.includes(s.name.toLowerCase().split(' ')[0]));

  if (/revis|days? plan|in \d+ days/.test(q)) {
    const s = named || ranked[0];
    const n = Math.min(Number((q.match(/(\d+)\s*days?/) || [])[1]) || 7, 14);
    const topics = s.topics?.length ? s.topics : ['Core concepts', 'Practice problems'];
    let out = `Here is a ${n}-day revision plan for ${s.name}:\n`;
    for (let i = 0; i < n; i++) {
      out += i === n - 1 ? `\nDay ${i + 1}: Full mock test + review mistakes`
        : i === n - 2 ? `\nDay ${i + 1}: Solve past papers (timed)`
        : `\nDay ${i + 1}: ${topics[i % topics.length]} — notes, then 10 practice questions`;
    }
    return out;
  }
  if (/attend|bunk|shortage/.test(q)) {
    if (!D.attendance.length) return 'You have no attendance data yet. Add your subjects on the Attendance page.';
    return 'Attendance analysis:\n' + D.attendance.map(a => {
      const p = attPct(a);
      return p >= a.required
        ? `• ${a.name}: ${p.toFixed(1)}% — safe. You can miss ${attCanSkip(a.attended, a.total, a.required)} more class(es).`
        : `• ${a.name}: ${p.toFixed(1)}% (needs ${a.required}%) — attend the next ${attNeeded(a.attended, a.total, a.required)} classes without a miss.`;
    }).join('\n');
  }
  if (/quiz|question|test me/.test(q)) {
    const s = named || ranked[0], t = s.topics?.[0] || 'core concepts';
    return `Quick quiz on ${s.name} (${t}):\n1. Define ${t} in your own words.\n2. Give one real-world use of ${t}.\n3. What is the time/space complexity or main limitation involved?\n4. Solve one practice problem on ${t} without notes.\nTell me your answers and revise anything you missed.`;
  }
  if (/deadline|assignment|task|due/.test(q)) {
    const p = D.tasks.filter(t => !t.done).sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (!p.length) return 'You have no pending tasks. Nice work!';
    return 'Your pending tasks, most urgent first:\n' + p.slice(0, 5).map(t => `• ${t.name} (${t.subject}) — ${dueText(t.deadline)}, ~${t.hours}h`).join('\n');
  }
  if (/\d+(\.\d+)?\s*(hours?|hrs?)|today|what should i study/.test(q)) {
    const h = Number((q.match(/(\d+(\.\d+)?)\s*(hours?|hrs?)/) || [])[1]) || D.profile.hours;
    const total = ranked.slice(0, 3).reduce((s, r) => s + r.score, 0);
    return `With ${h} hours today, I recommend:\n` + ranked.slice(0, 3).map(r => `• ${r.name} — ${(h * r.score / total).toFixed(1)}h (${r.reason})`).join('\n') + '\nFinish with 15 minutes of quiz-style revision.';
  }
  if (/plan|schedule|timetable/.test(q)) {
    const t = D.sessions.filter(s => s.date === today());
    return t.length ? "Today's study plan:\n" + t.map(s => `• ${fmtTime(s.start)} – ${fmtTime(s.end)}: ${s.subject} (${s.topic})`).join('\n') : 'No plan for today. Open the AI Study Planner and click Generate.';
  }
  return `I can help with: study plans, attendance, deadlines, quizzes, and revision plans. Try "I have 3 hours today" or "Help me revise ${ranked[0]?.name || 'a subject'} in 7 days".`;
}

function buildInsights(D) {
  const out = [];
  const top = scoreSubjects(D)[0];
  if (top) out.push(`Focus more on ${top.name} this week: ${top.reason}.`);
  D.attendance.filter(a => attPct(a) < a.required).forEach(a => out.push(`Your attendance in ${a.name} is below the required ${a.required}%.`));
  const soon = D.tasks.filter(t => !t.done && daysLeft(t.deadline) <= 3 && daysLeft(t.deadline) >= 0).length;
  if (soon) out.push(`You have ${soon} assignment${soon > 1 ? 's' : ''} due within 3 days.`);
  out.push(`You are on track for your target if you keep ${D.profile.hours} focused study hours per day.`);
  return out;
}
