# Digital Twin Dashboard (Phase 5)

This directory contains the real-time React monitoring dashboard and its Node.js WebSocket backend. The dashboard cross-checks incoming state payloads against the Hyperledger Fabric ledger to detect tampering, replayed messages, or unauthorised state edits.

## Prerequisites
- Node.js (v18+)
- Fabric Gateway network configured (if testing against a real ledger).

## 1. Starting the Backend
The backend subscribes to the event stream, verifies hashes with Fabric, and broadcasts to the frontend.

```bash
cd backend
npm install
# (Optional) Copy .env from sync-service to use real Fabric gateway
# cp ../../sync-service/.env .env
node server.js
```
The backend will start on **port 4000**.

## 2. Starting the Frontend
The frontend is a Vite + React application.

```bash
cd frontend
npm install
npm run dev
```
The frontend will start on **port 5173** (or similar, check Vite logs).

## Simulating Attacks
While both the backend and frontend are running, you can use the script from Phase 4 to inject attacks directly into the dashboard's `/api/stream` endpoint, or run `node attack.js a` (note: you may need to update the attack script to point to `http://localhost:4000/api/stream` if you want it to hit the dashboard directly for testing visual flags, though the dashboard will also pick up ledger anomalies organically if wired properly).
