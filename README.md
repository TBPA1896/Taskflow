# Taskflow

A full-stack task management web application for creating, updating, and tracking personal tasks. Built as a learning-friendly monorepo with authentication, REST APIs, real-time sync, and a responsive UI.

**Live repo:** [github.com/TBPA1896/Taskflow](https://github.com/TBPA1896/Taskflow)

---

## Features

- **User authentication** — Register, sign in, sign out with bcrypt-hashed passwords and JWT sessions (httpOnly cookies)
- **Task CRUD** — Create, read, update, and delete tasks scoped to the signed-in user
- **Task statuses** — `To do`, `In progress`, and `Done`
- **Real-time updates** — Socket.io pushes task changes to all open tabs for the same user
- **Responsive UI** — Mobile-first layout with a clean dark theme (Tailwind CSS)

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, TypeScript, Vite, React Router, Tailwind CSS v4 |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | SQLite via Prisma ORM |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Real-time** | Socket.io |

---

## Project structure

```
taskflow/
├── client/          # Vite + React frontend
│   └── src/
│       ├── pages/       # Login, Register, Tasks
│       ├── context/     # Auth state
│       └── hooks/       # Socket.io subscription
├── server/          # Express API + Socket.io
│   ├── prisma/          # Schema & SQLite database
│   └── src/
│       ├── routes/      # auth & tasks
│       └── middleware/  # JWT protection
└── package.json     # npm workspaces root
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm 10+

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/TBPA1896/Taskflow.git
cd Taskflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `server/.env` (this file is not committed to Git):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="use-a-long-random-secret-in-production"
CLIENT_ORIGIN="http://localhost:5173"
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite file path for Prisma |
| `JWT_SECRET` | Secret key for signing JWTs — use a strong random value in production |
| `CLIENT_ORIGIN` | Allowed CORS origin (Vite dev server URL) |

### 4. Set up the database

```bash
npm run db:generate
npm run db:push
```

### 5. Run the app

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

> **Important:** Always use `localhost` (not `127.0.0.1`) so auth cookies work consistently between the client and API proxy.

The API runs on **port 4000**. In development, Vite proxies `/api` and `/socket.io` to the backend, so you only need to open the frontend URL.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API and frontend together |
| `npm run build` | Production build for server and client |
| `npm run db:push` | Apply Prisma schema to the database |
| `npm run db:generate` | Regenerate Prisma Client |

Workspace-specific commands:

```bash
npm run dev -w server
npm run dev -w client
```

---

## API overview

All task routes require authentication (JWT cookie or `Authorization: Bearer <token>`).

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/me` | Current user |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List user's tasks |
| `POST` | `/api/tasks` | Create task |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |

**Example — create a task**

```json
POST /api/tasks
{
  "title": "Ship feature",
  "description": "Optional details",
  "status": "TODO"
}
```

`status` values: `TODO`, `IN_PROGRESS`, `DONE`.

---

## Real-time events

After any task mutation, the server emits `tasks:change` to the authenticated user's Socket.io room.

| Event payload `type` | When |
|----------------------|------|
| `task:created` | New task |
| `task:updated` | Task edited |
| `task:deleted` | Task removed |

The client connects with credentials so the same session cookie used for REST auth applies to WebSockets.

---

## Production notes

1. Set `NODE_ENV=production` and use a strong `JWT_SECRET`.
2. Replace SQLite with PostgreSQL or MySQL for production if needed (update `datasource` in `server/prisma/schema.prisma`).
3. Serve the built client (`client/dist`) behind a reverse proxy and point `CLIENT_ORIGIN` to your public URL.
4. Enable HTTPS so secure cookies work as intended.

```bash
npm run build
npm run start -w server
```

---

## What you'll learn

- Monorepo layout with npm workspaces
- REST API design and validation (Zod)
- JWT-based auth with httpOnly cookies
- Prisma ORM and relational data modeling
- Real-time UI updates with Socket.io
- Modern React patterns (context, hooks, routing)

---

## License

This project is open source and available for learning and personal use.
