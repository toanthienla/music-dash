import axios from "axios";
// import { ACCESS_TOKEN, PROXY_ACCESS_TOKEN } from "@/utils/constants";

const axiosClient = axios.create();

axiosClient.interceptors.request.use((config) => {
  const localAccessToken = localStorage.getItem("access_token");
  if (localAccessToken) {
    config.headers.Authorization = `Bearer ${localAccessToken}`;
  }

  // Uncomment the following lines if you want to use a proxy token from local storage or environment variable
  // config.headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  // const localProxyToken = localStorage.getItem("access_token");
  // if (localProxyToken) {
  //   config.headers["X-Proxy-Authorization"] = `Bearer ${localProxyToken}`;
  // } else if (PROXY_ACCESS_TOKEN) {
  //   config.headers["X-Proxy-Authorization"] = `Bearer ${PROXY_ACCESS_TOKEN}`;
  // }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");

      // Redirect to signin
      window.location.href = "/signin";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
