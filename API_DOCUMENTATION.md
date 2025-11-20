# GTextSuite Backend API Documentation

Complete API reference for frontend integration.

## Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [User Endpoints](#user-endpoints)
4. [Property Endpoints](#property-endpoints)
5. [Error Handling](#error-handling)
6. [Data Models](#data-models)

---

## Base Configuration

**Base URL:** `http://localhost:5000` (Development)  
**API Prefix:** `/api`

**Content-Type:** `application/json`  
**Cookie Support:** Required for authentication (HttpOnly cookies)

---

## Authentication

### How Authentication Works

1. User logs in via `/api/users/login`
2. Server sets `auth_token` cookie (HttpOnly, secure)
3. Frontend automatically sends cookie with each request
4. No need to manually add token to headers

### Cookie Details
- **Cookie Name:** `auth_token`
- **Type:** HttpOnly (not accessible via JavaScript)
- **Expires:** 24 hours
- **Auto-sent:** Browser automatically includes in requests

---

## User Endpoints

### 1. Register User (Client)

**Endpoint:** `POST /api/users/register`

**Description:** Register a new client user

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "roles": ["user"],
    "isVerified": false
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "User Credentials already exist"
}
```

---

### 2. Register Admin

**Endpoint:** `POST /api/users/register-admin`

**Description:** Register a new admin user (requires secret key)

**Authentication:** Not required (but needs admin secret)

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123456",
  "firstName": "Admin",
  "lastName": "User",
  "phoneNumber": "+1234567890",
  "adminSecret": "your-admin-secret-key"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "phoneNumber": "+1234567890",
    "roles": ["admin"],
    "isVerified": true
  }
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Invalid admin secret key"
}
```

---

### 3. Login

**Endpoint:** `POST /api/users/login`

**Description:** Login user and get authentication cookie

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login Successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "roles": ["user"],
    "isVerified": true
  }
}
```

**Note:** Cookie `auth_token` is automatically set by server. No need to store manually.

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Property Endpoints

### 1. Get All Properties

**Endpoint:** `GET /api/properties`

**Description:** Get list of properties with optional filters

**Authentication:** Optional
- **Not logged in:** See only active properties
- **Logged in as Client:** See only active properties
- **Logged in as Admin:** See all properties (active + inactive)

**Query Parameters (All Optional):**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=1` |
| `limit` | number | Items per page (default: 10) | `?limit=20` |
| `location` | string | Filter by location | `?location=New York` |
| `search` | string | Search in name/description | `?search=luxury` |
| `minPrice` | number | Minimum price filter | `?minPrice=1000000` |
| `maxPrice` | number | Maximum price filter | `?maxPrice=5000000` |
| `bedrooms` | number | Filter by bedrooms | `?bedrooms=2` |
| `bathrooms` | number | Filter by bathrooms | `?bathrooms=1` |

