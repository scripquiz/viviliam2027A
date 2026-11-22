import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fredfrank.viviliam',
  appName: 'Viviliam',
  webDir: 'www/browser',
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      // Match the white background of the splash artwork so letterboxing
      // and the Android 12+ system splash blend seamlessly
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash_icon',
      // Use FIT_CENTER for Android 11 and below to prevent stretching
      androidScaleType: 'FIT_CENTER',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#cc0000',
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: true,
    },
    // Updated EdgeToEdge configuration for Android 15 compatibility
    EdgeToEdgeSupport: {
      enabled: true,
      navigationBarMode: 'default',
      statusBarMode: 'insetsByTopMargin',
      statusBarOverlay: false,
    },
    // Remove or minimize StatusBar plugin to avoid deprecated APIs
    // StatusBar: {
    //   backgroundColor: "#FFFFFF",
    //   style: "dark",
    //   overlaysWebView: false
    // },
    // Network plugin configuration
    Network: {
      // Actively detect network changes
      enableNetworkEvent: true,
      // Detect slow connections
      monitorConnectionType: true,
    },
    // Configure keyboard plugin for better non-Latin (Tamil) input support
    Keyboard: {
      // Empty config to avoid TypeScript errors
    },
  },
  server: {
    // Optimize API requests for different network conditions
    androidScheme: 'https',
    // Enable proper caching mechanisms
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    // Change this to false to improve Tamil keyboard input
    captureInput: false,
    webContentsDebuggingEnabled: true,
    // Android build configuration
    buildOptions: {
      keystorePath: '../viviliam-key.keystore',
      keystoreAlias: 'key0',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
    // Optimize iOS network handling
    preferredContentMode: 'mobile',
  },
};

export default config;
