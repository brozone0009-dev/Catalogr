import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.catalogr.owner',
  appName: 'Catalogr Owner',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
