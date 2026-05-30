module.exports = {
  "expo": {
    "name": "househunt",
    "slug": "nest",
    "scheme": "nest-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FAF8F5"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.nest.househunt",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "config": {
        "googleMaps": {
          "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-font",
      "expo-router",
      "expo-secure-store",
      "expo-video"
    ],
    "extra": {
      "router": {},
      "eas": {
        "projectId": "71597021-6851-4e7e-9751-e8a07b54bcbd"
      }
    }
  }
}
