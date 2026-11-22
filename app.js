/**
 * TaskHorizon - Modern Time-Horizon To-Do & Activity Tracker
 * Executive Edition with dynamic date calculations, Chart.js analytics,
 * instant rescheduling, productivity metrics, and localStorage sync.
 */

// ==========================================================================
// 1. State Management & Constants
// ==========================================================================
const STORAGE_KEY = 'taskhorizon_activities_demo_55_v1';
const THEME_KEY = 'taskhorizon_theme';
const USER_SESSION_KEY = 'taskhorizon_user_session';

const DEMO_USERS = {
  admin: {
    id: 'user-admin',
    name: 'Eleanor Vance',
    initials: 'EV',
    role: 'Chief Operations Officer & Admin',
    roleType: 'admin',
    email: 'admin@horizon.app',
    avatarClass: 'bg-rose'
  },
  alex: {
    id: 'user-alex',
    name: 'Alex Morgan',
    initials: 'AM',
    role: 'Executive Director',
    roleType: 'user',
    email: 'alex.morgan@company.com',
    avatarClass: 'bg-indigo'
  },
  sarah: {
    id: 'user-sarah',
    name: 'Sarah Chen',
    initials: 'SC',
    role: 'Senior Product Manager',
    roleType: 'user',
    email: 'sarah.chen@product.io',
    avatarClass: 'bg-teal'
  },
  david: {
    id: 'user-david',
    name: 'David Kumar',
    initials: 'DK',
    role: 'Principal Architect',
    roleType: 'user',
    email: 'david.k@techlead.dev',
    avatarClass: 'bg-amber'
  }
};

