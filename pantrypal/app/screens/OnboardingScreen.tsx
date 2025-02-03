import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, TextStyle } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackParamList } from "app/navigators"
import { Screen, Text, Button } from "app/components"
import { colors, spacing } from "app/theme"
import { useStores } from "app/models"

interface OnboardingScreenProps extends NativeStackScreenProps<AppStackParamList, "Onboarding"> {}

export const OnboardingScreen: FC<OnboardingScreenProps> = observer(function OnboardingScreen(props) {
  const { navigation } = props
  const { userPreferencesStore } = useStores()

  const handleComplete = () => {
    userPreferencesStore.setProp("onboardingCompleted", true)
    navigation.replace("Home")
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={$screenContentContainer}
      style={$root}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={$content}>
        <Text preset="heading" text="Welcome to PantryPal" style={$title} />
        <Text
          text="Help us understand your preferences to provide better food recommendations."
          style={$description}
        />
        <Button
          text="Get Started"
          style={$button}
          onPress={handleComplete}
        />
      </View>
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $content: ViewStyle = {
  flex: 1,
  padding: spacing.lg,
  justifyContent: "center",
  alignItems: "center",
}

const $title: TextStyle = {
  fontSize: 28,
  textAlign: "center",
  marginBottom: spacing.sm,
}

const $description: TextStyle = {
  fontSize: 16,
  textAlign: "center",
  marginBottom: spacing.xl,
  color: colors.textDim,
}

const $button: ViewStyle = {
  minWidth: 200,
} 