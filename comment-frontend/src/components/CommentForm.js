import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CommentForm.module.css";
import DOMPurify from "dompurify";
import api from "./api";

const CommentForm = (parentId = null) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        homepage: "",
        text: "",
        captcha: "",
        image: null,
        file: null,
    });
    const [captchaImage, setCaptchaImage] = useState("");
    const [captchaKey, setCaptchaKey] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [fileError, setFileError] = useState("");
    const [previewHTML, setPreviewHTML] = useState("");

    const fetchCaptcha = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/captcha/");
            setCaptchaImage(response.data.image);
            setCaptchaKey(response.data.key);
        } catch (error) {
            console.error("Error fetching CAPTCHA:", error);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
    
        if (name === "image") {
            const file = files[0];
            if (file) {
                // Checking the file format
                const validFormats = ["image/jpeg", "image/png", "image/gif"];
                if (!validFormats.includes(file.type)) {
                    setFileError("Изображение должно быть в формате JPG, PNG или GIF.");
                    return;
                }
                // Checking image dimensions
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const { width, height } = img;
                    if (width > 320 || height > 240) {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
    
                        const scale = Math.min(320 / width, 240 / height);
                        canvas.width = width * scale;
                        canvas.height = height * scale;
    
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob((blob) => {
                            const resizedImage = new File([blob], file.name, { type: file.type });
                            setFormData({ ...formData, image: resizedImage });
                            setFileError("");
                        }, file.type);
                    } else {
                        setFormData({ ...formData, image: file });
                        setFileError("");
                    }
                };
            }
        } else if (name === "file") {
            const file = files[0];
            if (file) {
                // Checking the file format
                if (file.type !== "text/plain") {
                    setFileError("Текстовый файл должен быть в формате TXT.");
                    return;
                }
                // Check file size
                if (file.size > 100 * 1024) {
                    setFileError("Размер текстового файла не должен превышать 100 КБ.");
                    return;
                }
                setFormData({ ...formData, file });
                setFileError("");
            }
        } else {
            setFormData({ ...formData, [name]: value });
            if (name === "text") {
                setPreviewHTML(parseBBCode(value));
            }
        }
    };
    

    const handleInsertTag = (tag) => {
        const textarea = document.querySelector(`textarea[name="text"]`);
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // We get the text before and after the selected one
        const before = formData.text.substring(0, start);
        const selected = formData.text.substring(start, end);
        const after = formData.text.substring(end);

        // Wrap the selected text in tags
        const newText = `${before}[${tag}]${selected}[/${tag}]${after}`;
        setFormData({ ...formData, text: newText });
        setPreviewHTML(parseBBCode(newText)); 

        // Return focus and cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length + 2, end + tag.length + 2);
        }, 0);
    };

    const parseBBCode = (text) => {
        const rawHTML = text
            .replace(/\[strong\](.*?)\[\/strong\]/g, "<strong>$1</strong>")
            .replace(/\[i\](.*?)\[\/i\]/g, "<i>$1</i>")
            .replace(/\[code\](.*?)\[\/code\]/g, "<code>$1</code>")
            .replace(/\[a\](.*?)\[\/a\]/g, '<a href="$1">$1</a>');
       
        return DOMPurify.sanitize(rawHTML, {
            ALLOWED_TAGS: ['a', 'strong', 'i', 'code'],
            ALLOWED_ATTR: ['href', 'target', 'rel']
        });
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append("username", formData.username);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("homepage", formData.homepage);
        console.log(parseBBCode(formData.text))
        formDataToSend.append("text", parseBBCode(formData.text));
        formDataToSend.append("captcha_key", captchaKey);
        formDataToSend.append("captcha_text", formData.captcha);
        if (parentId && parentId.parentId) {
            formDataToSend.append("parent", parentId.parentId);
        }
        if (formData.image) formDataToSend.append("image", formData.image);
        if (formData.file) formDataToSend.append("file", formData.file);

        try {
            await api.post("/comments/", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            fetchCaptcha();
            setFormData({
                username: "",
                email: "",
                homepage: "",
                text: "",
                captcha: "",
                image: null,
                file: null,
            });
            setErrorMessage("");
            setFileError("");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                const errors = error.response.data;
                let message = "Ошибка при отправке формы. Проверьте введённые данные.";
                if (errors.captcha_text) {
                    message = "Введённый текст капчи неверный. Проверьте ввод и попробуйте снова.";
                } else if (errors.username) {
                    message = errors.username.join(", ");
                } else if (errors.email) {
                    message = errors.email.join(", ");
                } else {
                    message = "Ошибка при отправке формы. Проверьте введённые данные.";
                }
                setErrorMessage(message);
                fetchCaptcha();
            } else {
                console.error("Error submitting comment:", error.response?.data || error);
                setErrorMessage("Произошла ошибка при отправке. Попробуйте позже.");
            }
        }
    };

    return (
    <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
            <input
                type="text"
                name="username"
                placeholder="Username"
                required
                onChange={handleChange}
                value={formData.username}
                className={styles.input}
            />
            <input
                type="email"
                name="email"
                placeholder="Email"
                required
                onChange={handleChange}
                value={formData.email}
                className={styles.input}
            />
            <input
                type="url"
                name="homepage"
                placeholder="Homepage (optional)"
                onChange={handleChange}
                value={formData.homepage}
                className={styles.input}
            />
            <div className={styles.toolbar}>
                <button type="button" onClick={() => handleInsertTag("i")}>
                    [i]
                </button>
                <button type="button" onClick={() => handleInsertTag("strong")}>
                    [strong]
                </button>
                <button type="button" onClick={() => handleInsertTag("code")}>
                    [code]
                </button>
                <button type="button" onClick={() => handleInsertTag("a")}>
                    [a]
                </button>
            </div>
            <textarea
                id="comment-text"
                name="text"
                placeholder="Comment"
                required
                onChange={handleChange}
                value={formData.text}
                className={styles.textarea}
            ></textarea>
            <div className={styles.captchaContainer}>
                <img src={`http://localhost:8000${captchaImage}`} alt="CAPTCHA" className={styles.captchaImage} />
                <input
                    type="text"
                    name="captcha"
                    placeholder="Enter CAPTCHA"
                    required
                    onChange={handleChange}
                    value={formData.captcha}
                    className={styles.input}
                />
                <small className={styles.hint}>
                    Пожалуйста, введите текст с изображения. Учитывайте регистр символов.
                </small>
            </div>
            <div>
                <label htmlFor="image" className={styles.fileLabel}>Загрузите изображение:</label>
                <input
                    type="file"
                    name="image"
                    accept="image/*"
                    id="image"
                    onChange={handleChange}
                    className={styles.fileInput}
                />
            </div>
            <div>
                <label htmlFor="file" className={styles.fileLabel}>Загрузите текстовый файл (.txt):</label>
                <input
                    type="file"
                    name="file"
                    accept=".txt"
                    id="file"
                    onChange={handleChange}
                    className={styles.fileInput}
                />
            </div>
            {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            {fileError && <p className={styles.errorMessage}>{fileError}</p>}
            <button type="submit" className={styles.button}>Submit</button>
        </form>
        <div className={styles.preview}>
            <h2>Preview</h2>
            <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
        </div>
    </div>    
    );
};

export default CommentForm;
