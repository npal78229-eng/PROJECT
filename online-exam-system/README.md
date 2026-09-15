# Online Exam System (Python + Django)

Academic Mini-Project for B.Tech / BCA / MCA / Diploma in Computer Engineering.  
**Student:** Nikhil Pal (Enrollment No.: 20240600)  
**Guide:** Ms. Ragini Sharma  
**Institution:** Faculty of Engineering and Technology, Mangalayatan University, Beswan  

---

## 🚀 Overview
The Online Exam System is a web-based examination platform developed using Python, Django, Bootstrap 5, and MySQL/SQLite. It provides automated examination management, question bank management with objective-type MCQs, timed exams with server-side authoritative end timestamps, and role-based portals for administrators/faculty and students.

## 📁 Repository Structure
```
PROJECT/
└── online-exam-system/
    ├── accounts/       → Role-based authentication (Admin / Student), Profiles, Dashboards
    ├── questions/      → Question Bank CRUD, Subject/Category management
    ├── exams/          → Exam scheduling, Student Start/Resume flow, Attempt tracking
    ├── results/        → Student responses & evaluation models
    ├── templates/      → Bootstrap 5 UI templates (responsive navbar, forms, tables)
    ├── examsystem/     → Core Django settings and URL configurations
    ├── manage.py
    ├── requirements.txt
    └── .env.example
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
- [ ] **Day 3:** Exam Engine (randomization, question navigation, AJAX response autosave, timer auto-submit, evaluation).
- [ ] **Day 4:** Security measures, tab-switch monitoring, PDF/Excel export, report analytics.
