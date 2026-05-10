import axios from 'axios';

const API = axios.create({
  // Purana localhost wala link hata kar naya Vercel link dalein
  baseURL: "https://digital-attendance-system-5acs.vercel.app/api", 
  withCredentials: true // Ye cookies ke liye lazmi hai
});

export default API;