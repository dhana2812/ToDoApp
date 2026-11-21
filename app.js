/**
 * TaskHorizon - Modern Time-Horizon To-Do & Activity Tracker
 * Full client-side application with dynamic date calculations,
 * Chart.js visual dashboard, localStorage sync, and responsive UI.
 */

// ==========================================================================
// 1. State Management & Constants
// ==========================================================================
const STORAGE_KEY = 'taskhorizon_activities_v2';
const THEME_KEY = 'taskhorizon_theme';

const state = {
  tasks: [],
  currentView: 'dashboard', // 'dashboard' | 'all-tasks'
  filters: {
    scope: 'all',          // 'all' | 'today' | 'week' | 'month' | 'overdue'
    status: 'all',         // 'all' | 'pending' | 'completed' | 'overdue'
    priority: 'all',       // 'all' | 'high' | 'medium' | 'low'
    category: 'all',       // 'all' | category name
    search: ''
  },
  sortBy: 'dueDateAsc',
  viewMode: 'grid',        // 'grid' | 'table'
  charts: {
    status: null,
    horizon: null,
    category: null
  }
};

// ==========================================================================
// 2. Date Utility Helpers
// ==========================================================================
function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return formatDateToYYYYMMDD(d);
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as start of week: day 0 is Sunday, so if Sunday (0) go back 6 days, else day - 1
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getEndOfWeek(date = new Date()) {
  const start = getStartOfWeek(date);
  const sunday = new Date(start);
  sunday.setDate(start.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getEndOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Check if a task is overdue
function isTaskOverdue(task) {
  if (task.status === 'completed') return false;
  if (!task.dueDate) return false;
  const taskDate = parseDate(task.dueDate);
  const startOfToday = getStartOfToday();
  return taskDate < startOfToday;
}

// Check if task is scheduled for Today
function isTaskToday(task) {
  if (!task.dueDate) return false;
  return task.dueDate === formatDateToYYYYMMDD(new Date());
}

// Check if task is scheduled for This Week (Mon - Sun)
function isTaskThisWeek(task) {
  if (!task.dueDate) return false;
  const taskDate = parseDate(task.dueDate);
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  return taskDate >= weekStart && taskDate <= weekEnd;
}

// Check if task is scheduled for This Month
function isTaskThisMonth(task) {
  if (!task.dueDate) return false;
  const taskDate = parseDate(task.dueDate);
  const now = new Date();
  return taskDate.getFullYear() === now.getFullYear() && taskDate.getMonth() === now.getMonth();
}

// Format relative date display
function formatFriendlyDueDate(dateStr, timeStr = '') {
  if (!dateStr) return 'No due date';
  const taskDate = parseDate(dateStr);
  const today = getStartOfToday();
  const diffDays = Math.round((taskDate - today) / (1000 * 60 * 60 * 24));

  const timeDisplay = timeStr ? ` at ${formatTime(timeStr)}` : '';

  if (diffDays === 0) return `Today${timeDisplay}`;
  if (diffDays === 1) return `Tomorrow${timeDisplay}`;
  if (diffDays === -1) return `Yesterday${timeDisplay}`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays < 7) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[taskDate.getDay()]}${timeDisplay}`;
  }

  const options = { month: 'short', day: 'numeric' };
  if (taskDate.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }
  return `${taskDate.toLocaleDateString(undefined, options)}${timeDisplay}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  const displayMinutes = String(m).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// ==========================================================================
// 3. Default Sample Data (Dynamic relative to current date)
// ==========================================================================
function generateInitialSampleTasks() {
  const now = new Date();
  const todayStr = formatDateToYYYYMMDD(now);
  
  // Day offsets for this week
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatDateToYYYYMMDD(tomorrow);

  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);
  const in3DaysStr = formatDateToYYYYMMDD(in3Days);

  const in10Days = new Date(now);
  in10Days.setDate(now.getDate() + 10);
  const in10DaysStr = formatDateToYYYYMMDD(in10Days);

  const in18Days = new Date(now);
  in18Days.setDate(now.getDate() + 18);
  const in18DaysStr = formatDateToYYYYMMDD(in18Days);

  const overdueDate = new Date(now);
  overdueDate.setDate(now.getDate() - 2);
  const overdueStr = formatDateToYYYYMMDD(overdueDate);

  return [
    {
      id: 'task-1',
      title: 'Finalize Q4 project roadmap & share with team',
      description: 'Prepare executive slides, confirm milestones and assign sprint leads.',
      dueDate: todayStr,
      dueTime: '15:00',
      priority: 'high',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Review weekly budget & approve software subscriptions',
      description: 'Inspect cloud billing dashboard and confirm developer tool licenses.',
      dueDate: todayStr,
      dueTime: '17:30',
      priority: 'medium',
      category: 'Finance',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: 'Prepare design assets for client presentation',
      description: 'Export SVG mockups, update typography tokens and verify prototype links.',
      dueDate: tomorrowStr,
      dueTime: '14:00',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      title: '30-minute cardio and strength workout session',
      description: 'Complete high-intensity intervals and full body stretching routine.',
      dueDate: in3DaysStr,
      dueTime: '08:00',
      priority: 'low',
      category: 'Health',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-5',
      title: 'Complete chapter 4 of System Architecture handbook',
      description: 'Take notes on distributed consensus, event sourcing, and cache strategies.',
      dueDate: in10DaysStr,
      dueTime: '20:00',
      priority: 'medium',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-6',
      title: 'Review monthly personal savings & investment portfolio',
      description: 'Rebalance index funds and review retirement deposit allocations.',
      dueDate: in18DaysStr,
      dueTime: '11:00',
      priority: 'low',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-7',
      title: 'Submit quarterly tax compliance documents',
      description: 'Collect receipts, verify contractor invoices, and upload to accountant portal.',
      dueDate: overdueStr,
      dueTime: '18:00',
      priority: 'high',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  ];
}

// ==========================================================================
// 4. Storage & Persistence
// ==========================================================================
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.tasks = parsed;
        return;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored activities:', err);
  }
  // Fallback to sample tasks
  state.tasks = generateInitialSampleTasks();
  saveTasks();
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  } catch (err) {
    console.error('Failed to save activities to localStorage:', err);
    showToast('Failed to save to local storage', 'warning');
  }
}

