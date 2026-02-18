import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fittracker.app",
  appName: "FitTracker",
  webDir: "out",
  server: {
    androidScheme: "http",
    cleartext: true,
    allowNavigation: ["*"],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
