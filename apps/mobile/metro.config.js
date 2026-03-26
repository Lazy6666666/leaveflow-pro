const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const convexRoot = path.resolve(projectRoot, "../../convex");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [convexRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
