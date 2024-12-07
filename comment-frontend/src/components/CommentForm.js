import React, { useState, useEffect } from "react";
import axios from "axios";

const CommentForm = ({ onCommentAdded }) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        homepage: "",
        text: "",
        captcha: "",
    });
    const [captchaImage, setCaptchaImage] = useState("");
    const [captchaKey, setCaptchaKey] = useState("");
    const [errorMessage, setErrorMessage] = useState(""); // Для отображения ошибки

    // Функция для загрузки CAPTCHA
    const fetchCaptcha = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/captcha/");
            setCaptchaImage(response.data.image);
            setCaptchaKey(response.data.key);
        } catch (error) {
            console.error("Error fetching CAPTCHA:", error);
        }
    };

    // Загружаем CAPTCHA при загрузке компонента
    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:8000/api/comments/", {
                ...formData,
                captcha_key: captchaKey,
                captcha_text: formData.captcha,
            });
            onCommentAdded(response.data);

            // После успешной отправки комментария сбрасываем форму и обновляем CAPTCHA
            fetchCaptcha();
            setFormData({ username: "", email: "", homepage: "", text: "", captcha: "" });
            setErrorMessage(""); // Сбрасываем сообщение об ошибке
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setErrorMessage("CAPTCHA введена неверно. Попробуйте снова."); // Устанавливаем сообщение об ошибке
                fetchCaptcha(); // Обновляем CAPTCHA
            } else {
                console.error("Error submitting comment:", error.response?.data || error);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="username"
                placeholder="Username"
                required
                onChange={handleChange}
                value={formData.username}
            />
            <input
                type="email"
                name="email"
                placeholder="Email"
                required
                onChange={handleChange}
                value={formData.email}
            />
            <input
                type="url"
                name="homepage"
                placeholder="Homepage (optional)"
                onChange={handleChange}
                value={formData.homepage}
            />
            <textarea
                name="text"
                placeholder="Comment"
                required
                onChange={handleChange}
                value={formData.text}
            ></textarea>
            <div>
                <img src={`http://localhost:8000${captchaImage}`} alt="CAPTCHA" />
                <input
                    type="text"
                    name="captcha"
                    placeholder="Enter CAPTCHA"
                    required
                    onChange={handleChange}
                    value={formData.captcha}
                />
            </div>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            <button type="submit">Submit</button>
        </form>
    );
};

export default CommentForm;
