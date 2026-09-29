from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{BASE_DIR / 'tasks.db'}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(120), nullable=False)
    done = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        created_at = self.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return {
            "id": self.id,
            "text": self.text,
            "done": self.done,
            "time": created_at.astimezone().strftime("%I:%M %p").lstrip("0"),
        }


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/api/tasks")
def get_tasks():
    tasks = db.session.execute(db.select(Task).order_by(Task.created_at.desc(), Task.id.desc())).scalars()
    return jsonify([task.to_dict() for task in tasks])


@app.post("/api/tasks")
def create_task():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Task text is required."}), 400
    task = Task(text=text.strip()[:120])
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@app.patch("/api/tasks/<int:task_id>")
def update_task(task_id):
    task = db.get_or_404(Task, task_id)
    payload = request.get_json(silent=True) or {}
    if "done" not in payload or not isinstance(payload["done"], bool):
        return jsonify({"error": "A boolean done value is required."}), 400
    task.done = payload["done"]
    db.session.commit()
    return jsonify(task.to_dict())


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    task = db.get_or_404(Task, task_id)
    db.session.delete(task)
    db.session.commit()
    return "", 204


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    print("Tiny Tasks is running at http://127.0.0.1:8000")
    app.run(host="127.0.0.1", port=8000, debug=False)
