import axios from "axios";
import { ACCESS_TOKEN, PROXY_ACCESS_TOKEN } from "@/utils/constants";

const axiosClient = axios.create();

axiosClient.interceptors.request.use((config) => {
  if (ACCESS_TOKEN) {
    config.headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }

  const localProxyToken = localStorage.getItem("access_token");
  if (localProxyToken) {
    config.headers["X-Proxy-Authorization"] = `Bearer ${localProxyToken}`;
  }
  else if (PROXY_ACCESS_TOKEN) {
    config.headers["X-Proxy-Authorization"] = `Bearer ${PROXY_ACCESS_TOKEN}`;
  }

  return config;
});

export default axiosClient;
