import axios from 'axios';

// Ye line check karegi ke app browser mein localhost par chal rahi hai ya nahi
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API = axios.create({
  baseURL: isLocalhost 
    ? "http://localhost:3000/api" 
    : "https://ali295-digitalattendence.hf.space/api",
  withCredentials: true
});

export default API;