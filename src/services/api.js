import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE THIS WITH YOUR IP ADDRESS IF TESTING ON PHONE
const BASE_URL = 'https://attendanceapp-backend-server.onrender.com/api'; 

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;