# OmniMind Route Reference

## Frontend Routes

### Public Routes (no login required)

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | LoginPage | Email + password login |
| `/register` | RegisterPage | New account registration |

### Protected Routes (login required)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | — | Redirects to `/dashboard` |
| `/dashboard` | DashboardPage | Main user dashboard |
| `/overview` | OverviewPage | Project overview |
| `/jarvis` | JarvisPage | Full-page AI chat |
| `/profile` | ProfilePage | User profile & settings |

### Admin Routes (admin role required)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/overview` | SuperDashboardPage | Live service status cards, system stats |
| `/admin/users` | UsersPage | List, create, edit, deactivate users |
| `/admin/audit-log` | AuditLogPage | Security audit event log with filters |
| `/admin/env` | EnvManagerPage | Edit .env variables (API keys, tokens) |
| `/admin/settings` | SettingsPage | System-wide settings |

---

## API Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | None | DB + Redis health check |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | None | Create account |
| POST | `/api/v1/auth/login` | None | Login → access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh token | Issue new access token |
| POST | `/api/v1/auth/logout` | Bearer | Invalidate refresh token |
| GET | `/api/v1/auth/me` | Bearer | Current user profile |

### Users (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/users` | Admin | List all users |
| GET | `/api/v1/admin/users/{id}` | Admin | Get user by ID |
| PATCH | `/api/v1/admin/users/{id}` | Admin | Update user (role, active, etc.) |
| DELETE | `/api/v1/admin/users/{id}` | Admin | Delete user |

### Audit Log (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/audit-log` | Admin | Paginated audit events with filters |

### Jarvis AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/jarvis/chat` | Bearer | Send message, get Claude response |
| GET | `/api/v1/jarvis/conversations` | Bearer | List conversations |
| GET | `/api/v1/jarvis/conversations/{id}` | Bearer | Get conversation with messages |
| DELETE | `/api/v1/jarvis/conversations/{id}` | Bearer | Delete conversation |

### System (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/system/health` | Admin | Live status of all services |
| GET | `/api/v1/admin/system/stats` | Admin | User/conversation/audit counts |
| GET | `/api/v1/admin/system/info` | Admin | App name, version, uptime, Python |

### Env Manager (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/env` | Admin | List env variables (values masked) |
| PATCH | `/api/v1/admin/env` | Admin | Update one or more env variables |

### Proxy (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/proxy/health-check?url=...` | Admin | Proxy HTTP GET to target URL |

### Telegram Bot

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/telegram/webhook` | Telegram secret | Incoming webhook from Telegram |
| GET | `/api/v1/telegram/link` | Bearer | Get bot invite link |

### WhatsApp Bot

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/whatsapp/webhook` | Twilio signature | Incoming webhook from Twilio |
| GET | `/api/v1/whatsapp/link` | Bearer | Get WhatsApp bot number info |

---

## Authentication Flow

```
POST /auth/login
  → { access_token, refresh_token }

All protected requests:
  Authorization: Bearer <access_token>

When access_token expires:
  POST /auth/refresh
  Authorization: Bearer <refresh_token>
  → { access_token }
```

Tokens are stored in `localStorage` and managed by the Zustand `useAuthStore`.

---

## Role-Based Access

| Role | Access |
|------|--------|
| `user` | Public routes + protected routes |
| `admin` | All routes including `/admin/*` and admin API endpoints |

The frontend `ProtectedRoute` component checks `user.role === 'admin'` and redirects non-admins away from admin routes.
