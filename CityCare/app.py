from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
DATA_FILE = "citycare_data.json"

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

def load_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get_reports")
def get_reports():
    return jsonify(load_data())

@app.route("/submit_report", methods=["POST"])
def submit_report():
    data = load_data()
    new_report = {
        "id": len(data) + 1,
        "issue": request.json["issue"],
        "location": request.json["location"] or "Not provided",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "status": "Sent"
    }
    data.append(new_report)
    save_data(data)
    return jsonify({"success": True})

@app.route("/update_status", methods=["POST"])
def update_status():
    data = load_data()
    index = request.json["index"]
    status = request.json["status"]
    data[index]["status"] = status
    save_data(data)
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True)
