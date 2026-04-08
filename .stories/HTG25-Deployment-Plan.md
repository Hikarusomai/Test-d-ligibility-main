# HTG25 Deployment Plan: Hosting for Free on Vercel

This document outlines the strategy for hosting the HTG25 project (Frontend + Backend + Database) for free using modern cloud platforms.

## Architecture Overview

Since Vercel is optimized for static sites and serverless functions, the best approach for a Node.js/Express backend with a persistent MongoDB database is a "Hybrid Cloud" setup.

| Component | Platform | Plan |
| :--- | :--- | :--- |
| **Frontend** (React/Vite) | **Vercel** | Hobby (Free) |
| **Backend** (Node/Express) | **Render** or **Railway** | Free Tier |
| **Database** (MongoDB) | **MongoDB Atlas** | Shared Cluster (Free) |

---

## Step 1: Database (MongoDB Atlas)

1.  Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Deploy a **Shared Cluster** (M0 - Free).
3.  In "Network Access", allow access from `0.0.0.0/0` (required for Render/Vercel dynamic IPs).
4.  Create a database user and copy the **Connection String**.
    - *Example:* `mongodb+srv://user:pass@cluster.mongodb.net/visa_requirements`

## Step 2: Backend (Render/Railway)

Vercel *can* host Express apps via Serverless Functions, but it often requires significant code changes. **Render** is recommended for a standard Express API.

1.  Push your code to a GitHub repository.
2.  Connect the repository to [Render](https://render.com/).
3.  Select **Web Service**.
4.  **Configuration:**
    - **Build Command:** `cd backend && npm install`
    - **Start Command:** `cd backend && node server.js`
5.  **Environment Variables:**
    - `MONGODB_URI`: Your MongoDB Atlas string.
    - `PORT`: `3000` (Render will handle the mapping).
    - `JWT_SECRET`: A random string.
    - `PERPLEXITY_API_KEY`: Your key.

## Step 3: Frontend (Vercel)

1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Vercel will automatically detect the Vite project.
3.  **Configuration:**
    - **Root Directory:** `frontend`
    - **Build Command:** `npm run build`
    - **Output Directory:** `dist`
4.  **Environment Variables:**
    - `VITE_API_URL`: The URL of your Render backend (e.g., `https://htg25-api.onrender.com/api`).

---

## Step 4: Final Adjustments

### CORS Configuration
Ensure your backend `server.js` allows the Vercel domain:
```javascript
app.use(cors({
    origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
    credentials: true
}));
```

### Database Seeding
Once the backend is live on Render, you can run the seed script locally by pointing `MONGODB_URI` to the Atlas string:
```bash
$env:MONGODB_URI="mongodb+srv://..."; node backend/scripts/seed.js
```

---

## Summary of URLs
- **Frontend:** `https://matchmyschool-htg25.vercel.app`
- **API:** `https://htg25-backend.onrender.com/api`
