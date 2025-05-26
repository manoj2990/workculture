# Auth API Samples

## Login

**Request:**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "password123"
}
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "test@example.com",
      "name": "Test User",
      "accountType": "employee"
    },
    "message": "Login successful"
  }
}
```

## Signup

**Request:**

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "New",
    "lastName": "User",
    "accountType": "employee"
}
```

**Response:**

```json
{
  "status": 201,
  "data": {
    "user": {
      "email": "newuser@example.com",
      "name": "New User",
      "accountType": "employee"
    },
    "message": "employee created successfully. Please login to continue."
  }
}
```

## Create Admin (Superadmin Only)

**Request:**

```http
POST /api/v1/auth/create-admin
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "email": "newadmin@example.com",
    "password": "admin123",
    "firstName": "New",
    "lastName": "Admin",
    "accountType": "admin"
}
```

**Response:**

```json
{
  "status": 201,
  "data": {
    "user": {
      "email": "newadmin@example.com",
      "name": "New Admin",
      "accountType": "admin"
    },
    "message": "admin created successfully. Please login to continue."
  }
}
```

## Logout

**Request:**

```http
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "status": 200,
  "data": null,
  "message": "Logout successful"
}
```

## Error Responses

### Invalid Credentials

```json
{
  "status": 401,
  "message": "Invalid credentials"
}
```

### Email Already Exists

```json
{
  "status": 409,
  "message": "Email already registered"
}
```

### Unauthorized (No Token)

```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

### Forbidden (Non-Superadmin Creating Admin)

```json
{
  "status": 403,
  "message": "Only superadmin can create admin users"
}
```
