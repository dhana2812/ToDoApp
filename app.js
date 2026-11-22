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

// Check if task is scheduled for This Week (Calendar week or within next 7 days)
function isTaskThisWeek(task) {
  if (!task.dueDate) return false;
  const taskDate = parseDate(task.dueDate);
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const inCalWeek = taskDate >= weekStart && taskDate <= weekEnd;
  const todayStart = getStartOfToday();
  const inNext7Days = taskDate >= todayStart && taskDate <= new Date(todayStart.getTime() + 7 * 86400000);
  return inCalWeek || inNext7Days;
}

// Check if task is scheduled for This Month (Calendar month or within next 30 days)
function isTaskThisMonth(task) {
  if (!task.dueDate) return false;
  const taskDate = parseDate(task.dueDate);
  const now = new Date();
  const inCalMonth = taskDate.getFullYear() === now.getFullYear() && taskDate.getMonth() === now.getMonth();
  const todayStart = getStartOfToday();
  const inNext30Days = taskDate >= todayStart && taskDate <= new Date(todayStart.getTime() + 30 * 86400000);
  return inCalMonth || inNext30Days;
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
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
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

  return [
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

  // Sidebar Counts
  setElementText('countAll', stats.total);
  setElementText('countToday', stats.today.total);
  setElementText('countWeek', stats.week.total);
  setElementText('countMonth', stats.month.total);
  setElementText('countOverdue', stats.overdue);

  // Tab Counts
  setElementText('tabCountAll', stats.total);
  setElementText('tabCountToday', stats.today.total);
  setElementText('tabCountWeek', stats.week.total);
  setElementText('tabCountMonth', stats.month.total);
  setElementText('tabCountOverdue', stats.overdue);

  // Sidebar Productivity Mini-Gauge
  setElementText('sidebarProdRate', `${stats.percent}%`);
  setElementWidth('sidebarProdFill', `${stats.percent}%`);

  // Hero Card & Radial Meter
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
    heroGreetingText.textContent = `${timeGreeting}! Here's your executive activity outlook.`;
  }

  if (heroSummaryText) {
    if (stats.overdue > 0) {
      heroSummaryText.innerHTML = `⚠️ You have <strong style="color:var(--status-overdue);">${stats.overdue} overdue activities</strong> requiring prompt action, and <strong>${stats.today.pending} tasks</strong> remaining today.`;
    } else if (stats.today.pending > 0) {
      heroSummaryText.innerHTML = `🎯 <strong>${stats.today.pending} activities</strong> scheduled for today. You are making steady progress!`;
    } else if (stats.total > 0 && stats.completed === stats.total) {
      heroSummaryText.innerHTML = `🎉 Outstanding execution! All activities have been successfully marked completed.`;
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

  // Overdue Callout Banner
  const overdueBanner = document.getElementById('overdueCalloutBanner');
  if (overdueBanner) {
    if (stats.overdue > 0) {
      overdueBanner.style.display = 'flex';
      setElementText('overdueCalloutTitle', `Attention: ${stats.overdue} Overdue Activities Detected`);
      setElementText('overdueCalloutDesc', `You have ${stats.overdue} activities past due. Reschedule them to Today with one click or review them.`);
    } else {
      overdueBanner.style.display = 'none';
    }
  }

  // Update Dynamic Date Subtitles
  updateDateSubtitles();

  // Metric Cards
  setElementText('statTodayTotal', stats.today.total);
  setElementText('statTodayPending', `${stats.today.pending} still not done`);
  setElementText('statTodayDone', `${stats.today.done} done`);
  const todayFill = stats.today.total > 0 ? (stats.today.done / stats.today.total) * 100 : 0;
  setElementWidth('barTodayProgress', `${todayFill}%`);

  setElementText('statWeekTotal', stats.week.total);
  setElementText('statWeekPending', `${stats.week.pending} still not done`);
  setElementText('statWeekDone', `${stats.week.done} done`);
  const weekFill = stats.week.total > 0 ? (stats.week.done / stats.week.total) * 100 : 0;
  setElementWidth('barWeekProgress', `${weekFill}%`);

  setElementText('statMonthTotal', stats.month.total);
  setElementText('statMonthPending', `${stats.month.pending} still not done`);
  setElementText('statMonthDone', `${stats.month.done} done`);
  const monthFill = stats.month.total > 0 ? (stats.month.done / stats.month.total) * 100 : 0;
  setElementWidth('barMonthProgress', `${monthFill}%`);

  setElementText('statOverdueTotal', stats.overdue);
  setElementText('statOverdueAdvice', stats.overdue > 0 ? 'Requires immediate attention' : 'Zero overdue items 👍');

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

  const todayTasks = state.tasks.filter(isTaskToday);

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
              <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
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
            backgroundColor: isDark ? '#16223b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
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
            backgroundColor: isDark ? '#16223b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
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
              font: { size: 11, family: 'Plus Jakarta Sans' }
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#16223b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
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
    const isWeek = isTaskThisWeek(task);
    const isMonth = isTaskThisMonth(task);

    let horizonLabel = 'Horizon';
    let horizonClass = '';
    if (isToday) {
      horizonLabel = '☀️ Today';
      horizonClass = 'scope-today';
    } else if (isWeek) {
      horizonLabel = '📅 This Week';
      horizonClass = 'scope-week';
    } else if (isMonth) {
      horizonLabel = '🗓️ This Month';
      horizonClass = 'scope-month';
    }

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
            ? '<span class="badge scope-today">☀️ Today</span>'
            : isTaskThisWeek(task)
              ? '<span class="badge scope-week">📅 This Week</span>'
              : isTaskThisMonth(task)
                ? '<span class="badge scope-month">🗓️ This Month</span>'
                : '<span class="badge">Future</span>';

          return `
            <tr>
              <td>
                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
              </td>
              <td>
                <span class="task-title" style="${isCompleted ? 'text-decoration: line-through; color: var(--text-subtle);' : ''}">${escapeHtml(task.title)}</span>
                ${task.description ? `<br><small style="color:var(--text-muted); font-size:0.78rem;">${escapeHtml(task.description)}</small>` : ''}
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
  updateDashboardUI();
  renderTasksList();
}

function rescheduleTaskToToday(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.dueDate = getTodayDateString();
  task.status = 'pending';
  saveTasks();
  updateDashboardUI();
  renderTasksList();
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
  updateDashboardUI();
  renderTasksList();
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
    updateDashboardUI();
    renderTasksList();
    showToast(`Cleared ${completedCount} completed activities.`, 'info');
  }
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
  if (e) e.preventDefault();

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

  if (confirm(`Delete "${task.title}"?`)) {
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
  const pageTitle = document.getElementById('pageTitle');

  document.querySelectorAll('.sidebar-nav .nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  if (viewName === 'dashboard') {
    dashboardSec.style.display = 'flex';
    tasksSec.style.display = 'none';
    pageTitle.textContent = 'Executive Dashboard';
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
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  const toggleCheckbox = document.getElementById('themeToggleCheckbox');
  const themeLabelText = document.getElementById('themeLabelText');

  if (toggleCheckbox) {
    toggleCheckbox.checked = savedTheme === 'dark';
  }
  if (themeLabelText) {
    themeLabelText.innerHTML = savedTheme === 'dark' 
      ? '<i class="fa-solid fa-moon"></i> Dark Theme' 
      : '<i class="fa-solid fa-sun"></i> Light Theme';
  }
}

function toggleTheme(isDark) {
  const theme = isDark ? 'dark' : 'light';
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const themeLabelText = document.getElementById('themeLabelText');
  if (themeLabelText) {
    themeLabelText.innerHTML = isDark 
      ? '<i class="fa-solid fa-moon"></i> Dark Theme' 
      : '<i class="fa-solid fa-sun"></i> Light Theme';
  }

  const stats = calculateStats();
  renderCharts(stats);
}

// ==========================================================================
// 14. Event Listeners & Application Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
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
    updateDashboardUI();
    renderTasksList();
    showToast('Loaded 55 demo activities across all horizons! 🎉', 'success');
  });
  document.getElementById('exportDataBtn')?.addEventListener('click', exportTasksToJSON);
  document.getElementById('importDataInput')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importTasksFromJSON(e.target.files[0]);
    }
  });
  document.getElementById('resetDataBtn')?.addEventListener('click', resetToDefaultTasks);

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

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
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
