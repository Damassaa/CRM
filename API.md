# API Documentation

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All protected endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer {your_access_token}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate entry
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `TENANT_LIMIT_EXCEEDED` - Tenant limit reached
- `INTERNAL_ERROR` - Server error

## Endpoints

### Authentication

#### Login

```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "ADMIN",
      "tenant": {
        "id": "uuid",
        "name": "Company Name"
      }
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Super Admin Login

```http
POST /auth/super-admin/login
```

**Body:**
```json
{
  "email": "admin@crm.com",
  "password": "admin123"
}
```

#### Refresh Token

```http
POST /auth/refresh
```

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer {token}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer {token}
```

---

### Super Admin - Tenants

#### List Tenants

```http
GET /super-admin/tenants?page=1&limit=20&status=ACTIVE&search=company
Authorization: Bearer {super_admin_token}
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (TRIAL, ACTIVE, PAUSED, CANCELED)
- `plan` (string, optional): Filter by plan (BASIC, PRO, ENTERPRISE)
- `search` (string, optional): Search in company name and email

#### Get Tenant

```http
GET /super-admin/tenants/:id
Authorization: Bearer {super_admin_token}
```

#### Create Tenant

```http
POST /super-admin/tenants
Authorization: Bearer {super_admin_token}
```

**Body:**
```json
{
  "companyName": "Company Name",
  "email": "contact@company.com",
  "phone": "+55 62 99999-9999",
  "plan": "PRO",
  "status": "ACTIVE",
  "maxUsers": 10,
  "maxLeads": 5000,
  "maxPipelines": 10,
  "adminName": "Admin Name",
  "adminEmail": "admin@company.com"
}
```

#### Update Tenant

```http
PATCH /super-admin/tenants/:id
Authorization: Bearer {super_admin_token}
```

**Body:** (all fields optional)
```json
{
  "companyName": "New Company Name",
  "status": "PAUSED",
  "maxLeads": 10000
}
```

#### Delete Tenant

```http
DELETE /super-admin/tenants/:id
Authorization: Bearer {super_admin_token}
```

#### Get System Stats

```http
GET /super-admin/tenants/stats
Authorization: Bearer {super_admin_token}
```

---

### Leads

#### Get Kanban Board

```http
GET /leads/kanban
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "column-uuid",
      "name": "Novo Lead",
      "color": "#3B82F6",
      "icon": "📋",
      "position": 0,
      "leads": [
        {
          "id": "lead-uuid",
          "name": "João Silva",
          "email": "joao@example.com",
          "phone": "(62) 99999-9999",
          "company": "Empresa XYZ",
          "estimatedValue": 5000,
          "tags": ["urgente", "vip"],
          "responsible": {
            "id": "user-uuid",
            "name": "Responsible User",
            "email": "user@example.com"
          },
          "enteredCurrentColumnAt": "2025-01-01T10:00:00Z"
        }
      ]
    }
  ]
}
```

#### List Leads

```http
GET /leads?page=1&limit=20&columnId=uuid&search=joão&tags=urgente,vip
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `columnId` (uuid): Filter by column
- `responsibleId` (uuid): Filter by responsible user
- `search` (string): Search in name, email, phone, company
- `tags` (string): Comma-separated tags

#### Get Lead

```http
GET /leads/:id
Authorization: Bearer {token}
```

#### Create Lead

```http
POST /leads
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(62) 99999-9999",
  "company": "Empresa XYZ",
  "position": "Gerente de TI",
  "estimatedValue": 5000,
  "columnId": "column-uuid",
  "responsibleId": "user-uuid",
  "tags": ["urgente", "vip"],
  "source": "manual",
  "customFields": {
    "momento": "descoberta",
    "produto": "CRM Pro"
  }
}
```

#### Update Lead

```http
PATCH /leads/:id
Authorization: Bearer {token}
```

**Body:** (all fields optional)
```json
{
  "name": "João Silva Jr.",
  "estimatedValue": 7500,
  "tags": ["urgente", "vip", "follow-up"]
}
```

#### Delete Lead

```http
DELETE /leads/:id
Authorization: Bearer {token}
```

#### Move Lead

```http
POST /leads/:id/move
Authorization: Bearer {token}
```

**Body:**
```json
{
  "columnId": "new-column-uuid",
  "position": 0  // Optional: specific position in column
}
```

#### Get Lead Activities

```http
GET /leads/:id/activities?page=1&limit=20
Authorization: Bearer {token}
```

#### Add Lead Activity

```http
POST /leads/:id/activities
Authorization: Bearer {token}
```

**Body:**
```json
{
  "type": "NOTE",  // NOTE, CALL, EMAIL, MEETING, SYSTEM
  "content": "Cliente pediu proposta comercial"
}
```

#### Get Lead History

```http
GET /leads/:id/history?page=1&limit=20
Authorization: Bearer {token}
```

---

### Columns

#### List Columns

```http
GET /columns
Authorization: Bearer {token}
```

#### Get Column

```http
GET /columns/:id
Authorization: Bearer {token}
```

#### Create Column (Admin only)

```http
POST /columns
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "name": "Qualificação",
  "color": "#8B5CF6",
  "icon": "🎯",
  "position": 1,  // Optional
  "isWinColumn": false,
  "isLostColumn": false
}
```

#### Update Column (Admin only)

```http
PATCH /columns/:id
Authorization: Bearer {admin_token}
```

**Body:** (all fields optional)
```json
{
  "name": "Nova Qualificação",
  "color": "#EC4899"
}
```

#### Delete Column (Admin only)

```http
DELETE /columns/:id
Authorization: Bearer {admin_token}
```

⚠️ **Note:** Column must be empty (no leads) to be deleted.

#### Reorder Columns (Admin only)

```http
POST /columns/reorder
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "columnIds": [
    "column-uuid-1",
    "column-uuid-2",
    "column-uuid-3"
  ]
}
```

---

### Users

#### List Users (Admin only)

```http
GET /users?page=1&limit=20&search=name
Authorization: Bearer {admin_token}
```

#### Get User (Admin only)

```http
GET /users/:id
Authorization: Bearer {admin_token}
```

#### Invite User (Admin only)

```http
POST /users
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "USER",  // ADMIN or USER
  "canCreateLeads": true,
  "canEditLeads": true,
  "canDeleteLeads": false,
  "canMoveLeads": true,
  "viewAllLeads": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "USER",
    "inviteLink": "http://localhost:3000/invite/accept?token=..."
  }
}
```

#### Update User (Admin only)

```http
PATCH /users/:id
Authorization: Bearer {admin_token}
```

**Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "role": "ADMIN",
  "canDeleteLeads": true
}
```

#### Delete User (Admin only)

```http
DELETE /users/:id
Authorization: Bearer {admin_token}
```

⚠️ **Note:** User must not have assigned leads and cannot delete yourself.

#### Resend Invite (Admin only)

```http
POST /users/:id/resend-invite
Authorization: Bearer {admin_token}
```

---

## Rate Limiting

- **Public API:** 100 requests per minute per IP
- **Authenticated API:** 1000 requests per minute per token
- **Login endpoints:** 5 attempts per 15 minutes per IP

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Webhooks (Prepared for Future)

Coming in Phase 3:
- Configure outgoing webhooks
- Events: lead.created, lead.moved, lead.updated, etc.
- HMAC signature validation

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"demo123456"}'
```

### Create Lead
```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(62) 99999-9999",
    "columnId": "COLUMN_UUID"
  }'
```

### Get Kanban Board
```bash
curl http://localhost:3001/api/v1/leads/kanban \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For issues or questions, open an issue on GitHub.
