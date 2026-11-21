# TaskHorizon - Modern Time-Horizon To-Do & Activity Tracker

An intuitive, visually engaging, responsive web application built to plan, track, and complete activities across three key time horizons:
- ☀️ **Today** (Next 24 Hours)
- 📅 **This Week** (Next 7 Days)
- 🗓️ **This Month** (Current Month Calendar)
- ⚠️ **Overdue Tracker** (Past-due activities requiring immediate attention)

---

## 🌟 Key Features

1. **Time-Horizon Categorization**:
   - Automatic dynamic categorization for **Today**, **This Week**, and **This Month**.
   - Automatic detection of **Overdue** tasks (any task whose due date has passed and is still not completed).

2. **Full Activity Lifecycle**:
   - **Create Activities**: Set title, description/notes, due date, due time, priority (High, Medium, Low), and category (Work, Personal, Study, Health, Finance, Project).
   - **Update Activities**: Easily edit any activity's parameters, due date, or scope at any time.
   - **Status Tracking**: Clearly mark activities as **Completed** (with animated confetti celebration!), **Still Not Done**, or **Overdue**.
   - **Delete & Clear**: Quick delete with confirmation.

3. **Visual Dashboard**:
   - **Overall Completion Ring**: Circular radial progress meter showing percentage of completed tasks.
   - **Horizon Metric Cards**: Dedicated stat cards for Today, This Week, This Month, and Overdue with progress bars and quick links.
   - **Interactive Charts (Chart.js)**:
     - 📊 **Status Breakdown Doughnut**: Completed vs Still Not Done vs Overdue.
     - 📈 **Time Horizon Load Bar Chart**: Compares pending vs completed load across Today, Week, and Month.
     - 🎯 **Category & Priority Distribution Chart**: Visual breakdown of your workload by category.
   - **Quick Action Priority Section**: Instant completion checklist for Today's critical focus items.

4. **User-Friendly & Attractive Interface**:
   - Modern glassmorphism dark & light theme with smooth toggle.
   - Responsive design (Mobile, Tablet, Desktop).
   - Flexible view modes: **Card Grid View** or **Detailed Table View**.
   - Instant search & multi-parameter filtering (by status, priority, category, and time scope).
   - LocalStorage persistence (no backend required, works offline).
   - JSON **Export** and **Import** for backup and data portability.

---

## 🚀 How to Run the App

1. Double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari, Brave).
2. No installation, npm setup, or local server required! Everything runs out of the box with zero dependencies.
