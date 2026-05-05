import os
import uuid
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from models import db, User, Report, Comment

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'citycare-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ── Configuration ──────────────────────────────────────────────────────────────
UPLOAD_FOLDER   = os.path.join('static', 'uploads')
ALLOWED_EXT     = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── Extensions ─────────────────────────────────────────────────────────────────
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'auth_login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ── DB Setup & Seeding ─────────────────────────────────────────────────────────
with app.app_context():
    db.create_all()
    # Seed default authority
    if not User.query.filter_by(username='admin').first():
        admin_pass = os.environ.get('ADMIN_PASSWORD', 'admin123')
        hashed = bcrypt.generate_password_hash(admin_pass).decode('utf-8')
        admin = User(username='admin', password_hash=hashed, role='Authority')
        db.session.add(admin)
        db.session.commit()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

# ── Frontend Routes ────────────────────────────────────────────────────────────
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('auth_login'))

@app.route('/login', methods=['GET', 'POST'])
def auth_login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        # Handle both JSON and Form data for flexibility
        data = request.get_json() if request.is_json else request.form
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        user = User.query.filter_by(username=username).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            if request.is_json:
                return jsonify({'success': True, 'role': user.role})
            return redirect(url_for('dashboard'))
            
        if request.is_json:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        flash('Invalid username or password', 'error')
        
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def auth_register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if User.query.filter_by(username=username).first():
            if request.is_json:
                return jsonify({'success': False, 'error': 'Username already exists'}), 400
            flash('Username already exists', 'error')
            return render_template('register.html')
            
        hashed = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, password_hash=hashed, role='Citizen')
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        if request.is_json:
            return jsonify({'success': True, 'role': new_user.role})
        return redirect(url_for('dashboard'))
        
    return render_template('register.html')

@app.route('/logout')
@login_required
def auth_logout():
    logout_user()
    return redirect(url_for('auth_login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

# ── API Routes ─────────────────────────────────────────────────────────────────
@app.route('/api/auth_status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'logged_in': True,
            'username': current_user.username,
            'role': current_user.role
        })
    return jsonify({'logged_in': False})

@app.route('/api/get_reports', methods=['GET'])
@login_required
def get_reports():
    if current_user.role == 'Authority':
        reports = Report.query.order_by(Report.upvotes.desc(), Report.date.desc()).all()
    else:
        reports = Report.query.filter_by(user_id=current_user.id).order_by(Report.date.desc()).all()
        
    result = []
    for r in reports:
        result.append({
            'id': r.id,
            'issue': r.issue,
            'location': r.location,
            'description': r.description,
            'latitude': r.latitude,
            'longitude': r.longitude,
            'image': r.image,
            'status': r.status,
            'date': r.date.strftime('%Y-%m-%d %H:%M'),
            'updated_at': r.updated_at.strftime('%Y-%m-%d %H:%M') if r.updated_at else None,
            'username': r.user.username if current_user.role == 'Authority' else None
        })
    return jsonify(result)

@app.route('/api/all_reports', methods=['GET'])
@login_required
def all_reports():
    # Returns all reports for the Live Map
    reports = Report.query.all()
    result = []
    for r in reports:
        result.append({
            'id': r.id,
            'issue': r.issue,
            'location': r.location,
            'description': r.description,
            'latitude': r.latitude,
            'longitude': r.longitude,
            'status': r.status,
            'upvotes': r.upvotes,
            'date': r.date.strftime('%Y-%m-%d %H:%M')
        })
    return jsonify(result)

@app.route('/api/get_stats', methods=['GET'])
@login_required
def get_stats():
    if current_user.role == 'Authority':
        reports = Report.query.all()
    else:
        reports = Report.query.filter_by(user_id=current_user.id).all()
        
    by_issue = {}
    for r in reports:
        by_issue[r.issue] = by_issue.get(r.issue, 0) + 1

    return jsonify({
        'total': len(reports),
        'sent': sum(1 for r in reports if r.status == 'Sent'),
        'in_progress': sum(1 for r in reports if r.status == 'In Progress'),
        'resolved': sum(1 for r in reports if r.status == 'Resolved'),
        'by_issue': by_issue,
    })

@app.route('/api/submit_report', methods=['POST'])
@login_required
def submit_report():
    image_filename = None

    if request.content_type and 'multipart/form-data' in request.content_type:
        issue = request.form.get('issue', 'Other')
        location = request.form.get('location', 'Not provided')
        description = request.form.get('description', '')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')

        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                image_filename = f"{uuid.uuid4().hex}.{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, image_filename))
    else:
        body = request.get_json() or {}
        issue = body.get('issue', 'Other')
        location = body.get('location', 'Not provided')
        description = body.get('description', '')
        latitude = body.get('latitude')
        longitude = body.get('longitude')

    report = Report(
        issue=issue,
        location=location,
        description=description,
        latitude=latitude,
        longitude=longitude,
        image=image_filename,
        user_id=current_user.id
    )
    db.session.add(report)
    db.session.commit()
    
    return jsonify({'success': True, 'report_id': report.id})

@app.route('/api/update_status', methods=['POST'])
@login_required
def update_status():
    if current_user.role != 'Authority':
        return jsonify({'error': 'Unauthorized'}), 403
        
    body = request.get_json() or {}
    report_id = body.get('id')
    new_status = body.get('status')

    report = Report.query.get(report_id)
    if report:
        if new_status == 'Resolved' and report.status != 'Resolved':
            # Award points to the user who reported it
            report.user.points += 10
            
        report.status = new_status
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.route('/api/upvote', methods=['POST'])
@login_required
def upvote():
    body = request.get_json() or {}
    report_id = body.get('report_id')
    
    report = Report.query.get(report_id)
    if report:
        report.upvotes += 1
        db.session.commit()
        return jsonify({'success': True, 'upvotes': report.upvotes})
    return jsonify({'success': False}), 404

@app.route('/api/comments/<int:report_id>', methods=['GET', 'POST'])
@login_required
def comments(report_id):
    report = Report.query.get_or_404(report_id)
    
    if request.method == 'POST':
        body = request.get_json() or {}
        text = body.get('text', '').strip()
        if text:
            comment = Comment(text=text, user_id=current_user.id, report_id=report.id)
            db.session.add(comment)
            db.session.commit()
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Empty comment'}), 400
        
    # GET comments
    result = []
    for c in report.comments:
        result.append({
            'id': c.id,
            'text': c.text,
            'username': c.user.username,
            'role': c.user.role,
            'timestamp': c.timestamp.strftime('%Y-%m-%d %H:%M')
        })
    return jsonify(result)

@app.route('/api/leaderboard', methods=['GET'])
@login_required
def leaderboard():
    # Top 10 citizens by points
    top_users = User.query.filter_by(role='Citizen').order_by(User.points.desc()).limit(10).all()
    result = []
    for u in top_users:
        result.append({
            'username': u.username,
            'points': u.points
        })
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)