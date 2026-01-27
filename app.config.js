/**
 * Expo App Configuration
 * 環境変数対応版
 *
 * 環境:
 * - development: 開発用（シミュレーター）
 * - preview: TestFlight/内部テスト用
 * - production: App Store リリース用
 */

const APP_ENV = process.env.APP_ENV || 'development';

const envConfig = {
  development: {
    name: 'JidaiScope (Dev)',
    apiUrl: 'http://localhost:3000',
  },
  preview: {
    name: 'JidaiScope (Preview)',
    apiUrl: 'https://preview-api.jidaiscope.app',
  },
  production: {
    name: 'JidaiScope',
    apiUrl: 'https://api.jidaiscope.app',
  },
};

const currentEnv = envConfig[APP_ENV] || envConfig.development;

export default ({ config }) => ({
  ...config,
  name: currentEnv.name,
  slug: 'JidaiScope',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'jidaiscope',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.kazuyakurashima.JidaiScope',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.kazuyakurashima.JidaiScope',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '42fcfc01-4290-4a3a-84df-8f6d3d4f94fb',
    },
    appEnv: APP_ENV,
    apiUrl: currentEnv.apiUrl,
  },
});
