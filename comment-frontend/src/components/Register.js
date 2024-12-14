import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import styles from "./Register.module.css"; // Подключаем стили

const Register = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            const response = await api.post("/auth/register/", {
                username,
                password,
                email,
            });
            setSuccess(response.data.message);
            setTimeout(() => navigate("/login"), 2000); // Перенаправление на логин
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2>Register</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.input}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                    />
                    <button type="submit" className={styles.button}>Register</button>
                </form>
                {error && <p className={styles.errormessage}>{error}</p>}
                {success && <p className={styles.successmessage}>{success}</p>}
            </div>
        </div>
    );
};

export default Register;
