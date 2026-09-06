# AI Resume Generator — Backend

## Quick Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `.env` file:
```
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_secret_string
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Get your **free** Anthropic API key at: https://console.anthropic.com/

> ⚠️ If you skip the API key, the app still works using smart mock AI data.

### 3. Start the server
```bash
npm run dev    # development (auto-restart)
npm start      # production
```

Server runs on: http://localhost:4000

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT token |
| GET  | /api/auth/me | Get current user (requires token) |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/resumes/auto-generate | Generate resume with AI |
| GET  | /api/resumes | List all resumes (requires token) |
| POST | /api/resumes | Create resume (requires token) |
| GET  | /api/resumes/:id | Get one resume |
| PUT  | /api/resumes/:id | Update resume |
| DELETE | /api/resumes/:id | Delete resume |
| POST | /api/resumes/:id/ai-populate | AI improve resume |
| POST | /api/resumes/:id/ats-check | ATS score + suggestions |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/generate | Generate resume from raw data |

---

## AI Integration
- Uses **Anthropic Claude** (claude-sonnet-4-5) via the native fetch API
- No OpenAI SDK required
- Falls back to smart mock data if API key is missing
