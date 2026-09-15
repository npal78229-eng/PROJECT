# Online Exam System — Day 1 Build

Day 1 of the sprint schedule: project bootstrap, MySQL-ready config, role-based
authentication, and every database model/migration for the whole project.

## ✅ What's done (tested and verified working)

- Django project `examsystem` with 4 apps: `accounts`, `questions`, `exams`, `results`
- Base template with a Bootstrap 5 navbar shared across all pages
- Custom `Profile` model (role: `admin` / `student`) linked 1-to-1 to Django's `User`
- Signal that auto-creates a `Profile` for every new user — superusers become `admin`, everyone else `student`
- Student self-registration + login/logout, with **role-based redirect** after login
- All 6 core models, migrated: `Profile`, `Category`, `Question`, `Exam`, `ExamAttempt`, `ExamQuestion`, `Response`, `Result`
- Everything registered in Django admin
- MySQL/SQLite toggle via `.env` (`DB_ENGINE=mysql` for real use, `DB_ENGINE=sqlite` for fast local testing with zero DB setup)

## Setup on your machine

```bash
# 1. Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt
# If mysqlclient fails to install on Windows, see the Troubleshooting note below.

# 3. Configure your database
cp .env.example .env
# then edit .env with your real MySQL username/password
# (or set DB_ENGINE=sqlite in .env if you just want to run it immediately with no MySQL setup)

# 4. Create the database in MySQL (skip if using sqlite)
mysql -u root -p -e "CREATE DATABASE exam_system_db;"

# 5. Run migrations
python manage.py migrate

# 6. Create your admin account
python manage.py createsuperuser
# (this account automatically gets role='admin' — see accounts/signals.py)

# 7. Run the server
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` — you'll land on the login page. Register a
student account there, or log in with the superuser you just created to see
the admin dashboard.

## Project structure

```
online-exam-system/
├── accounts/       → Profile model, auth views, role-based redirect
├── questions/      → Category, Question (the question bank)
├── exams/          → Exam, ExamAttempt, ExamQuestion (randomized set per attempt)
├── results/        → Response, Result
├── templates/       → base.html + accounts templates
├── examsystem/      → project settings/urls
├── .env.example     → copy to .env, fill in real secrets (never commit .env)
└── requirements.txt
```

## Design note: why `ExamAttempt` exists

Your synopsis's ER diagram implies students, exams, and responses connect
directly. I added one extra model, `ExamAttempt`, sitting between `Exam` and
`Response`. This is what Day 3 (the exam engine) depends on:

- It stores `ends_at` — the **server-side authoritative end time** — so the
  countdown timer can't be reset by refreshing the page or manipulated via
  browser dev tools.
- It's where the **randomly-selected question set gets locked in** once,
  at the start of the attempt (via `ExamQuestion`), instead of
  re-randomizing on every page load — which is the #1 bug source in these
  projects.

This is a small structural upgrade on the original synopsis, not a
deviation from it — worth a one-line mention in your final report's
"Implementation" section if you want to show you refined the design.

## Troubleshooting

| Problem | Fix |
|---|---|
| `mysqlclient` fails to install (Windows) | Run `pip install pymysql` instead, then add `import pymysql; pymysql.install_as_MySQLdb()` as the first two lines of `examsystem/__init__.py`. |
| `Access denied` connecting to MySQL | Check `DB_USER`/`DB_PASSWORD` in `.env`, and that the user has privileges: `GRANT ALL PRIVILEGES ON exam_system_db.* TO 'root'@'localhost';` |
| Want to just see it running right now, no MySQL setup | Set `DB_ENGINE=sqlite` in `.env`, then `python manage.py migrate` and `runserver`. Switch back to `mysql` before your final submission/testing, since that's what your synopsis specifies. |

## Next: Day 2

Question Bank CRUD, Exam creation/scheduling form, and the Faculty and
Student dashboards get built out (see the sprint schedule doc).