const state = {
  tasks: [],
  currentUser: null,
  authMode: 'signin',      // 'signin' | 'signup'
  currentView: 'dashboard', // 'dashboard' | 'all-tasks' | 'calendar'
  filters: {
    scope: 'all',          // 'all' | 'today' | 'week' | 'month' | 'overdue'
    status: 'all',         // 'all' | 'pending' | 'completed' | 'overdue'
    priority: 'all',       // 'all' | 'high' | 'medium' | 'low'
    category: 'all',       // 'all' | category name
    userScope: 'all',      // 'all' | 'my'
    selectedMember: 'all', // 'all' | member ID
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
// 2. Date Utility Helpers & Horizon Calculations
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
  if (task.status === 'overdue') return true;
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

// Check if task is scheduled for This Week (upcoming days within next 7 days, excluding overdue and today)
function isTaskThisWeek(task) {
  if (!task.dueDate) return false;
  if (isTaskToday(task)) return false;
  if (isTaskOverdue(task)) return false;

  const taskDate = parseDate(task.dueDate);
  const todayStart = getStartOfToday();
  const next7DaysEnd = new Date(todayStart.getTime() + 7 * 86400000);
  next7DaysEnd.setHours(23, 59, 59, 999);

  return taskDate > todayStart && taskDate <= next7DaysEnd;
}

// Check if task is scheduled for This Month (beyond this week, within next 30 days, excluding overdue and today)
function isTaskThisMonth(task) {
  if (!task.dueDate) return false;
  if (isTaskToday(task)) return false;
  if (isTaskThisWeek(task)) return false;
  if (isTaskOverdue(task)) return false;

  const taskDate = parseDate(task.dueDate);
  const todayStart = getStartOfToday();
  const next30DaysEnd = new Date(todayStart.getTime() + 30 * 86400000);
  next30DaysEnd.setHours(23, 59, 59, 999);

  return taskDate > todayStart && taskDate <= next30DaysEnd;
}

// Get primary horizon identifier for any task
function getTaskHorizon(task) {
  if (isTaskOverdue(task)) return 'overdue';
  if (isTaskToday(task)) return 'today';
  if (isTaskThisWeek(task)) return 'week';
  if (isTaskThisMonth(task)) return 'month';
  return 'future';
}

// Get task horizon metadata for badges and UI rendering
function getTaskHorizonMeta(task) {
  const horizon = getTaskHorizon(task);
  switch (horizon) {
    case 'overdue':
      return { label: '⚠️ Overdue', badgeClass: 'badge-rose', scopeClass: 'scope-overdue' };
    case 'today':
      return { label: '☀️ Today', badgeClass: 'badge-amber', scopeClass: 'scope-today' };
    case 'week':
      return { label: '📅 This Week', badgeClass: 'badge-indigo', scopeClass: 'scope-week' };
    case 'month':
      return { label: '🗓️ This Month', badgeClass: 'badge-teal', scopeClass: 'scope-month' };
    default:
      return { label: '🔮 Upcoming', badgeClass: 'badge-scope', scopeClass: 'scope-future' };
  }
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
  if (diffDays === -1) return `Yesterday (Overdue)${timeDisplay}`;
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue${timeDisplay}`;
  if (diffDays < 7 && diffDays > 0) {
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
// 3. 55+ Professional Demo Activities Dataset
// ==========================================================================
function getDayOffsetDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return formatDateToYYYYMMDD(d);
}

function generateInitialSampleTasks() {
  const d0 = getDayOffsetDate(0);   // Today
  const dm1 = getDayOffsetDate(-1); // Yesterday
  const dm2 = getDayOffsetDate(-2); // 2 days ago
  const dm3 = getDayOffsetDate(-3); // 3 days ago
  const dm4 = getDayOffsetDate(-4); // 4 days ago
  const dm5 = getDayOffsetDate(-5); // 5 days ago

  const d1 = getDayOffsetDate(1);   // Tomorrow
  const d2 = getDayOffsetDate(2);   // In 2 days
  const d3 = getDayOffsetDate(3);   // In 3 days
  const d4 = getDayOffsetDate(4);   // In 4 days
  const d5 = getDayOffsetDate(5);   // In 5 days
  const d6 = getDayOffsetDate(6);   // In 6 days

  const d8 = getDayOffsetDate(8);   // In 8 days
  const d10 = getDayOffsetDate(10); // In 10 days
  const d12 = getDayOffsetDate(12); // In 12 days
  const d14 = getDayOffsetDate(14); // In 14 days
  const d17 = getDayOffsetDate(17); // In 17 days
  const d20 = getDayOffsetDate(20); // In 20 days
  const d24 = getDayOffsetDate(24); // In 24 days
  const d27 = getDayOffsetDate(27); // In 27 days

  const rawTasks = [
    // ------------------------------------------------------------------------
    // HORIZON: TODAY (12 Tasks: 6 Completed, 6 Pending)
    // ------------------------------------------------------------------------
    {
      id: 'task-1',
      title: 'Finalize Q4 strategic roadmap & share with executive team',
      description: 'Prepare executive slides, confirm milestones, and align sprint leads.',
      dueDate: d0,
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
      dueDate: d0,
      dueTime: '17:30',
      priority: 'medium',
      category: 'Finance',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: 'Conduct bi-weekly 1:1 performance sync with engineering team',
      description: 'Review career growth goals, blocker resolution, and team morale feedback.',
      dueDate: d0,
      dueTime: '11:00',
      priority: 'medium',
      category: 'Work',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      title: 'Deploy production hotfix v2.4.1 for payment webhook retry loop',
      description: 'Monitor error telemetry and verify zero duplicate transaction charges.',
      dueDate: d0,
      dueTime: '13:30',
      priority: 'high',
      category: 'Project',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-5',
      title: 'Refactor user profile API service & optimize SQL joins',
      description: 'Add Redis cache layer and eliminate redundant database queries.',
      dueDate: d0,
      dueTime: '16:00',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-6',
      title: 'Review customer sentiment survey & churn analysis deck',
      description: 'Summarize top 3 user requested features for the product steering committee.',
      dueDate: d0,
      dueTime: '14:30',
      priority: 'medium',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-7',
      title: '30-minute high-intensity cardio and core workout session',
      description: 'Complete 5-round interval circuits and full body stretching routine.',
      dueDate: d0,
      dueTime: '07:30',
      priority: 'medium',
      category: 'Health',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-8',
      title: 'Meal prep high-protein lunches for the upcoming work week',
      description: 'Prepare chicken breast, quinoa bowls, and roasted greens.',
      dueDate: d0,
      dueTime: '19:00',
      priority: 'low',
      category: 'Health',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-9',
      title: 'Reconcile corporate credit card receipts in expense portal',
      description: 'Upload hotel receipts, client dinner bills, and ride-share statements.',
      dueDate: d0,
      dueTime: '18:15',
      priority: 'low',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-10',
      title: 'Drop off winter coats at eco-friendly dry cleaner',
      description: 'Collect order receipt and set pickup reminder for Friday.',
      dueDate: d0,
      dueTime: '10:00',
      priority: 'low',
      category: 'Personal',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-11',
      title: 'Read chapter 5 of Designing Data-Intensive Applications',
      description: 'Highlight key concepts: multi-leader replication and conflict resolution.',
      dueDate: d0,
      dueTime: '21:30',
      priority: 'medium',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-12',
      title: 'Verify daily database automated backup snapshots & checksums',
      description: 'Validate multi-region backup replication status in AWS S3 Glacier.',
      dueDate: d0,
      dueTime: '09:00',
      priority: 'high',
      category: 'Project',
      status: 'completed',
      createdAt: new Date().toISOString()
    },

    // ------------------------------------------------------------------------
    // HORIZON: OVERDUE (7 Tasks: All Pending Action)
    // ------------------------------------------------------------------------
    {
      id: 'task-13',
      title: 'Submit quarterly corporate tax compliance documentation',
      description: 'Collate contractor 1099s, W-9 filings, and export P&L report for accountant.',
      dueDate: dm2,
      dueTime: '18:00',
      priority: 'high',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'task-14',
      title: 'Resolve critical mobile checkout safari rendering glitch',
      description: 'Fix sticky payment CTA button overlap on iOS WebKit browsers.',
      dueDate: dm1,
      dueTime: '17:00',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'task-15',
      title: 'Schedule annual preventative medical & dental checkup',
      description: 'Book morning appointment slot with preferred family health clinic.',
      dueDate: dm3,
      dueTime: '12:00',
      priority: 'medium',
      category: 'Health',
      status: 'pending',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'task-16',
      title: 'Submit quarterly cloud infrastructure spend analysis report',
      description: 'Detail cost breakdowns between Kubernetes nodes, RDS storage, and data egress.',
      dueDate: dm2,
      dueTime: '16:00',
      priority: 'high',
      category: 'Work',
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'task-17',
      title: 'Complete Module 3 of Deep Learning Certification exam',
      description: 'Finish practical assessment on convolutional neural network hyperparameter tuning.',
      dueDate: dm4,
      dueTime: '20:00',
      priority: 'medium',
      category: 'Study',
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'task-18',
      title: 'Send customized birthday gift hamper & card to mom',
      description: 'Express shipping order needs tracking confirmation and delivery date lock.',
      dueDate: dm1,
      dueTime: '15:30',
      priority: 'high',
      category: 'Personal',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'task-19',
      title: 'Renew domain names and SSL wildcard certificates',
      description: 'Ensure auto-renewal payment authorization for production staging domains.',
      dueDate: dm5,
      dueTime: '14:00',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
    },

    // ------------------------------------------------------------------------
    // HORIZON: THIS WEEK (18 Tasks: 5 Completed, 13 Pending)
    // ------------------------------------------------------------------------
    {
      id: 'task-20',
      title: 'Prepare design assets for client keynote presentation',
      description: 'Export high-res SVG mockups, update typography tokens, and test demo click-paths.',
      dueDate: d1,
      dueTime: '14:00',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-21',
      title: 'Benchmark API gateway response latency under 10k RPS load',
      description: 'Execute k6 load testing scripts and identify CPU throttle bottlenecks.',
      dueDate: d1,
      dueTime: '16:30',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-22',
      title: 'Setup automated Cypress end-to-end regression test pipeline',
      description: 'Integrate GitHub Actions workflow with headless Chrome test runners.',
      dueDate: d2,
      dueTime: '15:00',
      priority: 'medium',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-23',
      title: 'Integrate webhook event handler for Stripe subscription billing',
      description: 'Handle customer.subscription.updated and invoice.payment_failed webhooks.',
      dueDate: d1,
      dueTime: '11:00',
      priority: 'high',
      category: 'Work',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-24',
      title: 'Audit AWS & GCP cloud resource tags to eliminate orphaned disks',
      description: 'Unattached EBS volumes and idle load balancers cleanup.',
      dueDate: d2,
      dueTime: '17:00',
      priority: 'high',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-25',
      title: 'Finalize department OKRs & KPI scorecards for next cycle',
      description: 'Confirm measurable outcomes across product, design, and engineering pods.',
      dueDate: d3,
      dueTime: '12:00',
      priority: 'high',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-26',
      title: 'Conduct architectural design review for Payment Gateway v2',
      description: 'Review zero-downtime database migration schema with lead architect.',
      dueDate: d2,
      dueTime: '14:00',
      priority: 'medium',
      category: 'Work',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-27',
      title: 'Draft RFC proposal for microservices authentication overhaul',
      description: 'Document transition from legacy session cookies to mTLS & JWT OAuth2.',
      dueDate: d3,
      dueTime: '18:00',
      priority: 'medium',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-28',
      title: 'Interview senior full-stack engineering candidate',
      description: 'Conduct system design round focusing on distributed rate limiters.',
      dueDate: d3,
      dueTime: '16:00',
      priority: 'medium',
      category: 'Work',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-29',
      title: 'Approve vendor software invoices & contractor statements of work',
      description: 'Verify hourly delivery logs against monthly budget ceilings.',
      dueDate: d4,
      dueTime: '11:30',
      priority: 'low',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-30',
      title: 'Review personal investment portfolio & rebalance ETF allocations',
      description: 'Shift dividend yields into broad market index funds and treasury bonds.',
      dueDate: d2,
      dueTime: '19:30',
      priority: 'medium',
      category: 'Finance',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-31',
      title: '45-minute strength training: upper body & functional mobility',
      description: 'Push-pull compound exercises and rotator cuff stability drills.',
      dueDate: d3,
      dueTime: '07:00',
      priority: 'medium',
      category: 'Health',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-32',
      title: 'Achieve 10,000 steps daily outdoor walking goal',
      description: 'Evening brisk walk through park to reset screen fatigue.',
      dueDate: d1,
      dueTime: '20:00',
      priority: 'low',
      category: 'Health',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-33',
      title: 'Practice 2 LeetCode graph traversal algorithm challenges',
      description: 'Implement Dijkstra shortest path and topological sorting in Python.',
      dueDate: d4,
      dueTime: '21:00',
      priority: 'high',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-34',
      title: 'Watch keynote recording on Distributed AI Agents architecture',
      description: 'Take notes on agent communication protocols, swarm routing, and memory sandboxes.',
      dueDate: d5,
      dueTime: '18:30',
      priority: 'low',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-35',
      title: 'Study Rust memory safety & ownership model fundamentals',
      description: 'Build a small CLI tool demonstrating borrowing, lifetimes, and smart pointers.',
      dueDate: d5,
      dueTime: '15:00',
      priority: 'medium',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-36',
      title: 'Book flights and hotel accommodation for family holiday',
      description: 'Compare non-stop flight departures and secure refundable boutique hotel.',
      dueDate: d4,
      dueTime: '13:00',
      priority: 'high',
      category: 'Personal',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-37',
      title: 'Deep clean home office workspace and organize cable management',
      description: 'Wipe dual monitors, vacuum desk mat, and route power cables through raceways.',
      dueDate: d6,
      dueTime: '10:30',
      priority: 'low',
      category: 'Personal',
      status: 'pending',
      createdAt: new Date().toISOString()
    },

    // ------------------------------------------------------------------------
    // HORIZON: THIS MONTH (18 Tasks: 3 Completed, 15 Pending)
    // ------------------------------------------------------------------------
    {
      id: 'task-38',
      title: 'Organize quarterly departmental hackathon & prize categories',
      description: 'Coordinate sponsor judging panel, mentorship workshops, and trophy delivery.',
      dueDate: d10,
      dueTime: '16:00',
      priority: 'medium',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-39',
      title: 'Complete vendor compliance & SOC2 Type II audit documentation',
      description: 'Collate security incident response drills and penetration testing reports.',
      dueDate: d14,
      dueTime: '17:00',
      priority: 'high',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-40',
      title: 'Review updated terms of service and GDPR privacy policy',
      description: 'Meet with corporate legal counsel to sign off on revised data retention clauses.',
      dueDate: d17,
      dueTime: '14:30',
      priority: 'medium',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-41',
      title: 'Publish monthly engineering newsletter to technology division',
      description: 'Spotlight notable shipped features, customer wins, and team milestones.',
      dueDate: d8,
      dueTime: '12:00',
      priority: 'low',
      category: 'Work',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-42',
      title: 'Evaluate enterprise observability & telemetry SaaS platforms',
      description: 'Compare Datadog, New Relic, and Grafana Cloud cost-benefit matrix.',
      dueDate: d20,
      dueTime: '15:00',
      priority: 'medium',
      category: 'Work',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-43',
      title: 'Migrate legacy Elasticsearch cluster to OpenSearch 2.0',
      description: 'Plan blue-green reindexing phase and monitor zero query downtime.',
      dueDate: d12,
      dueTime: '11:00',
      priority: 'high',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-44',
      title: 'Implement system dark mode support across admin backoffice',
      description: 'Standardize semantic CSS variables for tables, modals, and charts.',
      dueDate: d14,
      dueTime: '16:00',
      priority: 'medium',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-45',
      title: 'Build automated CSV and PDF export generator for reporting',
      description: 'Generate high-res downloadable executive transaction summaries.',
      dueDate: d17,
      dueTime: '13:00',
      priority: 'medium',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-46',
      title: 'Conduct accessibility audit for WCAG 2.1 AA compliance',
      description: 'Fix screen-reader aria labels and color contrast ratios on button states.',
      dueDate: d24,
      dueTime: '15:30',
      priority: 'low',
      category: 'Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-47',
      title: 'Negotiate annual contract renewal with CRM platform vendor',
      description: 'Target 15% discount on tier-up user seats and lock 24-month rate guarantee.',
      dueDate: d10,
      dueTime: '11:00',
      priority: 'high',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-48',
      title: 'Prepare annual budget forecasting model for upcoming fiscal year',
      description: 'Model hiring plans, software tooling subscriptions, and capital expenditures.',
      dueDate: d24,
      dueTime: '17:00',
      priority: 'high',
      category: 'Finance',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-49',
      title: 'Verify employee 401(k) / retirement contribution statements',
      description: 'Ensure accurate employer match deposits are reflected in portal.',
      dueDate: d20,
      dueTime: '10:00',
      priority: 'low',
      category: 'Finance',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-50',
      title: 'Register for city spring half-marathon competition',
      description: 'Confirm registration tier, timing chip bib, and medical clearance.',
      dueDate: d12,
      dueTime: '18:00',
      priority: 'low',
      category: 'Health',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-51',
      title: 'Restock daily vitamins, protein powder, and electrolytes',
      description: 'Order Omega-3, Vitamin D3, and micronutrient supplements.',
      dueDate: d14,
      dueTime: '19:00',
      priority: 'low',
      category: 'Health',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-52',
      title: 'Complete TypeScript 5.5 advanced type gymnastics workshop',
      description: 'Deep dive into conditional infer types, template literals, and brand types.',
      dueDate: d17,
      dueTime: '20:30',
      priority: 'medium',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-53',
      title: 'Finish reading "Thinking in Systems" by Donella Meadows',
      description: 'Draft summary notes on feedback loops, system delays, and leverage points.',
      dueDate: d27,
      dueTime: '21:00',
      priority: 'low',
      category: 'Study',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-54',
      title: 'Schedule seasonal vehicle maintenance and tire rotation',
      description: 'Book 30,000-mile comprehensive inspection and synthetic oil change.',
      dueDate: d14,
      dueTime: '09:30',
      priority: 'medium',
      category: 'Personal',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-55',
      title: 'Renew international passport and verified driver credentials',
      description: 'Complete digital renewal photo upload and expedited courier delivery form.',
      dueDate: d27,
      dueTime: '14:00',
      priority: 'high',
      category: 'Personal',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ];

  const teamAssignees = [
    { id: 'user-alex', name: 'Alex Morgan', avatar: 'AM', avatarClass: 'bg-indigo' },
    { id: 'user-sarah', name: 'Sarah Chen', avatar: 'SC', avatarClass: 'bg-teal' },
    { id: 'user-david', name: 'David Kumar', avatar: 'DK', avatarClass: 'bg-amber' }
  ];

  return rawTasks.map((task, index) => {
    const assignee = teamAssignees[index % teamAssignees.length];
    return {
      ...task,
      assigneeId: task.assigneeId || assignee.id,
      assigneeName: task.assigneeName || assignee.name,
      assigneeAvatar: task.assigneeAvatar || assignee.avatar,
      assigneeAvatarClass: task.assigneeAvatarClass || assignee.avatarClass
    };
  });
}

// ==========================================================================
// 4. Storage & Persistence
// ==========================================================================
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const teamAssignees = [
          { id: 'user-alex', name: 'Alex Morgan', avatar: 'AM', avatarClass: 'bg-indigo' },
          { id: 'user-sarah', name: 'Sarah Chen', avatar: 'SC', avatarClass: 'bg-teal' },
          { id: 'user-david', name: 'David Kumar', avatar: 'DK', avatarClass: 'bg-amber' }
        ];
        parsed = parsed.map((task, idx) => {
          if (!task.assigneeId) {
            const a = teamAssignees[idx % teamAssignees.length];
            return {
              ...task,
              assigneeId: a.id,
              assigneeName: a.name,
              assigneeAvatar: a.avatar,
              assigneeAvatarClass: a.avatarClass
            };
          }
          return task;
        });
        state.tasks = parsed;
        return;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored activities:', err);
  }
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

  // 0. User Scope & Admin Member Filter
  if (state.currentUser && state.currentUser.roleType === 'user' && state.filters.userScope === 'my') {
    list = list.filter(t => t.assigneeId === state.currentUser.id);
  } else if (state.filters.selectedMember && state.filters.selectedMember !== 'all') {
    list = list.filter(t => t.assigneeId === state.filters.selectedMember);
  }

  // 1. Scope Filter
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
    list = list.filter(t => t.status !== 'completed');
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

  // 5. Search Filter
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

  // Individual user stats (for current logged in user)
  const currentUserId = state.currentUser ? state.currentUser.id : 'user-alex';
  const myTasks = state.tasks.filter(t => t.assigneeId === currentUserId);
  const myTotal = myTasks.length;
  const myCompleted = myTasks.filter(t => t.status === 'completed').length;
  const myOverdueTasks = myTasks.filter(isTaskOverdue);
  const myOverdue = myOverdueTasks.length;
  const myStillNotDone = myTasks.filter(t => t.status !== 'completed' && !isTaskOverdue(t)).length;

  const myTodayTasks = myTasks.filter(isTaskToday);
  const myTodayDone = myTodayTasks.filter(t => t.status === 'completed').length;
  const myTodayPending = myTodayTasks.length - myTodayDone;

  const myWeekTasks = myTasks.filter(isTaskThisWeek);
  const myWeekDone = myWeekTasks.filter(t => t.status === 'completed').length;
  const myWeekPending = myWeekTasks.length - myWeekDone;

  const myMonthTasks = myTasks.filter(isTaskThisMonth);
  const myMonthDone = myMonthTasks.filter(t => t.status === 'completed').length;
  const myMonthPending = myMonthTasks.length - myMonthDone;

  const myPercent = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

  // Team Member Breakdown (for Admin Dashboard)
  const teamMembers = [DEMO_USERS.alex, DEMO_USERS.sarah, DEMO_USERS.david];
  const memberStats = teamMembers.map(m => {
    const tasks = state.tasks.filter(t => t.assigneeId === m.id);
    const mTotal = tasks.length;
    const mCompleted = tasks.filter(t => t.status === 'completed').length;
    const mOverdue = tasks.filter(isTaskOverdue).length;
    const mPending = mTotal - mCompleted;
    const mPercent = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;
    return {
      ...m,
      total: mTotal,
      completed: mCompleted,
      pending: mPending,
      overdue: mOverdue,
      percent: mPercent
    };
  });

  return {
    total,
    completed,
    overdue,
    stillNotDone,
    percent,
    today: { total: todayTasks.length, done: todayDone, pending: todayPending },
    week: { total: weekTasks.length, done: weekDone, pending: weekPending },
    month: { total: monthTasks.length, done: monthDone, pending: monthPending },
    my: {
      total: myTotal,
      completed: myCompleted,
      overdue: myOverdue,
      stillNotDone: myStillNotDone,
      percent: myPercent,
      today: { total: myTodayTasks.length, done: myTodayDone, pending: myTodayPending },
      week: { total: myWeekTasks.length, done: myWeekDone, pending: myWeekPending },
      month: { total: myMonthTasks.length, done: myMonthDone, pending: myMonthPending }
    },
    memberStats
  };
}

// ==========================================================================
// 7. UI Rendering: Dashboard & Metrics
// ==========================================================================
function updateDashboardUI() {
  const stats = calculateStats();
  const isAdmin = state.currentUser && state.currentUser.roleType === 'admin';
  const isMyScope = !isAdmin && state.filters.userScope === 'my';
  const activeStats = isMyScope ? stats.my : stats;

  // Toggle Admin Command Center vs User Scope Banner
  const adminSec = document.getElementById('adminCommandSection');
  const userBanner = document.getElementById('userScopeBanner');
  const tasksUserScopeRow = document.getElementById('tasksUserScopeRow');
  const filterMemberGroup = document.getElementById('filterMemberGroup');

  if (adminSec) adminSec.style.display = isAdmin ? 'flex' : 'none';
  if (userBanner) userBanner.style.display = !isAdmin ? 'flex' : 'none';
  if (tasksUserScopeRow) tasksUserScopeRow.style.display = !isAdmin ? 'flex' : 'none';
  if (filterMemberGroup) filterMemberGroup.style.display = isAdmin ? 'flex' : 'none';

  // Render Admin Team Cards Grid if Admin
  if (isAdmin) {
    const teamCardsGrid = document.getElementById('teamCardsGrid');
    if (teamCardsGrid) {
      teamCardsGrid.innerHTML = stats.memberStats.map(m => `
        <div class="team-member-card">
          <div class="member-card-top">
            <div class="member-avatar ${m.avatarClass}">${m.initials}</div>
            <div class="member-info">
              <h4>${escapeHtml(m.name)}</h4>
              <span class="member-role">${escapeHtml(m.role)}</span>
              <span class="member-email">${escapeHtml(m.email)}</span>
            </div>
            <span class="member-health-badge ${m.overdue > 0 ? 'badge-rose' : 'badge-emerald'}">
              ${m.overdue > 0 ? `⚠️ ${m.overdue} Overdue` : '✅ On Track'}
            </span>
          </div>
          <div class="member-stats-row">
            <div class="stat-col">
              <span class="stat-num">${m.total}</span>
              <span class="stat-lbl">Assigned</span>
            </div>
            <div class="stat-col text-emerald">
              <span class="stat-num">${m.completed}</span>
              <span class="stat-lbl">Done</span>
            </div>
            <div class="stat-col text-amber">
              <span class="stat-num">${m.pending}</span>
              <span class="stat-lbl">Pending</span>
            </div>
            <div class="stat-col text-rose">
              <span class="stat-num">${m.overdue}</span>
              <span class="stat-lbl">Overdue</span>
            </div>
          </div>
          <div class="member-progress-wrapper">
            <div class="member-progress-bar">
              <div class="member-progress-fill" style="width: ${m.percent}%"></div>
            </div>
            <span class="member-progress-pct">${m.percent}% Done</span>
          </div>
          <div class="member-card-footer">
            <button class="btn-subtle btn-inspect-member" data-member-id="${m.id}" title="Filter activities to ${escapeHtml(m.name)}">
              <i class="fa-solid fa-list-check"></i> Tasks (${m.total})
            </button>
            ${m.overdue > 0 ? `
              <button class="btn-quick-reschedule btn-member-reschedule" data-member-reschedule="${m.id}" title="Reschedule ${escapeHtml(m.name)}'s overdue tasks to Today">
                <i class="fa-solid fa-calendar-check text-amber"></i> Clear Overdue
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    setElementText('adminOverdueAlertBadge', `⚠️ ${stats.overdue} Team Overdue`);
  }

  // Update User Scope Banner if User
  if (!isAdmin && state.currentUser) {
    const userScopeAvatar = document.getElementById('userScopeAvatar');
    if (userScopeAvatar) {
      userScopeAvatar.textContent = state.currentUser.initials;
      userScopeAvatar.className = `user-scope-avatar ${state.currentUser.avatarClass || 'bg-indigo'}`;
    }
    setElementText('userScopeTitle', `${state.currentUser.name}'s Horizon Workspace`);
    setElementText('userScopeSubtitle', `Showing ${isMyScope ? 'your assigned personal activities' : 'all team shared activities'}`);
    setElementText('scopeMyCount', stats.my.total);
    setElementText('scopeAllCount', stats.total);
    setElementText('tasksScopeMyCount', stats.my.total);
    setElementText('tasksScopeAllCount', stats.total);

    document.querySelectorAll('[data-user-scope]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-user-scope') === state.filters.userScope);
    });

    const tasksScopeHint = document.getElementById('tasksScopeHint');
    if (tasksScopeHint) {
      tasksScopeHint.textContent = isMyScope 
        ? `Showing only activities assigned to ${state.currentUser.name}`
        : `Showing all 55 shared team activities across members`;
    }
  }

  // Sidebar Counts
  setElementText('countAll', activeStats.total);
  setElementText('countToday', activeStats.today.total);
  setElementText('countWeek', activeStats.week.total);
  setElementText('countMonth', activeStats.month.total);
  setElementText('countOverdue', activeStats.overdue);

  // Tab Counts
  setElementText('tabCountAll', activeStats.total);
  setElementText('tabCountToday', activeStats.today.total);
  setElementText('tabCountWeek', activeStats.week.total);
  setElementText('tabCountMonth', activeStats.month.total);
  setElementText('tabCountOverdue', activeStats.overdue);

  // Sidebar Productivity Mini-Gauge
  setElementText('sidebarProdRate', `${activeStats.percent}%`);
  setElementWidth('sidebarProdFill', `${activeStats.percent}%`);

  // Hero Card & Radial Meter
  const heroProgressText = document.getElementById('heroProgressText');
  const heroProgressCircle = document.getElementById('heroProgressCircle');
  const heroSummaryText = document.getElementById('heroSummaryText');

  if (heroProgressText) heroProgressText.textContent = `${activeStats.percent}%`;
  if (heroProgressCircle) {
    const circumference = 2 * Math.PI * 42; // r=42 -> ~263.89
    const offset = circumference - (activeStats.percent / 100) * circumference;
    heroProgressCircle.style.strokeDashoffset = offset;
  }

  // Dynamic Time-of-Day Greeting
  const heroGreetingText = document.getElementById('heroGreetingText');
  if (heroGreetingText) {
    const currentHour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (currentHour < 12) timeGreeting = 'Good morning';
    else if (currentHour < 17) timeGreeting = 'Good afternoon';
    const userFirstName = state.currentUser ? state.currentUser.name.split(' ')[0] : 'there';
    if (isAdmin) {
      heroGreetingText.textContent = `${timeGreeting}, Eleanor! Organization & Team Command Center.`;
    } else {
      heroGreetingText.textContent = `${timeGreeting}, ${userFirstName}! Here's your personal activity outlook.`;
    }
  }

  if (heroSummaryText) {
    if (isAdmin) {
      heroSummaryText.innerHTML = `👑 Monitoring <strong style="color:var(--color-primary);">${stats.total} total team activities</strong> across 3 active members. <strong style="color:var(--status-overdue);">${stats.overdue} overdue items</strong> require administrative attention.`;
    } else if (activeStats.overdue > 0) {
      heroSummaryText.innerHTML = `⚠️ You have <strong style="color:var(--status-overdue);">${activeStats.overdue} overdue activities</strong> requiring prompt action, and <strong>${activeStats.today.pending} tasks</strong> remaining today.`;
    } else if (activeStats.today.pending > 0) {
      heroSummaryText.innerHTML = `🎯 <strong>${activeStats.today.pending} activities</strong> scheduled for today. You are making steady progress!`;
    } else if (activeStats.total > 0 && activeStats.completed === activeStats.total) {
      heroSummaryText.innerHTML = `🎉 Outstanding execution! All activities have been successfully marked completed.`;
    } else {
      heroSummaryText.innerHTML = `✨ Today is organized. You have ${activeStats.week.total} tasks lined up for this week.`;
    }
  }

  // Hero Horizon Pills
  const heroTodayPill = document.getElementById('heroTodayPill');
  const heroWeekPill = document.getElementById('heroWeekPill');
  const heroMonthPill = document.getElementById('heroMonthPill');
  const heroOverduePill = document.getElementById('heroOverduePill');

  if (heroTodayPill) heroTodayPill.innerHTML = `<i class="fa-solid fa-sun"></i> Today: <strong>${activeStats.today.total}</strong>`;
  if (heroWeekPill) heroWeekPill.innerHTML = `<i class="fa-solid fa-calendar-week"></i> This Week: <strong>${activeStats.week.total}</strong>`;
  if (heroMonthPill) heroMonthPill.innerHTML = `<i class="fa-solid fa-calendar-days"></i> This Month: <strong>${activeStats.month.total}</strong>`;
  if (heroOverduePill) heroOverduePill.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Overdue: <strong>${activeStats.overdue}</strong>`;

  // Overdue Callout Banner
  const overdueBanner = document.getElementById('overdueCalloutBanner');
  if (overdueBanner) {
    if (activeStats.overdue > 0) {
      overdueBanner.style.display = 'flex';
      setElementText('overdueCalloutTitle', `Attention: ${activeStats.overdue} Overdue Activities Detected`);
      setElementText('overdueCalloutDesc', `You have ${activeStats.overdue} activities past due. Reschedule them to Today with one click or review them.`);
    } else {
      overdueBanner.style.display = 'none';
    }
  }

  // Update Dynamic Date Subtitles
  updateDateSubtitles();

  // Metric Cards
  setElementText('statTodayTotal', activeStats.today.total);
  setElementText('statTodayPending', `${activeStats.today.pending} still not done`);
  setElementText('statTodayDone', `${activeStats.today.done} done`);
  const todayFill = activeStats.today.total > 0 ? (activeStats.today.done / activeStats.today.total) * 100 : 0;
  setElementWidth('barTodayProgress', `${todayFill}%`);

  setElementText('statWeekTotal', activeStats.week.total);
  setElementText('statWeekPending', `${activeStats.week.pending} still not done`);
  setElementText('statWeekDone', `${activeStats.week.done} done`);
  const weekFill = activeStats.week.total > 0 ? (activeStats.week.done / activeStats.week.total) * 100 : 0;
  setElementWidth('barWeekProgress', `${weekFill}%`);

  setElementText('statMonthTotal', activeStats.month.total);
  setElementText('statMonthPending', `${activeStats.month.pending} still not done`);
  setElementText('statMonthDone', `${activeStats.month.done} done`);
  const monthFill = activeStats.month.total > 0 ? (activeStats.month.done / activeStats.month.total) * 100 : 0;
  setElementWidth('barMonthProgress', `${monthFill}%`);

  setElementText('statOverdueTotal', activeStats.overdue);
  setElementText('statOverdueAdvice', activeStats.overdue > 0 ? 'Requires immediate attention' : 'Zero overdue items 👍');

  // Today's Focus List
  renderDashboardFocusList();

  // Charts
  renderCharts(stats);

  // Categories
  renderCategoryFilterList();
}

function updateDateSubtitles() {
  const now = new Date();
  
  // Today chip
  const chipToday = document.getElementById('chipTodayDate');
  if (chipToday) chipToday.textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // Week range chip
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const chipWeek = document.getElementById('chipWeekDate');
  const navSubWeek = document.getElementById('navSubWeek');
  const weekRangeStr = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  if (chipWeek) chipWeek.textContent = weekRangeStr;
  if (navSubWeek) navSubWeek.textContent = weekRangeStr;

  // Month chip
  const monthStr = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const chipMonth = document.getElementById('chipMonthDate');
  const navSubMonth = document.getElementById('navSubMonth');
  if (chipMonth) chipMonth.textContent = monthStr;
  if (navSubMonth) navSubMonth.textContent = now.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
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

  const isAdmin = state.currentUser && state.currentUser.roleType === 'admin';
  const isMyScope = !isAdmin && state.filters.userScope === 'my';
  const currentUserId = state.currentUser ? state.currentUser.id : 'user-alex';

  let todayTasks = state.tasks.filter(isTaskToday);
  if (isMyScope) {
    todayTasks = todayTasks.filter(t => t.assigneeId === currentUserId);
  }

  if (todayTasks.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-surface-elevated); border-radius: var(--radius-md);">
        <i class="fa-solid fa-mug-hot" style="font-size: 1.8rem; margin-bottom: 8px; display: inline-block; color: var(--horizon-today);"></i>
        <p style="font-weight: 500;">No activities scheduled specifically for today. You're in great shape!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todayTasks.map(task => {
    const isCompleted = task.status === 'completed';
    return `
      <div class="task-card ${isCompleted ? 'is-completed' : ''}" style="padding: 14px 18px; margin: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} title="Toggle completed">
            <div style="min-width: 0;">
              <span class="task-title" style="font-size: 0.94rem; ${isCompleted ? 'text-decoration: line-through; color: var(--text-subtle);' : ''}">${escapeHtml(task.title)}</span>
              <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${capitalize(task.priority)}</span>
                <span class="badge badge-scope">${escapeHtml(task.category || 'General')}</span>
                <span class="assignee-tag-sm" title="Assigned to ${escapeHtml(task.assigneeName || 'Team Member')}">
                  <span class="avatar-micro ${task.assigneeAvatarClass || 'bg-indigo'}">${task.assigneeAvatar || 'U'}</span>
                  <span>${escapeHtml(task.assigneeName ? task.assigneeName.split(' ')[0] : 'Assignee')}</span>
                </span>
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

  const isDark = document.body && document.body.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  const isAdmin = state.currentUser && state.currentUser.roleType === 'admin';
  const isMyScope = !isAdmin && state.filters.userScope === 'my';
  const activeStats = isMyScope ? stats.my : stats;

  // Chart 1: Status Distribution Doughnut
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    if (state.charts.status) {
      state.charts.status.destroy();
    }

    const statusPastelColors = isDark 
      ? ['#6ee7b7', '#fcd34d', '#fda4af'] 
      : ['#34d399', '#fbbf24', '#f87171'];

    state.charts.status = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Still Not Done', 'Overdue'],
        datasets: [{
          data: [activeStats.completed, activeStats.stillNotDone, activeStats.overdue],
          backgroundColor: statusPastelColors,
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
            backgroundColor: isDark ? '#1a2236' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#1e293b',
            bodyColor: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const total = activeStats.total || 1;
                const pct = Math.round((val / total) * 100);
                return ` ${context.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
        cutout: '72%'
      }
    });

    const legendEl = document.getElementById('statusChartLegend');
    if (legendEl) {
      const dotColors = isDark 
        ? { done: '#6ee7b7', pending: '#fcd34d', overdue: '#fda4af' }
        : { done: '#34d399', pending: '#fbbf24', overdue: '#f87171' };
      legendEl.innerHTML = `
        <span class="legend-item"><span class="legend-dot" style="background:${dotColors.done};"></span> Done (${activeStats.completed})</span>
        <span class="legend-item"><span class="legend-dot" style="background:${dotColors.pending};"></span> Pending (${activeStats.stillNotDone})</span>
        <span class="legend-item"><span class="legend-dot" style="background:${dotColors.overdue};"></span> Overdue (${activeStats.overdue})</span>
      `;
    }
  }

  // Chart 2: Time Horizon Breakdown (or Team Workload for Admin)
  const horizonCtx = document.getElementById('horizonChart');
  if (horizonCtx) {
    if (state.charts.horizon) {
      state.charts.horizon.destroy();
    }

    let chartLabels = [];
    let datasets = [];

    const chart2Title = horizonCtx.closest('.chart-card')?.querySelector('.card-title');
    const chart2Subtitle = horizonCtx.closest('.chart-card')?.querySelector('.card-subtitle');

    if (isAdmin && stats.memberStats && stats.memberStats.length > 0) {
      if (chart2Title) chart2Title.innerHTML = '<i class="fa-solid fa-users text-teal"></i> Team Workload & Health';
      if (chart2Subtitle) chart2Subtitle.textContent = 'Activity volume & overdue distribution across members';

      chartLabels = stats.memberStats.map(m => m.name.split(' ')[0]);
      datasets = [
        {
          label: 'Completed',
          data: stats.memberStats.map(m => m.completed),
          backgroundColor: isDark ? '#6ee7b7' : '#34d399',
          borderRadius: 6
        },
        {
          label: 'Still Not Done',
          data: stats.memberStats.map(m => m.pending),
          backgroundColor: isDark ? '#93c5fd' : '#818cf8',
          borderRadius: 6
        },
        {
          label: 'Overdue',
          data: stats.memberStats.map(m => m.overdue),
          backgroundColor: isDark ? '#fda4af' : '#f87171',
          borderRadius: 6
        }
      ];
    } else {
      if (chart2Title) chart2Title.innerHTML = '<i class="fa-solid fa-chart-column text-teal"></i> Time Horizon Workload';
      if (chart2Subtitle) {
        chart2Subtitle.textContent = isMyScope 
          ? 'Your personal activity volume across horizons' 
          : 'Team activity volume across Today, Week & Month';
      }

      chartLabels = ['Today', 'This Week', 'This Month'];
      const horizonPendingPastel = isDark
        ? ['#fcd34d', '#93c5fd', '#5eead4']
        : ['#fbbf24', '#818cf8', '#2dd4bf'];
      const horizonDonePastel = isDark ? '#6ee7b7' : '#34d399';

      datasets = [
        {
          label: 'Still Not Done',
          data: [activeStats.today.pending, activeStats.week.pending, activeStats.month.pending],
          backgroundColor: horizonPendingPastel,
          borderRadius: 6
        },
        {
          label: 'Completed',
          data: [activeStats.today.done, activeStats.week.done, activeStats.month.done],
          backgroundColor: horizonDonePastel,
          borderRadius: 6
        }
      ];
    }

    state.charts.horizon = new Chart(horizonCtx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } }
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
              font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' }
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1a2236' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#1e293b',
            bodyColor: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            borderWidth: 1,
            padding: 10
          }
        }
      }
    });
  }

  // Chart 3: Category Distribution
  const catCtx = document.getElementById('categoryChart');
  if (catCtx) {
    if (state.charts.category) {
      state.charts.category.destroy();
    }

    const catMap = {};
    state.tasks.forEach(t => {
      const cat = t.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);
    const catColors = isDark
      ? ['#93c5fd', '#f472b6', '#5eead4', '#fcd34d', '#7dd3fc', '#c084fc', '#6ee7b7']
      : ['#818cf8', '#f472b6', '#2dd4bf', '#fbbf24', '#38bdf8', '#c084fc', '#34d399'];

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
              font: { size: 11, family: 'Plus Jakarta Sans' }
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1a2236' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#1e293b',
            bodyColor: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            borderWidth: 1,
            padding: 10
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
  renderActiveFilterTags();

  if (tasks.length === 0) {
    container.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'flex';
      const emptyTitle = document.getElementById('emptyStateTitle');
      const emptyDesc = document.getElementById('emptyStateDesc');
      if (state.filters.scope === 'overdue') {
        emptyTitle.textContent = 'Zero Overdue Activities!';
        emptyDesc.textContent = 'All your scheduled tasks are on-track or completed.';
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
    const horizonMeta = getTaskHorizonMeta(task);

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
              <span class="badge ${horizonMeta.badgeClass}">${horizonMeta.label}</span>
              <span class="badge ${getPriorityBadgeClass(task.priority)}">${capitalize(task.priority)}</span>
              <span class="badge ${statusClass}">${statusLabel}</span>
              <span class="assignee-tag-sm" title="Assigned to ${escapeHtml(task.assigneeName || 'Team Member')}">
                <span class="avatar-micro ${task.assigneeAvatarClass || 'bg-indigo'}">${task.assigneeAvatar || 'U'}</span>
                <span>${escapeHtml(task.assigneeName ? task.assigneeName.split(' ')[0] : 'Assignee')}</span>
              </span>
            </div>
          </div>
        </div>

        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}

        <div class="task-card-footer">
          <div class="task-due-info ${isOverdue ? 'text-rose font-semibold' : ''}">
            <i class="fa-regular fa-calendar"></i>
            <span>${formatFriendlyDueDate(task.dueDate, task.dueTime)}</span>
          </div>

          <div class="task-actions">
            ${isOverdue || (!isToday && !isCompleted) ? `
              <button class="btn-quick-reschedule" data-reschedule-id="${task.id}" title="Reschedule to Today">
                <i class="fa-solid fa-calendar-check text-amber"></i> Today
              </button>
            ` : ''}
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
          <th>Activity Title & Description</th>
          <th style="width: 140px;">Assignee</th>
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
          const horizonMeta = getTaskHorizonMeta(task);

          let statusBadge = isCompleted 
            ? '<span class="badge status-badge-completed">Completed</span>'
            : isOverdue 
              ? '<span class="badge status-badge-overdue">Overdue</span>'
              : '<span class="badge status-badge-pending">Still Not Done</span>';

          return `
            <tr class="${isOverdue ? 'row-overdue' : ''}">
              <td>
                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
              </td>
              <td>
                <span class="task-title" style="${isCompleted ? 'text-decoration: line-through; color: var(--text-subtle);' : ''}">${escapeHtml(task.title)}</span>
                ${task.description ? `<br><small style="color:var(--text-muted); font-size:0.78rem;">${escapeHtml(task.description)}</small>` : ''}
              </td>
              <td>
                <span class="assignee-tag">
                  <span class="avatar-micro ${task.assigneeAvatarClass || 'bg-indigo'}">${task.assigneeAvatar || 'U'}</span>
                  <span>${escapeHtml(task.assigneeName || 'Assigned')}</span>
                </span>
              </td>
              <td><span class="badge ${horizonMeta.badgeClass}">${horizonMeta.label}</span></td>
              <td class="${isOverdue ? 'text-rose font-semibold' : ''}">
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
                <div style="display: inline-flex; gap: 6px; align-items: center;">
                  ${isOverdue || (!isToday && !isCompleted) ? `
                    <button class="btn-quick-reschedule" data-reschedule-id="${task.id}" title="Reschedule to Today">
                      <i class="fa-solid fa-calendar-check text-amber"></i> Today
                    </button>
                  ` : ''}
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
// 10. Task CRUD & Reschedule Operations
// ==========================================================================
function refreshAllViews() {
  updateDashboardUI();
  renderTasksList();
  if (state.currentView === 'calendar') {
    renderCalendar();
  }
}

function toggleTaskStatus(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const wasCompleted = task.status === 'completed';
  task.status = wasCompleted ? 'pending' : 'completed';

  if (!wasCompleted) {
    triggerCelebration();
    showToast(`Activity marked completed! 🎉`, 'success');
  } else {
    showToast(`Activity marked as still not done.`, 'info');
  }

  saveTasks();
  refreshAllViews();
}

function rescheduleTaskToToday(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.dueDate = getTodayDateString();
  task.status = 'pending';
  saveTasks();
  refreshAllViews();
  showToast(`"${task.title}" rescheduled to Today! ☀️`, 'success');
}

function rescheduleAllOverdueToToday() {
  const overdueTasks = state.tasks.filter(isTaskOverdue);
  if (overdueTasks.length === 0) return;

  const todayStr = getTodayDateString();
  overdueTasks.forEach(t => {
    t.dueDate = todayStr;
    t.status = 'pending';
  });

  saveTasks();
  refreshAllViews();
  showToast(`${overdueTasks.length} overdue activities rescheduled to Today! ☀️`, 'success');
}

function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.status === 'completed').length;
  if (completedCount === 0) {
    showToast('No completed activities to clear.', 'info');
    return;
  }

  if (confirm(`Clear all ${completedCount} completed activities from your list?`)) {
    state.tasks = state.tasks.filter(t => t.status !== 'completed');
    saveTasks();
    refreshAllViews();
    showToast(`Cleared ${completedCount} completed activities.`, 'info');
  }
}

