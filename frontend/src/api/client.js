import axios from 'axios';
const api = axios.create({ baseURL: '/api', withCredentials: true });
export const errorMessage = (error) => error?.response?.data?.errors?.join(' ') || error?.response?.data?.message || 'Something went wrong. Please try again.';
export default api;
