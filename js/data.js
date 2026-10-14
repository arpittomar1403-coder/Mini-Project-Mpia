// Realistic demo data. Everything here is editable in the app.
function demoData() {
  const hrs = [1.5, 2, 0, 3, 2.5, 2, 1, 2.5, 3, 2, 1.5, 2.5, 3, 2.5]; // last 14 days
  return {
    profile: { college: 'ABC Institute of Technology', course: 'B.Tech CSE', semester: '4', targetCGPA: 8.5, targetPct: 80, preferred: 16, hours: 4 },
    subjects: [
      { name: 'Data Structures', difficulty: 4, prep: 35, target: 85, topics: ['Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Hashing'] },
      { name: 'Mathematics', difficulty: 3, prep: 55, target: 80, topics: ['Differential Equations', 'Laplace Transform', 'Matrices', 'Probability'] },
      { name: 'Operating Systems', difficulty: 4, prep: 45, target: 80, topics: ['Memory Management', 'Process Scheduling', 'Deadlocks', 'File Systems'] },
      { name: 'Computer Networks', difficulty: 3, prep: 60, target: 75, topics: ['OSI Model', 'TCP/IP', 'Routing', 'Subnetting'] },
      { name: 'Digital Electronics', difficulty: 2, prep: 70, target: 75, topics: ['Logic Gates', 'K-Maps', 'Flip-Flops', 'Counters'] }
    ],
    exams: [
      { id: uid(), name: 'Mid-Sem Data Structures', subject: 'Data Structures', date: addDays(6) },
      { id: uid(), name: 'Mid-Sem Mathematics', subject: 'Mathematics', date: addDays(12) },
      { id: uid(), name: 'Mid-Sem Operating Systems', subject: 'Operating Systems', date: addDays(16) }
    ],
    tasks: [
      { id: uid(), name: 'Linked List Assignment', subject: 'Data Structures', desc: 'Implement singly and doubly linked lists', deadline: addDays(2), priority: 'High', hours: 3, done: false },
      { id: uid(), name: 'ODE Problem Set', subject: 'Mathematics', desc: 'Chapters 3 and 4', deadline: addDays(5), priority: 'Medium', hours: 2, done: false },
      { id: uid(), name: 'OS Project Report', subject: 'Operating Systems', desc: 'Scheduler simulation', deadline: addDays(8), priority: 'Low', hours: 5, done: false },
      { id: uid(), name: 'Subnetting Worksheet', subject: 'Computer Networks', desc: '', deadline: addDays(1), priority: 'Medium', hours: 1.5, done: false },
      { id: uid(), name: 'K-Map Lab Record', subject: 'Digital Electronics', desc: '', deadline: addDays(-1), priority: 'Low', hours: 1, done: true }
    ],
    attendance: [
      { id: uid(), name: 'Data Structures', total: 38, attended: 26, required: 75 },
      { id: uid(), name: 'Mathematics', total: 34, attended: 29, required: 75 },
      { id: uid(), name: 'Operating Systems', total: 36, attended: 27, required: 75 },
      { id: uid(), name: 'Computer Networks', total: 30, attended: 25, required: 75 },
      { id: uid(), name: 'Digital Electronics', total: 28, attended: 26, required: 75 }
    ],
    events: [
      { id: uid(), title: 'DS Lab', date: addDays(1), type: 'Class' },
      { id: uid(), title: 'Group project meeting', date: addDays(3), type: 'Study' }
    ],
    sessions: [],
    hours: hrs.map((h, i) => ({ date: addDays(i - 13), hours: h })),
    marks: [62, 66, 64, 71, 74, 78] // academic progress (internal test %)
  };
}
