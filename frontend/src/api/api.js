import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ali295-digitalattendence.hf.space/api' || "http://localhost:3000/api" ,
  withCredentials: true
});

export default API;