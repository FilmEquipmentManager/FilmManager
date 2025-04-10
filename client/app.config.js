require("dotenv/config");

module.exports = ({ config }) => ({
    ...config,
    name: "Film Manager",
    slug: "Film Manager",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        ...config.ios,
        supportsTablet: true,
        bundleIdentifier: "com.sadliquid.Film-Manager",
    },
    android: {
        ...config.android,
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.png",
            backgroundColor: "#ffffff",
        },
    },
    web: {
        ...config.web,
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png",
    },
    plugins: [
        "expo-router",
        "expo-font",
        [
            "expo-build-properties",
            {
                ios: {
                    newArchEnabled: true,
                },
                android: {
                    newArchEnabled: true,
                },
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
    },
    newArchEnabled: true,
    extra: {
        // Add all .env variables here
        BASE_URL: process.env.BASE_URL,
    },
});