function openAddModal(defaultScope = null, specificDate = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const idField = document.getElementById('taskIdField');

  form.reset();
  idField.value = '';
  modalTitle.textContent = 'New Activity';
  modalSubtitle.textContent = 'Create an activity to track today, this week, or this month';

  let defaultDate = specificDate || getTodayDateString();
  if (!specificDate) {
    if (defaultScope === 'tomorrow') {
      defaultDate = getTodayDateString(1);
    } else if (defaultScope === 'week') {
      defaultDate = getTodayDateString(3);
    } else if (defaultScope === 'month') {
      defaultDate = getTodayDateString(14);
    }
  }

  document.getElementById('taskDueDateInput').value = defaultDate;
  document.getElementById('taskDueTimeInput').value = '17:00';
  document.getElementById('taskPrioritySelect').value = 'medium';
  document.getElementById('taskCategorySelect').value = 'Work';
  document.getElementById('taskStatusSelect').value = 'pending';

  const assigneeSelect = document.getElementById('taskAssigneeSelect');
  if (assigneeSelect) {
    const defaultAssignee = state.currentUser ? (state.currentUser.id === 'user-admin' ? 'user-alex' : state.currentUser.id) : 'user-alex';
    assigneeSelect.value = defaultAssignee;
  }

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

  const assigneeSelect = document.getElementById('taskAssigneeSelect');
  if (assigneeSelect) {
    assigneeSelect.value = task.assigneeId || 'user-alex';
  }

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
  if (e) e.preventDefault();

  const id = document.getElementById('taskIdField').value.trim();
  const title = document.getElementById('taskTitleInput').value.trim();
  const description = document.getElementById('taskDescInput').value.trim();
  const dueDate = document.getElementById('taskDueDateInput').value;
  const dueTime = document.getElementById('taskDueTimeInput').value;
  const priority = document.getElementById('taskPrioritySelect').value;
  const category = document.getElementById('taskCategorySelect').value;
  const status = document.getElementById('taskStatusSelect').value;
  const assigneeId = document.getElementById('taskAssigneeSelect')?.value || 'user-alex';

  const assigneeInfo = Object.values(DEMO_USERS).find(u => u.id === assigneeId) || {
    id: assigneeId,
    name: 'Alex Morgan',
    initials: 'AM',
    avatarClass: 'bg-indigo'
  };

  if (!title) {
    showToast('Please enter an activity title.', 'warning');
    return;
  }

  if (id) {
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
        assigneeId: assigneeInfo.id,
        assigneeName: assigneeInfo.name,
        assigneeAvatar: assigneeInfo.initials,
        assigneeAvatarClass: assigneeInfo.avatarClass,
        updatedAt: new Date().toISOString()
      };
      showToast('Activity successfully updated!', 'success');
    }
  } else {
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      description,
      dueDate,
      dueTime,
      priority,
      category,
      status,
      assigneeId: assigneeInfo.id,
      assigneeName: assigneeInfo.name,
      assigneeAvatar: assigneeInfo.initials,
      assigneeAvatarClass: assigneeInfo.avatarClass,
      createdAt: new Date().toISOString()
    };
    state.tasks.unshift(newTask);
    showToast('New activity added to schedule!', 'success');
  }

  saveTasks();
  closeModal();
  refreshAllViews();
}

function deleteTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (confirm(`Delete "${task.title}"?`)) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveTasks();
    showToast('Activity removed.', 'info');
    refreshAllViews();
  }
}

function updateCalculatedScopeHint(dateStr) {
  const hintEl = document.getElementById('horizonCalculatedBadge');
  if (!hintEl || !dateStr) return;

  const dummyTask = { dueDate: dateStr, status: 'pending' };
  if (isTaskToday(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-sun text-amber"></i> Scope: <strong>Today (24h)</strong>';
  } else if (isTaskThisWeek(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-calendar-week text-indigo"></i> Scope: <strong>This Week (7 Days)</strong>';
  } else if (isTaskThisMonth(dummyTask)) {
    hintEl.innerHTML = '<i class="fa-solid fa-calendar-days text-teal"></i> Scope: <strong>This Month (30 Days)</strong>';
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
  const calendarSec = document.getElementById('calendarView');
  const pageTitle = document.getElementById('pageTitle');

  document.querySelectorAll('.sidebar-nav .nav-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  if (viewName !== 'all-tasks') {
    document.querySelectorAll('.sidebar-nav .nav-btn[data-filter-scope]').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  if (viewName === 'dashboard') {
    dashboardSec.style.display = 'flex';
    tasksSec.style.display = 'none';
    if (calendarSec) calendarSec.style.display = 'none';
    pageTitle.textContent = 'Executive Dashboard';
    updateDashboardUI();
  } else if (viewName === 'calendar') {
    dashboardSec.style.display = 'none';
    tasksSec.style.display = 'none';
    if (calendarSec) calendarSec.style.display = 'flex';
    pageTitle.textContent = 'Interactive Calendar';
    renderCalendar();
  } else {
    dashboardSec.style.display = 'none';
    tasksSec.style.display = 'flex';
    if (calendarSec) calendarSec.style.display = 'none';
    pageTitle.textContent = 'Activities Management';
    renderTasksList();
  }
}

function filterByScope(scope) {
  state.filters.scope = scope;

  // If filtering by overdue, reset completed status filter so overdue items are visible
  if (scope === 'overdue' && state.filters.status === 'completed') {
    state.filters.status = 'all';
    const filterStatusSelect = document.getElementById('filterStatusSelect');
    if (filterStatusSelect) filterStatusSelect.value = 'all';
  }

  switchView('all-tasks');

  document.querySelectorAll('#horizonTabs .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-scope') === scope);
  });

  document.querySelectorAll('.sidebar-nav .nav-btn[data-filter-scope]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter-scope') === scope);
  });

  renderTasksList();
}

