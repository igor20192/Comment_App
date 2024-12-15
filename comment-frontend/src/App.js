import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Lazy loading components for better performance
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import('./components/Register'));
const Home = lazy(() => import('./components/Home'));
const CommentForm = lazy(() => import('./components/CommentForm'));
const CommentList = lazy(() => import('./components/CommentList'));


const Comments = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  const toggleForm = () => setIsFormVisible(prev => !prev);

  return (
    <div className="app-container">
      <h1 className="app-title">Comments</h1>
      <div className="form-toggle-container">
        <button
          className="toggle-form-button"
          onClick={toggleForm}
          aria-expanded={isFormVisible}
        >
          {isFormVisible ? 'Hide Comment Form' : 'Add a Comment'}
        </button>
      </div>
      {isFormVisible && <CommentForm />}
      <CommentList />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route 
              path="/comments" 
              element={
                <ProtectedRoute>
                  <Comments />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;
