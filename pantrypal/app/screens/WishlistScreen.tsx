import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackParamList } from "app/navigators"
import { Screen, Text } from "app/components"
import { colors } from "@/theme"

interface WishlistScreenProps extends NativeStackScreenProps<AppStackParamList, "Wishlist"> {}

export const WishlistScreen: FC<WishlistScreenProps> = observer(function WishlistScreen(props) {
  const { route } = props
  const initialView = route.params?.initialView || "wishlist"

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={$screenContentContainer}
      style={$root}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text text={`Wishlist Screen - ${initialView} view`} />
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $screenContentContainer: ViewStyle = {
  padding: 16,
} 