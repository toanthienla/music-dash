import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const axiosClient = axios.create();

// Automatically attach Authorization header
axiosClient.interceptors.request.use((config) => {
  if (ACCESS_TOKEN) {
    config.headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }
  return config;
});

export default axiosClient;