// ==========================================================================
// 5. Activity Filtering & Sorting Logic
// ==========================================================================
function getFilteredAndSortedTasks() {
  let list = [...state.tasks];

  // 1. Horizon Scope Filter
  if (state.filters.scope === 'today') {
    list = list.filter(isTaskToday);
  } else if (state.filters.scope === 'week') {
    list = list.filter(isTaskThisWeek);
  } else if (state.filters.scope === 'month') {
    list = list.filter(isTaskThisMonth);
  } else if (state.filters.scope === 'overdue') {
    list = list.filter(isTaskOverdue);
  }

  // 2. Status Filter
  if (state.filters.status === 'completed') {
    list = list.filter(t => t.status === 'completed');
  } else if (state.filters.status === 'pending') {
    list = list.filter(t => t.status !== 'completed' && !isTaskOverdue(t));
  } else if (state.filters.status === 'overdue') {
    list = list.filter(isTaskOverdue);
  }

  // 3. Priority Filter
  if (state.filters.priority !== 'all') {
    list = list.filter(t => t.priority === state.filters.priority);
  }

  // 4. Category Filter
  if (state.filters.category !== 'all') {
    list = list.filter(t => t.category === state.filters.category);
  }

  // 5. Search Query Filter
  if (state.filters.search) {
    const q = state.filters.search.toLowerCase().trim();
    list = list.filter(t =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // 6. Sorting
  list.sort((a, b) => {
    switch (state.sortBy) {
      case 'dueDateAsc': {
        const dateA = a.dueDate ? `${a.dueDate} ${a.dueTime || '23:59'}` : '9999-99-99';
        const dateB = b.dueDate ? `${b.dueDate} ${b.dueTime || '23:59'}` : '9999-99-99';
        return dateA.localeCompare(dateB);
      }
      case 'dueDateDesc': {
        const dateA = a.dueDate ? `${a.dueDate} ${a.dueTime || '00:00'}` : '0000-00-00';
        const dateB = b.dueDate ? `${b.dueDate} ${b.dueTime || '00:00'}` : '0000-00-00';
        return dateB.localeCompare(dateA);
      }
      case 'priorityHigh': {
        const weight = { high: 3, medium: 2, low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      case 'statusPending': {
        if (a.status === b.status) return 0;
        return a.status === 'pending' ? -1 : 1;
      }
      case 'titleAsc':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return list;
}

// ==========================================================================
// 6. Statistics Calculations
// ==========================================================================
function calculateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = state.tasks.filter(isTaskOverdue);
  const overdue = overdueTasks.length;
  const stillNotDone = state.tasks.filter(t => t.status !== 'completed' && !isTaskOverdue(t)).length;

  const todayTasks = state.tasks.filter(isTaskToday);
  const todayDone = todayTasks.filter(t => t.status === 'completed').length;
  const todayPending = todayTasks.length - todayDone;

  const weekTasks = state.tasks.filter(isTaskThisWeek);
  const weekDone = weekTasks.filter(t => t.status === 'completed').length;
  const weekPending = weekTasks.length - weekDone;

  const monthTasks = state.tasks.filter(isTaskThisMonth);
  const monthDone = monthTasks.filter(t => t.status === 'completed').length;
  const monthPending = monthTasks.length - monthDone;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    overdue,
    stillNotDone,
    percent,
    today: { total: todayTasks.length, done: todayDone, pending: todayPending },
    week: { total: weekTasks.length, done: weekDone, pending: weekPending },
    month: { total: monthTasks.length, done: monthDone, pending: monthPending }
  };
}

// ==========================================================================
// 7. UI Rendering: Dashboard & Metrics
// ==========================================================================
function updateDashboardUI() {
  const stats = calculateStats();

  // 1. Sidebar Badge Counts
  const countAll = document.getElementById('countAll');
  const countToday = document.getElementById('countToday');
  const countWeek = document.getElementById('countWeek');
  const countMonth = document.getElementById('countMonth');
  const countOverdue = document.getElementById('countOverdue');

  if (countAll) countAll.textContent = stats.total;
  if (countToday) countToday.textContent = stats.today.total;
  if (countWeek) countWeek.textContent = stats.week.total;
  if (countMonth) countMonth.textContent = stats.month.total;
  if (countOverdue) countOverdue.textContent = stats.overdue;

  // 2. Hero Card & Radial Meter
  const heroProgressText = document.getElementById('heroProgressText');
  const heroProgressCircle = document.getElementById('heroProgressCircle');
  const heroSummaryText = document.getElementById('heroSummaryText');

  if (heroProgressText) heroProgressText.textContent = `${stats.percent}%`;
  if (heroProgressCircle) {
    const circumference = 2 * Math.PI * 42; // r=42 -> ~263.89
    const offset = circumference - (stats.percent / 100) * circumference;
    heroProgressCircle.style.strokeDashoffset = offset;
  }

  // Dynamic Time-of-Day Greeting
  const heroGreetingText = document.getElementById('heroGreetingText');
  if (heroGreetingText) {
    const currentHour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (currentHour < 12) timeGreeting = 'Good morning';
    else if (currentHour < 17) timeGreeting = 'Good afternoon';
    heroGreetingText.textContent = `${timeGreeting}! Here's your activity outlook.`;
  }

  if (heroSummaryText) {
    if (stats.overdue > 0) {
      heroSummaryText.innerHTML = `⚠️ You have <strong style="color:var(--status-overdue);">${stats.overdue} overdue activities</strong> requiring prompt action, and <strong>${stats.today.pending} tasks</strong> remaining today.`;
    } else if (stats.today.pending > 0) {
      heroSummaryText.innerHTML = `🎯 <strong>${stats.today.pending} tasks</strong> scheduled for today. You are making steady progress!`;
    } else if (stats.total > 0 && stats.completed === stats.total) {
      heroSummaryText.innerHTML = `🎉 Outstanding! All activities have been successfully marked completed.`;
    } else {
      heroSummaryText.innerHTML = `✨ Today is organized. You have ${stats.week.total} tasks lined up for this week.`;
    }
  }

  // Hero Horizon Pills
  const heroTodayPill = document.getElementById('heroTodayPill');
  const heroWeekPill = document.getElementById('heroWeekPill');
  const heroMonthPill = document.getElementById('heroMonthPill');
  const heroOverduePill = document.getElementById('heroOverduePill');

  if (heroTodayPill) heroTodayPill.innerHTML = `<i class="fa-solid fa-sun"></i> Today: <strong>${stats.today.total}</strong>`;
  if (heroWeekPill) heroWeekPill.innerHTML = `<i class="fa-solid fa-calendar-week"></i> This Week: <strong>${stats.week.total}</strong>`;
  if (heroMonthPill) heroMonthPill.innerHTML = `<i class="fa-solid fa-calendar-days"></i> This Month: <strong>${stats.month.total}</strong>`;
  if (heroOverduePill) heroOverduePill.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Overdue: <strong>${stats.overdue}</strong>`;

  // 3. Metric Cards
  // Today Card
  setElementText('statTodayTotal', stats.today.total);
  setElementText('statTodayPending', `${stats.today.pending} still not done`);
  setElementText('statTodayDone', `${stats.today.done} done`);
  const todayFill = stats.today.total > 0 ? (stats.today.done / stats.today.total) * 100 : 0;
  setElementWidth('barTodayProgress', `${todayFill}%`);

  // Week Card
  setElementText('statWeekTotal', stats.week.total);
  setElementText('statWeekPending', `${stats.week.pending} still not done`);
  setElementText('statWeekDone', `${stats.week.done} done`);
  const weekFill = stats.week.total > 0 ? (stats.week.done / stats.week.total) * 100 : 0;
  setElementWidth('barWeekProgress', `${weekFill}%`);

  // Month Card
  setElementText('statMonthTotal', stats.month.total);
  setElementText('statMonthPending', `${stats.month.pending} still not done`);
  setElementText('statMonthDone', `${stats.month.done} done`);
  const monthFill = stats.month.total > 0 ? (stats.month.done / stats.month.total) * 100 : 0;
  setElementWidth('barMonthProgress', `${monthFill}%`);

  // Overdue Card
  setElementText('statOverdueTotal', stats.overdue);
  setElementText('statOverdueAdvice', stats.overdue > 0 ? 'Action required immediately' : 'Zero overdue items 👍');

  // 4. Render Today's Quick Focus Widget
  renderDashboardFocusList();

  // 5. Update Charts
  renderCharts(stats);

  // 6. Update Categories in Sidebar
  renderCategoryFilterList();
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setElementWidth(id, widthStr) {
  const el = document.getElementById(id);
  if (el) el.style.width = widthStr;
}

// Quick action widget on Dashboard for Today's items
function renderDashboardFocusList() {
  const container = document.getElementById('dashboardFocusList');
  if (!container) return;

  const todayTasks = state.tasks.filter(isTaskToday);

  if (todayTasks.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-muted); background: var(--bg-surface-elevated); border-radius: var(--radius-sm);">
        <i class="fa-solid fa-mug-hot" style="font-size: 1.5rem; margin-bottom: 6px; display: inline-block;"></i>
        <p>No tasks scheduled specifically for today. Enjoy your day or add a new activity!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todayTasks.map(task => {
    const isCompleted = task.status === 'completed';
    return `
      <div class="task-card ${isCompleted ? 'is-completed' : ''}" style="padding: 12px 16px; margin: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} title="Toggle completed">
            <div style="min-width: 0;">
              <span class="task-title" style="font-size: 0.92rem; ${isCompleted ? 'text-decoration: line-through; color: var(--text-subtle);' : ''}">${escapeHtml(task.title)}</span>
              <div style="display: flex; gap: 6px; align-items: center; margin-top: 3px;">
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${capitalize(task.priority)}</span>
                <span class="badge badge-scope">${escapeHtml(task.category || 'General')}</span>
                ${task.dueTime ? `<span style="font-size: 0.74rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${formatTime(task.dueTime)}</span>` : ''}
              </div>
            </div>
          </div>
          <button class="action-icon-btn btn-edit" data-edit-id="${task.id}" title="Edit activity">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 8. Visual Charts (Chart.js Integration)
// ==========================================================================
function renderCharts(stats) {
  if (typeof Chart === 'undefined') return;

  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // Chart 1: Status Distribution Doughnut
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    if (state.charts.status) {
      state.charts.status.destroy();
    }

    state.charts.status = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Still Not Done', 'Overdue'],
        datasets: [{
          data: [stats.completed, stats.stillNotDone, stats.overdue],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const total = stats.total || 1;
                const pct = Math.round((val / total) * 100);
                return ` ${context.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
        cutout: '72%'
      }
    });

    // Custom legend below chart
    const legendEl = document.getElementById('statusChartLegend');
    if (legendEl) {
      legendEl.innerHTML = `
        <span class="legend-item"><span class="legend-dot" style="background:#10b981;"></span> Done (${stats.completed})</span>
        <span class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span> Pending (${stats.stillNotDone})</span>
        <span class="legend-item"><span class="legend-dot" style="background:#ef4444;"></span> Overdue (${stats.overdue})</span>
      `;
    }
  }

  // Chart 2: Time Horizon Breakdown (Bar Chart)
  const horizonCtx = document.getElementById('horizonChart');
  if (horizonCtx) {
    if (state.charts.horizon) {
      state.charts.horizon.destroy();
    }

    state.charts.horizon = new Chart(horizonCtx, {
      type: 'bar',
      data: {
        labels: ['Today', 'This Week', 'This Month'],
        datasets: [
          {
            label: 'Still Not Done',
            data: [stats.today.pending, stats.week.pending, stats.month.pending],
            backgroundColor: ['#f59e0b', '#818cf8', '#14b8a6'],
            borderRadius: 6
          },
          {
            label: 'Completed',
            data: [stats.today.done, stats.week.done, stats.month.done],
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: textColor
            },
            grid: { color: gridColor }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              color: textColor,
              font: { size: 11, family: 'Plus Jakarta Sans' }
            }
          }
        }
      }
    });
  }

  // Chart 3: Category Distribution (Polar Area / Doughnut)
  const catCtx = document.getElementById('categoryChart');
  if (catCtx) {
    if (state.charts.category) {
      state.charts.category.destroy();
    }

    // Aggregate category counts
    const catMap = {};
    state.tasks.forEach(t => {
      const cat = t.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);
    const catColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

    state.charts.category = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['None'],
        datasets: [{
          data: dataValues.length ? dataValues : [1],
          backgroundColor: catColors.slice(0, labels.length || 1),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              color: textColor,
              font: { size: 10, family: 'Plus Jakarta Sans' }
            }
          }
        },
        cutout: '60%'
      }
    });
  }
}

// Render Category Filter list in Sidebar
function renderCategoryFilterList() {
  const container = document.getElementById('categoryFilterList');
  if (!container) return;

  const catMap = {};
  state.tasks.forEach(t => {
    const cat = t.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });

  const categories = Object.keys(catMap).sort();

  if (categories.length === 0) {
    container.innerHTML = '<span style="font-size:0.75rem; color:var(--text-subtle); padding:4px 10px;">No categories yet</span>';
    return;
  }

  container.innerHTML = categories.map(cat => {
    const isActive = state.filters.category === cat;
    return `
      <button class="cat-filter-btn ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">
        <span class="cat-label"><i class="fa-solid fa-tag text-indigo"></i> ${escapeHtml(cat)}</span>
        <span class="badge-count">${catMap[cat]}</span>
      </button>
    `;
  }).join('');
}

// ==========================================================================
// 9. UI Rendering: Tasks List & Grid
// ==========================================================================
function renderTasksList() {
  const container = document.getElementById('tasksContainer');
  const emptyState = document.getElementById('emptyState');
  if (!container) return;

  const tasks = getFilteredAndSortedTasks();

  // Active filter pills indicator
  renderActiveFilterTags();

  if (tasks.length === 0) {
    container.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'flex';
      const emptyTitle = document.getElementById('emptyStateTitle');
      const emptyDesc = document.getElementById('emptyStateDesc');
      if (state.filters.scope === 'overdue') {
        emptyTitle.textContent = 'Great news! No overdue tasks.';
        emptyDesc.textContent = 'All your past-due activities are clear or completed.';
      } else if (state.filters.search) {
        emptyTitle.textContent = `No matches for "${state.filters.search}"`;
        emptyDesc.textContent = 'Try searching with another keyword or clear the search filter.';
      } else {
        emptyTitle.textContent = 'No activities found';
        emptyDesc.textContent = 'No tasks match your selected horizon or filter options.';
      }
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (state.viewMode === 'table') {
    renderTableView(container, tasks);
  } else {
    renderGridView(container, tasks);
  }
}

function renderGridView(container, tasks) {
  container.className = 'tasks-container grid-view';
  container.innerHTML = tasks.map(task => {
    const isCompleted = task.status === 'completed';
    const isOverdue = isTaskOverdue(task);
    const isToday = isTaskToday(task);
    const isWeek = isTaskThisWeek(task);
    const isMonth = isTaskThisMonth(task);

    // Determine horizon badge label
    let horizonLabel = 'Horizon';
    let horizonClass = '';
    if (isToday) {
      horizonLabel = 'Today';
      horizonClass = 'scope-today';
    } else if (isWeek) {
      horizonLabel = 'This Week';
      horizonClass = 'scope-week';
    } else if (isMonth) {
      horizonLabel = 'This Month';
      horizonClass = 'scope-month';
    }

    // Determine status badge
    let statusClass = 'status-badge-pending';
    let statusLabel = '⏳ Still Not Done';
    if (isCompleted) {
      statusClass = 'status-badge-completed';
      statusLabel = '✅ Completed';
    } else if (isOverdue) {
      statusClass = 'status-badge-overdue';
      statusLabel = '⚠️ Overdue';
    }

    return `
      <div class="task-card ${isOverdue ? 'is-overdue' : ''} ${isCompleted ? 'is-completed' : ''} ${isToday ? 'is-today' : ''}" data-task-id="${task.id}">
        <div class="task-card-header">
          <div class="task-checkbox-wrap">
            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} title="Mark as ${isCompleted ? 'Still Not Done' : 'Completed'}">
          </div>
          <div class="task-title-group">
            <h4 class="task-title">${escapeHtml(task.title)}</h4>
            <div class="task-card-meta">
              <span class="badge badge-scope ${horizonClass}">${horizonLabel}</span>
              <span class="badge ${getPriorityBadgeClass(task.priority)}">${capitalize(task.priority)}</span>
              <span class="badge ${statusClass}">${statusLabel}</span>
            </div>
          </div>
        </div>

        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}

        <div class="task-card-footer">
          <div class="task-due-info ${isOverdue ? 'text-rose' : ''}">
            <i class="fa-regular fa-calendar"></i>
            <span>${formatFriendlyDueDate(task.dueDate, task.dueTime)}</span>
          </div>

          <div class="task-actions">
            <button class="action-icon-btn btn-edit" data-edit-id="${task.id}" title="Edit activity">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-icon-btn btn-delete" data-delete-id="${task.id}" title="Delete activity">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTableView(container, tasks) {
  container.className = 'tasks-container table-view';
  container.innerHTML = `
    <table class="tasks-table">
      <thead>
        <tr>
          <th style="width: 44px;"></th>
          <th>Activity</th>
          <th>Horizon</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Category</th>
          <th>Status</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => {
          const isCompleted = task.status === 'completed';
          const isOverdue = isTaskOverdue(task);
          const isToday = isTaskToday(task);

          let statusBadge = isCompleted 
            ? '<span class="badge status-badge-completed">Completed</span>'
            : isOverdue 
              ? '<span class="badge status-badge-overdue">Overdue</span>'
              : '<span class="badge status-badge-pending">Still Not Done</span>';

          let horizonBadge = isToday 
            ? '<span class="badge scope-today">Today</span>'
            : isTaskThisWeek(task)
              ? '<span class="badge scope-week">This Week</span>'
              : isTaskThisMonth(task)
                ? '<span class="badge scope-month">This Month</span>'
                : '<span class="badge">Future</span>';

          return `
            <tr>
              <td>
                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
              </td>
              <td>
                <span class="task-title" style="${isCompleted ? 'text-decoration: line-through; color: var(--text-subtle);' : ''}">${escapeHtml(task.title)}</span>
                ${task.description ? `<br><small style="color:var(--text-muted);">${escapeHtml(task.description)}</small>` : ''}
              </td>
              <td>${horizonBadge}</td>
              <td class="${isOverdue ? 'text-rose' : ''}">
                ${formatFriendlyDueDate(task.dueDate, task.dueTime)}
              </td>
              <td>
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${capitalize(task.priority)}</span>
              </td>
              <td>
                <span class="badge badge-scope">${escapeHtml(task.category || 'General')}</span>
              </td>
              <td>${statusBadge}</td>
              <td style="text-align: right;">
                <div style="display: inline-flex; gap: 6px;">
                  <button class="action-icon-btn btn-edit" data-edit-id="${task.id}" title="Edit activity">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="action-icon-btn btn-delete" data-delete-id="${task.id}" title="Delete activity">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderActiveFilterTags() {
  const container = document.getElementById('activeFilterTags');
  if (!container) return;

  const tags = [];

  if (state.filters.scope !== 'all') {
    const scopeNames = { today: 'Today', week: 'This Week', month: 'This Month', overdue: 'Overdue' };
    tags.push({ key: 'scope', label: `Horizon: ${scopeNames[state.filters.scope] || state.filters.scope}` });
  }

  if (state.filters.status !== 'all') {
    const statusNames = { pending: 'Still Not Done', completed: 'Completed', overdue: 'Overdue' };
    tags.push({ key: 'status', label: `Status: ${statusNames[state.filters.status] || state.filters.status}` });
  }

  if (state.filters.priority !== 'all') {
    tags.push({ key: 'priority', label: `Priority: ${capitalize(state.filters.priority)}` });
  }

  if (state.filters.category !== 'all') {
    tags.push({ key: 'category', label: `Category: ${state.filters.category}` });
  }

  if (state.filters.search) {
    tags.push({ key: 'search', label: `Search: "${state.filters.search}"` });
  }

  if (tags.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span style="font-size:0.75rem; color:var(--text-subtle); margin-right:4px;">Active Filters:</span>
    ${tags.map(t => `
      <span class="filter-badge-item">
        ${escapeHtml(t.label)}
        <span class="remove-tag" data-clear-filter="${t.key}">&times;</span>
      </span>
    `).join('')}
    <button class="btn-subtle" id="clearAllFiltersBtn" style="padding: 2px 8px; font-size: 0.72rem;">Clear All</button>
  `;
}

function getPriorityBadgeClass(priority) {
  if (priority === 'high') return 'badge-priority-high';
  if (priority === 'medium') return 'badge-priority-medium';
  return 'badge-priority-low';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// 10. Task CRUD Operations
// ==========================================================================
function toggleTaskStatus(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const wasCompleted = task.status === 'completed';
  task.status = wasCompleted ? 'pending' : 'completed';

  if (!wasCompleted) {
    // Celebratory confetti trigger!
    triggerCelebration();
    showToast(`Activity "${task.title}" marked completed! 🎉`, 'success');
  } else {
    showToast(`Activity "${task.title}" marked as still not done.`, 'info');
  }

  saveTasks();
  updateDashboardUI();
  renderTasksList();
}

function openAddModal(defaultScope = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const idField = document.getElementById('taskIdField');

  form.reset();
  idField.value = '';
  modalTitle.textContent = 'New Activity';
  modalSubtitle.textContent = 'Create an activity to track today, this week, or this month';

  // Default due date logic
  let defaultDate = getTodayDateString();
  if (defaultScope === 'tomorrow') {
    defaultDate = getTodayDateString(1);
  } else if (defaultScope === 'week') {
    defaultDate = getTodayDateString(3);
  } else if (defaultScope === 'month') {
    defaultDate = getTodayDateString(14);
  }

  document.getElementById('taskDueDateInput').value = defaultDate;
  document.getElementById('taskDueTimeInput').value = '17:00';
  document.getElementById('taskPrioritySelect').value = 'medium';
  document.getElementById('taskCategorySelect').value = 'Work';
  document.getElementById('taskStatusSelect').value = 'pending';

  updateCalculatedScopeHint(defaultDate);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('taskTitleInput').focus();
}

function openEditModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById('taskModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const idField = document.getElementById('taskIdField');

  idField.value = task.id;
  modalTitle.textContent = 'Edit Activity';
  modalSubtitle.textContent = 'Update activity details, due date, status or horizon';

  document.getElementById('taskTitleInput').value = task.title || '';
  document.getElementById('taskDescInput').value = task.description || '';
  document.getElementById('taskDueDateInput').value = task.dueDate || getTodayDateString();
  document.getElementById('taskDueTimeInput').value = task.dueTime || '17:00';
  document.getElementById('taskPrioritySelect').value = task.priority || 'medium';
  document.getElementById('taskCategorySelect').value = task.category || 'Work';
  document.getElementById('taskStatusSelect').value = task.status === 'completed' ? 'completed' : 'pending';

  updateCalculatedScopeHint(task.dueDate);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('taskTitleInput').focus();
}

function closeModal() {
  const modal = document.getElementById('taskModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function handleSaveTaskForm(e) {
  e.preventDefault();

  const id = document.getElementById('taskIdField').value.trim();
  const title = document.getElementById('taskTitleInput').value.trim();
  const description = document.getElementById('taskDescInput').value.trim();
  const dueDate = document.getElementById('taskDueDateInput').value;
  const dueTime = document.getElementById('taskDueTimeInput').value;
  const priority = document.getElementById('taskPrioritySelect').value;
  const category = document.getElementById('taskCategorySelect').value;
  const status = document.getElementById('taskStatusSelect').value;

  if (!title) {
    showToast('Please enter an activity title.', 'warning');
    return;
  }

  if (id) {
    // Update existing task
    const index = state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      state.tasks[index] = {
        ...state.tasks[index],
        title,
        description,
        dueDate,
        dueTime,
        priority,
        category,
        status,
        updatedAt: new Date().toISOString()
      };
      showToast('Activity successfully updated!', 'success');
    }
  } else {
    // Create new task
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      description,
      dueDate,
      dueTime,
      priority,
      category,
      status,
      createdAt: new Date().toISOString()
    };
    state.tasks.unshift(newTask);
    showToast('New activity added to schedule!', 'success');
  }

  saveTasks();
  closeModal();
  updateDashboardUI();
  renderTasksList();
}

function deleteTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveTasks();
    showToast('Activity removed.', 'info');
    updateDashboardUI();
    renderTasksList();
  }
}

function updateCalculatedScopeHint(dateStr) {
  const hintEl = document.getElementById('horizonCalculatedBadge');
  if (!hintEl || !dateStr) return;

  const dummyTask = { dueDate: dateStr, status: 'pending' };
  if (isTaskToday(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-sun text-amber"></i> Scope: <strong>Today</strong>';
  } else if (isTaskThisWeek(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-calendar-week text-indigo"></i> Scope: <strong>This Week</strong>';
  } else if (isTaskThisMonth(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-calendar-days text-teal"></i> Scope: <strong>This Month</strong>';
  } else if (isTaskOverdue(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose"></i> Scope: <strong>Past Due / Overdue</strong>';
  } else {
    hintEl.innerHTML = '<i class="fa-solid fa-calendar"></i> Scope: <strong>Future Horizon</strong>';
  }
}

// ==========================================================================
// 11. View Switching & Navigation
// ==========================================================================
function switchView(viewName) {
  state.currentView = viewName;
  const dashboardSec = document.getElementById('dashboardView');
  const tasksSec = document.getElementById('tasksView');
  const pageTitle = document.getElementById('pageTitle');

  // Update navigation buttons active state
  document.querySelectorAll('.sidebar-nav .nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  if (viewName === 'dashboard') {
    dashboardSec.style.display = 'flex';
    tasksSec.style.display = 'none';
    pageTitle.textContent = 'Dashboard & Horizons';
    updateDashboardUI();
  } else {
    dashboardSec.style.display = 'none';
    tasksSec.style.display = 'flex';
    pageTitle.textContent = 'Activities Management';
    renderTasksList();
  }
}

function filterByScope(scope) {
  state.filters.scope = scope;
  switchView('all-tasks');

  // Update Horizon tab buttons
  document.querySelectorAll('#horizonTabs .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-scope') === scope);
  });

  renderTasksList();
}

// ==========================================================================
// 12. Backup, Export, Import & Reset
// ==========================================================================
function exportTasksToJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `taskhorizon-export-${formatDateToYYYYMMDD(new Date())}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Activities exported successfully!', 'success');
}

function importTasksFromJSON(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        state.tasks = imported;
        saveTasks();
        updateDashboardUI();
        renderTasksList();
        showToast(`Imported ${imported.length} activities!`, 'success');
      } else {
        showToast('Invalid JSON file format.', 'warning');
      }
    } catch (err) {
      showToast('Error parsing JSON file.', 'warning');
    }
  };
  reader.readAsText(file);
}

function resetToDefaultTasks() {
  if (confirm('Reset all activities to default sample data? Your current activities will be overwritten.')) {
    state.tasks = generateInitialSampleTasks();
    saveTasks();
    updateDashboardUI();
    renderTasksList();
    showToast('Reset to default activities.', 'info');
  }
}

// ==========================================================================
// 13. UI Enhancements: Toast, Confetti, Theme
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function triggerCelebration() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899']
    });
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  const toggleCheckbox = document.getElementById('themeToggleCheckbox');
  if (toggleCheckbox) {
    toggleCheckbox.checked = savedTheme === 'dark';
  }
}

function toggleTheme(isDark) {
  const theme = isDark ? 'dark' : 'light';
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const stats = calculateStats();
  renderCharts(stats);
}

// ==========================================================================
// 14. Event Listeners & Application Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme & Data
  initTheme();
  loadTasks();

  // Set today's date in navbar
  const pageDateEl = document.getElementById('pageCurrentDate');
  if (pageDateEl) {
    const today = new Date();
    pageDateEl.textContent = today.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // 2. Initial Render
  updateDashboardUI();
  renderTasksList();

  // 3. Navigation View Switchers
  document.querySelectorAll('.sidebar-nav .nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.getAttribute('data-view'));
      closeMobileSidebar();
    });
  });

  document.querySelectorAll('.sidebar-nav .nav-btn[data-filter-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      filterByScope(btn.getAttribute('data-filter-scope'));
      closeMobileSidebar();
    });
  });

  // Horizon Tabs in Tasks View
  document.querySelectorAll('#horizonTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterByScope(btn.getAttribute('data-scope'));
    });
  });

  // Metric Cards clickable to jump to filtered tasks
  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const scope = card.getAttribute('data-filter');
      if (scope) filterByScope(scope);
    });
  });

  // Hero Pills clickable
  const heroTodayPill = document.getElementById('heroTodayPill');
  const heroWeekPill = document.getElementById('heroWeekPill');
  const heroMonthPill = document.getElementById('heroMonthPill');
  const heroOverduePill = document.getElementById('heroOverduePill');

  if (heroTodayPill) heroTodayPill.onclick = () => filterByScope('today');
  if (heroWeekPill) heroWeekPill.onclick = () => filterByScope('week');
  if (heroMonthPill) heroMonthPill.onclick = () => filterByScope('month');
  if (heroOverduePill) heroOverduePill.onclick = () => filterByScope('overdue');

  const viewOverdueLink = document.getElementById('viewOverdueLink');
  if (viewOverdueLink) viewOverdueLink.onclick = () => filterByScope('overdue');

  const viewAllTodayBtn = document.getElementById('viewAllTodayBtn');
  if (viewAllTodayBtn) viewAllTodayBtn.onclick = () => filterByScope('today');

  // 4. Filters & Controls
  const filterStatusSelect = document.getElementById('filterStatusSelect');
  if (filterStatusSelect) {
    filterStatusSelect.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      renderTasksList();
    });
  }

  const filterPrioritySelect = document.getElementById('filterPrioritySelect');
  if (filterPrioritySelect) {
    filterPrioritySelect.addEventListener('change', (e) => {
      state.filters.priority = e.target.value;
      renderTasksList();
    });
  }

  const sortTasksSelect = document.getElementById('sortTasksSelect');
  if (sortTasksSelect) {
    sortTasksSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderTasksList();
    });
  }

  // Global Search Input
  const globalSearchInput = document.getElementById('globalSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
      if (state.currentView !== 'all-tasks') switchView('all-tasks');
      renderTasksList();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      globalSearchInput.value = '';
      state.filters.search = '';
      clearSearchBtn.style.display = 'none';
      renderTasksList();
    });
  }

  // View Mode: Cards vs Table
  const viewModeCards = document.getElementById('viewModeCards');
  const viewModeTable = document.getElementById('viewModeTable');

  if (viewModeCards && viewModeTable) {
    viewModeCards.addEventListener('click', () => {
      state.viewMode = 'grid';
      viewModeCards.classList.add('active');
      viewModeTable.classList.remove('active');
      renderTasksList();
    });

    viewModeTable.addEventListener('click', () => {
      state.viewMode = 'table';
      viewModeTable.classList.add('active');
      viewModeCards.classList.remove('active');
      renderTasksList();
    });
  }

  // 5. Category filter clicks delegation
  document.getElementById('categoryFilterList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-filter-btn');
    if (!btn) return;
    const cat = btn.getAttribute('data-category');
    state.filters.category = (state.filters.category === cat) ? 'all' : cat;
    switchView('all-tasks');
    renderCategoryFilterList();
    renderTasksList();
    closeMobileSidebar();
  });

  // Filter clear buttons delegation
  document.getElementById('activeFilterTags')?.addEventListener('click', (e) => {
    if (e.target.id === 'clearAllFiltersBtn') {
      state.filters = { scope: 'all', status: 'all', priority: 'all', category: 'all', search: '' };
      if (globalSearchInput) globalSearchInput.value = '';
      if (filterStatusSelect) filterStatusSelect.value = 'all';
      if (filterPrioritySelect) filterPrioritySelect.value = 'all';
      document.querySelectorAll('#horizonTabs .tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-scope') === 'all'));
      renderTasksList();
      return;
    }

    const removeBtn = e.target.closest('[data-clear-filter]');
    if (removeBtn) {
      const key = removeBtn.getAttribute('data-clear-filter');
      state.filters[key] = key === 'search' ? '' : 'all';
      if (key === 'scope') {
        document.querySelectorAll('#horizonTabs .tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-scope') === 'all'));
      }
      if (key === 'status' && filterStatusSelect) filterStatusSelect.value = 'all';
      if (key === 'priority' && filterPrioritySelect) filterPrioritySelect.value = 'all';
      if (key === 'search' && globalSearchInput) globalSearchInput.value = '';
      renderTasksList();
    }
  });

  // 6. Modal Open / Close & Form Submit
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const taskModal = document.getElementById('taskModal');
  const taskForm = document.getElementById('taskForm');
  const taskDueDateInput = document.getElementById('taskDueDateInput');

  if (openAddModalBtn) openAddModalBtn.addEventListener('click', () => openAddModal());
  if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', () => openAddModal());
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (taskForm) taskForm.addEventListener('submit', handleSaveTaskForm);

  if (taskModal) {
    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal) closeModal();
    });
  }

  // Update scope hint on date change in modal
  if (taskDueDateInput) {
    taskDueDateInput.addEventListener('change', (e) => {
      updateCalculatedScopeHint(e.target.value);
    });
  }

  // Preset Date Pills in Modal
  document.querySelectorAll('.date-preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const preset = pill.getAttribute('data-preset');
      let targetDate = getTodayDateString();
      if (preset === 'tomorrow') targetDate = getTodayDateString(1);
      if (preset === 'thisWeek') targetDate = getTodayDateString(3);
      if (preset === 'thisMonth') targetDate = getTodayDateString(14);
      taskDueDateInput.value = targetDate;
      updateCalculatedScopeHint(targetDate);
    });
  });

  // 7. Global Event Delegation for Checkbox toggle, Edit, Delete
  document.addEventListener('click', (e) => {
    // Checkbox toggle
    if (e.target.classList.contains('task-checkbox')) {
      const taskId = e.target.getAttribute('data-id');
      if (taskId) toggleTaskStatus(taskId);
      return;
    }

    // Edit button
    const editBtn = e.target.closest('[data-edit-id]');
    if (editBtn) {
      const taskId = editBtn.getAttribute('data-edit-id');
      if (taskId) openEditModal(taskId);
      return;
    }

    // Delete button
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (deleteBtn) {
      const taskId = deleteBtn.getAttribute('data-delete-id');
      if (taskId) deleteTask(taskId);
      return;
    }
  });

  // 8. Theme Toggle Checkbox
  const themeToggle = document.getElementById('themeToggleCheckbox');
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      toggleTheme(e.target.checked);
    });
  }

  // 9. Export, Import, Reset
  document.getElementById('exportDataBtn')?.addEventListener('click', exportTasksToJSON);
  document.getElementById('importDataInput')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importTasksFromJSON(e.target.files[0]);
    }
  });
  document.getElementById('resetDataBtn')?.addEventListener('click', resetToDefaultTasks);

  // 10. Mobile Sidebar Drawer
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebar = document.getElementById('sidebar');

  if (openSidebarBtn && sidebar) {
    openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
  }
  if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
  }

  function closeMobileSidebar() {
    if (window.innerWidth <= 860 && sidebar) {
      sidebar.classList.remove('open');
    }
  }

  // 11. Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      globalSearchInput?.focus();
    }
  });
});
