import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Modules from './pages/Modules';
import CodeEditor from './pages/CodeEditor';
import CustomGameStudio from './pages/CustomGameStudio';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/modules" 
          element={
            <ProtectedRoute>
              <PageTransition><Modules /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/editor/:moduleId" 
          element={
            <ProtectedRoute>
              <PageTransition><CodeEditor /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/custom-game" 
          element={
            <ProtectedRoute requireGameStudio>
              <PageTransition><CustomGameStudio /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
