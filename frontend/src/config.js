const getApiUrl = () => {
    if (import.meta.env.VITE_API_HOST) {
        return `https://${import.meta.env.VITE_API_HOST}`;
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const API_URL = getApiUrl();
