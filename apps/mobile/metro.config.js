const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo workspace
config.watchFolders = [workspaceRoot];

// 2. Let Metro search both project and workspace node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve a single singleton instance of core packages
const resolveSingleton = (pkgName) => path.dirname(require.resolve(`${pkgName}/package.json`));

config.resolver.extraNodeModules = {
  react: resolveSingleton('react'),
  'react-dom': resolveSingleton('react-dom'),
  'react-native': resolveSingleton('react-native'),
  'react-native-web': resolveSingleton('react-native-web'),
};

module.exports = config;
