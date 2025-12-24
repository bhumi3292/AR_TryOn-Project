# Architecture Overview

System design and architecture of the AR Try-On application.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Unity AR Frontend                      │
│         (User Interface, 3D Visualization, AR Features)     │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ HTTP/REST API
               │
       ┌───────┴───────────────────────────────────────┐
       │                                               │
┌──────▼─────────────────────────┐      ┌──────────────▼───────────┐
│     MERN Backend Server         │      │   Python ML Server      │
│  (Port 5000)                   │      │   (Port 8000)           │
│                                 │      │                         │
│  • Express.js                   │      │  • FastAPI              │
│  • User Authentication (JWT)    │      │  • PyTorch Models       │
│  • Product Management           │      │  • Prediction Engine    │
│  • Review System                │      │  • Model Information    │
└──────┬─────────────────────────┘      └──────────┬──────────────┘
       │                                           │
       │ TCP Connection                   Internal Communication
       │                                           │
       └───────┬──────────────────────────────────┘
               │
       ┌───────▼──────────────┐
       │   MongoDB Database   │
       │   (Port 27017)       │
       │                      │
       │  • Users            │
       │  • Products         │
       │  • Categories       │
       │  • Reviews          │
       └────────────────────┘
```

## Component Architecture

### 1. MERN Backend (Node.js + Express + MongoDB)

#### Purpose
- User authentication and authorization
- Product catalog management
- Order processing (future)
- API gateway for frontend

#### Technology
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: MongoDB 7.0 + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

#### Folder Structure
```
mern-backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Category.js
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── productController.js
│   │   └── categoryController.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── categoryRoutes.js
│   ├── middleware/            # Express middleware
│   │   └── authMiddleware.js  # JWT verification
│   ├── uploads/               # File storage
│   └── index.js               # Main app file
├── .env                       # Environment config
├── package.json               # Dependencies
└── README.md
```

#### Key Features
1. **Authentication**
   - User registration with email validation
   - Login with JWT token generation
   - Protected routes with middleware

2. **Product Management**
   - CRUD operations for products
   - Category classification
   - 3D model support (GLB, OBJ, FBX)
   - Pagination and search

3. **Review System**
   - Product ratings (0-5 stars)
   - User reviews with comments
   - Average rating calculation

#### Database Schema

**Users Collection**
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin | customer),
  profilePic: String,
  isActive: Boolean,
  timestamps: { createdAt, updatedAt }
}
```

**Products Collection**
```
{
  _id: ObjectId,
  name: String,
  category: ObjectId (ref: Category),
  imgUrl: String,
  model3DUrl: String,
  model3DType: String (glb | obj | fbx),
  price: Number,
  description: String,
  specifications: {
    material: String,
    weight: String,
    dimensions: String
  },
  stock: Number,
  inStock: Boolean,
  ratings: Number,
  reviews: [{
    user: ObjectId (ref: User),
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  views: Number,
  createdBy: ObjectId (ref: User),
  timestamps: { createdAt, updatedAt }
}
```

**Categories Collection**
```
{
  _id: ObjectId,
  name: String (unique),
  description: String,
  icon: String,
  isActive: Boolean,
  timestamps: { createdAt, updatedAt }
}
```

### 2. Python ML Server (FastAPI + PyTorch)

#### Purpose
- Jewelry recommendation engine
- User preference matching
- Product-user compatibility prediction
- Inference API for frontend

#### Technology
- **Runtime**: Python 3.10+
- **Framework**: FastAPI
- **ML Framework**: PyTorch
- **Server**: Uvicorn
- **Data**: NumPy, Pandas, scikit-learn

#### Folder Structure
```
python-ml/
├── models/                    # ML models
│   └── skill_match_model.py   # Neural network
├── server/                    # FastAPI application
│   └── app.py                # API endpoints
├── scripts/                   # Training & utilities
│   ├── train.py              # Model training
│   └── generate_weights.py   # Weight generation
├── utils/                     # Utilities
│   ├── encode.py             # Feature encoding
│   └── load_data.py          # Data loading
├── data/                      # Training data
├── requirements.txt           # Dependencies
└── README.md
```

#### ML Model Architecture

**SkillMatchModel (Neural Network)**

```
Input Layer (10D)
    ↓
Dense Layer (10 → 64) + ReLU + Dropout(0.2)
    ↓
Dense Layer (64 → 32) + ReLU + Dropout(0.2)
    ↓
Dense Layer (32 → 1) + Sigmoid
    ↓
Output (0-1 probability)
```

**Input Features (10D vector)**
1. Preferred metal type (0-1)
2. Preferred jewelry size (0-1)
3. Style preference (0-1)
4. Budget range (0-1)
5. Occasion formality (0-1)
6. Color preference (0-1)
7. Gemstone preference (0-1)
8. Comfort importance (0-1)
9. Brand preference (0-1)
10. Trend awareness (0-1)

#### API Endpoints

1. **Health Check** - `GET /health`
   - Returns server status and device info

2. **Single Prediction** - `POST /predict`
   - Input: 10D feature vector
   - Output: Score, prediction (0/1), confidence