**Example Requests:**
```bash
# Basic
GET /api/properties

# With pagination
GET /api/properties?page=1&limit=10

# With filters
GET /api/properties?location=New York&bedrooms=2&bathrooms=1

# With search
GET /api/properties?search=luxury

# Combined
GET /api/properties?page=1&limit=10&location=New York&minPrice=1000000&maxPrice=5000000
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Heritage Suite",
        "location": "New York, USA",
        "description": "Indulge in world-class hospitality...",
        "longDescription": "This exceptional property offers...",
        "price": "$2,500,000",
        "priceNumeric": 2500000,
        "size": "2,500 sq ft",
        "bedrooms": 2,
        "bathrooms": 1,
        "amenities": {
          "beds": "2 King Bed",
          "capacity": "4 Person",
          "ac": "Air Conditioned",
          "bathroom": "1 Spacious Bathroom"
        },
        "images": [
          "/img/usa.jpg",
          "/img/usa1.jpg"
        ],
        "investmentDetails": {
          "roi": "8-12%",
          "expectedReturn": "15-20 years",
          "location": "New York, USA",
          "propertyType": "Luxury Apartment"
        },
        "features": [
          "Premium Location",
          "Modern Architecture"
        ],
        "coordinates": {
          "lat": 40.7589,
          "lng": -73.9851
        },
        "nearbyAttractions": [
          "Central Park - 0.5 miles"
        ],
        "isActive": true,
        "createdBy": {
          "_id": "...",
          "firstName": "John",
          "lastName": "Admin",
          "email": "admin@example.com"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 2. Get Single Property

**Endpoint:** `GET /api/properties/:id`

**Description:** Get single property by ID

**Authentication:** Optional
- **Not logged in:** Can only see if property is active
- **Logged in as Admin:** Can see any property (active or inactive)

**Example Request:**
```bash
GET /api/properties/507f1f77bcf86cd799439011
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "property": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Heritage Suite",
      "location": "New York, USA",
      // ... all property fields (same as in list)
    }
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Property not found"
}
```

---

### 3. Create Property (Admin Only)

**Endpoint:** `POST /api/properties`

**Description:** Create a new property

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "Heritage Suite",
  "location": "New York, USA",
  "description": "Indulge in world-class hospitality, refined interiors, and personalized service",
  "longDescription": "This exceptional property offers a perfect blend of luxury living and investment potential. Located in the heart of New York, this stunning apartment features modern architecture, smart home technology, and high-end finishes throughout.",
  "price": "$2,500,000",
  "priceNumeric": 2500000,
  "size": "2,500 sq ft",
  "bedrooms": 2,
  "bathrooms": 1,
  "amenities": {
    "beds": "2 King Bed",
    "capacity": "4 Person",
    "ac": "Air Conditioned",
    "bathroom": "1 Spacious Bathroom"
  },
  "images": [
    "/img/usa.jpg",
    "/img/usa1.jpg",
    "/img/usa2.jpg",
    "/img/usa3.jpg"
  ],
  "investmentDetails": {
    "roi": "8-12%",
    "expectedReturn": "15-20 years",
    "location": "New York, USA",
    "propertyType": "Luxury Apartment"
  },
  "features": [
    "Premium Location",
    "Modern Architecture",
    "Smart Home Technology",
    "High-End Finishes",
    "Investment Grade",
    "Rental Potential"
  ],
  "coordinates": {
    "lat": 40.7589,
    "lng": -73.9851
  },
  "nearbyAttractions": [
    "Central Park - 0.5 miles",
    "Times Square - 1.2 miles",
    "Metropolitan Museum - 0.8 miles",
    "Broadway Theaters - 1.0 miles"
  ]
}
```

**Required Fields:**
- `name` (string, 3-200 chars)
- `location` (string, 2-200 chars)
- `description` (string, 10-500 chars)
- `longDescription` (string, min 50 chars)
- `price` (string)
- `size` (string)
- `bedrooms` (number, min: 0)
- `bathrooms` (number, min: 0)
- `amenities` (object)
- `images` (array, min: 1 image)
- `investmentDetails` (object)
- `features` (array, min: 1 feature)

