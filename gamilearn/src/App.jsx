import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Modules from "./pages/Modules";
import CodeEditor from "./pages/CodeEditor";
import CustomGameStudio from "./pages/CustomGameStudio";
import MultiplayerGameStudio from "./pages/MultiplayerGameStudio";
import GamePlanningBoard from "./pages/GamePlanningBoard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div
      style={{
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules"
              element={
                <ProtectedRoute>
                  <Modules />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:moduleId"
              element={
                <ProtectedRoute>
                  <CodeEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-game"
              element={
                <ProtectedRoute requireGameStudio>
                  <CustomGameStudio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game-planning"
              element={
                <ProtectedRoute requireGameStudio>
                  <GamePlanningBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/multiplayer-studio"
              element={
                <ProtectedRoute requireGameStudio>
                  <MultiplayerGameStudio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </div>
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
