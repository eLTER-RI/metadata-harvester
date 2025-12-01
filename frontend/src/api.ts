import axios from 'axios';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return 'http://localhost:3000/api';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});