**Optional Fields:**
- `priceNumeric` (number)
- `coordinates` (object with `lat` and `lng`)
- `nearbyAttractions` (array)

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "property": {
      "_id": "507f1f77bcf86cd799439011",
      // ... all property fields
      "createdBy": "admin-user-id",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Missing required fields",
  "missingFields": ["name", "location"]
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Forbidden - Admin access required"
}
```

---

### 4. Update Property (Admin Only)

**Endpoint:** `PUT /api/properties/:id`

**Description:** Update an existing property

**Authentication:** Required (Admin only)

**Request Body:** (Partial update - only send fields to update)
```json
{
  "name": "Updated Property Name",
  "price": "$3,000,000",
  "priceNumeric": 3000000,
  "isActive": false
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Property updated successfully",
  "data": {
    "property": {
      // ... updated property object
    }
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Property not found"
}
```

---

### 5. Delete Property (Admin Only)

**Endpoint:** `DELETE /api/properties/:id`

**Description:** Delete a property

**Authentication:** Required (Admin only)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Property not found"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (optional)",
  "missingFields": ["field1", "field2"] // Only for validation errors
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server errors |

### Common Error Scenarios

**1. Missing Authentication:**
```json
{
  "success": false,
  "message": "Unauthorized - No token provided"
}
```

**2. Invalid Token:**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or expired token"
}
```

**3. Not Admin:**
```json
{
  "success": false,
  "message": "Forbidden - Admin access required"
}
```

**4. Validation Errors:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "missingFields": ["name", "location", "description"]
}
```

**5. Duplicate Email:**
```json
{
  "success": false,
  "message": "User Credentials already exist"
}
```

---

## Data Models

### User Model

```typescript
{
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[]; // ["user"] or ["admin"]
  isVerified: boolean;
  lastLoginDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Property Model

```typescript
{
  _id: string;
  name: string;
  location: string;
  description: string;
  longDescription: string;
  price: string;
  priceNumeric?: number;
  size: string;
  bedrooms: number;
  bathrooms: number;
  amenities: {
    beds?: string;
    capacity?: string;
    ac?: string;
    bathroom?: string;
  };
  images: string[];
  investmentDetails: {
    roi?: string;
    expectedReturn?: string;
    location?: string;
    propertyType?: string;
  };
  features: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  nearbyAttractions?: string[];
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Frontend Integration Guide

### 1. Setting Up API Client

**Using Fetch:**
```javascript
// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Make authenticated request (cookies sent automatically)
async function fetchProperties() {
  const response = await fetch(`${API_BASE_URL}/properties`, {
    method: 'GET',
    credentials: 'include', // Important: Include cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data;
}
```

**Using Axios:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Important: Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get properties
const getProperties = async (filters = {}) => {
  const response = await api.get('/properties', { params: filters });
  return response.data;
};
```

### 2. Login Flow

```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    credentials: 'include', // Important for cookies
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Cookie is automatically set by browser
    // Store user data in your state/context
    return data.user;
  } else {
    throw new Error(data.message);
  }
}
```

### 3. Check Authentication Status

```javascript
async function checkAuth() {
  try {
    // Try to access a protected endpoint
    const response = await fetch('http://localhost:5000/api/properties', {
      credentials: 'include',
    });
    
    // If 401, user is not authenticated
    if (response.status === 401) {
      return { authenticated: false };
    }
    
    return { authenticated: true };
  } catch (error) {
    return { authenticated: false };
  }
}
```

### 4. Create Property (Admin)

```javascript
async function createProperty(propertyData) {
  const response = await fetch('http://localhost:5000/api/properties', {
    method: 'POST',
    credentials: 'include', // Important: Include auth cookie
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(propertyData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create property');
  }
  
  return data;
}
```

### 5. Error Handling

```javascript
async function handleApiCall(apiFunction) {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      // API error response
      const { status, data } = error.response;
      
      if (status === 401) {
        // Redirect to login
        window.location.href = '/login';
      } else if (status === 403) {
        // Show "Access denied" message
        return { success: false, error: 'Access denied' };
      } else {
        return { success: false, error: data.message || 'An error occurred' };
      }
    } else {
      // Network error
      return { success: false, error: 'Network error. Please try again.' };
    }
  }
}
```

---

## Important Notes for Frontend

1. **Cookies are HttpOnly:** You cannot access `auth_token` via JavaScript. Browser handles it automatically.

2. **Include Credentials:** Always use `credentials: 'include'` (fetch) or `withCredentials: true` (axios) to send cookies.

3. **CORS:** Make sure your frontend URL is allowed in backend CORS configuration.

4. **Error Handling:** Always check `response.ok` or `response.status` before using data.

5. **Pagination:** Use `pagination` object from response to build pagination UI.

6. **Filtering:** All query parameters are optional. Combine multiple filters as needed.

7. **Admin vs Client:** Same endpoints, different data based on authentication status.

---

## Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/register` | POST | ❌ | Register client |
| `/api/users/register-admin` | POST | ❌ | Register admin |
| `/api/users/login` | POST | ❌ | Login user |
| `/api/properties` | GET | Optional | Get all properties |
| `/api/properties/:id` | GET | Optional | Get single property |
| `/api/properties` | POST | ✅ Admin | Create property |
| `/api/properties/:id` | PUT | ✅ Admin | Update property |
| `/api/properties/:id` | DELETE | ✅ Admin | Delete property |

---

**Last Updated:** January 2024  
**Version:** 1.0

