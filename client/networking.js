import axios from "axios";
import Constants from "expo-constants";

const { BASE_URL } = Constants.expoConfig.extra;

const instance = axios.create({
    baseURL: BASE_URL,
});

instance.interceptors.request.use(
    (config) => {
        config.headers["content-type"] = "application/json";
        config.headers["ngrok-skip-browser-warning"] = "true";

        return config;
    },
    (err) => Promise.reject(err)
);

export default instance;