# PeerNet Setup & Run Instructions

## 1. Database Setup

Before running the application, you must set up the PostgreSQL database.

1.  **Check PostgreSQL**: Ensure PostgreSQL is installed and running.
2.  **Configure Credentials**: Open `peernet/backend/.env` and check the `DB_PASSWORD`.
    *   Default is `postgres`.
    *   If your local postgres user has a different password, update it there.
3.  **Initialize Database**:
    *   Open a terminal in `peernet/backend`.
    *   Run: `node src/db/init.js`
    *   If this fails, you can manually run the SQL in `peernet/backend/schema.sql` using pgAdmin or a SQL tool.

## 2. Running the Application

### Backend
1.  Open a terminal.
2.  Navigate to `peernet/backend`.
3.  Run: `npm install` (if not done).
4.  Run: `npm start`.
    *   Server will start on `http://localhost:5000`.

### Frontend
1.  Open a new terminal.
2.  Navigate to `peernet/frontend`.
3.  Run: `npm install` (if not done).
4.  Run: `npm run dev`.
    *   Web app will start on `http://localhost:5173`.

## 3. Demo Accounts
*   **Mentor**: `alex@example.com` / `password123`
*   **Admin**: `admin@peernet.com` / `admin123`
*   **Student**: You can register a new account.
