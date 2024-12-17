import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Box, Grid, Paper } from "@mui/material";


const Home = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ flexGrow: 1, textAlign: "center", padding: 4, minHeight: "100vh" }}>
            <Grid container spacing={3} alignItems="center" justifyContent="center">
                {/* Headline */}
                <Grid item xs={12}>
                    <Typography variant="h2" gutterBottom>
                        Welcome to CommentHub
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                        Share your thoughts and join the conversation!
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <img
                        src={`${process.env.REACT_APP_BASE_URL}/static/images/balloons-874837_1280.jpg`}
                        alt="Comments Illustration"
                        style={{ width: "100%", borderRadius: "8px" }}
                    />
                </Grid>

                {/* Login and registration */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
                        <Typography variant="h5" gutterBottom>
                            Get Started
                        </Typography>
                        <Typography variant="body1" color="textSecondary" gutterBottom>
                            To comment, log in or create a new account.
                        </Typography>

                        <Box sx={{ marginTop: 2, display: "flex", gap: 2, justifyContent: "center" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={() => navigate("/login")}
                            >
                                Log In
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="large"
                                onClick={() => navigate("/register")}
                            >
                                Register
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* CTA to scroll to comments */}
                <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Already logged in? Explore and share your thoughts now!
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        onClick={() => navigate("/comments")}
                    >
                        View Comments
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Home;
