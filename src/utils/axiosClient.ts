import axios from "axios";
import { MOCK_USER_ACCESS_TOKEN, TEKNIX_USER_ACCESS_TOKEN } from "@/utils/constants";

const axiosClient = axios.create({
  timeout: 60000,
});

// Automatically attach Authorization header
axiosClient.interceptors.request.use((config) => {
  if (MOCK_USER_ACCESS_TOKEN) {
    config.headers.Authorization = `Bearer ${MOCK_USER_ACCESS_TOKEN}`;
  }
  if (TEKNIX_USER_ACCESS_TOKEN) {
    config.headers["X-Proxy-Authorization"] = `Bearer ${TEKNIX_USER_ACCESS_TOKEN}`;
  }
  return config;
});

export default axiosClient;
