import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "development",
  entry: {
    code: "./src/code.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "dist/code.js",
    path: path.resolve(__dirname, "."),
    clean: false,
    libraryTarget: "var", // "var"に変更
    library: "buildPlugin", // ライブラリ名を指定
  },
  optimization: {
    minimize: false,
    runtimeChunk: false, // ランタイムチャンクを無効化
    splitChunks: false, // コード分割を無効化
  },
  target: "web", // "web"に変更
  devtool: false,
  watchOptions: {
    ignored: ["node_modules/**", "dist/**"],
  },
  performance: {
    hints: false,
  },
};
