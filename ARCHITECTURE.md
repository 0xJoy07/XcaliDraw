# Architecture

## High-Level Overview

Xcalidraw follows a decoupled client-server architecture utilizing a React SPA frontend and an Express/Bun backend connected to MongoDB. 

```text
+----------------+      Vercel Proxy Rewrite     +-----------------+      +---------+
|                |      (/api/* -> Backend)      |                 |      |         |
| Client (React) | <===========================> | Server (Express)| <==> | MongoDB |
|                |       (First-party context)   |                 |      |         |
+----------------+                               +-----------------+      +---------+
```

A critical architectural decision is the use of a proxy rewrite pattern (configured in `client/vercel.json` for production, and Vite's proxy for local development). Browsers like Brave and Safari enforce strict Intelligent Tracking Prevention (ITP) that aggressively blocks cross-site cookies. By proxying all `/api/*` traffic through the frontend domain, the API appears as a first-party origin. This ensures that secure, `httpOnly` refresh cookies are reliably attached to requests without being blocked by privacy shields.

## Auth Flow

Authentication employs a robust dual-token pattern:
- **Access Token (JWT)**: Issued with a short lifespan (e.g., 5-15 minutes) and kept purely in-memory on the client to completely eliminate the risk of XSS exfiltration.
- **Refresh Token**: A long-lived, cryptographically hashed token stored in a secure, `httpOnly`, `sameSite: lax` cookie. 
- **Rotation & Guarding**: When the access token expires, the client transparently hits `/refresh` to mint a new access token and rotate the refresh token. A single-flight guard in the API client prevents concurrent requests from invalidating each other's tokens. Furthermore, the backend implements a grace-period on revoked refresh tokens to handle React `StrictMode`'s double-mounting behavior during OAuth callbacks without triggering false-positive reuse detections.
- **OAuth**: Google and GitHub integrations are handled via Passport.js, issuing a short-lived intermediate OAuth token that the client exchanges for the standard access/refresh token pair.

## Data Model

- **User**: Represents a registered account, storing identity details, the authentication provider type (local, google, github), and a securely hashed password.
- **Canvas**: Represents a single drawing board. It contains the visual `elements` array, the `appState` configuration, and sharing settings (`isPublic`, `publicRole`, `shareToken`).
- **CanvasCollaborator**: An associative entity linking a `User` to a specific `Canvas` at a specific permission level (`viewer` or `editor`).
- **RefreshToken**: Tracks active refresh sessions. Stores a hash of the token, expiration times, and revocation timestamps to allow detection of token reuse and hijacking.
- **PasswordResetToken**: A short-lived, single-use token utilized during the self-serve password recovery flow.

## Canvas Save Pipeline

Saving canvas state prioritizes perceived performance and offline resilience:
1. **Synchronous Local Write**: Every stroke immediately triggers a synchronous write to `localStorage`. This guarantees zero data loss in the event of an unexpected tab closure or network drop.
2. **Debounced Remote Sync**: A background process (`useCanvasAutosave`) debounces state changes and flushes them to MongoDB over the network. Because the network request happens asynchronously in the background, it never blocks the main thread or interrupts the user's drawing experience.

## Sharing & Access Model

Authorization logic for canvas access is strictly centralized. 
Instead of duplicating permission checks across different endpoints, all canvas-related routes defer to a shared `resolveAccess` utility. This single source of truth evaluates the user's identity against the canvas's public sharing flags, share tokens, and specific `CanvasCollaborator` grants to definitively return an access level (`owner`, `editor`, `viewer`, or `none`).

## Folder Structure

The repository is organized into two distinct workspaces:

**`client/src/`**
- `components/ui/`: Reusable, atomic components styled with the project's hand-drawn visual identity.
- `pages/`: Top-level route components.
- `canvas/`: Core drawing logic and integration with the RoughJS rendering engine.
- `auth/`: Context providers and route protection logic for session management.
- `store/`: Zustand stores for global application state (elements, theme, UI state).
- `lib/`: API client wrappers and fetch utilities.

**`server/src/`**
- `routes/`: Express route handlers grouped by domain (auth, canvases).
- `models/`: Mongoose schemas defining the data model layer.
- `middleware/`: Express middlewares for route protection, rate limiting, and request validation.
- `utils/`: Shared backend helpers (token generation, access resolution).
- `emails/`: Nodemailer templates for transactional emails.

## Design System

The application employs a custom, hand-drawn visual language across the UI. This is achieved by utilizing `RoughJS` to dynamically generate sketchy borders and backgrounds for interactive elements (`RoughCard`, `RoughButton`, `RoughSelect`), paired with the `Virgil` (Excalifont) font family to mimic whiteboard writing.

**Note on Emails**: The transactional email templates (like password resets) deliberately deviate from this design system. Due to the severe rendering constraints and limited CSS support across various email clients (e.g., Outlook, Gmail), the emails utilize standard static layouts and web-safe font fallbacks. This inconsistency is a necessary engineering trade-off for deliverability, not an oversight.
