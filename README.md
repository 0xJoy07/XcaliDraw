# Xcalidraw

A hand-drawn collaborative canvas tool for capturing ideas.

<img width="1918" height="928" alt="image" src="https://github.com/user-attachments/assets/ea9de107-0c01-4020-a3c3-bb21dd0f323c" />

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Zustand, RoughJS
- **Backend**: Bun, Express, MongoDB (Mongoose)
- **Authentication**: JWT (in-memory access tokens + HTTP-only refresh cookies), Passport.js (Google/GitHub OAuth)
- **Emails**: Nodemailer for transactional emails

## Features
- **Canvas Drawing**: Infinite panning/zooming canvas with freedraw, rectangle, ellipse, diamond, and eraser tools.
- **Autosave Pipeline**: Instant synchronous writes to localStorage paired with debounced background sync to MongoDB.
- **Sharing & Access Control**: Generate shareable links with granular role-based access (Owner, Editor, Viewer).
- **Authentication**: Secure email/password login and OAuth integrations.
- **Password Recovery**: Self-serve password reset flow via transactional email.
- **Cross-Platform**: Mobile and touch support for seamless drawing on tablets and phones.
- **Hand-drawn Aesthetics**: Consistent rough/hand-drawn visual identity across components and dark mode support.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.x)
- [Node.js](https://nodejs.org/) (v20+)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas cluster)

### Backend Setup (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies using Bun:
   ```bash
   bun install
   ```
3. Set up the environment variables:
   ```bash
   cp .env.example .env
   ```
   *Note: You will need to provision a MongoDB URI, set up OAuth applications in the Google Cloud Console and GitHub Developer Settings, and generate a Gmail App Password for Nodemailer.*
4. Start the development server:
   ```bash
   bun run dev
   ```

### Frontend Setup (Client)
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies using npm:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure `VITE_API_URL` points to your running backend (usually `http://localhost:5001`).*
4. Start the development server:
   ```bash
   npm run dev
   ```

### LAN Testing Setup (Optional)
To test the application on mobile devices on your local network:
1. Find your machine's local IP address (e.g., `192.168.1.X`).
2. In `client/.env`, set `VITE_API_URL` to `http://<YOUR_LAN_IP>:5001`.
3. In `server/.env`, set `CLIENT_URL` to `http://<YOUR_LAN_IP>:5173`.
4. Start the backend bound to all interfaces:
   ```bash
   PORT=5001 HOST=0.0.0.0 bun run dev
   ```
5. Start the frontend bound to all interfaces:
   ```bash
   npm run dev -- --host
   ```

## Known Limitations
- No live multi-cursor collaboration (multiplayer) is currently implemented.
- The project lacks an automated test suite.

## License
MIT License
