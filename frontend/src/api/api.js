import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://digital-attendance-system-5acs.vercel.app/api",
  withCredentials: true
});

export default API;