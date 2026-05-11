import axios from 'axios';

const API = axios.create({
  baseURL: "https://ali295-digitalattendence.hf.space/api",
  withCredentials: true
});

export default API;