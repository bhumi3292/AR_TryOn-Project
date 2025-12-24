# 🎨 AR Try-On App - Complete AR Jewelry Platform

A full-stack Augmented Reality application for virtual jewelry try-on with MERN backend and Python ML analytics.

## 📁 Project Structure

```
AR-TryOn-App/
│
├── unity-frontend/               # Unity project for AR + UI
│   ├── Assets/
│   ├── Scenes/
│   ├── Scripts/
│   ├── UI/
│   └── ProjectSettings/
│
├── mern-backend/                 # Node.js + Express + MongoDB backend
│   ├── src/
│   │   ├── config/              # Database configuration
│   │   ├── models/              # MongoDB schemas
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Authentication & validation
│   │   └── index.js             # Entry point
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── python-ml/                    # Python ML & Analytics
│   ├── server/                  # FastAPI inference server
│   ├── models/                  # PyTorch/TensorFlow models
│   ├── scripts/                 # Training & processing scripts
│   ├── data/                    # Datasets
│   ├── utils/                   # Utility functions
│   ├── requirements.txt
│   └── README.md
│
├── docs/                         # Documentation
│   ├── API_REFERENCE.md         # API endpoints & specs
│   ├── SETUP_GUIDE.md           # Installation & setup
│   ├── ARCHITECTURE.md          # System architecture
│   ├── DEPLOYMENT.md            # Deployment guide
│   └── TROUBLESHOOTING.md       # Common issues
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

### Backend Setup
```bash
cd mern-backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

### ML Server Setup
```bash
cd python-ml
pip install -r requirements.txt
python -m uvicorn server.app:app --port 8000 --reload
```

### Unity Frontend
Open `unity-frontend/` in Unity Editor (2022 LTS or newer)

## 📊 Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Unity     │─────▶│   MERN       │─────▶│   MongoDB    │
│  Frontend   │      │  Backend     │      │  Database    │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                      ┌──────────────┐
                      │   Python ML  │
                      │   Server     │
                      └──────────────┘
```

## 🔑 Key Features

### Backend (MERN)
- ✅ User authentication (JWT)
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Product reviews & ratings
- ✅ ML model integration
- ✅ RESTful API endpoints
- ✅ Role-based access control

### ML Server
- ✅ Recommendation engine
- ✅ Analytics processing
- ✅ Model inference
- ✅ Data preprocessing
- ✅ REST API endpoints

### Unity Frontend
- ✅ AR jewelry visualization
- ✅ Real-time try-on
- ✅ Product browsing
- ✅ User interface
- ✅ Authentication

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)

## 🐳 Docker Deployment

```bash
docker compose up -d
```

Services:
- Backend: http://localhost:5000
- ML Server: http://localhost:8000
- MongoDB: localhost:27017

## 📚 Documentation

- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Installation & configuration
- **[Architecture](docs/ARCHITECTURE.md)** - System design & components
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues & solutions

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcryptjs)
- ✅ CORS protection
- ✅ Input validation
- ✅ Role-based access control
- ✅ Environment variable configuration

## 📈 Performance

- ✅ Database indexing
- ✅ Caching strategies
- ✅ Batch processing
- ✅ Load balancing ready
- ✅ Scalable architecture

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Unity | 2022 LTS+ |
| Backend | Node.js + Express | 18+ |
| Database | MongoDB | 7.0+ |
| ML | Python + FastAPI | 3.10+ |
| Containerization | Docker | Latest |

## 📋 Development Workflow

1. **Backend Development**: `cd mern-backend && npm run dev`
2. **ML Development**: `cd python-ml && python -m uvicorn server.app:app --reload`
3. **Frontend Development**: Open `unity-frontend/` in Unity

## 🚀 Deployment

### Development
```bash
npm run dev          # Backend
python -m uvicorn server.app:app --reload  # ML
```

### Production
```bash
npm start            # Backend
gunicorn -w 4 server.app:app  # ML
docker compose up -d # All services
```

## 🔍 Testing

```bash
# Backend tests
cd mern-backend
npm test

# ML tests
cd python-ml
pytest
```

## 📞 Support & Documentation

- Backend: See `mern-backend/README.md`
- ML: See `python-ml/README.md`
- General: See `docs/`

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** December 2024  
**Maintained by:** AR Try-On Team
