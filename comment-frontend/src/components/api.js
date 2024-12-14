import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api", // Замените на ваш адрес
    withCredentials: true, // Отправка cookies, включая HttpOnly
});

// Перехватчик для автоматического обновления токенов
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Запрос на обновление токена
                await axios.post(
                    "http://localhost:8000/api/token/refresh/",
                    {},
                    { withCredentials: true }
                );
                // Повторный запрос после обновления токена
                return api(originalRequest);
            } catch (refreshError) {
                // Обработка ошибки обновления
                console.error("Failed to refresh token", refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

