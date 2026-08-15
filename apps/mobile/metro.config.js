const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Root of the monorepo
const workspaceRoot = path.resolve(__dirname, '../../');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve from project root first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force a single copy of React and core renderers from workspace root
// This prevents the "Invalid hook call" / "mismatching React versions" crash
const rootModules = path.resolve(workspaceRoot, 'node_modules');
config.resolver.extraNodeModules = {
  'react': path.resolve(rootModules, 'react'),
  'react-dom': path.resolve(rootModules, 'react-dom'),
  'react-native': path.resolve(rootModules, 'react-native'),
  'react-native-web': path.resolve(rootModules, 'react-native-web'),
};

module.exports = config;
