import React, { useState, useEffect, useContext } from 'react';
import DOMPurify from 'dompurify'; // XSS protection
import Modal from 'react-modal'; // Modal for image viewing
import styles from './CommentList.module.css'; // Connecting styles
import CommentForm from './CommentForm';
import AuthContext from './AuthContext';

const CommentList = () => {
    const [expandedComment, setExpandedComment] = useState(null); // State for expanded comment
    const [activeReplyForm, setActiveReplyForm] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [modalImage, setModalImage] = useState(null); // State for modal image
    const {logout, comments, currentPage, setCurrentPage, setSortField, setSortOrder, sortOrder, nextPage, prevPage, } = useContext(AuthContext);

    useEffect(() => {
        setIsLoading(false); // Simulating the completion of the download
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

    const openModal = (imageUrl) => {
        setModalImage(imageUrl);
    };

    const closeModal = () => {
        setModalImage(null);
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
                        <img
                            src={comment.image}
                            alt="Attachment"
                            className={styles.image}
                            onClick={() => openModal(comment.image)}
                        />
                    </div>
                )}
                {comment.file && (
                    <div className={styles.commentFile}>
                        <a href={comment.file} download>
                            Download File
                        </a>
                    </div>
                )}

                {/* Button to show/hide answers */}
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

                {/* "Reply" button and form for adding a reply */}
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
            {/* Exit button */}
            <div className={styles.header}>
                {/* Top */}
                <h1 className={styles.title}>Comments</h1>

                {/* Button exit */}
                <button className={styles.logoutButton} onClick={logout}>
                    Logout
                </button>
            </div>

            {/* Sorting */}
            <div className={styles.sortSection}>
                <span>Sort by:</span>
                <button onClick={() => handleSort("username")} className={styles.sortButton}>
                    Username
                </button>
                <button onClick={() => handleSort("email")} className={styles.sortButton}>
                    Email
                </button>
                <button onClick={() => handleSort("created_at")} className={styles.sortButton}>
                    Date
                </button>
            </div>

            {/* List of comments */}
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

            {/* Modal for viewing image */}
            {modalImage && (
                <Modal
                    isOpen={true}
                    onRequestClose={closeModal}
                    contentLabel="Image Modal"
                    className={styles.modal}
                    overlayClassName={styles.overlay}
                >
                    <img src={modalImage} alt="Full View" className={styles.modalImage} />
                    <button onClick={closeModal} className={styles.closeButton}>Close</button>
                </Modal>
            )}
        </div>
    );
};

export default CommentList;
