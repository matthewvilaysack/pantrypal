import { observer } from "mobx-react-lite"
import React from "react"
import { View, ViewStyle, TextStyle, ImageStyle, Pressable } from "react-native"
import { Button, Text, AutoImage } from "@/components"
import { colors, typography, spacing } from "@/theme"
import { Icon } from "./Icon"

export interface FamilyMember {
  id: string
  avatar: string
}

export interface FoodListItemProps {
  /**
   * Product image URL
   */
  imageUrl?: string
  /**
   * Product name
   */
  name: string
  /**
   * Product quantity
   */
  quantity: string
  /**
   * Family members who want this item
   */
  familyMembers?: FamilyMember[]
  /**
   * Callback when quantity is updated
   */
  onUpdateQuantity?: (newQuantity: string) => void
  /**
   * Callback when item is removed
   */
  onRemove?: () => void
  /**
   * Optional style override
   */
  style?: ViewStyle
}

/**
 * A reusable food list item component that displays product info and family members
 */
export const FoodListItem = observer(function FoodListItem(props: FoodListItemProps) {
  const { 
    imageUrl, 
    name, 
    quantity, 
    familyMembers = [], 
    onUpdateQuantity, 
    onRemove,
    style: $styleOverride 
  } = props

  return (
    <View style={[$container, $styleOverride]}>
      <View style={$itemContainer}>
        <View style={$itemLeftSection}>
          {imageUrl ? (
            <AutoImage source={{ uri: imageUrl }} style={$itemImage} />
          ) : (
            <View style={$itemImagePlaceholder}>
              <Icon icon="components" size={24} color={colors.palette.neutral400} />
            </View>
          )}
        </View>
        
        <View style={$itemMainContent}>
          <View style={$itemHeader}>
            <Text text={name} style={$itemTitle} />
            <View style={$actionButtons}>
              <Pressable onPress={onRemove} style={$removeButton}>
                <Icon icon="x" size={20} color={colors.palette.primary500} />
              </Pressable>
              <Pressable style={$addButton}>
                <Icon icon="heart" size={20} color={colors.palette.neutral100} />
              </Pressable>
            </View>
          </View>

          <View style={$bottomSection}>
            <View style={$familyMembersSection}>
              {familyMembers.length > 0 ? (
                familyMembers.map((member, index) => (
                  <View key={member.id} style={[$familyMemberAvatar, index > 0 && { marginLeft: -8 }]}>
                    <Icon icon="community" size={16} color={colors.palette.neutral400} />
                  </View>
                ))
              ) : (
                <View style={$familyMemberAvatar}>
                  <Icon icon="community" size={16} color={colors.palette.neutral400} />
                </View>
              )}
            </View>
            <Text text={`${quantity} dozen`} style={$quantityText} />
          </View>
        </View>
      </View>
    </View>
  )
})

const $container: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.md,
  shadowColor: colors.palette.primary500,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 4,
  marginVertical: spacing.xs,
  marginHorizontal: spacing.xs,
}

const $itemContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.md,
  backgroundColor: colors.palette.neutral100,
}

const $itemLeftSection: ViewStyle = {
  width: 48,
}

const $itemImage: ImageStyle = {
  width: 48,
  height: 48,
  borderRadius: 8,
}

const $itemImagePlaceholder: ViewStyle = {
  width: 48,
  height: 48,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
}

const $itemMainContent: ViewStyle = {
  flex: 1,
}

const $itemHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
}

const $itemTitle: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 16,
  color: colors.text,
}

const $actionButtons: ViewStyle = {
  flexDirection: "row",
  gap: spacing.xs,
}

const $removeButton: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.primary100,
  justifyContent: "center",
  alignItems: "center",
}

const $addButton: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.primary500,
  justifyContent: "center",
  alignItems: "center",
}

const $bottomSection: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $familyMembersSection: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $familyMemberAvatar: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 2,
  borderColor: colors.background,
}

const $quantityText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.textDim,
} 