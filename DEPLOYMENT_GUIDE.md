# Deployment Guide

This repo contains three deployable parts:

- `backend` on Render
- `my-owner-s-space-main` on Vercel
- `sales-partner-connect-main` on Vercel

## 1. Backend on Render

1. Create a new Render Web Service from the `backend` folder.
2. Use the `render.yaml` in this folder or enter these settings manually:
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `backend`
3. Add these environment variables in Render:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES` if you want something other than the default `7d`
   - `CORS_ORIGIN` as a comma-separated list of both Vercel frontend URLs
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

Example `CORS_ORIGIN`:

```text
https://your-owner-app.vercel.app,https://your-sales-app.vercel.app
```

## 2. Owner frontend on Vercel

1. Create a new Vercel project from the `my-owner-s-space-main` folder.
2. Set the production environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
3. Keep the default build settings unless you want to override them:
   - Build command: `npm run build`
   - Output directory: `dist`
4. The included `vercel.json` rewrites all routes to `index.html` so direct refreshes on nested routes keep working.

## 3. Salesman frontend on Vercel

1. Create a second Vercel project from the `sales-partner-connect-main` folder.
2. Set the production environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
3. Use the same build settings as the owner app.
4. The included `vercel.json` also rewrites nested routes to `index.html`.

## 4. Local development values

Use these values locally if you want the apps to talk to a local backend:

- `backend/.env.example`
- `my-owner-s-space-main/.env.example`
- `sales-partner-connect-main/.env.example`

Recommended local setup:

```text
backend: http://localhost:5000
owner frontend: http://localhost:8080
sales frontend: http://localhost:8081
```

## 5. Deployment order

1. Deploy the backend first.
2. Copy the backend URL into both frontend `VITE_API_URL` values.
3. Add both frontend URLs to backend `CORS_ORIGIN`.
4. Deploy both Vercel apps.

## 6. Final check

- Open each frontend and confirm login works.
- Create a test product and order.
- If product uploads fail, confirm the Cloudinary env vars are set on Render.