import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentForm from './components/CommentForm';
import CommentList from './components/CommentList';
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

    // Загрузка комментариев
    const fetchComments = async (page,url = `http://localhost:8000/api/comments/`) => {
        setLoading(true);
        try {
            const response = await axios.get(url,{
                params: {
                    page: page,
                    ordering: `${sortOrder === "asc" ? "" : "-"}${sortField}`,
                },
            });
            // setComments((prevComments) => {
            //     const newComments = response.data.results.filter(
            //         (newComment) => !prevComments.some((comment) => comment.id === newComment.id)
            //     );
            //     return [...prevComments, ...newComments];
            // });
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
    }, [currentPage,sortField,sortOrder]);

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
    );
};

export default App;
