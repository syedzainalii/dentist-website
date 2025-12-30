from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
import random
import string
from datetime import datetime, UTC, timedelta
from functools import wraps
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()


app = Flask(__name__)

# Enable automatic OPTIONS response for all routes (CORS preflight)
@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        headers = response.headers
        headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        headers['Access-Control-Allow-Headers'] = request.headers.get('Access-Control-Request-Headers', 'Authorization, Content-Type')
        headers['Access-Control-Allow-Credentials'] = 'true'
        return response

# ============================================================================
# CONFIGURATION
# ============================================================================

# CORS Configuration
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     expose_headers=["Content-Type", "Authorization"])

# Enable automatic OPTIONS response
@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        headers = response.headers
        origin = request.headers.get('Origin', '*')
        
        if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
            headers['Access-Control-Allow-Origin'] = origin
        else:
            headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        headers['Access-Control-Allow-Credentials'] = 'true'
        return response

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres:postgres@db:5432/postgres"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME'))

# File Upload Configuration
UPLOAD_FOLDER = 'uploads/content'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('uploads/cars', exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

db = SQLAlchemy(app)
mail = Mail(app)

# ============================================================================
# DATABASE MODELS
# ============================================================================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='user', server_default='user')
    is_verified = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(6), nullable=True)
    code_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'status': self.status,
            'role': self.status,  # Alias for frontend compatibility
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    pickup_location = db.Column(db.String(200), nullable=False)
    dropoff_location = db.Column(db.String(200), nullable=False)
    car_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending', server_default='pending')  # pending, confirmed, completed, cancelled
    ride_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'pickup_location': self.pickup_location,
            'dropoff_location': self.dropoff_location,
            'car_type': self.car_type,
            'status': self.status,
            'ride_date': self.ride_date.isoformat() if self.ride_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Car(db.Model):
    __tablename__ = 'cars'
    

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    brand = db.Column(db.String(100), nullable=True)
    details = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    year = db.Column(db.String(10), nullable=True)
    seats = db.Column(db.String(10), nullable=True)
    transmission = db.Column(db.String(50), nullable=True)
    fuel = db.Column(db.String(50), nullable=True)
    features = db.Column(db.Text, nullable=True)  # JSON stringified list
    specs = db.Column(db.Text, nullable=True)     # JSON stringified dict
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'details': self.details,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'year': self.year,
            'seats': self.seats,
            'transmission': self.transmission,
            'fuel': self.fuel,
            'features': json.loads(self.features) if self.features else [],
            'specs': json.loads(self.specs) if self.specs else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ContentBlock(db.Model):
    __tablename__ = 'content_blocks'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False, index=True)  # e.g., 'hero_title', 'about_text'
    title = db.Column(db.String(200), nullable=True)
    content = db.Column(db.Text, nullable=True)  # HTML or plain text content
    media_url = db.Column(db.String(500), nullable=True)  # Image/video URL
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    updater = db.relationship('User', foreign_keys=[updated_by], lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'title': self.title,
            'content': self.content,
            'media_url': self.media_url,
            'updated_by': self.updated_by,
            'updated_by_name': self.updater.name if self.updater else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email, code, name):
    """Send verification code via email"""
    try:
        msg = Message(
            subject='Verify Your Email Address',
            recipients=[email],
            html=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .code-box {{ background: white; border: 2px dashed #667eea; border-radius: 8px; 
                                 padding: 20px; text-align: center; margin: 20px 0; }}
                    .code {{ font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <h2>Hello, {name}! 👋</h2>
                        <p>Thank you for registering. Please use the verification code below to verify your email address:</p>
                        <div class="code-box">
                            <div class="code">{code}</div>
                        </div>
                        <p><strong>Important:</strong> This code will expire in 10 minutes.</p>
                        <p>If you didn't request this verification, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Email Error: {str(e)}")
        return False

def generate_token(user):
    """Generate JWT token"""
    payload = {
        'user_id': user.id,
        'status': user.status,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'success': False, 'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing'}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found'}), 401
            
            if not current_user.is_verified:
                return jsonify({'success': False, 'message': 'Email not verified'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        except Exception:
            return jsonify({'success': False, 'message': 'Authentication failed'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


def role_required(allowed_roles):
    """Decorator to require specific roles (admin/moderator)"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(current_user, *args, **kwargs):
            if current_user.status not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': f'Access denied. Required roles: {", ".join(allowed_roles)}'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

# ============================================================================
# PUBLIC ROUTES
# ============================================================================

@app.route('/', methods=['GET'])
def index():
    """API Information"""
    return jsonify({
        'success': True,
        'message': 'Flask Authentication API',
        'version': '2.0',
        'endpoints': {
            'auth': {
                'register': 'POST /api/auth/register',
                'verify-email': 'POST /api/auth/verify-email',
                'resend-code': 'POST /api/auth/resend-code',
                'login': 'POST /api/auth/login'
            },
            'protected': {
                'dashboard': 'GET /api/dashboard'
            }
        }
    }), 200

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@app.route('/api/public/content', methods=['GET'])
def get_public_content():
    """Get content blocks for public website display"""
    try:
        key_filter = request.args.get('key')
        
        query = ContentBlock.query
        if key_filter:
            query = query.filter_by(key=key_filter)
        
        content_blocks = query.order_by(ContentBlock.key).all()
        blocks_dict = {block.key: {
            'title': block.title,
            'content': block.content,
            'media_url': block.media_url
        } for block in content_blocks}
        
        return jsonify({
            'success': True,
            'content': blocks_dict
        }), 200
        
    except Exception as e:
        print(f"❌ Get Public Content Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch content'}), 500

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user and send verification code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not all([name, email, password]):
            return jsonify({'success': False, 'message': 'Name, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            if existing_user.is_verified:
                return jsonify({'success': False, 'message': 'Email already registered'}), 409
            
            verification_code = generate_verification_code()
            existing_user.verification_code = verification_code
            existing_user.code_expires_at = datetime.utcnow() + timedelta(minutes=10)
            db.session.commit()
            
            send_verification_email(email, verification_code, name)
            
            return jsonify({
                'success': True,
                'message': 'Verification code sent to your email',
                'email': email
            }), 200
        
        verification_code = generate_verification_code()
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            verification_code=verification_code,
            code_expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        email_sent = send_verification_email(email, verification_code, name)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Verification code sent to your email.',
            'email': email,
            'email_sent': email_sent
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Register Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Registration failed. Please try again.'}), 500

@app.route('/api/auth/verify-email', methods=['POST'])
def verify_email():
    """Verify email with code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({'success': False, 'message': 'Email and verification code are required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'success': False, 'message': 'Email already verified'}), 400
        
        if not user.code_expires_at or user.code_expires_at < datetime.utcnow():
            return jsonify({'success': False, 'message': 'Verification code has expired'}), 400
        
        if user.verification_code != code:
            return jsonify({'success': False, 'message': 'Invalid verification code'}), 400
        
        user.is_verified = True
        user.verification_code = None
        user.code_expires_at = None
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        token = generate_token(user)
        
        return jsonify({
            'success': True,
            'message': 'Email verified successfully',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Verify Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Verification failed'}), 500

@app.route('/api/auth/resend-code', methods=['POST'])
def resend_code():
    """Resend verification code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'success': False, 'message': 'Email already verified'}), 400
        
        verification_code = generate_verification_code()
        user.verification_code = verification_code
        user.code_expires_at = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        
        email_sent = send_verification_email(email, verification_code, user.name)
        
        if email_sent:
            return jsonify({'success': True, 'message': 'Verification code sent successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to send email'}), 500
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Resend Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to resend code'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        if not user.is_verified:
            return jsonify({
                'success': False,
                'message': 'Please verify your email before logging in',
                'email_verified': False
            }), 403
        
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        token = generate_token(user)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Login Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

# ============================================================================
# PROTECTED ENDPOINTS
# ============================================================================

@app.route('/api/dashboard', methods=['GET'])
@token_required
def dashboard(current_user):
    """Get dashboard data - Protected route"""
    try:
        return jsonify({
            'success': True,
            'message': 'Dashboard data retrieved successfully',
            'user': current_user.to_dict(),
            'stats': {
                'total_users': User.query.count(),
                'verified_users': User.query.filter_by(is_verified=True).count()
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Dashboard Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load dashboard'}), 500

@app.route('/api/users', methods=['GET'])
@role_required(['admin', 'moderator'])
def get_users(current_user):
    """Get all users - Protected route (admin/moderator only)"""
    try:
        users = User.query.all()
        users_list = [user.to_dict() for user in users]
        
        return jsonify({
            'success': True,
            'users': users_list
        }), 200
        
    except Exception as e:
        print(f"❌ Get Users Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch users'}), 500


@app.route('/api/users/<int:user_id>/role', methods=['PATCH'])
@role_required(['admin'])
def update_user_role(current_user, user_id):
    """Update user role - Admin only"""
    try:
        data = request.get_json()
        new_role = data.get('role', '').strip().lower()
        
        if new_role not in ['admin', 'moderator', 'user']:
            return jsonify({
                'success': False,
                'message': 'Invalid role. Must be admin, moderator, or user'
            }), 400
        
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Prevent self-demotion if last admin
        if target_user.id == current_user.id and new_role != 'admin':
            admin_count = User.query.filter_by(status='admin').count()
            if admin_count <= 1:
                return jsonify({
                    'success': False,
                    'message': 'Cannot demote yourself. At least one admin must remain.'
                }), 400
        
        target_user.status = new_role
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'User role updated to {new_role}',
            'user': target_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Update Role Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update user role'}), 500

# ============================================================================
# PROFILE SETTING ENDPOINTS
# ============================================================================

@app.route('/api/users/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile - Authenticated users only"""
    try:
        data = request.get_json()
        
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'success': False, 'message': 'Name is required'}), 400
        
        current_user.name = name
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Update Profile Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update profile'}), 500


@app.route('/api/users/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    """Change user password - Authenticated users only"""
    try:
        data = request.get_json()
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Both passwords are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'New password must be at least 6 characters'}), 400
        
        # Verify current password
        if not check_password_hash(current_user.password, current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
        
        # Update password
        current_user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Change Password Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to change password'}), 500


# ============================================================================
# BOOKING ENDPOINTS
# ============================================================================


@app.route('/api/bookings', methods=['GET', 'POST'])
@token_required
def bookings_handler(current_user):
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            pickup_location = data.get('pickup_location', '').strip()
            dropoff_location = data.get('dropoff_location', '').strip()
            car_type = data.get('car_type', '').strip()
            ride_date = data.get('ride_date')
            if not all([pickup_location, dropoff_location, car_type]):
                return jsonify({
                    'success': False,
                    'message': 'Pickup location, dropoff location, and car type are required'
                }), 400
            ride_date_obj = None
            if ride_date:
                try:
                    ride_date_obj = datetime.fromisoformat(ride_date.replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({'success': False, 'message': 'Invalid date format'}), 400
            new_booking = Booking(
                user_id=current_user.id,
                pickup_location=pickup_location,
                dropoff_location=dropoff_location,
                car_type=car_type,
                ride_date=ride_date_obj,
                status='pending'
            )
            db.session.add(new_booking)
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Booking created successfully',
                'booking': new_booking.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            print(f"❌ Create Booking Error: {str(e)}")
            return jsonify({'success': False, 'message': 'Failed to create booking'}), 500
    # GET method for admin/moderator
    if current_user.status not in ['admin', 'moderator']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        status = request.args.get('status')
        query = Booking.query
        if status:
            query = query.filter_by(status=status)
        bookings = query.order_by(Booking.created_at.desc()).all()
        bookings_list = [booking.to_dict() for booking in bookings]
        return jsonify({'success': True, 'bookings': bookings_list}), 200
    except Exception as e:
        print(f"❌ Get All Bookings Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch bookings'}), 500


@app.route('/api/bookings/my-bookings', methods=['GET'])
@token_required
def get_my_bookings(current_user):
    """Get current user's bookings - Authenticated users only"""
    try:
        bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.created_at.desc()).all()
        bookings_list = [booking.to_dict() for booking in bookings]
        
        return jsonify({
            'success': True,
            'bookings': bookings_list
        }), 200
        
    except Exception as e:
        print(f"❌ Get My Bookings Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch bookings'}), 500


# ============================================================================
# CAR MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/cars', methods=['GET'])
def get_cars():
    """Get all cars (public endpoint, optionally filter by active status)"""
    try:
        active_only = request.args.get('active', 'false').lower() == 'true'
        
        query = Car.query
        if active_only:
            query = query.filter_by(is_active=True)
        
        cars = query.order_by(Car.created_at.desc()).all()
        cars_list = [car.to_dict() for car in cars]
        
        return jsonify({
            'success': True,
            'cars': cars_list
        }), 200
        
    except Exception as e:
        print(f"❌ Get Cars Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch cars'}), 500


@app.route('/api/cars', methods=['POST'])
@role_required(['admin', 'moderator'])
def create_car(current_user):
    """Create a new car - Admin/Moderator only"""
    try:
        name = request.form.get('name', '').strip()
        brand = request.form.get('brand', '').strip()
        details = request.form.get('details', '').strip()
        year = request.form.get('year', '').strip()
        seats = request.form.get('seats', '').strip()
        transmission = request.form.get('transmission', '').strip()
        fuel = request.form.get('fuel', '').strip()
        features = request.form.get('features', '').strip()  # Expecting JSON string
        specs = request.form.get('specs', '').strip()        # Expecting JSON string

        # FIX: Check for 'true' OR '1' (since React sends '1')
        is_active_raw = request.form.get('is_active', 'true').lower()
        is_active = is_active_raw in ['true', '1']

        if not name:
            return jsonify({'success': False, 'message': 'Car name is required'}), 400

        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                # Ensure directory exists
                os.makedirs(os.path.join('uploads', 'cars'), exist_ok=True)
                # Save image and generate URL
                filename = f"car_{datetime.utcnow().timestamp()}_{file.filename}"
                file.save(os.path.join('uploads', 'cars', filename))
                image_url = f"/uploads/cars/{filename}"

        car = Car(
            name=name,
            brand=brand,
            details=details,
            year=year,
            seats=seats,
            transmission=transmission,
            fuel=fuel,
            features=features,
            specs=specs,
            image_url=image_url,
            is_active=is_active
        )
        
        db.session.add(car)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Car created successfully',
            'car': car.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Create Car Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create car'}), 500


@app.route('/api/cars/<int:car_id>', methods=['PUT'])
@role_required(['admin', 'moderator'])
def update_car(current_user, car_id):
    """Update a car - Admin/Moderator only"""
    try:
        car = Car.query.get(car_id)
        if not car:
            return jsonify({'success': False, 'message': 'Car not found'}), 404
        
        if 'name' in request.form:
            car.name = request.form.get('name', '').strip()
        if 'brand' in request.form:
            car.brand = request.form.get('brand', '').strip()
        if 'details' in request.form:
            car.details = request.form.get('details', '').strip()
        if 'year' in request.form:
            car.year = request.form.get('year', '').strip()
        if 'seats' in request.form:
            car.seats = request.form.get('seats', '').strip()
        if 'transmission' in request.form:
            car.transmission = request.form.get('transmission', '').strip()
        if 'fuel' in request.form:
            car.fuel = request.form.get('fuel', '').strip()
        if 'features' in request.form:
            car.features = request.form.get('features', '').strip()
        if 'specs' in request.form:
            car.specs = request.form.get('specs', '').strip()

        # FIX: Properly handle the is_active toggle
        if 'is_active' in request.form:
            is_active_raw = request.form.get('is_active', '').lower()
            car.is_active = is_active_raw in ['true', '1']

        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                os.makedirs(os.path.join('uploads', 'cars'), exist_ok=True)
                filename = f"car_{datetime.utcnow().timestamp()}_{file.filename}"
                file.save(os.path.join('uploads', 'cars', filename))
                car.image_url = f"/uploads/cars/{filename}"
        
        car.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Car updated successfully',
            'car': car.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Update Car Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update car'}), 500


@app.route('/api/cars/<int:car_id>', methods=['DELETE'])
@role_required(['admin', 'moderator'])
def delete_car(current_user, car_id):
    """Delete a car - Admin/Moderator only"""
    try:
        car = Car.query.get(car_id)
        if not car:
            return jsonify({'success': False, 'message': 'Car not found'}), 404
        
        db.session.delete(car)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Car deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete Car Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete car'}), 500


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files from the uploads directory"""
    # Using absolute path to avoid directory confusion
    uploads_dir = os.path.abspath(os.path.join(os.getcwd(), 'uploads'))
    return send_from_directory(uploads_dir, filename)
# ============================================================================
# CONTENT MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/content', methods=['GET'])
@role_required(['admin', 'moderator'])
def get_content_blocks(current_user):
    try:
        key_filter = request.args.get('key')
        query = ContentBlock.query

        if key_filter:
            query = query.filter_by(key=key_filter)

        blocks = query.order_by(ContentBlock.key).all()

        return jsonify({
            'success': True,
            'content_blocks': [block.to_dict() for block in blocks]
        }), 200

    except Exception as e:
        print(f"❌ Get Content Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Failed to fetch content blocks'}), 500


@app.route('/api/content', methods=['POST'])
@role_required(['admin'])
def create_content_block(current_user):
    try:
        key = request.form.get('key', '').strip()
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()

        print(f"📝 Creating content block: key={key}, title={title}")

        if not key:
            return jsonify({'success': False, 'message': 'Key is required'}), 400

        if ContentBlock.query.filter_by(key=key).first():
            return jsonify({'success': False, 'message': 'Content block key already exists'}), 409

        media_url = None
        file = request.files.get('media_file')

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"{key}_{int(datetime.utcnow().timestamp())}_{filename}"
            
            # Save to uploads/content/
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            
            # Store as /uploads/content/filename
            media_url = f"/uploads/content/{filename}"
            
            print(f"✅ File saved: {media_url}")

        block = ContentBlock(
            key=key,
            title=title,
            content=content,
            media_url=media_url,
            updated_by=current_user.id
        )

        db.session.add(block)
        db.session.commit()

        print(f"✅ Content block created: ID={block.id}")

        return jsonify({
            'success': True,
            'message': 'Content block created',
            'content_block': block.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Create Content Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Failed to create content block: {str(e)}'}), 500


@app.route('/api/content/<int:block_id>', methods=['PUT'])
@role_required(['admin'])
def update_content_block(current_user, block_id):
    try:
        print(f"🔄 Updating content block ID: {block_id}")
        
        block = ContentBlock.query.get(block_id)
        if not block:
            print(f"❌ Block not found: {block_id}")
            return jsonify({'success': False, 'message': 'Content block not found'}), 404

        print(f"📦 Current block: key={block.key}, title={block.title}")

        # Get form data
        title = request.form.get('title')
        content = request.form.get('content')

        print(f"📝 New data: title={title}, content={content[:50] if content else None}...")

        if title is not None:
            block.title = title.strip()
        if content is not None:
            block.content = content.strip()

        # Handle file upload
        file = request.files.get('media_file')
        if file and file.filename:
            print(f"📁 File received: {file.filename}")
            
            if allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filename = f"{block.key}_{int(datetime.utcnow().timestamp())}_{filename}"
                
                # Save to uploads/content/
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                print(f"💾 Saving file to: {filepath}")
                file.save(filepath)

                # Delete old file if exists
                if block.media_url:
                    # Convert URL path to filesystem path
                    old_path = block.media_url.replace('/uploads/', 'uploads/')
                    print(f"🗑️ Attempting to delete old file: {old_path}")
                    if os.path.exists(old_path):
                        try:
                            os.remove(old_path)
                            print(f"✅ Old file deleted")
                        except Exception as e:
                            print(f"⚠️ Could not delete old file: {e}")

                # Store as /uploads/content/filename
                block.media_url = f"/uploads/content/{filename}"
                print(f"✅ New media URL: {block.media_url}")
            else:
                print(f"❌ File type not allowed: {file.filename}")
                return jsonify({'success': False, 'message': 'File type not allowed'}), 400
        else:
            print("ℹ️ No file uploaded")

        block.updated_by = current_user.id
        block.updated_at = datetime.utcnow()
        db.session.commit()

        print(f"✅ Content block updated successfully")

        return jsonify({
            'success': True,
            'message': 'Content block updated',
            'content_block': block.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Update Content Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Failed to update content block: {str(e)}'}), 500


@app.route('/api/content/<int:block_id>/json', methods=['PUT'])
@role_required(['admin'])
def update_content_block_json(current_user, block_id):
    """Update content block with JSON data only (no file upload)"""
    try:
        print(f"🔄 JSON Update for block ID: {block_id}")
        
        block = ContentBlock.query.get(block_id)
        if not block:
            return jsonify({'success': False, 'message': 'Content block not found'}), 404

        data = request.get_json()
        print(f"📝 JSON data received: {data}")
        
        if 'title' in data:
            block.title = data['title'].strip()
        if 'content' in data:
            block.content = data['content'].strip()

        block.updated_by = current_user.id
        block.updated_at = datetime.utcnow()
        db.session.commit()

        print(f"✅ JSON update successful")

        return jsonify({
            'success': True,
            'message': 'Content block updated',
            'content_block': block.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Update Content JSON Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Failed to update content block: {str(e)}'}), 500
# ============================================================================
# DASHBOARD ANALYTICS ENDPOINTS
# ============================================================================

@app.route('/api/dashboard/summary', methods=['GET'])
@role_required(['admin', 'moderator'])
def dashboard_summary(current_user):
    """Get dashboard summary statistics - Admin/Moderator only"""
    try:
        total_users = User.query.count()
        verified_users = User.query.filter_by(is_verified=True).count()
        admin_users = User.query.filter_by(status='admin').count()
        moderator_users = User.query.filter_by(status='moderator').count()
        
        total_bookings = Booking.query.count()
        pending_bookings = Booking.query.filter_by(status='pending').count()
        confirmed_bookings = Booking.query.filter_by(status='confirmed').count()
        completed_bookings = Booking.query.filter_by(status='completed').count()
        cancelled_bookings = Booking.query.filter_by(status='cancelled').count()
        
        # Calculate total revenue from completed bookings
        completed_bookings_query = Booking.query.filter_by(status='completed')
        total_revenue = sum(float(booking.price) for booking in completed_bookings_query.all() if booking.price)
        
        # Get bookings from last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_bookings = Booking.query.filter(Booking.created_at >= seven_days_ago).count()
        
        return jsonify({
            'success': True,
            'summary': {
                'users': {
                    'total': total_users,
                    'verified': verified_users,
                    'admins': admin_users,
                    'moderators': moderator_users
                },
                'bookings': {
                    'total': total_bookings,
                    'pending': pending_bookings,
                    'confirmed': confirmed_bookings,
                    'completed': completed_bookings,
                    'cancelled': cancelled_bookings,
                    'recent_7_days': recent_bookings
                },
                'revenue': {
                    'total': total_revenue
                }
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Dashboard Summary Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load dashboard summary'}), 500


@app.route('/api/dashboard/charts', methods=['GET'])
@role_required(['admin', 'moderator'])
def dashboard_charts(current_user):
    """Get chart data for dashboard - Admin/Moderator only"""
    try:
        range_type = request.args.get('range', '7d')  # 7d, 30d, 90d
        
        days = 7
        if range_type == '30d':
            days = 30
        elif range_type == '90d':
            days = 90
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Bookings over time (daily)
        bookings_data = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            count = Booking.query.filter(
                Booking.created_at >= date,
                Booking.created_at < next_date
            ).count()
            bookings_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'bookings': count
            })
        
        # Revenue over time (daily)
        revenue_data = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            day_bookings = Booking.query.filter(
                Booking.created_at >= date,
                Booking.created_at < next_date,
                Booking.status == 'completed'
            ).all()
            revenue = sum(float(b.price) for b in day_bookings if b.price)
            revenue_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'revenue': revenue
            })
        
        # User registrations over time (daily)
        users_data = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            count = User.query.filter(
                User.created_at >= date,
                User.created_at < next_date
            ).count()
            users_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'users': count
            })
        
        # Booking status distribution
        status_distribution = {
            'pending': Booking.query.filter_by(status='pending').count(),
            'confirmed': Booking.query.filter_by(status='confirmed').count(),
            'completed': Booking.query.filter_by(status='completed').count(),
            'cancelled': Booking.query.filter_by(status='cancelled').count()
        }
        
        return jsonify({
            'success': True,
            'charts': {
                'bookings_over_time': bookings_data,
                'revenue_over_time': revenue_data,
                'users_over_time': users_data,
                'booking_status_distribution': status_distribution
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Dashboard Charts Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load chart data'}), 500
    
# =====================================================================
# UPDATE BOOKING STATUS (Admin / Moderator)
# =====================================================================

@app.route('/api/bookings/<int:booking_id>/status', methods=['PATCH'])
@role_required(['admin', 'moderator'])
def update_booking_status(current_user, booking_id):
    """
    Update booking status
    Allowed statuses: pending, confirmed, completed, cancelled
    """
    try:
        data = request.get_json()

        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400

        new_status = data['status'].strip().lower()

        ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']
        if new_status not in ALLOWED_STATUSES:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Allowed: {", ".join(ALLOWED_STATUSES)}'
            }), 400

        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'message': 'Booking not found'
            }), 404

        booking.status = new_status
        booking.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Booking status updated to {new_status}',
            'booking': booking.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Update Booking Status Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update booking status'
        }), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

# ============================================================================
# INITIALIZE DATABASE
# ============================================================================

with app.app_context():
    db.create_all()
    print("✅ Database initialized successfully")

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Flask Authentication API Server")
    print("="*50)
    print(f"📍 Server: http://localhost:4000")
    print(f"📚 API Docs: http://localhost:4000/")
    print(f"💚 Health Check: http://localhost:4000/api/health")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=4000, debug=True)