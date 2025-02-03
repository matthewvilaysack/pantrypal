/** @type {import('@babel/core').TransformOptions} */
const plugins = [
  [
    "@babel/plugin-proposal-decorators",
    {
      legacy: true,
    },
  ],
  "transform-inline-environment-variables",
  [
    "react-native-reanimated/plugin",
    {
      globals: ["__scanCodes"],
      relativeSourceLocation: true,
    },
  ],
]

module.exports = {
  presets: ["babel-preset-expo"],
  plugins: plugins,
  env: {
    production: {
      plugins: ["react-native-paper/babel"],
    },
  },
}
