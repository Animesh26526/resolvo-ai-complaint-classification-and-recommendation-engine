# Resolvo: AI-Powered Complaint Classification & Resolution Recommendation Engine

Resolvo is an enterprise-grade, web-based complaint management and intelligent resolution recommendation engine designed for multi-channel customer intake (text, email, customer helpline calls, chatbot/audio, and direct communication).

The platform automatically classifies complaints into **Product**, **Packaging**, or **Trade**, performs sentiment analysis, dynamically assigns **High**, **Medium**, or **Low** priority, and generates actionable resolution recommendations.

---

## 🏛️ System Architecture

```text
React Frontend (Vite + Tailwind CSS)
        │
        │ HTTP / REST + JWT
        ▼
Node.js + Express Backend (JavaScript)
        ├── Authentication & RBAC (Customer, CSE, QAT, OM)
        ├── Complaint Lifecycle & SLA Engine
        ├── Resolutions & QA Review
        └── Reports (PDF / CSV)
        │                       │
        │ Mongoose              │ REST
        ▼                       ▼
MongoDB (ComplaintDB)    FastAPI AI/ML Service (Python)
                                ├── Classification (Product/Packaging/Trade)
                                ├── Sentiment & Priority Assignment
                                └── Resolution Recommendation Engine
```

---

## 📁 Project Structure

```text
resolvo-ai-complaint-classification-and-recommendation-engine/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── health.controller.js
│   │   ├── db/
│   │   │   └── db.js
│   │   ├── middlewares/
│   │   │   └── error.middleware.js
│   │   ├── models/
│   │   │   └── .gitkeep
│   │   ├── routes/
│   │   │   └── health.routes.js
│   │   ├── services/
│   │   │   └── ai.service.js
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .env
│   └── .env.example
├── ai-service/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── complaint_analyzer.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── .gitignore
├── Backend-code-writing-style.txt
├── Complaint_Resolution_System_PRD.md
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+) & **pip**
- **MongoDB** (Local instance or MongoDB Atlas cluster)

---

### 2. Node.js + Express Backend Setup

1. Open terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (refer to `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/ComplaintDB
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   AI_SERVICE_URL=http://127.0.0.1:8000
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Run backend in development mode:
   ```bash
   npm run dev
   ```
   *Health endpoint: `http://localhost:5000/api/health`*

---

### 3. FastAPI AI/ML Service Setup

1. Open terminal and navigate to `ai-service`:
   ```bash
   cd ai-service
   ```
2. Create and activate a Python virtual environment:
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env` (refer to `.env.example`):
   ```env
   HOST=0.0.0.0
   PORT=8000
   ENVIRONMENT=development
   CORS_ORIGINS=http://localhost:5000,http://localhost:5173
   ```
5. Run the FastAPI service:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Health endpoint: `http://localhost:8000/health`*  
   *Interactive Swagger docs: `http://localhost:8000/docs`*

---

### 4. React + Vite Frontend Setup

1. Open terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (refer to `.env.example`):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_AI_SERVICE_URL=http://localhost:8000
   ```
4. Run frontend in development mode:
   ```bash
   npm run dev
   ```
   *Frontend access: `http://localhost:5173`*

---

## 🔍 Available Endpoints

### Health Endpoints
| Service | Endpoint | Method | Expected Response |
| :--- | :--- | :--- | :--- |
| **Node.js Backend** | `/api/health` | `GET` | `{ "message": "Resolvo Backend is healthy", "status": "ok", "database": { ... } }` |
| **Node.js Backend** | `/` | `GET` | Root API informational response |
| **FastAPI AI Engine** | `/health` | `GET` | `{ "status": "ok", "message": "Resolvo AI Service is running", ... }` |
| **FastAPI AI Engine** | `/docs` | `GET` | Interactive OpenAPI / Swagger UI |

### Authentication & Authorization Endpoints (`/api/auth`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register new user, hash password, generate & email 6-digit verification OTP |
| `/api/auth/verify-email` | `POST` | Public | Verify account email with OTP code |
| `/api/auth/resend-otp` | `POST` | Public | Resend new verification OTP to email |
| `/api/auth/login` | `POST` | Public | Authenticate user (blocks unverified accounts), returns JWT token & safe profile |
| `/api/auth/logout` | `POST` | Public | Invalidate/logout client session |
| `/api/auth/me` | `GET` | Authenticated | Retrieve authenticated user profile (`req.user`) |
| `/api/auth/staff-check` | `GET` | CSE, QAT, OM | Role-protected verification endpoint |

### Complaint Management Endpoints (`/api/complaints`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/complaints` | `POST` | Customer | Submit a new complaint (generates `complaintId`, defaults to status `Received`) |
| `/api/complaints` | `GET` | Customer | Retrieve customer's own complaint history (newest first) |
| `/api/complaints/:id` | `GET` | Customer / CSE | Retrieve specific complaint by ID (enforces customer ownership; CSE can view all) |
| `/api/complaints/staff` | `GET` | CSE | Retrieve all complaints with optional filters (`status`, `category`, `channel`, `priority`, `assignedTo`) |
| `/api/complaints/staff` | `POST` | CSE | Direct complaint intake by CSE (e.g. phone call, email, walk-in) |
| `/api/complaints/:id/status` | `PATCH` | CSE | Update complaint status with validated lifecycle transitions |
| `/api/complaints/:id/assign` | `PATCH` | CSE | Assign complaint to a CSE (transitions status to `Assigned`) |
| `/api/complaints/:id/analyze` | `POST` | Customer / CSE / QAT | Trigger AI analysis (classification, sentiment, priority, resolution recommendation) |
| `/api/complaints/:id/register` | `POST` | Customer / CSE | Formalize/register an analyzed complaint for CSE handling |
| `/api/complaints/:id/resolution` | `GET` | Customer / CSE / QAT / OM | Fetch AI and staff resolution details for a complaint |
| `/api/complaints/:id/resolution` | `POST` / `PUT` | CSE | Record or update CSE resolution action, remarks, and status |

### AI Service Endpoints (FastAPI)
| Endpoint | Method | Expected Response | Description |
| :--- | :--- | :--- | :--- |
| `/health` & `/api/health` | `GET` | `{ "status": "ok", "service": "ai-service" }` | Service health status |
| `/api/analyze` & `/analyze` | `POST` | `{ "category", "sentiment", "priority", "recommendation", "is_resolvable_by_ai" }` | AI Complaint Analysis engine |

---

## 👥 Supported Roles (RBAC)

- **Customer (`customer`):** Submits complaints (text, call, chatbot), receives preliminary AI recommendations, tracks resolution status.
- **Customer Support Executive (`cse`):** Directly registers multi-channel complaints, reviews AI classification & recommendations, executes resolution actions, or escalates.
- **Quality Assurance Team (`qat`):** Inspects classification accuracy, audits resolution quality, monitors trends.
- **Operations Manager (`om`):** Oversees macro operational dashboards, SLA compliance, pending/overdue tickets, and generates PDF/CSV reports.

---

## 🧪 Running Tests

To run the automated backend test suites:
```bash
cd backend
npm test               # Runs auth, complaint, and AI integration test suites
npm run test:auth      # Runs authentication & RBAC test suite (39 tests)
npm run test:complaints # Runs complaint lifecycle test suite (47 tests)
npm run test:ai        # Runs AI analysis & resolution layer integration suite (45 tests)
```

To run the independent FastAPI test suite:
```bash
cd ai-service
.\venv\Scripts\python test_ai_service.py   # 10 tests
```