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
  const { colors, typography } = useTheme();

  // カスタムカラーまたはテーマのテキストカラーを使用
  const textColor = lightColor || darkColor || colors.text;
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
