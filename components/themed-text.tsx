import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { colors, typography, isDark } = useTheme();

  // テーマに応じてカスタムカラーを選択
  // Dark mode: darkColor を優先、Light mode: lightColor を優先
  const getTextColor = () => {
    if (isDark) {
      return darkColor ?? lightColor ?? colors.text;
    }
    return lightColor ?? darkColor ?? colors.text;
  };
  const textColor = getTextColor();
  // リンク用のカラー
  const linkColor = colors.accent;

  // Typography トークンからスタイルを生成
  const getTypeStyle = () => {
    switch (type) {
      case 'title':
        return {
          fontSize: typography.size['5xl'],
          fontWeight: typography.weight.bold,
          lineHeight: typography.size['5xl'] * typography.lineHeight.tight,
        };
      case 'subtitle':
        return {
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          lineHeight: typography.size['2xl'] * typography.lineHeight.normal,
        };
      case 'defaultSemiBold':
        return {
          fontSize: typography.size.lg,
          lineHeight: typography.size.lg * typography.lineHeight.normal,
          fontWeight: typography.weight.semibold,
        };
      case 'link':
        return {
          fontSize: typography.size.lg,
          lineHeight: typography.size.lg * typography.lineHeight.relaxed,
        };
      case 'default':
      default:
        return {
          fontSize: typography.size.lg,
          lineHeight: typography.size.lg * typography.lineHeight.normal,
        };
    }
  };

  const typeStyle = getTypeStyle();
  const color = type === 'link' ? linkColor : textColor;

  return (
    <Text
      style={[
        { color },
        typeStyle,
        style,
      ]}
      {...rest}
    />
  );
}
