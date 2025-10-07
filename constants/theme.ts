import { Platform } from 'react-native';

const tintEmerald = '#22c55e';
const blackMatte = '#0b0b0c';
const graphite = '#161617';
const slate = '#1f2022';

export const Colors = {
  light: {
    text: '#ECEDEE',
    background: blackMatte,
    tint: tintEmerald,
    icon: '#A1A1AA',
    tabIconDefault: '#8b8b90',
    tabIconSelected: tintEmerald,
  },
  dark: {
    text: '#ECEDEE',
    background: blackMatte,
    tint: tintEmerald,
    icon: '#9BA1A6',
    tabIconDefault: '#8b8b90',
    tabIconSelected: tintEmerald,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
