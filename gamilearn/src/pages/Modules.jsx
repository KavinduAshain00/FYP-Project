import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulesAPI, userAPI } from '../api/api';
import { motion } from 'framer-motion';
import './Dashboard.css';

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Gamification states
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // get all modules, ignoring learning path (category=all)
        const [modulesRes, profileRes] = await Promise.all([
          modulesAPI.getAll('all'),
          userAPI.getProfile()
        ]);
        setModules(modulesRes.data.modules);
        setProfile(profileRes.data.user);
        
        // Use server-provided totals if available; otherwise compute
        const userData = profileRes.data.user;
        const points = userData.totalPoints || (userData.completedModules?.length || 0) * 100;
        setTotalPoints(points);
        setLevel(userData.level || (Math.floor(points / 200) + 1));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { refreshProfile } = useAuth();

  const handleStartModule = async (moduleId) => {
    try {
      await userAPI.setCurrentModule(moduleId);
      if (refreshProfile) await refreshProfile();
      navigate(`/editor/${moduleId}`);
    } catch (error) {
      console.error('Error starting module:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading modules...</p>
      </div>
    );
  }

  const completedModuleIds = (profile?.completedModules || []).map(m => (m.moduleId && m.moduleId._id) ? m.moduleId._id.toString() : (m.moduleId ? m.moduleId.toString() : null)).filter(Boolean);
  const completionPercentage = modules.length > 0 
    ? Math.round((completedModuleIds.length / modules.length) * 100)
    : 0;

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    const category = module.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {});

  return (
    <div className="dashboard">
      {/* Modern Header */}
      <motion.header 
        className="modules-hero"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="modules-hero-content">
          <div className="hero-top">
            <motion.button 
              onClick={() => navigate('/dashboard')} 
              className="btn-back-modern"
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Dashboard
            </motion.button>
            
            <div className="hero-actions-mini">
              <motion.div 
                className="stat-mini"
                whileHover={{ scale: 1.05 }}
              >
                <span className="stat-mini-icon">🏆</span>
                <span className="stat-mini-value">Level {level}</span>
              </motion.div>
              <motion.div 
                className="stat-mini"
                whileHover={{ scale: 1.05 }}
              >
                <span className="stat-mini-icon">⭐</span>
                <span className="stat-mini-value">{totalPoints}</span>
              </motion.div>
              <motion.button 
                onClick={handleLogout} 
                className="btn-logout-mini"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </div>

          <motion.div 
            className="hero-main"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1>📚 All Learning Modules</h1>
            <p className="hero-description">
              Explore our comprehensive collection of coding modules. Master JavaScript, React, and game development through hands-on challenges.
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            className="modules-stats-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="modules-stat-item">
              <div className="modules-stat-icon">📖</div>
              <div className="modules-stat-content">
                <span className="modules-stat-value">{modules.length}</span>
                <span className="modules-stat-label">Total Modules</span>
              </div>
            </div>
            <div className="modules-stat-item">
              <div className="modules-stat-icon">✅</div>
              <div className="modules-stat-content">
                <span className="modules-stat-value">{completedModuleIds.length}</span>
                <span className="modules-stat-label">Completed</span>
              </div>
            </div>
            <div className="modules-stat-item">
              <div className="modules-stat-icon">🎯</div>
              <div className="modules-stat-content">
                <span className="modules-stat-value">{modules.length - completedModuleIds.length}</span>
                <span className="modules-stat-label">Remaining</span>
              </div>
            </div>
            <div className="modules-stat-item">
              <div className="modules-stat-icon">📊</div>
              <div className="modules-stat-content">
                <span className="modules-stat-value">{completionPercentage}%</span>
                <span className="modules-stat-label">Progress</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Modules Content */}
      <div className="modules-body">
        {modules.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon">📭</div>
            <h3>No modules available yet</h3>
            <p>Check back soon for exciting new content!</p>
          </motion.div>
        ) : (
          <>
            {/* All Modules Grid */}
            <motion.section 
              className="modules-grid-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="section-header-simple">
                <h2>All Available Modules</h2>
                <p>Choose any module to begin your learning journey</p>
              </div>

              <div className="modules-grid-new">
                {modules.map((module, index) => {
                    const isCompleted = completedModuleIds.includes(module._id.toString());

                  return (
                    <motion.div 
                      key={module._id} 
                      className={`module-card-new ${isCompleted ? 'completed' : ''}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.3 + index * 0.05,
                        duration: 0.4
                      }}
                      whileHover={{ 
                        y: -8,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className="module-card-header">
                        <motion.div 
                          className="module-icon-new"
                          animate={isCompleted ? { 
                            rotate: [0, 15, -15, 0],
                            scale: [1, 1.2, 1.2, 1]
                          } : {}}
                          transition={{ 
                            repeat: Infinity,
                            repeatDelay: 4,
                            duration: 0.8
                          }}
                        >
                          {isCompleted ? '✅' : '🎯'}
                        </motion.div>
                        <span className={`difficulty-badge-new ${module.difficulty}`}>
                          {module.difficulty}
                        </span>
                      </div>

                      <div className="module-card-body">
                        <h3>{module.title}</h3>
                        <p>{module.description}</p>
                      </div>

                      <div className="module-card-footer">
                        <div className="module-meta-new">
                          <span className="category-tag-new">
                            {module.category.replace('-', ' ')}
                          </span>
                          {module.objectives && (
                            <span className="objectives-tag">
                              {module.objectives.length} tasks
                            </span>
                          )}
                        </div>

                        <motion.button 
                          className="btn-module"
                          onClick={() => handleStartModule(module._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isCompleted ? '🔄 Review' : '▶️ Start'}
                        </motion.button>
                      </div>

                      {isCompleted && (
                        <motion.div 
                          className="completed-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Categorized View */}
            {Object.keys(groupedModules).length > 1 && (
              <motion.section 
                className="categorized-modules"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="section-header-simple">
                  <h2>Browse by Category</h2>
                  <p>Explore modules organized by topic</p>
                </div>

                {Object.entries(groupedModules).map(([category, categoryModules], catIndex) => (
                  <motion.div 
                    key={category} 
                    className="category-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + catIndex * 0.1 }}
                  >
                    <h3 className="category-title">
                      <span className="category-icon">
                        {category === 'javascript-basics' ? '📘' : 
                         category === 'react-fundamentals' ? '⚛️' : 
                         category === 'game-development' ? '🎮' : '📚'}
                      </span>
                      {category.replace('-', ' ')}
                      <span className="category-count">({categoryModules.length})</span>
                    </h3>

                    <div className="category-modules-grid">
                      {categoryModules.map((module, idx) => {
                        const isCompleted = completedModuleIds.includes(module._id);
                        return (
                          <motion.div 
                            key={module._id}
                            className={`category-module-card ${isCompleted ? 'completed' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + idx * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleStartModule(module._id)}
                          >
                            <div className="category-module-icon">
                              {isCompleted ? '✅' : '🎯'}
                            </div>
                            <div className="category-module-info">
                              <h4>{module.title}</h4>
                              <span className={`difficulty-mini ${module.difficulty}`}>
                                {module.difficulty}
                              </span>
                            </div>
                            <motion.div 
                              className="category-module-arrow"
                              whileHover={{ x: 5 }}
                            >
                              →
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </motion.section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Modules;
