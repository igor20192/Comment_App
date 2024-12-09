import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentForm from './components/CommentForm';
import CommentList from './components/CommentList';

const App = () => {
    const [comments, setComments] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(false); // Состояние для отслеживания загрузки

    // Функция для загрузки комментариев
    const fetchComments = async (url = 'http://localhost:8000/api/comments/') => {
        setLoading(true); // Начинаем загрузку
        try {
            const response = await axios.get(url);
            setComments((prevComments) => {
                const newComments = response.data.results.filter(
                    newComment => !prevComments.some(comment => comment.id === newComment.id) // Добавляем только новые комментарии
                );
                return [...prevComments, ...newComments];
            });
            setNextPage(response.data.next); // Устанавливаем ссылку на следующую страницу
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false); // Останавливаем загрузку
        }
    };

    useEffect(() => {
        fetchComments(); // Загружаем комментарии при монтировании компонента
    }, []);

    // WebSocket для получения новых комментариев в реальном времени
    
    const addReplyToTree = (comments, newReply) => {
        return comments.map(comment => {
            if (comment.id === newReply.parent) {
                // Если нашли родителя, добавляем подкомментарий
                return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply],
                };
            }
    
            // Если не нашли, проверяем вложенные комментарии
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
                    // Обновляем дерево комментариев рекурсивно
                    return addReplyToTree(prevComments, newComment);
                } else {
                    // Если это обычный комментарий, добавляем его в начало списка
                    if (prevComments.some(comment => comment.id === newComment.id)) {
                        return prevComments; // Не добавляем, если комментарий уже существует
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
    
        return () => ws.close(); // Закрываем WebSocket соединение при размонтировании компонента
    }, []);
    


    // Функция для загрузки следующей страницы комментариев
    const loadMoreComments = () => {
        if (nextPage) {
            fetchComments(nextPage);
        }
    };
    
    return (
        <div>
            <h1>Comments</h1>
            <CommentForm />
            <CommentList comments={comments}  fetchComments={fetchComments}/>
            {loading && <p>Loading...</p>} {/* Показываем текст "Loading..." при загрузке */}
            {nextPage && !loading && (
                <button onClick={loadMoreComments}>Load More</button> // Кнопка для подгрузки следующей страницы
            )}
        </div>
    );
};

export default App;
