export const typography = {
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export type Typography = typeof typography;