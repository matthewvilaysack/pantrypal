// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import { Platform } from "react-native"
import {
  Poppins_300Light as poppinsLight,
  Poppins_400Regular as poppinsRegular,
  Poppins_500Medium as poppinsMedium,
  Poppins_600SemiBold as poppinsSemiBold,
  Poppins_700Bold as poppinsBold,
} from "@expo-google-fonts/poppins"
import {
  Inter_300Light as interLight,
  Inter_400Regular as interRegular,
  Inter_500Medium as interMedium,
  Inter_600SemiBold as interSemiBold,
  Inter_700Bold as interBold,
} from "@expo-google-fonts/inter"

export const customFontsToLoad = {
  poppinsLight,
  poppinsRegular,
  poppinsMedium,
  poppinsSemiBold,
  poppinsBold,
  interLight,
  interRegular,
  interMedium,
  interSemiBold,
  interBold,
}

const fonts = {
  poppins: {
    light: "poppinsLight",
    normal: "poppinsRegular",
    medium: "poppinsMedium",
    semiBold: "poppinsSemiBold",
    bold: "poppinsBold",
  },
  inter: {
    light: "interLight",
    normal: "interRegular",
    medium: "interMedium",
    semiBold: "interSemiBold",
    bold: "interBold",
  },
}

export const typography = {
  fonts,
  
  // Primary font family
  primary: fonts.poppins,
  
  // Secondary font family
  secondary: fonts.inter,

  // Font sizes from style guide
  sizes: {
    h1: 64, // Heading 1
    h2: 40, // Heading 2
    h3: 24, // Heading 3
    h4: 20, // Paragraph
    body: 16, // Body text
    small: 14, // Small text
  },

  // Font weights
  weights: {
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },
}
