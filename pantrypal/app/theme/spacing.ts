/**
 * Spacing values from the design system
 */
export const spacing = {
  xxxs: 2,  // Micro spacing
  xxs: 4,   // Tiny spacing
  xs: 8,    // Extra small spacing
  sm: 12,   // Small spacing
  md: 16,   // Medium spacing
  lg: 24,   // Large spacing
  xl: 32,   // Extra large spacing
  xxl: 48,  // Huge spacing
  xxxl: 64, // Giant spacing
  extraLarge: 40,
} as const

export type Spacing = keyof typeof spacing
