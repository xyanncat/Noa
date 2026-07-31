const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration for the conventional React Native Android app.
 * https://reactnative.dev/docs/metro
 *
 * In npm workspaces, Metro must watch the workspace root so hoisted node_modules
 * (like @babel/runtime) and shared dependencies are properly resolved.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
