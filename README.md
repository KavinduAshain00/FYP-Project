# GamiLearn - Gamified Game Development Learning Platform

A full-stack web application for learning game development through interactive coding challenges with an in-browser code editor.

## Features

- 🔐 **User Authentication**: Sign up and login with JWT-based authentication
- 📚 **JavaScript Assessment**: New users are asked about their JavaScript knowledge and redirected to appropriate learning paths
- 🎯 **Learning Modules**: Game development focused modules (Canvas, Animation, Collision Detection, etc.)
- 💻 **In-Browser Code Editor**: CodeMirror-based IDE with HTML, CSS, and JavaScript tabs
- 🚀 **Live Preview**: Real-time preview of code changes in an iframe sandbox
- 📊 **Progress Tracking**: Track completed modules and learning progress
- 🎨 **Modern UI**: Beautiful gradient design with responsive layout

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 19
- React Router for navigation
- CodeMirror for code editing
- Axios for API calls
- CSS3 for styling

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd FYP-Project
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory (already created):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gamilearn
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

Seed the database with sample learning modules:
```bash
npm run seed
```

Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../gamilearn
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Sign Up**: Create a new account
2. **JavaScript Assessment**: Answer whether you're comfortable with JavaScript
   - If YES: You'll be directed to advanced game development modules
   - If NO: You'll start with JavaScript basics modules
3. **Dashboard**: View your profile, progress, and available learning modules
4. **Start Learning**: Click on any module to open the code editor
5. **Code Editor**: 
   - Write HTML, CSS, and JavaScript in separate tabs
   - See live preview on the right side
   - Read instructions and objectives on the left
   - Complete modules to track progress

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### User
- `GET /api/user/profile` - Get user profile (Protected)
- `PUT /api/user/module/complete` - Mark module as completed (Protected)
- `PUT /api/user/module/current` - Set current module (Protected)

### Modules
- `GET /api/modules` - Get all modules (Protected)
- `GET /api/modules/:id` - Get single module (Protected)
- `POST /api/modules` - Create new module (Protected)
