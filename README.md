# AI Resume Generator

AI-powered resume generator that creates ATS-optimized resumes tailored to specific job roles and descriptions.

## 🚀 Features

- AI-powered resume generation
- ATS optimization
- Job description analysis
- Resume-job matching
- Professional resume formatting
- Resume preview and editing
- PDF resume generation

## 🛠️ Tech Stack

- **Frontend:** React.js, JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI/ML:** Google Gemini APIs
- **Authentication:** JWT
- **Tools:** Git, GitHub, Postman

- 🛠️ Architecture & Deployment Overview
Frontend:

Deployed on Vercel with client-side SPA routing (rewrites to /index.html).
Built with Vite production optimization.
Connected to the backend via VITE_API_URL=https://ai-career-assistant-backend.vercel.app.
No sensitive keys or credentials are baked into or exposed in the client bundle.
Backend:

Deployed as a serverless microservice on Vercel (api/index.js wrapper).
On-demand MongoDB Atlas connection pooling middleware ensures reliability across cold starts and concurrent requests.
Dynamic CORS enabled with credentials: true, verified to allow requests from https://ai-career-assistant-frontend-beige.vercel.app.
Database (MongoDB Atlas):

Preserved existing production cluster on Atlas (cluster0.fyr8y.mongodb.net).
Secure connection URI configured as an encrypted environment variable on Vercel (MONGO_URI).
AI Engine (Gemini):

Configured with @google/genai using gemini-2.5-flash / gemini-2.0-flash with JSON Schema structured outputs.
Secret key GEMINI_API_KEY stored exclusively in Vercel backend environment variables.
  
🌐 Production URLs

Component	Production URL	Status

Frontend (React + Vite)	https://ai-career-assistant-frontend-beige.vercel.app

Backend API (Node.js + Express)	https://ai-career-assistant-backend.vercel.app

🟢 Live & Verified