// ==========================================================================
// 12. Interactive Calendar Module
// ==========================================================================
state.calendarViewDate = new Date();
state.selectedCalendarDate = formatDateToYYYYMMDD(new Date());

function changeCalendarMonth(delta) {
  state.calendarViewDate.setMonth(state.calendarViewDate.getMonth() + delta);
  renderCalendar();
}

function goToTodayCalendar() {
  state.calendarViewDate = new Date();
  state.selectedCalendarDate = formatDateToYYYYMMDD(new Date());
  renderCalendar();
}

function selectCalendarDate(dateStr) {
  state.selectedCalendarDate = dateStr;
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarDaysGrid');
  const monthTitle = document.getElementById('calMonthTitle');
  if (!grid || !monthTitle) return;

  const currentYear = state.calendarViewDate.getFullYear();
  const currentMonth = state.calendarViewDate.getMonth();

  // Set Month Title
  const monthName = state.calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  monthTitle.textContent = monthName;

  // Calendar dates math
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const totalCells = (firstDayIndex + daysInCurrentMonth) > 35 ? 42 : 35;
  const cells = [];
  const todayStr = formatDateToYYYYMMDD(new Date());

  // 1. Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
    const dateStr = formatDateToYYYYMMDD(prevDate);
    cells.push({ dayNum, dateStr, isOtherMonth: true });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const curDate = new Date(currentYear, currentMonth, d);
    const dateStr = formatDateToYYYYMMDD(curDate);
    cells.push({ dayNum: d, dateStr, isOtherMonth: false });
  }

  // 3. Next month leading days
  const remainingCells = totalCells - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(currentYear, currentMonth + 1, d);
    const dateStr = formatDateToYYYYMMDD(nextDate);
    cells.push({ dayNum: d, dateStr, isOtherMonth: true });
  }

  // Render HTML for grid
  grid.innerHTML = cells.map(cell => {
    const isToday = cell.dateStr === todayStr;
    const isSelected = cell.dateStr === state.selectedCalendarDate;
    const dayTasks = state.tasks.filter(t => t.dueDate === cell.dateStr);
    const hasOverdue = dayTasks.some(isTaskOverdue);

    const visibleTasks = dayTasks.slice(0, 3);
    const moreCount = dayTasks.length - 3;

    return `
      <div class="calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${cell.isOtherMonth ? 'other-month' : ''} ${hasOverdue ? 'has-overdue' : ''}" data-cal-date="${cell.dateStr}">
        <div class="cal-cell-header">
          <span class="cal-cell-day-num">${cell.dayNum}</span>
          <div style="display:flex; align-items:center; gap:4px;">
            ${hasOverdue ? `<span class="cal-overdue-tag" title="Contains overdue activities">⚠️ Past Due</span>` : ''}
            ${dayTasks.length > 0 ? `<span class="cal-cell-count-tag">${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
        <div class="cal-task-chips">
          ${visibleTasks.map(t => {
            const isDone = t.status === 'completed';
            const isOverdue = isTaskOverdue(t);
            let dotColor = '#38bdf8';
            if (isOverdue) dotColor = '#e11d48';
            else if (t.priority === 'high') dotColor = '#f43f5e';
            else if (t.priority === 'medium') dotColor = '#f59e0b';

            return `
              <div class="cal-chip ${isDone ? 'is-done' : ''} ${isOverdue ? 'is-overdue' : ''}" data-task-id="${t.id}" title="${escapeHtml(t.title)} (${isOverdue ? 'Overdue - ' : ''}${capitalize(t.priority)} Priority)">
                <span style="width:5px; height:5px; border-radius:50%; background:${dotColor}; flex-shrink:0; display:inline-block;"></span>
                <span>${escapeHtml(t.title)}</span>
              </div>
            `;
          }).join('')}
          ${moreCount > 0 ? `<span class="cal-more-chip">+${moreCount} more</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Update Day Inspector
  renderDayInspector();
}

function renderDayInspector() {
  const titleEl = document.getElementById('inspectorDateTitle');
  const countEl = document.getElementById('inspectorTaskCount');
  const listEl = document.getElementById('inspectorTasksList');
  if (!titleEl || !countEl || !listEl) return;

  const selDate = parseDate(state.selectedCalendarDate);
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  titleEl.textContent = selDate.toLocaleDateString(undefined, options);

  const dayTasks = state.tasks.filter(t => t.dueDate === state.selectedCalendarDate);
  countEl.textContent = `${dayTasks.length} ${dayTasks.length === 1 ? 'Activity' : 'Activities'}`;

  if (dayTasks.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:36px 12px; color:var(--text-muted); background:var(--bg-surface-elevated); border-radius:var(--radius-md);">
        <i class="fa-regular fa-calendar-plus" style="font-size:1.8rem; margin-bottom:8px; display:inline-block; color:var(--text-subtle);"></i>
        <p style="font-size:0.84rem;">No activities scheduled on this date.</p>
        <button class="btn-subtle" id="emptyDayAddBtn" style="margin-top:10px; font-size:0.78rem;">
          <i class="fa-solid fa-plus"></i> Add Activity
        </button>
      </div>
    `;
    document.getElementById('emptyDayAddBtn')?.addEventListener('click', () => {
      openAddModal(null, state.selectedCalendarDate);
    });
    return;
  }

  listEl.innerHTML = dayTasks.map(task => {
    const isCompleted = task.status === 'completed';
    const isOverdue = isTaskOverdue(task);
    const isToday = isTaskToday(task);
    const horizonMeta = getTaskHorizonMeta(task);

    return `
      <div class="inspector-task-card ${isCompleted ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''}">
        <div class="inspector-task-top">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} title="Toggle completed">
          <span class="inspector-task-title ${isCompleted ? 'text-line-through' : ''}">${escapeHtml(task.title)}</span>
          <div style="display:inline-flex; gap:6px; align-items:center; margin-left:auto;">
            ${isOverdue || (!isToday && !isCompleted) ? `
              <button class="btn-quick-reschedule" data-reschedule-id="${task.id}" title="Reschedule to Today">
                <i class="fa-solid fa-calendar-check text-amber"></i> Today
              </button>
            ` : ''}
            <button class="action-icon-btn btn-edit" data-edit-id="${task.id}" title="Edit activity">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </div>
        ${task.description ? `<p style="font-size:0.78rem; color:var(--text-muted); line-height:1.4; padding-left:26px;">${escapeHtml(task.description)}</p>` : ''}
        <div class="inspector-task-meta" style="padding-left:26px;">
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <span class="badge ${horizonMeta.badgeClass}">${horizonMeta.label}</span>
            <span class="badge ${getPriorityBadgeClass(task.priority)}">${capitalize(task.priority)}</span>
            <span class="badge badge-scope">${escapeHtml(task.category || 'General')}</span>
          </div>
          <span class="${isOverdue ? 'text-rose font-semibold' : ''}">${isOverdue ? formatFriendlyDueDate(task.dueDate, task.dueTime) : (task.dueTime ? formatTime(task.dueTime) : 'All Day')}</span>
        </div>
      </div>
    `;
  }).join('');
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
// 13. User Authentication & Profile Management
// ==========================================================================
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function initUserSession() {
  try {
    const stored = localStorage.getItem(USER_SESSION_KEY);
    if (stored) {
      state.currentUser = JSON.parse(stored);
    } else {
      state.currentUser = DEMO_USERS.alex;
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(state.currentUser));
    }
  } catch (err) {
    console.error('Failed to parse user session:', err);
    state.currentUser = DEMO_USERS.alex;
  }
  // Setup default scopes based on roleType
  if (state.currentUser && state.currentUser.roleType === 'admin') {
    state.filters.userScope = 'all';
    state.filters.selectedMember = 'all';
  } else {
    state.filters.userScope = 'my';
    state.filters.selectedMember = 'all';
  }
  updateUserUI();
}

function setUserSession(user, persist = true) {
  state.currentUser = user;
  if (user && user.roleType === 'admin') {
    state.filters.userScope = 'all';
    state.filters.selectedMember = 'all';
  } else {
    state.filters.userScope = 'my';
    state.filters.selectedMember = 'all';
  }

  if (persist && user) {
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not persist session', e);
    }
  } else if (!user) {
    localStorage.removeItem(USER_SESSION_KEY);
  }

  // Synchronize member select dropdowns
  const adminMemberSelect = document.getElementById('adminMemberSelect');
  if (adminMemberSelect) adminMemberSelect.value = state.filters.selectedMember;
  const filterMemberSelect = document.getElementById('filterMemberSelect');
  if (filterMemberSelect) filterMemberSelect.value = state.filters.selectedMember;

  updateUserUI();
  updateDashboardUI();
  renderTasksList();
  renderCalendar();
}

function updateUserUI() {
  const user = state.currentUser || {
    name: 'Guest User',
    role: 'Guest Access',
    email: 'guest@horizon.app',
    roleType: 'user',
    initials: 'GU',
    avatarClass: 'bg-gray'
  };

  const avatarClass = user.avatarClass || 'bg-indigo';
  const initials = user.initials || getInitials(user.name);
  const isAdmin = user.roleType === 'admin';

  // 1. Top Navbar
  const navAvatar = document.getElementById('navAvatar');
  const navUserName = document.getElementById('navUserName');
  const navUserRole = document.getElementById('navUserRole');
  if (navAvatar) {
    navAvatar.textContent = initials;
    navAvatar.className = `user-avatar ${avatarClass}`;
  }
  if (navUserName) navUserName.textContent = user.name;
  if (navUserRole) navUserRole.textContent = user.role;

  // Status Badge in Navbar
  const statusBadge = document.getElementById('systemStatusBadge');
  if (statusBadge) {
    if (isAdmin) {
      statusBadge.innerHTML = '<span class="status-indicator" style="background:#f43f5e;"></span> 👑 Administrator';
      statusBadge.classList.add('pill-admin');
    } else {
      statusBadge.innerHTML = '<span class="status-indicator" style="background:#10b981;"></span> 👤 Team Member';
      statusBadge.classList.remove('pill-admin');
    }
  }

  // Navigation Items Dynamic Names & Icons
  const navDashboardText = document.getElementById('navDashboardText');
  const navDashboardIcon = document.getElementById('navDashboardIcon');
  const navTasksText = document.getElementById('navTasksText');

  if (navDashboardText) navDashboardText.textContent = isAdmin ? 'Admin Dashboard' : 'User Dashboard';
  if (navDashboardIcon) {
    navDashboardIcon.className = isAdmin ? 'fa-solid fa-chart-pie' : 'fa-solid fa-compass';
  }
  if (navTasksText) navTasksText.textContent = isAdmin ? 'All Team Activities' : 'My Activities';

  // 2. Sidebar Footer Card
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserRole = document.getElementById('sidebarUserRole');
  if (sidebarAvatar) {
    sidebarAvatar.textContent = initials;
    sidebarAvatar.className = `user-avatar-sm ${avatarClass}`;
  }
  if (sidebarUserName) sidebarUserName.textContent = user.name;
  if (sidebarUserRole) sidebarUserRole.textContent = user.role;

  // 3. Dropdown Menu Header
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserEmail = document.getElementById('dropdownUserEmail');
  const dropdownUserRole = document.getElementById('dropdownUserRole');
  if (dropdownAvatar) {
    dropdownAvatar.textContent = initials;
    dropdownAvatar.className = `user-avatar-lg ${avatarClass}`;
  }
  if (dropdownUserName) dropdownUserName.textContent = user.name;
  if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@horizon.app`;
  if (dropdownUserRole) dropdownUserRole.textContent = user.role;
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (!dropdown) return;
  const isClosed = dropdown.style.display === 'none' || !dropdown.style.display;
  dropdown.style.display = isClosed ? 'flex' : 'none';
}

function closeUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.style.display = 'none';
}

function openAuthModal(mode = 'signin') {
  state.authMode = mode;
  closeUserDropdown();

  const modal = document.getElementById('authModal');
  const titleEl = document.getElementById('authModalTitle');
  const subtitleEl = document.getElementById('authModalSubtitle');
  const tabSignIn = document.getElementById('tabSignInBtn');
  const tabSignUp = document.getElementById('tabSignUpBtn');
  const nameGroup = document.getElementById('authNameGroup');
  const roleGroup = document.getElementById('authRoleGroup');
  const accountTypeGroup = document.getElementById('authAccountTypeGroup');
  const submitText = document.getElementById('submitAuthBtnText');

  if (mode === 'signup') {
    tabSignIn?.classList.remove('active');
    tabSignUp?.classList.add('active');
    if (titleEl) titleEl.textContent = 'Create New Account';
    if (subtitleEl) subtitleEl.textContent = 'Set up your executive profile and personalize your workspace';
    if (nameGroup) nameGroup.style.display = 'block';
    if (roleGroup) roleGroup.style.display = 'block';
    if (accountTypeGroup) accountTypeGroup.style.display = 'block';
    if (submitText) submitText.textContent = 'Create Account';
    setTimeout(() => document.getElementById('authNameInput')?.focus(), 100);
  } else {
    tabSignIn?.classList.add('active');
    tabSignUp?.classList.remove('active');
    if (titleEl) titleEl.textContent = 'Account Sign In';
    if (subtitleEl) subtitleEl.textContent = 'Sign in to sync activities and personalize your horizon workspace';
    if (nameGroup) nameGroup.style.display = 'none';
    if (roleGroup) roleGroup.style.display = 'none';
    if (accountTypeGroup) accountTypeGroup.style.display = 'none';
    if (submitText) submitText.textContent = 'Sign In';
    setTimeout(() => document.getElementById('authEmailInput')?.focus(), 100);
  }

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function switchDemoUser(profileKey) {
  const profile = DEMO_USERS[profileKey];
  if (!profile) return;
  setUserSession(profile, true);
  closeUserDropdown();
  closeAuthModal();
  showToast(`Signed in as ${profile.name} (${profile.role}) ✨`, 'success');
}

function handleAuthFormSubmit(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('authEmailInput')?.value.trim();
  const password = document.getElementById('authPasswordInput')?.value.trim();
  const remember = document.getElementById('authRememberCheckbox')?.checked ?? true;

  if (!email || !password) {
    showToast('Please enter both email and password.', 'warning');
    return;
  }

  if (state.authMode === 'signup') {
    const name = document.getElementById('authNameInput')?.value.trim() || 'New User';
    const accountType = document.getElementById('authAccountTypeSelect')?.value || 'user';
    const defaultRole = accountType === 'admin' ? 'Organization Administrator' : 'Team Member';
    const role = document.getElementById('authRoleInput')?.value.trim() || defaultRole;
    const initials = getInitials(name);
    const avatarClass = accountType === 'admin' ? 'bg-rose' : 'bg-indigo';

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      role,
      email,
      roleType: accountType,
      initials,
      avatarClass
    };

    setUserSession(newUser, remember);
    closeAuthModal();
    triggerCelebration();
    showToast(`Welcome aboard, ${name}! Your ${accountType === 'admin' ? 'Admin' : 'User'} account is active. 🎉`, 'success');
  } else {
    // Check if matches one of demo users
    const matchedDemo = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matchedDemo) {
      setUserSession(matchedDemo, remember);
      closeAuthModal();
      showToast(`Welcome back, ${matchedDemo.name}! 👋`, 'success');
    } else {
      // Derive role & name from email
      const emailPrefix = email.split('@')[0];
      const derivedName = emailPrefix
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ') || 'User';

      const isAdminEmail = email.toLowerCase().includes('admin');
      const customUser = {
        id: `user-${Date.now()}`,
        name: derivedName,
        role: isAdminEmail ? 'Organization Administrator' : 'Executive Member',
        email,
        roleType: isAdminEmail ? 'admin' : 'user',
        initials: getInitials(derivedName),
        avatarClass: isAdminEmail ? 'bg-rose' : 'bg-indigo'
      };

      setUserSession(customUser, remember);
      closeAuthModal();
      showToast(`Signed in successfully as ${derivedName}! 👋`, 'success');
    }
  }

  // Clear inputs
  const emailInput = document.getElementById('authEmailInput');
  const passInput = document.getElementById('authPasswordInput');
  const nameInput = document.getElementById('authNameInput');
  const roleInput = document.getElementById('authRoleInput');
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (nameInput) nameInput.value = '';
  if (roleInput) roleInput.value = '';
}

function handleSignOut() {
  closeUserDropdown();
  const guestUser = {
    id: 'user-guest',
    name: 'Guest User',
    role: 'Guest Access',
    email: 'guest@horizon.app',
    roleType: 'user',
    initials: 'GU',
    avatarClass: 'bg-gray'
  };
  setUserSession(guestUser, false);
  localStorage.removeItem(USER_SESSION_KEY);
  showToast('Signed out. You are now browsing as Guest.', 'info');
}

// Admin Team Functions
function exportTeamAuditReport() {
  const stats = calculateStats();
  const overdueTasks = state.tasks.filter(isTaskOverdue);
  const auditData = {
    exportedAt: new Date().toISOString(),
    organization: 'TaskHorizon Executive Workspace',
    administrator: state.currentUser ? state.currentUser.name : 'Eleanor Vance',
    adminEmail: state.currentUser ? state.currentUser.email : 'admin@horizon.app',
    overallMetrics: {
      totalActivities: stats.total,
      completedActivities: stats.completed,
      pendingActivities: stats.stillNotDone,
      overdueActivities: stats.overdue,
      orgVelocity: `${stats.percent}%`
    },
    teamWorkloadBreakdown: stats.memberStats.map(m => ({
      memberId: m.id,
      name: m.name,
      role: m.role,
      email: m.email,
      totalAssigned: m.total,
      completed: m.completed,
      pending: m.pending,
      overdue: m.overdue,
      completionRate: `${m.percent}%`,
      status: m.overdue > 0 ? 'Action Needed' : 'On Track'
    })),
    escalatedOverdueActivities: overdueTasks.map(t => ({
      id: t.id,
      title: t.title,
      assigneeName: t.assigneeName,
      dueDate: t.dueDate,
      priority: t.priority,
      category: t.category
    }))
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `taskhorizon-team-audit-${formatDateToYYYYMMDD(new Date())}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Team Audit Report exported successfully! 📋', 'success');
}

function rescheduleMemberOverdueToToday(memberId) {
  const overdueTasks = state.tasks.filter(t => isTaskOverdue(t) && t.assigneeId === memberId);
  if (overdueTasks.length === 0) {
    showToast('No overdue activities for this team member 👍', 'info');
    return;
  }

  const todayStr = getTodayDateString();
  const memberName = overdueTasks[0].assigneeName || 'Member';
  overdueTasks.forEach(t => {
    t.dueDate = todayStr;
    t.status = 'pending';
  });

  saveTasks();
  refreshAllViews();
  triggerCelebration();
  showToast(`Rescheduled ${overdueTasks.length} overdue tasks for ${memberName} to Today! ☀️`, 'success');
}

// ==========================================================================
// 14. UI Enhancements: Toast, Confetti, Theme
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info text-indigo';
  if (type === 'success') icon = 'fa-circle-check text-emerald';
  if (type === 'warning') icon = 'fa-triangle-exclamation text-rose';

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
      particleCount: 65,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#38bdf8']
    });
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  const toggleCheckbox = document.getElementById('themeToggleCheckbox');
  const themeLabelText = document.getElementById('themeLabelText');

  if (toggleCheckbox) {
    toggleCheckbox.checked = savedTheme === 'dark';
  }
  if (themeLabelText) {
    themeLabelText.innerHTML = savedTheme === 'dark' 
      ? '<i class="fa-solid fa-moon text-indigo"></i> Pastel Dusk' 
      : '<i class="fa-solid fa-wand-magic-sparkles text-amber"></i> Pastel Day';
  }
}