3. **Batch Predictions** - `POST /predict/batch`
   - Input: Multiple feature vectors
   - Output: Batch results

4. **Model Info** - `GET /model/info`
   - Returns model architecture and parameters

### 3. Unity AR Frontend

#### Purpose
- User interface for AR experience
- 3D model visualization
- Real-time jewelry try-on
- User interaction and camera handling

#### Key Features
- AR camera integration
- 3D model loading (GLB, OBJ, FBX)
- Real-time rendering
- Touch/gesture controls
- Product selection interface

---

## Data Flow Diagrams

### 1. User Registration Flow

```
User (Unity) 
    ↓
    └─→ [POST /api/auth/register]
        ├─ Validate input
        ├─ Hash password
        ├─ Save to MongoDB
        └─→ Return JWT Token
             (Store in localStorage)
```

### 2. Product Browsing Flow

```
User (Unity)
    ↓
    └─→ [GET /api/products?category=...]
        ├─ Query MongoDB
        ├─ Apply filters & pagination
        └─→ Return product list
             (Including 3D model URLs)
             ↓
        [Load 3D models in Unity]
```

### 3. Jewelry Recommendation Flow

```
User (Unity) selects product
    ↓
    └─→ [Backend API] Extract user preferences
        ├─ Create 10D feature vector
        └─→ [POST /predict] (ML Server)
            ├─ Run neural network
            └─→ Return compatibility score
                ├─ If score > threshold: Show as compatible
                └─ If score < threshold: Show alternatives
```

### 4. Product Review Flow

```
User (Unity) submits review
    ↓
    └─→ [POST /api/products/:id/review]
        ├─ Validate review data
        ├─ Save to MongoDB
        ├─ Calculate average rating
        └─→ Return updated product
```

---

## API Communication Pattern

### Request-Response Cycle

```
┌─────────────┐
│ Unity App   │
└──────┬──────┘
       │
       │ HTTP/REST Request
       │ (with JWT token in header)
       ↓
┌──────────────────────┐
│ Backend Server       │
│ - Parse request      │
│ - Verify JWT token   │
│ - Execute logic      │
│ - Query MongoDB      │
└──────┬───────────────┘
       │
       ├─→ [Call ML Server if needed]
       │   └─→ POST /predict
       │       └─→ Return prediction score
       │
       │ JSON Response
       ↓
┌─────────────┐
│ Unity App   │
│ - Parse JSON│
│ - Update UI │
│ - Render 3D │
└─────────────┘
```

---

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Unity | 2022 LTS+ |
| Backend Runtime | Node.js | 18+ |
| Backend Framework | Express.js | 4.18+ |
| Database | MongoDB | 7.0+ |
| Database ODM | Mongoose | 7.0+ |
| Authentication | JWT | - |
| Password Hashing | bcryptjs | 2.4+ |
| ML Runtime | Python | 3.10+ |
| ML Framework | PyTorch | 2.0+ |
| ML Server | FastAPI | 0.95+ |
| ML Server Runtime | Uvicorn | 0.21+ |

---

## Security Architecture

### Authentication Flow

```
1. User Registers
   └─→ Password hashed with bcryptjs (10 rounds)
       └─→ Saved to MongoDB

2. User Logs In
   └─→ Password verified with bcrypt
       └─→ JWT token generated (secret key)
           └─→ Sent to client (localStorage)

3. Protected Request
   └─→ Token sent in Authorization header
       └─→ Backend verifies signature & expiration
           └─→ Request allowed if valid
               └─→ User ID attached to req.user
```

### Data Security

- Passwords: bcryptjs hashing (10 salt rounds)
- Tokens: JWT with HS256 signature
- Database: MongoDB with access controls
- API: CORS enabled for trusted origins
- HTTPS: Required in production

---

## Deployment Architecture

### Docker Compose Setup

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./mern-backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/AR_Project
      - JWT_SECRET=<secret>
    depends_on:
      - mongodb

  ml-server:
    build: ./python-ml
    ports:
      - "8000:8000"
    environment:
      - ML_DEVICE=cpu
```

---

## Scalability Considerations

### Current Architecture
- Single backend server
- Single ML server
- Single MongoDB instance

### Future Improvements
1. **Backend Scaling**
   - Load balancer (nginx/HAProxy)
   - Multiple backend instances
   - Horizontal scaling with Kubernetes

2. **Database Scaling**
   - MongoDB replica set
   - Database sharding
   - Read replicas for queries

3. **ML Scaling**
   - Multiple ML server instances
   - Model caching
   - GPU support for faster inference

4. **Caching**
   - Redis for session storage
   - Cache product data
   - Cache ML predictions

---

## Performance Optimization

1. **Backend**
   - Database indexing on frequently queried fields
   - Pagination for large datasets
   - Connection pooling

2. **ML Server**
   - Model quantization for faster inference
   - Batch processing support
   - Device acceleration (CUDA/GPU)

3. **Frontend**
   - Lazy loading of 3D models
   - Model caching
   - Efficient rendering

---

Last updated: 2024
