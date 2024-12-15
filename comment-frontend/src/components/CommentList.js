import React, { useState, useEffect, useContext } from 'react';
import DOMPurify from 'dompurify'; // Защита от XSS
import styles from './CommentList.module.css'; // Подключение стилей
import CommentForm from './CommentForm';
import AuthContext from './AuthContext';

const CommentList = () => {
    const [expandedComment, setExpandedComment] = useState(null); // Состояние для раскрытого комментария
    const [activeReplyForm, setActiveReplyForm] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const {logout, comments, currentPage, setCurrentPage, setSortField, setSortOrder, sortOrder, nextPage, prevPage, } = useContext(AuthContext);

    useEffect(() => {
        setIsLoading(false); // Симулируем завершение загрузки
    }, [comments]);

    const handleSort = (field) => {
        setSortField(field);
        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    const handlePageChange = (direction) => {
        if (direction === "next" && nextPage) {
            setCurrentPage((prev) => prev + 1);
        } else if (direction === "prev" && prevPage) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const renderComments = (comments, depth = 0) => {
        return comments.map((comment) => (
            <div
                key={comment.id}
                className={`${styles.comment} ${
                    expandedComment === comment.id ? styles.active : ""
                }`} 
                style={{ marginLeft: `${depth * 20}px` }}
            >
                <div className={styles.commentHeader}>
                    <strong>{comment.username}</strong>
                    <span className={styles.commentDate}>
                        {new Date(comment.created_at).toLocaleString()}
                    </span>
                </div>
                <div
                    className={`${styles.commentBody} ${
                        expandedComment === comment.id ? styles.expanded : ""
                    }`}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(comment.text),
                    }}
                    onClick={() =>
                        setExpandedComment(expandedComment === comment.id ? null : comment.id)
                    }
                ></div>

                {comment.image && (
                    <div className={styles.commentImage}>
                        <img src={comment.image} alt="Attachment" className={styles.image} />
                    </div>
                )}
                {comment.file && (
                    <div className={styles.commentFile}>
                        <a href={comment.file} download>
                            Download File
                        </a>
                    </div>
                )}

                {/* Кнопка для отображения/скрытия ответов */}
                {comment.replies && comment.replies.length > 0 && (
                    <button
                        className={styles.button}
                        onClick={() => toggleReplies(comment.id)}
                    >
                        {expandedReplies[comment.id] ? "Hide Replies" : "Show Replies"}
                    </button>
                )}

                <div
                    className={`${styles.replies} ${
                        expandedReplies[comment.id] ? styles.expanded : ""
                    }`}
                >
                    {expandedReplies[comment.id] &&
                        comment.replies &&
                        renderComments(comment.replies, depth + 1)}
                </div>

                {/* Кнопка "Reply" и форма для добавления ответа */}
                <button
                    className={styles.replyButton}
                    onClick={() =>
                        setActiveReplyForm(activeReplyForm === comment.id ? null : comment.id)
                    }
                >
                    {activeReplyForm === comment.id ? "Cancel" : "Reply"}
                </button>
                {activeReplyForm === comment.id && <CommentForm parentId={comment.id} />}
            </div>
        ));
    };

    return (
        <div className={styles.container}>
            {/* Кнопка выхода */}
            <div className={styles.logoutSection}>
                <button className={styles.logoutButton} onClick={logout}>
                    Logout
                </button>
            </div>

            <h1>Comments</h1>

            {/* Сортировка */}
            <div className={styles.sortButtons}>
                <button onClick={() => handleSort("username")}>Sort by Username</button>
                <button onClick={() => handleSort("email")}>Sort by Email</button>
                <button onClick={() => handleSort("created_at")}>Sort by Date</button>
            </div>

            {/* Список комментариев */}
            <div className={styles.commentList}>
                {isLoading ? <div className={styles.loader}></div> : renderComments(comments)}
            </div>

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

export default CommentList;
