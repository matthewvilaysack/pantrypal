const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#F4F4F4",
  neutral300: "#E0E0E0",
  neutral400: "#BDBDBD",
  neutral500: "#9E9E9E",
  neutral600: "#757575",
  neutral700: "#616161",
  neutral800: "#424242",

  primary100: "#E3F2FD",
  primary200: "#BBDEFB",
  primary300: "#90CAF9",
  primary400: "#64B5F6",
  primary500: "#6BC7CF", // Main brand color from the image
  primary600: "#42A5F5",
  primary700: "#1E88E5",
  primary800: "#1565C0",

  // Category colors from style guide
  vegetables100: "#DFFBEC",
  vegetables200: "#C5EED8",
  vegetables300: "#B5E1C7",
  vegetables400: "#94DOAC",
  vegetables500: "#AADBBE",

  meat100: "#FFE5E5",
  meat200: "#FFCCCC",
  meat300: "#FFBEBE", // Main meat color - light red
  meat400: "#FFB0B0",
  meat500: "#FFA1A1",

  dairy100: "#E5EEF1",
  dairy200: "#C5CAED",
  dairy300: "#B7CBCF",
  dairy400: "#B5DEE1",
  dairy500: "#95B1B7",

  fruit100: "#FFF9F0",
  fruit200: "#FFE8CC",
  fruit300: "#FFD9A9",
  fruit400: "#FFCB86",
  fruit500: "#FFB563",

  bakery100: "#F5E6DC",
  bakery200: "#E6D5C9",
  bakery300: "#D6C4B6",
  bakery400: "#C7B3A3",
  bakery500: "#B8A290",
} as const

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   */
  palette,

  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",

  /**
   * The default text color in many components.
   */
  text: palette.neutral800,

  /**
   * Secondary text information.
   */
  textDim: palette.neutral500,

  /**
   * The default color of the screen background.
   */
  background: palette.neutral100,

  /**
   * The default border color.
   */
  border: palette.neutral300,

  /**
   * The main tinting color.
   */
  tint: palette.primary500,

  /**
   * The default separator color.
   */
  separator: palette.neutral200,

  /**
   * Error messages and icons.
   */
  error: "#FF0000",

  /**
   * Button colors based on style guide
   */
  buttonBackground: palette.primary500,
  buttonText: palette.neutral100,
  buttonPressed: palette.primary600,
  buttonOutline: palette.primary500,

  /**
   * Category tag colors
   */
  categoryTag: {
    vegetables: {
      background: palette.vegetables300,
      text: palette.neutral800,
    },
    meat: {
      background: palette.meat300,
      text: palette.neutral800,
    },
    dairy: {
      background: palette.dairy300,
      text: palette.neutral800,
    },
    fruit: {
      background: palette.fruit300,
      text: palette.neutral800,
    },
    bakery: {
      background: palette.bakery300,
      text: palette.neutral800,
    },
  },
}
