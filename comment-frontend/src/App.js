import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from 'axios';
import {AuthProvider} from "./components/AuthContext";
import ProtectedRoute from './components/ProtectedRoute';
import Login from "./components/Login";
import Register from './components/Register';
import Home from './components/Home';
import CommentForm from './components/CommentForm';
import CommentList from './components/CommentList';
import api from './components/api';
import AuthContext from './components/AuthContext';
import './App.css'; // Подключаем стили

const App = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState('created_at');// Поле сортировки
    const [sortOrder, setSortOrder] = useState('desc');
    const [isFormVisible, setIsFormVisible] = useState(false); // Состояние видимости формы
    const [currentPage, setCurrentPage] = useState(1); // Текущая страница
    const [nextPage, setNextPage] = useState(null); // Ссылка на следующую страницу
    const [prevPage, setPrevPage] = useState(null); // Ссылка на предыдущую страницу
    const  isAuthenticated  = useContext(AuthContext);
    

    // Загрузка комментариев
    const fetchComments = async (page,url = `/comments/`) => {
        setLoading(true);
        try {
            const response = await api.get(url,{
                params: {
                    page: page,
                    ordering: `${sortOrder === "asc" ? "" : "-"}${sortField}`,
                },
            });
            
            setComments(response.data.results);
            setNextPage(response.data.next);
            setPrevPage(response.data.previous)
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(currentPage);
    }, [currentPage,sortField,sortOrder,isAuthenticated]);

    const handlePageChange = (direction) => {
        if (direction === "next" && nextPage) {
            setCurrentPage((prev) => prev + 1);
        } else if (direction === "prev" && prevPage) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    // WebSocket для реального времени
    const addReplyToTree = (comments, newReply) => {
        return comments.map((comment) => {
            if (comment.id === newReply.parent) {
                return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply],
                };
            }

            if (comment.replies && comment.replies.length > 0) {
                return {
                    ...comment,
                    replies: addReplyToTree(comment.replies, newReply),
                };
            }

            return comment;
        });
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/comments/');
        ws.onmessage = (event) => {
            const newComment = JSON.parse(event.data);
            console.log('New comment received:', newComment);

            setComments((prevComments) => {
                if (newComment.parent) {
                    return addReplyToTree(prevComments, newComment);
                } else {
                    if (prevComments.some((comment) => comment.id === newComment.id)) {
                        return prevComments;
                    }
                    return [newComment, ...prevComments];
                }
            });
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => ws.close();
    }, []);

    const loadMoreComments = () => {
        if (nextPage) {
            fetchComments(nextPage);
        }
    };
    
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

                                <CommentList comments={comments} setSortField = {setSortField} setSortOrder = {setSortOrder} sortOrder = {sortOrder}/>

                                <div className=".pagination">
                                    <button onClick={() => handlePageChange("prev")} disabled={!prevPage}>
                                        Previous
                                    </button>
                                    <span>Page {currentPage}</span>
                                    <button onClick={() => handlePageChange("next")} disabled={!nextPage}>
                                        Next
                                    </button>
                                </div>
                            </div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>

        // <div className="app-container">
        //     <h1 className="app-title">Comments</h1>

        //     <div className="form-toggle-container">
        //         <button
        //             className="toggle-form-button"
        //             onClick={() => setIsFormVisible(!isFormVisible)}
        //         >
        //             {isFormVisible ? 'Hide Comment Form' : 'Add a Comment'}
        //         </button>
        //     </div>

        //     {isFormVisible && <CommentForm />}

        //     <CommentList comments={comments} setSortField = {setSortField} setSortOrder = {setSortOrder} sortOrder = {sortOrder}/>

        //     <div className=".pagination">
        //         <button onClick={() => handlePageChange("prev")} disabled={!prevPage}>
        //             Previous
        //         </button>
        //         <span>Page {currentPage}</span>
        //         <button onClick={() => handlePageChange("next")} disabled={!nextPage}>
        //             Next
        //         </button>
        //     </div>
        // </div>
    );
};

export default App;
