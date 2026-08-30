# HireLynk Backend

Node.js + Express.js + TypeScript backend for HireLynk ATS.

## Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Zod** - Validation
- **Helmet** - Security headers
- **CORS** - Cross-origin requests
- **express-rate-limit** - Rate limiting

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL (for later phases)

### Installation

```bash
npm install
cp .env.example .env
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Build & Run

```bash
npm run build
npm start
```

### Type Check

```bash
npm run typecheck
```

## API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "HireLynk API is running"
}
```

### API Root

```bash
GET /api
```

## Architecture

Clean layered architecture: