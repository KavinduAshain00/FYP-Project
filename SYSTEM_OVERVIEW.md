# GamiLearn System Architecture Overview

A full-stack gamified game development learning platform built with React (frontend) and Node.js/Express (backend).

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Data Models](#data-models)
6. [Core Features](#core-features)
7. [Data Flow & API Integration](#data-flow--api-integration)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────┐
│   Frontend (React)      │
│  gamilearn/src/         │
└────────────┬────────────┘
             │
        HTTP/REST API
             │
┌────────────▼────────────┐
│   Backend (Express)     │
│  backend/               │
└────────────┬────────────┘
             │
        MongoDB Database
             │
┌────────────▼────────────┐
│   Data Storage          │
│  Users, Modules,        │
│  Achievements, etc.     │
└─────────────────────────┘
```

### Key Technologies

**Frontend:**
- React 19 with React Router for navigation
- Vite for build tooling
- CodeMirror for in-browser code editing
- Framer Motion for animations
- React Toastify for notifications
- Tailwind CSS for styling

**Backend:**
- Express.js for HTTP server
- MongoDB + Mongoose for database
- JWT (JSON Web Tokens) for authentication
- bcryptjs for password hashing
- Gemini AI API for tutoring functionality
- Express Rate Limiter for API protection

---

## Frontend Architecture

### Directory Structure

```
gamilearn/src/
├── App.jsx                    # Main router and layout setup
├── main.jsx                   # React entry point
├── api/
│   └── api.js                # Axios API client for backend calls
├── components/
│   ├── layout/
│   │   ├── AppSidebar.jsx    # Navigation sidebar
│   │   └── GameLayout.jsx    # Layout wrapper for game pages
│   └── ui/
│       ├── ConfirmModal.jsx  # Reusable modal component
│       ├── GameUI.jsx        # Game-specific UI elements
│       └── MarkdownContent.jsx # Markdown rendering
├── context/
│   └── AuthContext.jsx       # Global authentication state
├── pages/
│   ├── Dashboard.jsx         # Main dashboard
│   ├── Modules.jsx           # List of learning modules
│   ├── Profile.jsx           # User profile
│   ├── admin/
│   │   ├── Admin.jsx         # Admin panel
│   │   ├── AdminModuleEditor.jsx
│   │   └── AdminModuleFormSections.jsx
│   ├── auth/
│   │   ├── Login.jsx         # Login page
│   │   ├── Signup.jsx        # Registration page
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   └── codeEditor/           # Main learning environment
│       ├── CodeEditor.jsx
│       ├── CodeEditorConsoleBody.jsx
│       ├── CodeEditorMirrors.jsx
│       ├── CodeEditorMultiplayerPreviewPanel.jsx
│       ├── CodeEditorSinglePlayerPreviewPanel.jsx
│       ├── CodeEditorTutorSidebar.jsx
│       ├── LectureOverviewPopup.jsx
│       ├── ModuleCompleteResultsModal.jsx
│       └── functions/
│           ├── lectureSlideImages.js
│           ├── splitLectureSlides.js
│           ├── tutorAskPayload.js
│           └── useLectureOverview.js
└── utils/
    ├── draftStorage.js       # Local storage for drafts
    ├── levelCurve.js         # Level calculation
    ├── moduleUtils.js
    ├── multiplayerRuntime.js
    └── singlePlayerPreviewHtml.js
```

### App.jsx - Router Setup

The main router defines these routes:

- `/auth/login` - Login page
- `/auth/signup` - Registration page
- `/auth/forgot-password` - Password reset request
- `/dashboard` - Main dashboard (protected)
- `/modules` - Module list (protected)
- `/modules/:id` - Code editor (protected)
- `/profile` - User profile (protected)
- `/admin` - Admin panel (admin only)

The `ShellPagesCacheProvider` keeps dashboard/modules/profile/admin data in memory while navigating between them, and clears the cache when leaving to code editor or auth pages.

### AuthContext - State Management

```javascript
// Provides:
- user: Current logged-in user object
- loading: Initial auth check status
- login(email, password): Authenticate user
- signup(name, email, password, knowsJavaScript): Create account
- logout(): Clear session
- isAdmin: Boolean check for admin role
```

**Key Features:**
- Auto-login on app load by validating stored JWT token
- JWT token stored in localStorage
- User data cached in localStorage
- Cancellable API requests on component unmount

### API Client (api.js)

Centralized Axios instance with:
- Base URL configuration
- Automatic token injection in Authorization header
- Request/response interceptors
- Grouped API endpoints (authAPI, userAPI, modulesAPI, etc.)

---

## Backend Architecture

### Server Setup (server.js)

```javascript
// Express server listening on process.env.PORT
// Connected to MongoDB via MONGODB_URI

// CORS configured for:
// - http://localhost:5173 (dev)
// - https://gamilearnapp.netlify.app (prod)

// Routes registered:
// /api/auth       - Authentication
// /api/modules    - Module CRUD
// /api/user       - User profile & progress
// /api/achievements - Achievements system
// /api/tutor      - AI tutoring
// /api/admin      - Admin functionality
```

### Directory Structure

```
backend/
├── server.js               # Express app entry point
├── seedAchievements.js     # Database seeding
├── constants/
│   ├── ai.js              # AI model configs
│   ├── avatars.js         # Avatar options
│   ├── learningPath.js    # Learning paths
│   ├── levelRanks.js      # Level/rank system
│   └── rateLimit.js       # Rate limit settings
├── controllers/
│   ├── authController.js      # Auth logic
│   ├── userController.js      # User profile/progress
│   ├── modulesController.js   # Module CRUD
│   ├── achievementsController.js # Achievements
│   ├── tutorController.js     # AI tutor
│   └── adminController.js     # Admin functions
├── models/
│   ├── User.js            # User schema
│   ├── Module.js          # Module schema
│   └── Achievement.js     # Achievement schema
├── routes/
│   ├── auth.js
│   ├── user.js
│   ├── modules.js
│   ├── achievements.js
│   ├── tutor.js
│   └── admin.js
├── middleware/
│   └── auth.js            # JWT verification middleware
├── services/
│   ├── achievementService.js    # Achievement logic
│   ├── aiService.js             # AI model integration
│   ├── githubModelsService.js   # GitHub Models API
│   ├── lessonXpService.js       # XP/progress system
└── utils/
    ├── jwt.js             # JWT utilities
    ├── levelSystem.js     # Level calculations
    ├── logger.js          # Logging utility
    ├── admin.js           # Admin utilities
    └── tutor.js           # Tutor utilities
```

### Middleware

**auth.js - JWT Authentication Middleware**

Verifies the Bearer token from the Authorization header:
```javascript
// Extracts token from "Authorization: Bearer <token>"
// Verifies JWT signature using JWT_SECRET
// Attaches user ID to req.userId for controllers
// Returns 401 if token invalid or missing
```

---

## Authentication Flow

### Signup Flow

```
1. User fills signup form
   ↓
2. POST /api/auth/signup-precheck (validation)
   ├─ Check if email already exists
   └─ Validate password strength
   ↓
3. POST /api/auth/signup (create account)
   ├─ Hash password with bcryptjs
   ├─ Create User document in MongoDB
   ├─ Generate JWT token
   └─ Return token + user data
   ↓
4. Frontend stores token and user in localStorage
   ↓
5. Redirect to dashboard
```

### Login Flow

```
1. User enters email/password
   ↓
2. POST /api/auth/login
   ├─ Find user by email
   ├─ Compare password with bcrypt hash
   ├─ Generate JWT token if password matches
   └─ Return token + user data
   ↓
3. Frontend stores token in localStorage
   ↓
4. Redirect to dashboard
```

### Auto-Login Flow (on page refresh)

```
1. App loads
   ↓
2. Check if token exists in localStorage
   ↓
3. If yes: GET /api/user/profile
   ├─ Verify JWT is valid
   ├─ Return user data
   ├─ Set user in AuthContext
   └─ User stays logged in
   ↓
4. If no or invalid: Clear localStorage, show login page
```

### JWT Token Structure

```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId: "<mongodb_id>", iat: <issued_at> }
Signature: HMAC-SHA256(header + payload, JWT_SECRET)
```

Token stored in localStorage and sent as:
```
Authorization: Bearer <token>
```

---

## Data Models

### User Model

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (hashed),
  avatarUrl: String,
  
  // Learning profile
  knowsJavaScript: Boolean,
  learningPath: "javascript-basics" | "advanced" | "none",
  
  // Progress tracking
  completedModules: [
    {
      moduleId: ObjectId,
      completedAt: Date
    }
  ],
  currentModule: ObjectId,
  
  // Step-by-step progress in code editor
  moduleStepProgress: [
    {
      moduleId: ObjectId,
      stepsVerified: [Boolean],      // Which steps completed
      currentStepIndex: Number,       // Current step
      updatedAt: Date
    }
  ],
  
  // Gamification
  earnedAchievements: [Number],      // Achievement IDs
  lessonXpKeys: [String],            // Dedup keys for XP
  
  // Admin
  role: "user" | "admin",
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Module Model

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  difficulty: "beginner" | "intermediate" | "advanced",
  category: "javascript-basics" | "game-development" | "multiplayer" | "advanced-concepts",
  order: Number,
  content: String (markdown),
  
  // Starter code for editors
  starterCode: {
    html: String,
    css: String,
    javascript: String,
    serverJs: String (for multiplayer)
  },
  
  // Module type
  moduleType: "vanilla" | "react",
  
  // Lesson content
  lessons: [
    {
      title: String,
      content: String,
      order: Number,
      steps: [
        {
          description: String,
          hint: String,
          order: Number,
          validationFn: String (JavaScript function as string)
        }
      ]
    }
  ],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Achievement Model

```javascript
{
  _id: Number,
  title: String,
  description: String,
  icon: String,
  rarity: "common" | "uncommon" | "rare" | "legendary",
  criteria: Object
}
```

---

## Core Features

### 1. Code Editor

**Location:** `/modules/:id` route → CodeEditor.jsx

The heart of the learning platform:

- **Three-tab editor:** HTML, CSS, JavaScript (CodeMirror-based)
- **Live preview:** Renders code in real-time iframe sandbox
- **Step validation:** Checks if code satisfies step requirements
- **Progress tracking:** Records which steps user has completed
- **Multiplayer support:** Socket.IO for real-time collaboration
- **Draft storage:** Local storage persists code between sessions
- **Console output:** Displays console.log and errors

**Step Verification Flow:**
```
1. User enters code
   ↓
2. User clicks "Verify Step"
   ↓
3. Frontend runs validation function on code
   ↓
4. If valid: 
   ├─ Mark step as complete
   ├─ Save to backend
   ├─ Award XP
   └─ Show success message
   ↓
5. If invalid: Show error message
```

### 2. AI Tutor

**Route:** POST `/api/tutor`

- Ask Gemini AI for help directly from the code editor
- Context includes: current file, code snippets, error messages
- Rate-limited: 6 requests/minute per user
- Server-side proxy for secure API key management
- Responses streamed back to frontend

**Usage Flow:**
```
1. User clicks "Ask Tutor"
   ↓
2. Frontend sends POST /api/tutor
   {
     message: "Why is my button not clickable?",
     context: { file: "index.html", code: "..." }
   }
   ↓
3. Backend:
   ├─ Verify JWT token
   ├─ Check rate limit
   ├─ Format prompt for Gemini
   ├─ Call Gemini API
   └─ Return answer
   ↓
4. Frontend displays answer
```

### 3. Achievement System

- Achievements awarded for milestones
- Tracked in User.earnedAchievements
- Displayed on user profile
- Types: First module, streak bonuses, level milestones, etc.

### 4. Progress Tracking

**Per-User Module Progress:**

```javascript
moduleStepProgress: {
  moduleId: <module_id>,
  stepsVerified: [true, true, false, false],  // Which steps completed
  currentStepIndex: 2,                        // On step 3 (0-indexed)
  updatedAt: <date>
}
```

**Learning Paths:**

- `javascript-basics`: Beginner modules
- `advanced`: Advanced modules
- Assigned based on `knowsJavaScript` question on signup

### 5. Admin Panel

**Route:** `/admin` (admin role only)

Features:
- Create/edit/delete modules
- Manage users
- View statistics
- Grant/revoke admin roles
- Bootstrap first admin via POST `/api/admin/bootstrap`

---

## Data Flow & API Integration

### Complete User Journey

#### 1. Registration to Dashboard

```
Signup Form (Signup.jsx)
    ↓ user enters name, email, password, JS knowledge
POST /api/auth/signup
    ↓ authController validates & creates user
User object + JWT token
    ↓ stored in localStorage
AuthContext updated
    ↓ user object now available app-wide
Redirect to Dashboard
```

#### 2. Learning a Module

```
User clicks module on Modules page
    ↓
GET /api/modules/:id
    ↓ loads full module with lessons/steps
CodeEditor.jsx mounts
    ↓
CodeMirror tabs: HTML, CSS, JavaScript
    ↓
User types code
    ↓ code auto-saved to localStorage (draftStorage.js)
User clicks "Verify Step"
    ↓
Frontend runs validation function
    ↓
PUT /api/user/module-progress
    {
      moduleId: <id>,
      currentStepIndex: <step>,
      stepsVerified: [true, true, ...]
    }
    ↓ updates User.moduleStepProgress
Success message + XP awarded
```

#### 3. Asking AI Tutor

```
User types question in CodeEditorTutorSidebar.jsx
    ↓
POST /api/tutor
    {
      message: "How do I create a game loop?",
      context: { file: "js", code: "..." }
    }
    ↓ auth middleware verifies JWT
    ↓ rate limiter checks 6/min quota
    ↓ format prompt for Gemini
    ↓ call Gemini API
Streamed response
    ↓
Display answer to user
```

#### 4. Admin Module Creation

```
Admin clicks "Create Module"
    ↓
AdminModuleEditor.jsx opens
    ↓
Fill form: title, description, difficulty, lessons/steps
    ↓
POST /api/admin/modules
    {
      title: "Canvas Basics",
      difficulty: "beginner",
      lessons: [...]
    }
    ↓ adminController validates & creates Module
Module saved to MongoDB
    ↓
Redirect to modules list
    ↓
GET /api/modules (refreshes list)
```

### API Endpoints Summary

**Authentication:**
- `POST /api/auth/signup-precheck` - Validate signup
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

**User:**
- `GET /api/user/profile` - Get current user
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/module-progress` - Save step progress
- `GET /api/user/achievements` - Get user achievements

**Modules:**
- `GET /api/modules` - List all modules
- `GET /api/modules/:id` - Get module details
- `POST /api/modules` - Create (admin)
- `PUT /api/modules/:id` - Update (admin)
- `DELETE /api/modules/:id` - Delete (admin)

**Achievements:**
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/user` - Get user achievements

**Tutor:**
- `POST /api/tutor` - Ask AI tutor

**Admin:**
- `POST /api/admin/bootstrap` - Create first admin
- `POST /api/admin/users/:id/grant-admin` - Grant admin role
- `POST /api/admin/users/:id/revoke-admin` - Revoke admin role

---

## Security Features

### Password Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- Never stored in plaintext
- Never returned by API

### JWT Authentication

- Tokens expire (configurable)
- Signed with JWT_SECRET environment variable
- Required for protected routes
- Verified by auth middleware

### Rate Limiting

- Auth endpoints: Configurable limit (e.g., 5 requests/15 min)
- Tutor endpoint: 6 requests/minute per user
- Implemented with express-rate-limit middleware

### CORS Protection

- Configured for specific origins only
- Credentials allowed for same-site requests
- Restricted HTTP methods

### Input Validation

- Email format validation
- Password strength requirements
- Module field validation
- XSS prevention via React's built-in escaping

---

## Environment Configuration

**Required Environment Variables (Backend):**

```bash
MONGODB_URI=mongodb://...      # MongoDB connection string
PORT=5000                      # Server port
JWT_SECRET=your-secret-key     # JWT signing secret
GEMINI_API_KEY=your-api-key   # Gemini AI API key
GEMINI_MODEL=gemini-1.5       # (optional) AI model ID
BOOTSTRAP_SECRET=secret       # (optional) Admin bootstrap secret
```

**Frontend Configuration:**

- Hardcoded API base URL in api.js
- Can be environment variable in vite.config.js

---

## Performance Optimizations

### Frontend

- **Page caching:** Shell pages (dashboard, modules, etc.) kept in memory while user navigates
- **Draft storage:** Code drafts auto-saved to localStorage to survive page reloads
- **Code splitting:** Routes lazy-loaded via React Router
- **Animation:** Framer Motion for smooth transitions

### Backend

- **Rate limiting:** Prevents abuse
- **JWT caching:** Client-side caching of token and user data
- **MongoDB indexing:** Indexes on email, moduleId for fast queries
- **Service layer:** Centralized business logic for reusability

---

## Deployment

### Frontend (Netlify)

- Built with Vite
- Deployed to `gamilearnapp.netlify.app`
- netlify.toml configuration for routing

### Backend (Any Node.js host)

- Runs Express server
- Requires Node.js v16+
- Environment variables configured on host
- MongoDB connection required

---

## Key Files Summary

| File | Purpose |
|------|---------|
| [backend/server.js](backend/server.js) | Express server setup and route registration |
| [backend/middleware/auth.js](backend/middleware/auth.js) | JWT verification middleware |
| [gamilearn/src/App.jsx](gamilearn/src/App.jsx) | Router setup and layout |
| [gamilearn/src/context/AuthContext.jsx](gamilearn/src/context/AuthContext.jsx) | Global auth state management |
| [gamilearn/src/pages/codeEditor/CodeEditor.jsx](gamilearn/src/pages/codeEditor/CodeEditor.jsx) | Main learning environment |
| [backend/models/User.js](backend/models/User.js) | User data schema |
| [backend/models/Module.js](backend/models/Module.js) | Module content schema |
| [backend/services/aiService.js](backend/services/aiService.js) | AI integration logic |
| [backend/controllers/](backend/controllers/) | Business logic for each feature |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────┐
│              FRONTEND (React)                     │
│  ┌────────────────────────────────────────────┐  │
│  │  App.jsx - Router Setup                     │  │
│  │  ├─ /auth (Login, Signup, etc.)            │  │
│  │  ├─ /dashboard (Main page)                 │  │
│  │  ├─ /modules (Module list)                 │  │
│  │  ├─ /modules/:id (Code Editor)             │  │
│  │  └─ /admin (Admin panel)                   │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  AuthContext - Global State                │  │
│  │  ├─ user (logged-in user)                  │  │
│  │  ├─ login/logout methods                   │  │
│  │  └─ Token management                       │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  API Client (Axios)                        │  │
│  │  ├─ authAPI                                │  │
│  │  ├─ userAPI                                │  │
│  │  ├─ modulesAPI                             │  │
│  │  └─ tutorAPI                               │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                       ↓ HTTP/REST
┌──────────────────────────────────────────────────┐
│           BACKEND (Express)                      │
│  ┌────────────────────────────────────────────┐  │
│  │  server.js - Express App                   │  │
│  │  ├─ CORS configured                        │  │
│  │  ├─ Route registration                     │  │
│  │  └─ MongoDB connection                     │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  Routes                                    │  │
│  │  ├─ /api/auth                              │  │
│  │  ├─ /api/user                              │  │
│  │  ├─ /api/modules                           │  │
│  │  ├─ /api/tutor                             │  │
│  │  └─ /api/admin                             │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  Middleware                                │  │
│  │  ├─ auth.js - JWT verification            │  │
│  │  ├─ Rate limiting                          │  │
│  │  └─ Error handling                         │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  Controllers                               │  │
│  │  ├─ authController                         │  │
│  │  ├─ userController                         │  │
│  │  ├─ modulesController                      │  │
│  │  ├─ tutorController                        │  │
│  │  └─ adminController                        │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  Services & Utils                          │  │
│  │  ├─ achievementService.js                  │  │
│  │  ├─ aiService.js (Gemini integration)      │  │
│  │  ├─ lessonXpService.js                     │  │
│  │  └─ levelSystem.js                         │  │
│  └────────────────────────────────────────────┘  │
│                       ↓                           │
│  ┌────────────────────────────────────────────┐  │
│  │  Models (Mongoose)                         │  │
│  │  ├─ User.js                                │  │
│  │  ├─ Module.js                              │  │
│  │  └─ Achievement.js                         │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                       ↓ Mongoose
┌──────────────────────────────────────────────────┐
│         DATABASE (MongoDB)                       │
│  ├─ users collection                            │
│  ├─ modules collection                          │
│  ├─ achievements collection                     │
│  └─ session data (if applicable)                │
└──────────────────────────────────────────────────┘
```

---

## Summary

GamiLearn is a gamified learning platform where:

1. **Users register** with their JavaScript knowledge level
2. **Users learn** through interactive code modules with HTML/CSS/JS editors
3. **Users get guided** by an AI tutor powered by Gemini
4. **Users track progress** through step completion and achievements
5. **Admins manage** content, users, and platform configuration

The architecture follows a clean separation between frontend (React) and backend (Express), with JWT-based authentication ensuring secure communication. MongoDB stores all persistent data, while local storage provides instant draft recovery and offline functionality.

