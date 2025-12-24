# API Reference

Complete API documentation for the AR Try-On application.

## Base URLs

- **Backend**: `http://localhost:5000` (development)
- **ML Server**: `http://localhost:8000` (development)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Response Format

All responses are JSON:

```json
{
  "message": "Success message",
  "data": {},
  "status": 200
}
```

Error responses:

```json
{
  "message": "Error description",
  "status": 400
}
```

---

## Backend API

### Health Check

#### GET /api/health

Check backend server status.

**Response**: 200 OK
```json
{
  "status": "Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**: 201 Created
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- 400: Missing required fields
- 409: Email already exists

---

### POST /api/auth/login

Login a user.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**: 200 OK
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- 400: Missing email or password
- 401: Invalid credentials

---

### GET /api/auth/profile

Get authenticated user's profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: 200 OK
```json
{
  "message": "Profile fetched successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "profilePic": "https://...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 401: No token provided
- 404: User not found

---

### PUT /api/auth/profile

Update user profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "name": "Jane Doe",
  "profilePic": "https://example.com/pic.jpg"
}
```

**Response**: 200 OK
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "john@example.com",
    "profilePic": "https://example.com/pic.jpg",
    "role": "customer",
    "isActive": true
  }
}
```

---

### POST /api/auth/logout

Logout user.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: 200 OK
```json
{
  "message": "Logout successful"
}
```

---

## Product Endpoints

### GET /api/products

Get all products with pagination and filtering.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `category` (optional): Filter by category ID
- `search` (optional): Search by product name

**Response**: 200 OK
```json
{
  "message": "Products fetched successfully",
  "products": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Diamond Ring",
      "category": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Rings"
      },
      "imgUrl": "https://...",
      "model3DUrl": "https://...model.glb",
      "model3DType": "glb",
      "price": 1500,
      "description": "Beautiful diamond ring",
      "stock": 10,
      "inStock": true,
      "ratings": 4.5,
      "views": 150,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "pages": 4,
    "currentPage": 1
  }
}
```

---

### GET /api/products/:id

Get product by ID.

**Response**: 200 OK
```json
{
  "message": "Product fetched successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Diamond Ring",
    "category": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Rings"
    },
    "imgUrl": "https://...",
    "model3DUrl": "https://...model.glb",
    "model3DType": "glb",
    "price": 1500,
    "description": "Beautiful diamond ring",
    "specifications": {
      "material": "18K Gold",
      "weight": "5g",
      "dimensions": "20mm x 15mm"
    },
    "stock": 10,
    "inStock": true,
    "ratings": 4.5,
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "user": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe"
        },
        "rating": 5,
        "comment": "Beautiful piece!",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "views": 151,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Admin User"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST /api/products

Create a new product (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "name": "Diamond Ring",
  "category": "507f1f77bcf86cd799439013",
  "imgUrl": "https://example.com/ring.jpg",
  "model3DUrl": "https://example.com/ring.glb",
  "model3DType": "glb",
  "price": 1500,
  "description": "Beautiful diamond ring",
  "specifications": {
    "material": "18K Gold",
    "weight": "5g",
    "dimensions": "20mm x 15mm"
  },
  "stock": 10
}
```

**Response**: 201 Created
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Diamond Ring",
    ...
  }
}
```

**Errors**:
- 400: Missing required fields
- 404: Category not found
- 401: Not authenticated

---

### PUT /api/products/:id

Update a product (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "name": "Updated Product Name",
  "price": 2000,
  "stock": 5
}
```

**Response**: 200 OK

---

### DELETE /api/products/:id

Delete a product (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: 200 OK
```json
{
  "message": "Product deleted successfully"
}
```

---

### POST /api/products/:id/review

Add a review to a product (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "rating": 5,
  "comment": "Amazing product!"
}
```

**Response**: 201 Created
```json
{
  "message": "Review added successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Diamond Ring",
    "ratings": 4.7,
    "reviews": [...]
  }
}
```

---

## Category Endpoints

### GET /api/categories

Get all active categories.

**Response**: 200 OK
```json
{
  "message": "Categories fetched successfully",
  "categories": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Rings",
      "description": "Finger rings and bands",
      "icon": "ring-icon.png",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/categories/:id

Get category by ID.

**Response**: 200 OK
```json
{
  "message": "Category fetched successfully",
  "category": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Rings",
    "description": "Finger rings and bands",
    "icon": "ring-icon.png",
    "isActive": true
  }
}
```

---

### POST /api/categories

Create a new category (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "name": "Necklaces",
  "description": "Necklaces and chains",
  "icon": "necklace-icon.png"
}
```

**Response**: 201 Created

---

### PUT /api/categories/:id

Update a category (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

---

### DELETE /api/categories/:id

Delete a category (authenticated).

**Headers**:
```
Authorization: Bearer <token>
```

---

## ML Server API

### GET /health

Check ML server health.

**Response**: 200 OK
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu",
  "message": "ML server is running"
}
```

---

### GET /model/info

Get model information.

**Response**: 200 OK
```json
{
  "name": "SkillMatchModel",
  "version": "1.0.0",
  "architecture": "MLP with 3 layers",
  "input_features": 10,
  "parameters": 4160,
  "device": "cpu"
}
```

---

### POST /predict

Make a single prediction.

**Request**:
```json
{
  "features": [0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.6, 0.4, 0.7],
  "threshold": 0.5
}
```

**Response**: 200 OK
```json
{
  "score": 0.7234,
  "prediction": 1,
  "confidence": 0.7234
}
```

---

### POST /predict/batch

Make batch predictions.

**Request**:
```json
{
  "predictions": [
    {
      "features": [0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.6, 0.4, 0.7],
      "threshold": 0.5
    },
    {
      "features": [0.3, 0.4, 0.6, 0.5, 0.7, 0.2, 0.8, 0.4, 0.6, 0.5],
      "threshold": 0.5
    }
  ]
}
```

**Response**: 200 OK
```json
{
  "results": [
    {
      "score": 0.7234,
      "prediction": 1,
      "confidence": 0.7234
    },
    {
      "score": 0.4821,
      "prediction": 0,
      "confidence": 0.5179
    }
  ],
  "total": 2
}
```

---

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Rate Limiting

(To be implemented in production)

- Default: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

---

## Pagination

For list endpoints with pagination:

**Query**:
```
GET /api/products?page=1&limit=12
```

**Response includes**:
```json
{
  "pagination": {
    "total": 45,
    "pages": 4,
    "currentPage": 1
  }
}
```

---

Last updated: 2024
