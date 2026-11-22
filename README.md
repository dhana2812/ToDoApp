# TaskHorizon - Executive Activity & Time-Horizon Tracker

A professional, responsive To-Do and Activity Management web application engineered for executive clarity, team delegation, and seamless time-horizon tracking across:
- ☀️ **Today** (24-Hour Horizon)
- 📅 **This Week** (7-Day Horizon)
- 🗓️ **This Month** (30-Day Strategic Horizon)
- ⚠️ **Overdue Tracker** (Immediate attention items past their scheduled due date)

---

## 🌟 Key Features

### 1. Dual Dashboard Views: Admin vs Individual User
- 👑 **Admin Command Center**:
  - **Organization-Wide Oversight**: Monitors all 55 team activities across members with org completion velocity and overdue alerts.
  - **Live Team Workload Grid**: Cards for each team member (**Alex Morgan**, **Sarah Chen**, **David Kumar**) showcasing individual assigned counts, completed, pending, overdue metrics, and animated progress bars.
  - **1-Click Member Activity Inspection**: Jump directly to tasks filtered to any specific team member.
  - **Administrative Overdue Escalation & Rebalance**: Bulk reschedule overdue tasks across the team or per selected member with one click.
  - **Executive Team Audit Report Export**: Download JSON audit report containing organizational metrics, per-member completion rates, and an escalated overdue activity register.
  - **Cross-Member Workload Analytics**: Chart.js comparative stacked bar chart contrasting assigned vs completed workload across all active team members.
- 👤 **Individual User Workspace**:
  - **Personal Horizon Workspace**: Tailored outlook addressing the user personally (*"Good morning, Alex!"*).
  - **Personal Horizon KPIs**: Metrics and progress rings reflect the individual's assigned activities ("My Today", "My This Week", "My This Month", "My Overdue").
  - **Personal Focus Checklist**: Quick actions focused on the user's immediate tasks for the day.
  - **Workspace Scope Toggle**: Instant toggle between **"My Activities"** (personal horizon) and **"Team Shared"** (all 55 team activities) directly from the dashboard and tasks view.

### 2. Individual Sign-In & Role-Based Authentication
- **1-Click Demo Profiles (Admin & Individual)**:
  - 👑 **Eleanor Vance** (`admin@horizon.app`) — Organization Administrator (Admin Dashboard)
  - 👤 **Alex Morgan** (`alex.morgan@company.com`) — Executive Director (19 assigned activities)
  - 👤 **Sarah Chen** (`sarah.chen@product.io`) — Senior Product Manager (18 assigned activities)
  - 👤 **David Kumar** (`david.k@techlead.dev`) — Principal Architect (18 assigned activities)
- **Role-Based Dynamic Navigation**:
  - Navbar and sidebar dynamically adapt titles and icons: `"Admin Dashboard"` (chart-pie) vs `"User Dashboard"` (compass), and `"All Team Activities"` vs `"My Activities"`.
  - Executive status badge in navbar: `👑 Administrator` (crimson) vs `👤 Team Member` (emerald).
- **Custom Sign In / Sign Up Modal**:
  - Full modal supporting sign in or registration with role designation (User vs Admin) and automatic avatar generation.
  - Persistent browser session storage with `localStorage`.

### 3. Task Assignment & Delegation
- Every task includes an **Assignee** with initials, name, and colored avatar tag (`AM` Alex, `SC` Sarah, `DK` David).
- **Task Modal Assignee Selector**: Assign new activities to any team member or reassign existing ones.
- **Table & Grid Assignee Badges**: Displays task owner on cards, table rows, and dashboard focus items.
- **Admin Member Sorter & Filter**: Filter views by individual team member or organization-wide.

### 4. 55 Preloaded Demo Activities
- Complete dataset preloaded across **Work**, **Project**, **Finance**, **Health**, **Study**, and **Personal** categories:
  - **Alex Morgan**: 19 tasks (5 completed, 11 pending, 3 overdue)
  - **Sarah Chen**: 18 tasks (5 completed, 11 pending, 2 overdue)
  - **David Kumar**: 18 tasks (4 completed, 12 pending, 2 overdue)
  - **Total**: 14 completed, 34 pending, 7 overdue = 55 activities!
- One-click **"55 Demo Tasks"** button in sidebar footer to restore initial dataset anytime.

### 5. Interactive Calendar View
- **Monthly Grid**: Full 35/42-cell calendar plotting all activities on their due dates.
- **Task Chips & Indicators**: Color-coded chips with priority dots, category badges, and overdue alert tags.
- **Day Inspector Side Panel**: Clicking any day opens the inspector detailing scheduled activities, status toggles, edits, and 1-click overdue reschedule buttons.
- **Month Navigation**: Jump between months or click `Today` to return.

### 6. Executive Pastel Design System
- **Professional Pastel Palette**: Engineered for high visual comfort with calming porcelain surfaces (`#f7f9fc`), soft ambient gradients, and crisp typography.
- **Harmonious Pastel Horizons & Status Badges**:
  - ☀️ **Today**: Pastel Apricot & Buttercup (`#d97706` / `#fef3c7`)
  - 📅 **This Week**: Pastel Periwinkle & Lavender (`#6366f1` / `#ede9fe`)
  - 🗓️ **This Month**: Pastel Mint & Sage Seafoam (`#0d9488` / `#ccfbf1`)
  - ⚠️ **Overdue**: Pastel Coral & Petal Rose (`#e11d48` / `#ffe4e6`)
  - ✅ **Completed**: Pastel Jade & Matcha (`#059669` / `#d1fae5`)
- **Dual Pastel Modes**: Instant 1-click toggle between **Pastel Day** (porcelain alabaster) and **Pastel Dusk** (slate velvet twilight).
- **Dual Display Modes**: Seamlessly toggle between **Card Grid View** and **Executive Table View**.

---

## 🧪 Verified End-to-End Test Suite

An automated End-to-End test suite verifies:
- ✅ **Role-Based Dashboards**: Eleanor Vance logs in as Administrator with organization oversight; Alex Morgan, Sarah Chen, and David Kumar log in as individual users with personal horizon views.
- ✅ **Task Assignment Breakdown**: Alex (19 tasks), Sarah (18 tasks), David (18 tasks) accurately sum to 55 total tasks.
- ✅ **User Scope Switching**: Toggling between `"My Activities"` and `"Team Shared"` filters tasks correctly.
- ✅ **Overdue Task Tracking**: Exactly 7 overdue tasks with zero overlap into upcoming Week or Month horizons.
- ✅ **Per-Member Overdue Rescheduling**: Admin can reschedule overdue tasks for specific members or rebalance all overdue tasks across the team.
- ✅ **Team Audit Export**: Exports full organizational metrics, team member workloads, and escalated overdue tasks.

---

## 🚀 Running the App

1. Navigate to the project directory: `c:\Users\dhana\ToDo\ToDoApp\`
2. Open [index.html](file:///c:/Users/dhana/ToDo/ToDoApp/index.html) in any modern web browser.
3. Zero installation or server dependencies required!
