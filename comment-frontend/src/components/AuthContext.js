import React, { createContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [comments, setComments] = useState([]);
    const [sortField, setSortField] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);  
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // New state to load

    useEffect(() => {
        const refreshToken = async () => {
            try {
                const response = await api.post("/token/refresh/", {}, { withCredentials: true });
                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Failed to refresh token", error);
                setIsAuthenticated(false);
            }
        };
    
        const interval = setInterval(refreshToken, 4 * 60 * 1000); // We update every 4 minutes
        return () => clearInterval(interval);
    }, []);
    
    

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get("/auth/check/");
                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false); // Finishing the download
            }
        };

        checkAuth();
    }, []);
    
    
    useEffect(() => {

             // Loading comments
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

        if (isAuthenticated) {
        fetchComments(currentPage);}
        else {
            setComments([]);
        }
    }, [currentPage, sortField, sortOrder, isAuthenticated]);


    useEffect(() => {

                 // WebSocket for real time
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

    const login = async (username, password) => {
        try {
            await api.post("/auth/login/", { username, password });
            setIsAuthenticated(true);
        } catch (error) {
            throw new Error("Invalid credentials");
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout/");
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };  

    return (
        <AuthContext.Provider value={{ isAuthenticated,
            loading,
            login,
            logout,
            comments,
            setSortField,
            setSortOrder,
            sortOrder,
            setCurrentPage,
            nextPage,
            prevPage,
            currentPage }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
