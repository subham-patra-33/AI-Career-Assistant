# AI Resume Generator — Professional ATS Edition

## 1. Requirements
- Node.js 18+ (20+ recommended)
- npm
- Gemini API key
- MongoDB is optional for the AI Generate page, but required for account/resume persistence features.

## 2. Backend
Open a terminal:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux use `cp .env.example .env` instead of `copy`.

Edit `backend/.env`:

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ai_resume
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=your_real_gemini_api_key
DEV_ALLOW_ANONYMOUS=true
```

The Gemini key must be kept in the backend only. Never put it in the React frontend or commit it to Git.

## 3. Frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## 4. Resume workflow
1. Enter full name, email and target job role.
2. Paste the target job description for better ATS keyword matching.
3. Add only real skills, experience, projects, education, certifications and achievements.
4. Click **Generate professional ATS resume**.
5. The AI creates structured sections and ATS keywords, then the app downloads a formatted PDF and opens a print-friendly preview.

## 5. ATS rules
The AI is explicitly instructed not to fabricate qualifications. Job-description keywords are incorporated only when supported by the candidate's supplied information.
