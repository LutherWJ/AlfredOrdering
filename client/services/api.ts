import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 3000,
    withCredentials: true
});

export default api;