function toggleTheme(isDark) {
  const theme = isDark ? 'dark' : 'light';
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const themeLabelText = document.getElementById('themeLabelText');
  if (themeLabelText) {
    themeLabelText.innerHTML = isDark 
      ? '<i class="fa-solid fa-moon text-indigo"></i> Pastel Dusk' 
      : '<i class="fa-solid fa-wand-magic-sparkles text-amber"></i> Pastel Day';
  }

  const stats = calculateStats();
  renderCharts(stats);
}

// ==========================================================================
// 15. Event Listeners & Application Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUserSession();
  loadTasks();

  // Set today's formatted date in navbar
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

  // Initial UI Render
  updateDashboardUI();
  renderTasksList();

  // User Scope Toggles (Dashboard & Tasks View)
  document.querySelectorAll('[data-user-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.getAttribute('data-user-scope');
      if (scope) {
        state.filters.userScope = scope;
        document.querySelectorAll('[data-user-scope]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-user-scope') === scope);
        });
        updateDashboardUI();
        renderTasksList();
      }
    });
  });

  // Admin & Team Member Filter Selects
  const adminMemberSelect = document.getElementById('adminMemberSelect');
  if (adminMemberSelect) {
    adminMemberSelect.addEventListener('change', (e) => {
      state.filters.selectedMember = e.target.value;
      const filterMemberSelect = document.getElementById('filterMemberSelect');
      if (filterMemberSelect) filterMemberSelect.value = e.target.value;
      renderTasksList();
      updateDashboardUI();
    });
  }

  const filterMemberSelect = document.getElementById('filterMemberSelect');
  if (filterMemberSelect) {
    filterMemberSelect.addEventListener('change', (e) => {
      state.filters.selectedMember = e.target.value;
      if (adminMemberSelect) adminMemberSelect.value = e.target.value;
      renderTasksList();
      updateDashboardUI();
    });
  }

  // Admin Command Action Buttons
  document.getElementById('adminRebalanceBtn')?.addEventListener('click', () => {
    if (state.filters.selectedMember && state.filters.selectedMember !== 'all') {
      rescheduleMemberOverdueToToday(state.filters.selectedMember);
    } else {
      rescheduleAllOverdueToToday();
    }
  });

  document.getElementById('adminExportAuditBtn')?.addEventListener('click', exportTeamAuditReport);

  // Navigation View Switchers
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

  // Metric Cards
  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const scope = card.getAttribute('data-filter');
      if (scope) filterByScope(scope);
    });
  });

  // Hero Pills
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

  // Overdue Banner Actions
  document.getElementById('rescheduleAllOverdueBtn')?.addEventListener('click', rescheduleAllOverdueToToday);
  document.getElementById('viewOverdueBannerBtn')?.addEventListener('click', () => filterByScope('overdue'));

  // Print Report Button
  document.getElementById('printReportBtn')?.addEventListener('click', () => {
    window.print();
  });

  // Clear Completed Tasks
  document.getElementById('clearCompletedBtn')?.addEventListener('click', clearCompletedTasks);

  // Filters & Controls
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

  // Category filter clicks delegation
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

  // Modal Open / Close & Form Submit
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

  // Global Event Delegation for Checkbox, Reschedule, Edit, Delete
  document.addEventListener('click', (e) => {
    // Checkbox toggle
    if (e.target.classList.contains('task-checkbox')) {
      const taskId = e.target.getAttribute('data-id');
      if (taskId) toggleTaskStatus(taskId);
      return;
    }

    // Quick reschedule button
    const rescheduleBtn = e.target.closest('[data-reschedule-id]');
    if (rescheduleBtn) {
      const taskId = rescheduleBtn.getAttribute('data-reschedule-id');
      if (taskId) rescheduleTaskToToday(taskId);
      return;
    }

    // Member card inspect activities button
    const inspectBtn = e.target.closest('.btn-inspect-member');
    if (inspectBtn) {
      const memberId = inspectBtn.getAttribute('data-member-id');
      if (memberId) {
        state.filters.selectedMember = memberId;
        const adminMemberSelect = document.getElementById('adminMemberSelect');
        const filterMemberSelect = document.getElementById('filterMemberSelect');
        if (adminMemberSelect) adminMemberSelect.value = memberId;
        if (filterMemberSelect) filterMemberSelect.value = memberId;
        switchView('all-tasks');
        renderTasksList();
      }
      return;
    }

    // Member overdue reschedule button
    const memberRescheduleBtn = e.target.closest('.btn-member-reschedule');
    if (memberRescheduleBtn) {
      const memberId = memberRescheduleBtn.getAttribute('data-member-reschedule');
      if (memberId) {
        rescheduleMemberOverdueToToday(memberId);
      }
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

  // Theme Toggle Checkbox
  const themeToggle = document.getElementById('themeToggleCheckbox');
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      toggleTheme(e.target.checked);
    });
  }

  // Export, Import, Reset, and 55 Demo Tasks
  document.getElementById('loadDemoDataBtn')?.addEventListener('click', () => {
    state.tasks = generateInitialSampleTasks();
    saveTasks();
    refreshAllViews();
    showToast('Loaded 55 demo activities across all horizons! 🎉', 'success');
  });
  document.getElementById('exportDataBtn')?.addEventListener('click', exportTasksToJSON);
  document.getElementById('importDataInput')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importTasksFromJSON(e.target.files[0]);
    }
  });
  document.getElementById('resetDataBtn')?.addEventListener('click', resetToDefaultTasks);

  // Calendar Controls & Grid Delegations
  document.getElementById('calPrevMonthBtn')?.addEventListener('click', () => changeCalendarMonth(-1));
  document.getElementById('calNextMonthBtn')?.addEventListener('click', () => changeCalendarMonth(1));
  document.getElementById('calTodayBtn')?.addEventListener('click', goToTodayCalendar);
  document.getElementById('calQuickAddBtn')?.addEventListener('click', () => openAddModal(null, state.selectedCalendarDate));
  document.getElementById('inspectorAddBtn')?.addEventListener('click', () => openAddModal(null, state.selectedCalendarDate));

  document.getElementById('calendarDaysGrid')?.addEventListener('click', (e) => {
    const cell = e.target.closest('[data-cal-date]');
    if (cell) {
      const dateStr = cell.getAttribute('data-cal-date');
      if (dateStr) selectCalendarDate(dateStr);
    }
  });

  // Mobile Sidebar Drawer
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

  // User Authentication & Profile Interactions
  document.getElementById('userProfileBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserDropdown();
  });

  document.getElementById('userDropdown')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.querySelectorAll('.demo-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const profileKey = btn.getAttribute('data-user-profile');
      if (profileKey) switchDemoUser(profileKey);
    });
  });

  document.querySelectorAll('.demo-login-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const loginKey = pill.getAttribute('data-login');
      if (loginKey) switchDemoUser(loginKey);
    });
  });

  document.getElementById('openAuthModalBtn')?.addEventListener('click', () => openAuthModal('signin'));
  document.getElementById('sidebarAuthTriggerBtn')?.addEventListener('click', () => openAuthModal('signin'));
  document.getElementById('closeAuthModalBtn')?.addEventListener('click', closeAuthModal);
  document.getElementById('cancelAuthModalBtn')?.addEventListener('click', closeAuthModal);

  const authModalEl = document.getElementById('authModal');
  if (authModalEl) {
    authModalEl.addEventListener('click', (e) => {
      if (e.target === authModalEl) closeAuthModal();
    });
  }

  document.getElementById('tabSignInBtn')?.addEventListener('click', () => openAuthModal('signin'));
  document.getElementById('tabSignUpBtn')?.addEventListener('click', () => openAuthModal('signup'));
  document.getElementById('authForm')?.addEventListener('submit', handleAuthFormSubmit);
  document.getElementById('logoutBtn')?.addEventListener('click', handleSignOut);

  document.getElementById('authForgotLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmailInput')?.value || 'your registered email';
    showToast(`Password reset link sent to ${email} 📧`, 'info');
  });

  // Dismiss dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#userProfileMenu')) {
      closeUserDropdown();
    }
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeAuthModal();
      closeUserDropdown();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      globalSearchInput?.focus();
    }
    // Ctrl + Enter to submit form when modal is open
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (taskModal && taskModal.classList.contains('open')) {
        handleSaveTaskForm();
      }
    }
  });
});
