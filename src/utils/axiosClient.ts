import axios from "axios";
import { TEKNIX_USER_ACCESS_TOKEN } from "@/utils/constants";

const axiosClient = axios.create({
  timeout: 60000,
});

// Automatically attach Authorization header
axiosClient.interceptors.request.use((config) => {
  if (TEKNIX_USER_ACCESS_TOKEN) {
    config.headers.Authorization = `Bearer ${TEKNIX_USER_ACCESS_TOKEN}`;
  }
  return config;
});

export default axiosClient;
