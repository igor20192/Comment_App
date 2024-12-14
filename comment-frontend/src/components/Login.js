import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "./AuthContext";
import { Link } from "react-router-dom";
import styles from "./Login.module.css"; // Подключение module.css

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate("/comments");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>Login</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                    />
                    <button type="submit" className={styles.button}>
                        Login
                    </button>
                </form>
                {error && <p className={styles.error}>{error}</p>}
                <p className={styles.registerLink}>
                    Don't have an account?{" "}
                    <Link to="/register" className={styles.link}>
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
