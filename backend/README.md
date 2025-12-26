# PeerNet Backend

Node.js + Express backend for PeerNet.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables:
   Create a `.env` file (already created by setup):
   ```
   PORT=5000
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_NAME=peernet
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```

3. Start Server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `GET /api/rooms` - List all learning rooms
- `POST /api/rooms` - Create a new room
