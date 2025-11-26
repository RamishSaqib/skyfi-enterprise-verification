const getApiUrl = () => {
    if (import.meta.env.VITE_API_HOST) {
        return `https://${import.meta.env.VITE_API_HOST}`;
    }
    return import.meta.env.VITE_API_URL || 'https://skyfi-verification-backend.onrender.com';
};

export const API_URL = getApiUrl();
