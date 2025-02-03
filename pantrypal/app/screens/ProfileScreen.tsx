import { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
import { Screen, Text } from "@/components"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { colors } from "@/theme"

interface ProfileScreenProps extends MainTabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  return (
    <Screen
      preset="scroll"
      contentContainerStyle={$screenContentContainer}
      style={$root}
      safeAreaEdges={["top"]}
    >
      <Text text="Profile" preset="heading" />
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
