module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", // <--- MUST BE HERE (In Presets)
    ],
    plugins: [
      "react-native-reanimated/plugin", // <--- MUST BE HERE (In Plugins)
    ],
  };
};