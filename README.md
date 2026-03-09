# StockPilot 

A RESTful inventory management API built with FastAPI, featuring JWT authentication, role-based access control, and full stock movement tracking.

---

## 🛠 Tech Stack

- **Python 3.11+**
- **FastAPI** — Modern, fast web framework for building APIs
- **SQLAlchemy** — ORM for database management
- **Alembic** — Database migrations
- **SQLite** (development) / **PostgreSQL** (production)
- **JWT (JSON Web Tokens)** — Authentication
- **Passlib + Bcrypt** — Password hashing
- **Pydantic** — Data validation

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/DHeraCode/StockPilot.git
cd StockPilot/backend
```

### 2. Create and activate virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Create a `.env` file in the `backend/` folder based on `.env.example`:
```bash
cp .env.example .env
```

Fill in the values:
```env
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./stockpilot.db
```

To generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Run database migrations
```bash
alembic upgrade head
```

### 6. Start the server
```bash
uvicorn app.main:app --reload
```

API will be available at: `http://127.0.0.1:8000`  
Interactive docs (Swagger): `http://127.0.0.1:8000/docs`

---

## 🔐 Authentication

StockPilot uses JWT Bearer token authentication. The first registered user is automatically assigned the admin role.

To authenticate in Swagger:
1. Register a user via `POST /auth/register`
2. Login via `POST /auth/login`
3. Click the **Authorize** button and enter your credentials

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login and get access token | No |
| GET | `/auth/me` | Get current user info | Yes |

### Products
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/products/` | Create a product | Yes |
| GET | `/products/` | List products (with pagination & search) | Yes |
| PUT | `/products/{id}` | Update a product | Yes |
| DELETE | `/products/{id}` | Delete a product | Yes |
| GET | `/products/alerts/low-stock` | Get low stock alerts | Yes |

### Categories
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/categories/` | Create a category | Admin only |
| GET | `/categories/` | List all categories | Yes |
| DELETE | `/categories/{id}` | Delete a category | Admin only |

### Stock Movements
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/stock/` | Register stock entry or exit | Admin only |
| GET | `/stock/{product_id}` | Get movement history for a product | Admin only |

---

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key | — |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes | `60` |
| `DATABASE_URL` | Database connection URL | `sqlite:///./stockpilot.db` |

---

## 🗺️ Roadmap

- [ ] Migrate to PostgreSQL for production
- [ ] Frontend dashboard (React + Vite)
- [ ] Email notifications for low stock alerts
- [ ] Export reports to CSV/PDF
- [ ] Docker support
- [ ] Unit and integration tests

---

## 👨‍💻 Author

**Donny Hera** — [@DHeraCode](https://github.com/DHeraCode)
