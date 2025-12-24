# Quick Start Guide

Get the AR Try-On application running in 10 minutes.

## Prerequisites

- **Node.js** 18+ - Download from https://nodejs.org/
- **Python** 3.10+ - Download from https://www.python.org/
- **MongoDB** 7.0+ - Download from https://www.mongodb.com/
- **Git** - For cloning repositories

## Step 1: Clone & Setup

```bash
# Navigate to your projects directory
cd your-projects

# Clone the repository
git clone <repo-url>
cd AR-TryOn-App
```

## Step 2: Start MongoDB

### Option A: Local Installation
```bash
# Start MongoDB service (Windows)
mongod

# Or use MongoDB Atlas (cloud)
# Set MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/AR_Project
```

## Step 3: Start Backend Server

```bash
cd mern-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your settings if needed
# Default: PORT=5000, MONGODB_URI=mongodb://localhost:27017/AR_Project

# Start the backend
npm start

# Expected output:
# 🚀 Backend Server running on port 5000
# ✅ MongoDB Connected Successfully
```

Backend runs on: `http://localhost:5000`

## Step 4: Start ML Server

```bash
cd ../python-ml

# Install dependencies
pip install -r requirements.txt

# Start the ML server
python -m server.app

# Expected output:
# INFO: Uvicorn running on http://0.0.0.0:8000
# ✅ Model loaded successfully
```

ML Server runs on: `http://localhost:8000`

## Step 5: Test the APIs

### Test Backend

```bash
# Health check
curl http://localhost:5000/api/health

# Expected response:
# {"status":"Backend is running","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Test ML Server

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","model_loaded":true,"device":"cpu"}
```

### Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Step 6: Open Unity Frontend

1. Open **Unity Hub**
2. Click **Add project from disk**
3. Select `AR-TryOn-App/unity-frontend/`
4. Open in Unity 2022 or later

## Success!

If all three services are running:
- ✅ Backend: http://localhost:5000
- ✅ ML Server: http://localhost:8000  
- ✅ Unity: Ready to develop

## Using Docker Compose (Alternative)

If you have Docker installed:

```bash
# From AR-TryOn-App directory
docker-compose up

# All services start automatically:
# - Backend on port 5000
# - ML Server on port 8000
# - MongoDB on port 27017

# Stop with:
docker-compose down
```

## Common Issues

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -r mern-backend/node_modules
cd mern-backend && npm install
```

### MongoDB connection error
```bash
# Ensure MongoDB is running
# Windows: Start mongod service
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port already in use
```bash
# Change port in .env
PORT=5001  # or another available port
```

### Python module errors
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Next Steps

1. **Read the API Documentation**: See [API_REFERENCE.md](./API_REFERENCE.md)
2. **Understand the Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Configure Settings**: Update `.env` files as needed
4. **Create sample data**: Use API endpoints to add products
5. **Test in Unity**: Create AR experience with test data

## API Testing Tools

### Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import collection: `POSTMAN_COLLECTION.json`
3. Test endpoints

### Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create requests to test APIs

### cURL (Command line)
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"User","email":"user@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get products
curl http://localhost:5000/api/products
```

## Documentation

- [Complete Documentation Index](./INDEX.md)
- [Backend Setup Details](../mern-backend/README.md)
- [ML Server Documentation](../python-ml/README.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Support

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review individual README files in each component folder
- Check API documentation for endpoint details

---

Happy coding! 🚀
