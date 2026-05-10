import axios from 'axios';

const API = axios.create({
  baseURL: 'http://192.168.100.67:3000/api', 
  withCredentials: true // <--- Sabse important line
});

// Yeh line extra surety ke liye add karein
API.defaults.withCredentials = true;

export default API;