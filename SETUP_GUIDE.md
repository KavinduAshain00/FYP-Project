# GamiLearn Setup & Usage Guide

## 🎮 Project Overview
GamiLearn is a gamified learning platform for game development with user authentication, learning modules, and an in-browser code editor with live preview.

## ✅ Setup Complete!

### Running Services:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:5174

## 🚀 Quick Start

### 1. Start MongoDB (if not running)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or using mongod directly
mongod --config /usr/local/etc/mongod.conf
```

### 2. Seed the Database (First Time Only)
```bash
cd backend
npm run seed
```

This creates sample learning modules including:
- JavaScript Basics (Variables, Functions)
- Canvas Drawing
- Game Loop and Animation
- Keyboard Controls
- Collision Detection

### 3. Access the Application
Open your browser and go to: **http://localhost:5174**

## 📖 How to Use

### Sign Up Flow:
1. Click "Sign up here" on the login page
2. Enter your details (name, email, password)
3. Answer the JavaScript knowledge question:
   - **"Yes, I know JavaScript"** → Advanced game development path
   - **"No, I'm new to JavaScript"** → JavaScript basics path
4. You'll be redirected to the dashboard

### Dashboard Features:
- **Profile Card**: Shows your avatar, email, and learning stats
- **Progress Bar**: Visual representation of completed modules
- **Learning Path Badge**: Shows your assigned learning path
- **Module Cards**: Browse and start learning modules
  - Each card shows difficulty level, category, and objectives
  - Click "Start Learning" to open the code editor

### Code Editor Features:
- **Left Panel**: Instructions, objectives, and hints
- **Middle Panel**: Code editor with HTML, CSS, and JS tabs
- **Right Panel**: Live preview of your code
- **Top Bar**: 
  - Reset button to restore starter code
  - Complete button to mark module as finished
  - Back button to return to dashboard

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm start          # Start server
npm run dev        # Start with nodemon (auto-restart)
npm run seed       # Seed database with modules
```

### Frontend
```bash
cd gamilearn
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 📁 Key Files

### Backend
- `server.js` - Express server setup
- `models/User.js` - User schema with auth
- `models/Module.js` - Learning module schema
- `routes/auth.js` - Login/signup endpoints
- `routes/modules.js` - Module CRUD endpoints
- `routes/user.js` - User profile endpoints
- `middleware/auth.js` - JWT authentication
- `seed.js` - Database seeder

### Frontend
- `src/App.jsx` - Main app with routing
- `src/context/AuthContext.jsx` - Auth state management
- `src/pages/Login.jsx` - Login page
- `src/pages/Signup.jsx` - Signup with JS assessment
- `src/pages/Dashboard.jsx` - User dashboard
- `src/pages/CodeEditor.jsx` - In-browser IDE
- `src/components/ProtectedRoute.jsx` - Route protection
- `src/api/api.js` - API client with axios

## 🔐 Environment Variables

Backend `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gamilearn
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

## 🎯 Features Implemented

✅ User authentication (signup/login) with JWT
✅ JavaScript knowledge assessment during signup
✅ Learning path assignment (basics vs advanced)
✅ User profile with progress tracking
✅ Game development learning modules
✅ In-browser code editor (HTML, CSS, JS)
✅ Live preview with iframe sandbox
✅ Module completion tracking
✅ Responsive design
✅ Protected routes

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is installed and running
- Check MONGODB_URI in `.env`
- Try: `brew services restart mongodb-community`

### Port Already in Use
- Frontend will automatically use next available port
- Backend: Change PORT in `.env`

### Module Not Loading
- Check backend is running on port 5000
- Ensure database is seeded: `npm run seed`
- Check browser console for errors

### Authentication Issues
- Clear localStorage in browser DevTools
- Check JWT_SECRET is set in `.env`
- Verify token in Network tab

## 🎨 Technology Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- CORS

**Frontend:**
- React 19
- React Router
- CodeMirror (code editor)
- Axios
- CSS3

## 📝 Sample Test User

You can create your own user or use these credentials after manual creation:
- Email: test@example.com
- Password: password123

## 🔄 Next Steps

To enhance the platform:
1. Add more advanced modules (Physics, Sound, Sprites)
2. Implement code saving/loading
3. Add unit tests for modules
4. Create admin panel for module management
5. Add social features (share projects)
6. Implement leaderboards
7. Add video tutorials

---

**Happy Learning! 🎮🚀**
