# TaskHorizon - Executive Activity & Time-Horizon Tracker

A professional, responsive To-Do and Activity Management web application engineered for executive clarity, high productivity, and seamless time-horizon tracking across:
- ☀️ **Today** (24-Hour Horizon)
- 📅 **This Week** (7-Day Horizon)
- 🗓️ **This Month** (30-Day Strategic Horizon)
- ⚠️ **Overdue Tracker** (Immediate attention items past their scheduled due date)

---

## 🌟 Key Features

1. **User Sign-In & Profile System**:
   - **Active Session Pill & Dropdown**: Displays the signed-in user's initials, name, and professional role in both the top navigation bar and the sidebar footer.
   - **1-Click Demo Switcher**: Instant switching between 3 realistic executive profiles for presentations:
     - 🟣 **Alex Morgan** (`alex.morgan@company.com`) — Executive Director
     - 🟢 **Sarah Chen** (`sarah.chen@product.io`) — Senior Product Manager
     - 🟡 **David Kumar** (`david.k@techlead.dev`) — Principal Architect
   - **Sign In / Create Account Modal**: Full authentication dialog supporting custom credentials, role designation, custom avatar generation, and persistent browser session storage.
   - **Personalized Executive Greeting**: Dynamic time-of-day greeting addressed directly to the signed-in user (e.g., *"Good morning, Alex!"*).

2. **55+ Preloaded Demo Activities**:
   - Ready for live demonstrations with realistic corporate, technical, and life tasks across **Work**, **Project**, **Finance**, **Health**, **Study**, and **Personal** categories.
   - Live breakdown:
     - **12 Today activities** (6 completed, 6 pending)
     - **18 This Week activities** (5 completed, 13 pending)
     - **18 This Month activities** (3 completed, 15 pending)
     - **7 Overdue activities** (highlighted in crimson with instant 1-click "Reschedule to Today" action)
   - One-click **"55 Demo Tasks"** button in the sidebar footer to instantly reload the dataset anytime during presentations.

2. **Interactive Calendar View**:
   - **Monthly Grid**: Full 35/42-cell interactive calendar view plotting all activities on their respective due dates.
   - **Task Pills & Indicators**: Live task chips with priority dots, category badges, strikethrough on completion, and overdue alerts.
   - **Day Inspector Side Panel**: Clicking any date opens the side inspector detailing all scheduled activities for that day, complete with status toggles, edits, and a "+ Add on Date" quick action.
   - **Month Navigation**: Effortlessly jump between months with `<` and `>`, or click `Today` to return to the active date.

3. **Executive Visual Analytics Dashboard**:
   - **Progress Radial Ring**: Circular SVG completion meter calculating overall progress velocity in real time.
   - **4 Time-Horizon Metric Cards**: Dedicated KPI cards for Today, This Week, This Month, and Overdue with animated progress bars and exact date range badges.
   - **Interactive Chart.js Visualizations**:
     - 📊 **Status Distribution Doughnut**: Real-time ratio of Completed vs Still Not Done vs Overdue.
     - 📈 **Time Horizon Load Bar Chart**: Stacked workload comparison across Today, This Week, and This Month.
     - 🎯 **Category Allocation Mix**: Breakdown across Work, Project, Finance, Health, and Study.
   - **Today's Quick Focus Section**: Dedicated dashboard checklist to complete today's critical items without switching views.

3. **Task Lifecycle & Productivity Tools**:
   - **Instant Status Toggle**: Single-click checkbox to toggle between Completed and Still Not Done (with animated celebratory confetti!).
   - **Overdue Task Tracking & Zero-Overlap Horizons**:
     - Strict mutually exclusive horizon classification: Overdue items are isolated to their own dedicated horizon (`badge-rose`) and excluded from upcoming Week/Month buckets.
     - Live count partition across 55 tasks: Today (12), This Week (18), This Month (18), Overdue (7) = 55 total.
     - Calendar cells with past-due tasks display a `⚠️ Past Due` badge and soft pastel rose highlight.
     - Day Inspector side drawer displays overdue badges, relative due times (`Yesterday (Overdue)`, `3d overdue`), and 1-click `⚡ Today` reschedule buttons.
   - **1-Click Reschedule**: Instant `⚡ Today` button on overdue cards to reschedule them to Today without opening modals.
   - **Overdue Banner**: High-visibility alert banner with a bulk "Reschedule All Overdue to Today" button.
   - **Clear / Archive Completed**: One-click cleanup to keep boards pristine.
   - **Search & Filters**: Search with `Ctrl + K` shortcut; filter by status, priority, category, or horizon.
   - **Dual Display Modes**: Seamlessly toggle between **Card Grid View** and **Executive Table View** with overdue row tinting.
   - **Print Report**: Instant formatted agenda printing via `@media print`.

4. **Executive Pastel Design System & Local Persistence**:
   - **Professional Pastel Palette**: Engineered for high visual comfort and executive clarity with calming porcelain surfaces (`#f7f9fc`), soft ambient gradients, and crisp typography.
   - **Harmonious Pastel Horizons & Status Badges**:
     - ☀️ **Today**: Pastel Apricot & Buttercup (`#d97706` / `#fef3c7`)
     - 📅 **This Week**: Pastel Periwinkle & Lavender (`#6366f1` / `#ede9fe`)
     - 🗓️ **This Month**: Pastel Mint & Sage Seafoam (`#0d9488` / `#ccfbf1`)
     - ⚠️ **Overdue**: Pastel Coral & Petal Rose (`#e11d48` / `#ffe4e6`)
     - ✅ **Completed**: Pastel Jade & Matcha (`#059669` / `#d1fae5`)
   - **Dual Pastel Modes**: Instant 1-click toggle between **Pastel Day** (Alabaster porcelain) and **Pastel Dusk** (Velvet slate twilight).
   - **Automatic Persistence**: Full state saved automatically to browser `localStorage` with JSON export/import options.

---

## 🧪 Verified End-to-End Test Suite

The app includes an automated 34-assertion End-to-End test suite verifying:
- ✅ 55 initial demo tasks generate cleanly across all categories.
- ✅ Exactly 7 tasks classified as overdue with zero overlap into upcoming Week or Month horizons.
- ✅ Mutually exclusive horizon math: Today (12) + Week (18) + Month (18) + Overdue (7) = 55 total.
- ✅ Overdue tasks accurately receive the `⚠️ Overdue` / `badge-rose` badge in Grid, Table, Calendar, and Day Inspector views.
- ✅ Filter by Scope (`overdue`) returns all 7 overdue tasks even with status filters applied.
- ✅ Single-task reschedule moves overdue item to Today, updates KPI counters dynamically.
- ✅ Bulk reschedule clears overdue count to 0 and reallocates items to Today.
- ✅ Real-time statistics, progress percentages, and Chart.js datasets remain consistent across all interactions.

---

## 🚀 Running the App

1. Navigate to the project directory: `c:\Users\dhana\ToDo\ToDoApp\`
2. Double-click or open [index.html](file:///c:/Users/dhana/ToDo/ToDoApp/index.html) in any modern browser (Chrome, Edge, Firefox, Brave, Safari).
3. Zero installation or server dependencies required!
