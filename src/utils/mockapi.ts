import axios from "axios";
import { MOCK_USER_ACCESS_TOKEN } from "./constants";

const axiosClient = axios.create();

// Automatically attach Authorization header
axiosClient.interceptors.request.use((config) => {
  if (MOCK_USER_ACCESS_TOKEN) {
    config.headers.Authorization = `Bearer ${MOCK_USER_ACCESS_TOKEN}`;
  }
  return config;
});

export default axiosClient;
