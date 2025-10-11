# Fullstack Project (Angular + Node + MongoDB) — Maven-wrapped

## What this repo contains
- `frontend/` — minimal Angular app with a reactive user form (firstName, lastName, pincode, email)
- `backend/` — Node + Express + Mongoose API that accepts `POST /api/userInquiry` and persists to MongoDB
- `pom.xml` — Maven POM that orchestrates installing Node, building frontend, and preparing backend

## Quick start (local dev)
You'll need:
- Node.js (>=20 recommended) and npm
- MongoDB (local or cloud)
- Maven (optional — used to orchestrate full build)

### Run backend only
```bash
cd backend
npm install
# set MONGO_USER
# set MONGO_PASS
npm run dev
```

### Run frontend only (dev server)
```bash
cd frontend
npm install
npm start
```
Use `proxy.conf.json` (already provided) to proxy `/api` to `http://localhost:3000` when running ng serve.

### Build with Maven (single command)
This will install frontend deps, build the frontend into `backend/public`, and install backend deps.
```bash
mvn generate-resources
```
Then start the backend to serve the compiled frontend:
```bash
cd backend
npm start
```
OR

```bash
mvn exec:exec
```