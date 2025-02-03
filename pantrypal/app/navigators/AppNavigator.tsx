/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useColorScheme } from "react-native"
import { OnboardingScreen } from "app/screens/OnboardingScreen"
import { navigationRef } from "./navigationUtilities"
import { useAuth } from "app/services/auth/useAuth"
import { SignInScreen } from "@/screens"
import { MainNavigator } from "./MainNavigator"

export type AppStackParamList = {
  Welcome: undefined
  SignIn: undefined
  Onboarding: undefined
  Main: undefined
  Home: undefined
  SchedulePickup: {
    foodBankId: string
    foodBank: {
      place_id: string
      name: string
      vicinity: string
      geometry: {
        location: {
          lat: number
          lng: number
        }
      }
      available_times: string[]
    }
  }
  IngredientDetails: { id: string }
  Wishlist: { initialView: "wishlist" | "grocery" }
  GroceryList: { initialView: "wishlist" | "grocery" }
}

export const AppStack = createNativeStackNavigator<AppStackParamList>()

interface NavigationProps extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = function AppNavigator(props: NavigationProps) {
  const colorScheme = useColorScheme()
  const { user, isOnboarded } = useAuth()

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      {...props}
    >
      <AppStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={user ? (isOnboarded ? "Main" : "Onboarding") : "SignIn"}
      >
        {!user ? (
          <>
            <AppStack.Screen name="SignIn" component={SignInScreen} />
          </>
        ) : !isOnboarded ? (
          <AppStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <AppStack.Screen name="Main" component={MainNavigator} />
          </>
        )}
      </AppStack.Navigator>
    </NavigationContainer>
  )
}
