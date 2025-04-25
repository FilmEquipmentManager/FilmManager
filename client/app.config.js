require("dotenv/config");

module.exports = ({ config }) => ({
    ...config,
    name: "Film Manager",
    slug: "film-manager",
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
    expo: {
        plugins: [
          [
            "expo-build-properties",
            {
              android: {
                kotlinVersion: "1.9.25"
              }
            }
          ]
        ]
    },
    ios: {
        ...config.ios,
        supportsTablet: true,
        bundleIdentifier: "com.sadliquid.Film-Manager",
    },
    android: {
        ...config.android,
        package: "com.sadliquid.filmmanager",
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
    extra: { // Add all .env variables here
        BASE_URL: process.env.BASE_URL,
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_DB_URL: process.env.FIREBASE_DB_URL,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_SENDER_ID: process.env.FIREBASE_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        eas: {
            projectId: "5e8d0969-0c7d-4b06-9727-1695c8156814"
        }
    },
});
