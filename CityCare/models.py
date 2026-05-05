from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Citizen')
    points = db.Column(db.Integer, default=0)

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    issue = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.String(50), nullable=True)
    longitude = db.Column(db.String(50), nullable=True)
    image = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Sent')
    upvotes = db.Column(db.Integer, default=0)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('reports', lazy=True))

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('comments', lazy=True))
    
    report_id = db.Column(db.Integer, db.ForeignKey('report.id'), nullable=False)
    report = db.relationship('Report', backref=db.backref('comments', lazy=True, cascade="all, delete-orphan"))
