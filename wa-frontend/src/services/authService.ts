import axios from 'axios';

const getBaseUrl = () => {
    if (typeof window !== "undefined" && (window as any).__API_BASE__) {
        return (window as any).__API_BASE__;
    }
    return '';
};

const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json', },
});

export const login = async (email: string, password: string) => {
    try {
        const response = await apiClient.post('/api/v1/auth/login', { email, password });
        // The Go backend returns { access_token, user }
        if (response.data && response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            return {
                status: true,
                data: response.data.user
            };
        }
        return { status: false, message: 'Invalid credentials' };
    } catch (error: any) {
        if (error.response && error.response.data) {
            return { status: false, message: error.response.data.error || 'Login gagal' };
        }
        return { status: false, message: 'Koneksi ke server gagal' };
    }
};
