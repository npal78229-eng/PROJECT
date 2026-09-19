# Engineering Portfolio Projects

Multi-project full-stack software engineering repository containing production-grade applications.

---

## 📁 Repository Projects

### 1. [Online Exam System (Python + Django)](./online-exam-system)
A web-based examination platform developed using Python, Django, Bootstrap 5, and MySQL/SQLite. Provides automated examination management, question bank management with objective-type MCQs, synchronized countdown timers, anti-cheat tab-switch detection, and role-based portals for administrators, faculty, and students.
- **Path:** [`online-exam-system/`](./online-exam-system)
- **Tech Stack:** Python 3.11+, Django 5.x, Bootstrap 5, MySQL / SQLite

### 2. [Amazon Clone E-Commerce Store (React + Express + PostgreSQL)](./amazon-clone)
A production-style e-commerce platform built with React, Vite, Tailwind CSS, and Redux Toolkit on the frontend, and Node.js, Express, PostgreSQL, and Stripe on the backend. Covers catalog search/filters, JWT auth, persistent server-side cart, and atomic transaction-based checkout with inventory locking.
- **Path:** [`amazon-clone/`](./amazon-clone)
- **Tech Stack:** React (Vite), Redux Toolkit, Tailwind CSS, Express, PostgreSQL, Stripe

---

## 🗂️ Workspace Directory Tree
```
PROJECT/
├── online-exam-system/         # Project 1: Django Exam Engine & Portal
│   ├── accounts/
│   ├── exams/
│   ├── questions/
│   ├── results/
│   ├── templates/
│   └── README.md
│
├── amazon-clone/               # Project 2: Full-Stack E-Commerce Store
│   ├── client/                 # React 18 (Vite) + Tailwind + Redux
│   ├── server/                 # Express REST API + PostgreSQL
│   └── README.md
│
└── README.md                   # Workspace portfolio index
```

## 🛠️ Tech Stack
- **Backend:** Python 3.11+, Django 5.x
- **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5 (CDN)
- **Database:** MySQL (MariaDB) / SQLite toggle for rapid local testing
- **Architecture:** 3-Tier MVC / MVT architecture

## ⚡ Quick Start Instructions

```powershell
# 1. Navigate to the project directory
cd online-exam-system

# 2. (Optional) Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Copy .env.example to .env
# Set DB_ENGINE=sqlite for instant local testing, or DB_ENGINE=mysql for MySQL
Copy-Item .env.example .env

# 5. Apply database migrations
python manage.py migrate

# 6. Create an administrator / faculty account
python manage.py createsuperuser

# 7. Start the development server
python manage.py runserver
```

Open your browser at `http://127.0.0.1:8000/`.
- **Faculty Login:** Use your superuser account &rarr; redirects to `/dashboard/admin/`.
- **Student Registration:** Click Register on the login page &rarr; redirects to `/dashboard/student/`.

---

## 📅 Sprint Progress
- [x] **Day 1:** Project bootstrap, 4 apps, full database schema & migrations, role signals, Bootstrap base.
- [x] **Day 2:** Question Bank CRUD, Category management, Exam scheduling, dynamic Faculty & Student Dashboards, server-authoritative "Start Exam" flow.
- [x] **Day 3:** Exam Engine (randomization, question navigation, AJAX response autosave, synchronized timer auto-submit, automated grading engine & scorecard).
- [x] **Day 4:** Security & anti-cheat (Page Visibility API tab-switch logging, right-click/copy-paste/shortcut prevention, audit trail on scorecards), faculty analytics & institutional performance reports (ORM aggregations), test suite (15/15 passing), institutional branding & polish.
