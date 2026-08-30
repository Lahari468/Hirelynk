# HireLynk - Applicant Tracking System

A modern, production-quality recruitment and Applicant Tracking System (ATS) built with React, Node.js, and PostgreSQL.

## 📋 Project Overview

HireLynk helps companies manage:
- Job postings
- Candidate applications
- Recruitment pipeline
- Interviews
- Analytics

## 🏗️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Zod

**Backend:**
- Node.js
- Express.js
- TypeScript
- PostgreSQL (Phase 2)
- Prisma (Phase 2)

## 📁 Project Structure
hirelynk/
├── backend/ # Express.js API
├── frontend/ # React application
├── docs/ # Documentation
└── README.md

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm 7+

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`

## ✅ Verification

### Check Backend

```bash
curl http://localhost:5000/api/health
```

Expected:
```json
{
  "success": true,
  "message": "HireLynk API is running"
}
```

### Check Frontend

Open `http://localhost:5173` in browser. Should show:
- HireLynk title
- Frontend: ✅ Running
- Backend API: ✅ Connected (if backend is running)

## 📚 Documentation

- `docs/SETUP.md` - Detailed setup guide

## 🧪 Commands

### Backend
```bash
cd backend
npm run dev         # Development
npm run build       # Build
npm start           # Production
npm run typecheck   # Type check
```

### Frontend
```bash
cd frontend
npm run dev         # Development
npm run build       # Build
npm run typecheck   # Type check
npm run preview     # Preview build
```

## 🔒 Security

- ✅ Helmet.js headers
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ TypeScript strict mode
- ✅ No hardcoded secrets

## 📝 Environment Variables

### Backend

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=your_secret_min_32_chars
```

### Frontend

```env
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

## 🎯 Development Phases

- **Phase 1:** Foundation (✅ Current)
- **Phase 2:** Database & Authentication
- **Phase 3:** Core Features
- **Phase 4:** Recruiter Dashboard
- **Phase 5:** Admin Panel
- **Phase 6:** Polish & Deployment

## 📞 Support

See `docs/SETUP.md` for troubleshooting.

## 📄 License

ISC