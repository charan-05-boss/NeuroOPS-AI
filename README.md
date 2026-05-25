# NeuroOps AI 🧠⚙️

> **Production-grade AI-powered DevOps monitoring platform** — real-time system metrics, anomaly detection, and intelligent alerting.

---

## 🏗️ Architecture Overview

```
neuroops-ai/
├── backend/          # FastAPI — metrics collection, AI analytics, alerting
└── frontend/         # React + Vite — real-time dashboard, charts, alerts UI
```

---

## 🚀 Quick Start

### Prerequisites
- Python ≥ 3.11
- Node.js ≥ 20
- pnpm (or npm)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # fill in your values
uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
pnpm install                      # or: npm install
cp .env.example .env.local        # fill in your values
pnpm dev                          # or: npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🧩 Tech Stack

| Layer      | Technology                                           |
|-----------|------------------------------------------------------|
| Frontend  | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui   |
| Charts    | Recharts                                             |
| Animation | Framer Motion                                        |
| HTTP      | Axios                                                |
| State     | Zustand                                              |
| Backend   | Python 3.11, FastAPI, Uvicorn                        |
| Metrics   | psutil                                               |
| AI/ML     | scikit-learn (Isolation Forest), pandas, numpy       |
| Testing   | pytest (backend), Vitest (frontend)                  |

---

## 📁 Project Structure

### Backend
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry, startup events
│   ├── config.py            # Pydantic settings (reads .env)
│   ├── dependencies.py      # Shared FastAPI dependencies
│   ├── api/v1/
│   │   ├── router.py        # Aggregated API router
│   │   └── endpoints/
│   │       ├── health.py    # GET /health
│   │       ├── metrics.py   # GET /metrics/current, /metrics/history
│   │       ├── analytics.py # GET /analytics/anomalies
│   │       └── alerts.py    # GET/POST /alerts
│   ├── core/
│   │   ├── logging.py       # Structured JSON logging
│   │   └── middleware.py    # CORS + request timing
│   ├── models/              # Pydantic request/response schemas
│   ├── services/
│   │   ├── system_monitor.py    # psutil metric collection
│   │   ├── anomaly_detector.py  # sklearn Isolation Forest
│   │   └── alert_engine.py      # Rule-based alert triggers
│   └── utils/helpers.py
├── tests/
├── requirements.txt
├── .env.example
└── Makefile
```

### Frontend
```
frontend/
├── src/
│   ├── api/             # Axios client + typed endpoint functions
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── charts/      # Recharts wrappers (CPU, Memory, Network)
│   │   ├── layout/      # Sidebar, Header, PageWrapper
│   │   └── shared/      # MetricCard, AlertBadge, StatusIndicator
│   ├── pages/           # Dashboard, Analytics, Alerts, Settings
│   ├── hooks/           # useMetrics, useAlerts, useWebSocket
│   ├── store/           # Zustand state
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Formatters, helpers
├── vite.config.ts
├── tailwind.config.ts
└── components.json      # shadcn/ui config
```

---

## 🔌 API Reference

| Method | Endpoint                   | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/api/v1/health`          | Health check                   |
| GET    | `/api/v1/metrics/current` | Current system snapshot        |
| GET    | `/api/v1/metrics/history` | Historical metrics (last N pts)|
| GET    | `/api/v1/analytics/anomalies` | AI-detected anomalies      |
| GET    | `/api/v1/alerts`          | List active alerts             |
| POST   | `/api/v1/alerts`          | Create manual alert            |
| DELETE | `/api/v1/alerts/{id}`     | Dismiss alert                  |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
APP_ENV=development
APP_NAME=NeuroOps AI
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173
METRICS_HISTORY_LIMIT=100
ANOMALY_CONTAMINATION=0.1
ALERT_CPU_THRESHOLD=85
ALERT_MEMORY_THRESHOLD=90
ALERT_DISK_THRESHOLD=95
LOG_LEVEL=INFO
```

### Frontend (`frontend/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_POLL_INTERVAL_MS=3000
VITE_APP_NAME=NeuroOps AI
```

---

## 🧪 Testing

```bash
# Backend
cd backend && pytest -v

# Frontend
cd frontend && pnpm test
```

---

## 🛠️ Make Commands (Backend)

```bash
make dev        # Run dev server
make test       # Run pytest
make lint       # Run ruff + mypy
make format     # Run black + isort
make clean      # Remove __pycache__, .pytest_cache
```

---

## 📐 Engineering Practices

- **Typed everywhere** — Pydantic v2 on backend, TypeScript strict mode on frontend
- **CORS configured** — environment-driven allowed origins
- **Structured logging** — JSON-formatted logs with request IDs
- **Centralized error handling** — FastAPI exception handlers
- **Component-driven UI** — shadcn/ui primitives + custom reusable components
- **Environment isolation** — all secrets in `.env` files, never hardcoded

---

## 📄 License

MIT © NeuroOps AI
