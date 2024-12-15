import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api", // Replace with your address
    withCredentials: true, // Sending cookies, including HttpOnly
});

// Interceptor for automatic token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Token Renewal Request
                await axios.post(
                    "http://localhost:8000/api/token/refresh/",
                    {},
                    { withCredentials: true }
                );
                // Re-request after token refresh
                return api(originalRequest);
            } catch (refreshError) {
                // Handling update error
                console.error("Failed to refresh token", refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

