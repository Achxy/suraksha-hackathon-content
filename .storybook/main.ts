import { StorybookConfig } from "@storybook/react-vite";

const STORYBOOK_PART_DIR = process.env.STORYBOOK_PART_DIR || "parts/part-1";

const staticDirs: string[] = [];
const publicDir = `../${STORYBOOK_PART_DIR}/public`;
staticDirs.push(publicDir);

const config: StorybookConfig = {
  stories: [
    `../${STORYBOOK_PART_DIR}/**/*.mdx`,
    `../${STORYBOOK_PART_DIR}/**/*.stories.@(js|jsx|mjs|ts|tsx)`,
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@chromatic-com/storybook",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  features: {
    hideFrameworkChrome: true,
  },
  staticDirs,
  viteFinal: async (config) => {
    config.base = "./";
    return config;
  },
};

export default config;
