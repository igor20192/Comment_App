import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {AuthProvider} from "./components/AuthContext";
import ProtectedRoute from './components/ProtectedRoute';
import Login from "./components/Login";
import Register from './components/Register';
import Home from './components/Home';
import CommentForm from './components/CommentForm';
import CommentList from './components/CommentList';
import './App.css'; // Подключаем стили

const App = () => {
    
    const [isFormVisible, setIsFormVisible] = useState(false); // Состояние видимости формы
    
    return (
        <AuthProvider> {/* Обертка для AuthContext */}
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/comments" element={
                        <ProtectedRoute>
                            <div className="app-container">
                                <h1 className="app-title">Comments</h1>

                                <div className="form-toggle-container">
                                    <button
                                        className="toggle-form-button"
                                        onClick={() => setIsFormVisible(!isFormVisible)}
                                    >
                                        {isFormVisible ? 'Hide Comment Form' : 'Add a Comment'}
                                    </button>
                                </div>

                                {isFormVisible && <CommentForm />}

                                <CommentList />
                            </div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>

        
    );
};

export default App;
