import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommentForm = ({ onCommentAdded }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        homepage: '',
        text: '',
        captcha: '',
        captchaKey: '',
    });

    const [captchaImage, setCaptchaImage] = useState(null);

    const fetchCaptcha = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/captcha/');
            const { key, image } = response.data;
            setFormData((prev) => ({ ...prev, captchaKey: key }));
            setCaptchaImage(image);
        } catch (error) {
            console.error('Error fetching CAPTCHA:', error);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/api/comments/', formData);
            onCommentAdded(response.data);
            setFormData({ username: '', email: '', homepage: '', text: '', captcha: '', captchaKey: '' });
            fetchCaptcha(); // обновить CAPTCHA
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };
    console.log("Captcha image URL:", captchaImage);
    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Username" required onChange={handleChange}
                   value={formData.username} />
            <input type="email" name="email" placeholder="Email" required onChange={handleChange}
                   value={formData.email} />
            <input type="url" name="homepage" placeholder="Homepage (optional)" onChange={handleChange}
                   value={formData.homepage} />
            <textarea name="text" placeholder="Comment" required onChange={handleChange}
                   value={formData.text}></textarea>
            {captchaImage && <img src={`http://localhost:8000${captchaImage}`} alt="CAPTCHA" />
        }
            <input type="text" name="captcha" placeholder="Enter CAPTCHA" required onChange={handleChange}
                   value={formData.captcha} />
            <button type="submit">Submit</button>
        </form>
    );
};

export default CommentForm;
