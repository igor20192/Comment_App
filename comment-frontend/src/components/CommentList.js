import React, { useState } from 'react';
import DOMPurify from 'dompurify'; // Защита от XSS
import styles from './CommentList.module.css'; // Подключение стилей

const CommentList = ({ comments }) => {
    const [sortField, setSortField] = useState('created_at'); // Поле сортировки
    const [sortOrder, setSortOrder] = useState('desc'); // Порядок сортировки
    const [currentPage, setCurrentPage] = useState(1); // Текущая страница
    const commentsPerPage = 25; // Количество комментариев на странице

    // Сортировка комментариев
    const sortComments = (comments) => {
        const sortedComments = [...comments];
        sortedComments.sort((a, b) => {
            const fieldA = a[sortField]?.toLowerCase?.() || a[sortField];
            const fieldB = b[sortField]?.toLowerCase?.() || b[sortField];

            if (sortOrder === 'asc') {
                return fieldA > fieldB ? 1 : -1;
            } else {
                return fieldA < fieldB ? 1 : -1;
            }
        });
        return sortedComments;
    };

    // Фильтрация только заглавных комментариев
    const topLevelComments = comments.filter((comment) => !comment.parent);

    // Пагинация
    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = sortComments(topLevelComments).slice(
        indexOfFirstComment,
        indexOfLastComment
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSort = (field) => {
        setSortField(field);
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className={styles.container}>
            <h1>Comments</h1>

            {/* Сортировка */}
            <div className={styles.sortButtons}>
                <button onClick={() => handleSort('username')}>Sort by Username</button>
                <button onClick={() => handleSort('email')}>Sort by Email</button>
                <button onClick={() => handleSort('created_at')}>Sort by Date</button>
            </div>

            {/* Список комментариев */}
            <div className={styles.commentList}>
                {currentComments.length === 0 ? (
                    <p>No comments available.</p>
                ) : (
                    currentComments.map((comment) => (
                        <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <strong>{comment.username}</strong>
                                <span className={styles.commentDate}>
                                    {new Date(comment.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div
                                className={styles.commentBody}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(comment.text),
                                }}
                            ></div>
                        </div>
                    ))
                )}
            </div>

            {/* Пагинация */}
            <div className={styles.pagination}>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>Page {currentPage}</span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={indexOfLastComment >= topLevelComments.length}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default CommentList;
