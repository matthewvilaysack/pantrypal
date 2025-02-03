import React, { FC, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, TextStyle, View } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackParamList } from "app/navigators"
import { Screen, Text, TextField, Button } from "app/components"
import { colors, spacing } from "app/theme"
import { useAuth } from "app/services/auth/useAuth"

interface SignInScreenProps extends NativeStackScreenProps<AppStackParamList, "Welcome"> {}

export const SignInScreen: FC<SignInScreenProps> = observer(function SignInScreen(props) {
  const { navigation } = props
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const auth = useAuth()

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      const result = await auth.signIn(email, password)
      if (result.error) {
        setError(result.error.message)
      }
      // After successful sign in, the AuthProvider will handle navigation
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError("An error occurred during sign in")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={$container}>
        <Text preset="heading" text="Sign In" style={$title} />
        
        {error ? <Text style={$error} text={error} /> : null}

        <TextField
          value={email}
          onChangeText={setEmail}
          containerStyle={$textField}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          editable={!isLoading}
        />

        <TextField
          value={password}
          onChangeText={setPassword}
          containerStyle={$textField}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry
          placeholder="Password"
          editable={!isLoading}
        />

        <Button
          text={isLoading ? "Signing In..." : "Sign In"}
          style={$button}
          preset="reversed"
          onPress={handleSignIn}
          disabled={isLoading}
        />
      </View>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.lg,
  justifyContent: "center",
}

const $title: TextStyle = {
  marginBottom: spacing.xl,
  textAlign: "center",
}

const $textField: ViewStyle = {
  marginBottom: spacing.lg,
}

const $button: ViewStyle = {
  marginTop: spacing.md,
}

const $error: TextStyle = {
  color: colors.error,
  textAlign: "center",
  marginBottom: spacing.md,
}