import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { colors, fonts, fontWeights } from '@/shared/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ style, lightColor, darkColor, type = 'default', ...rest }: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color, fontFamily: fonts?.sans },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  },
  title: {
    fontSize: 32,
    fontWeight: fontWeights.black,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: fontWeights.black,
  },
  link: {
    lineHeight: 24,
    fontSize: 15,
    color: colors.riovoley.gold,
  },
});
