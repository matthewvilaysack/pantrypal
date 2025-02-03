import * as React from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Text } from "./Text"
import { colors, spacing } from "@/theme"

type CategoryType = "vegetables" | "meat" | "dairy" | "fruit" | "bakery"

export interface CategoryTagProps {
  /**
   * The category text to display
   */
  category: CategoryType
  /**
   * An optional style override for the container
   */
  style?: ViewStyle
  /**
   * An optional style override for the text
   */
  textStyle?: TextStyle
}

/**
 * A reusable category tag component that displays a category in a styled container
 */
export function CategoryTag(props: CategoryTagProps) {
  const { category, style: $styleOverride, textStyle: $textStyleOverride } = props

  const categoryStyle = React.useMemo(() => {
    const categoryColors = colors.categoryTag[category] || colors.categoryTag.vegetables
    return {
      backgroundColor: categoryColors.background,
      color: categoryColors.text,
    }
  }, [category])

  return (
    <View style={[$categoryTag, { backgroundColor: categoryStyle.backgroundColor }, $styleOverride]}>
      <Text 
        text={category} 
        style={[$categoryText, { color: categoryStyle.color }, $textStyleOverride]} 
      />
    </View>
  )
}

const $categoryTag: ViewStyle = {
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: spacing.md,
  alignSelf: "flex-start",
}

const $categoryText: TextStyle = {
  fontSize: 12,
  textTransform: "lowercase",
} 