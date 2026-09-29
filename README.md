# Tiny Tasks

A lightweight personal task list built with Flask and Flask-SQLAlchemy. Tasks are stored in a local SQLite database (`tasks.db`), created automatically on first run.

## Run

From this folder, install the requirements and start the server:

```powershell
python -m pip install -r requirements.txt
python app.py
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Features

- Add tasks with Enter or the Add task button
- Mark tasks complete and remove them
- Filter between all, to do, and done
- Keep tasks in a local SQLite database between visits
- Responsive layout for desktop and mobile
