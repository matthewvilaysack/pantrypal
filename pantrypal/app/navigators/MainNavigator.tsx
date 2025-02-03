import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { HomeScreen, WishlistScreen, GroceryListScreen, ProfileScreen, IngredientDetailsScreen, SchedulePickupScreen } from "@/screens"
import { colors } from "@/theme"
import { Icon } from "@/components"
import { NavigatorScreenParams } from "@react-navigation/native"
import type { CompositeScreenProps } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs"

export type HomeStackParamList = {
  Home: undefined
  IngredientDetails: { id: string }
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
}

export type MainTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>
  GroceryList: { initialView?: "grocery" | "wishlist" }
  Wishlist: { initialView: "wishlist" }
  Profile: undefined
}

export type AppStackParamList = {
  Welcome: undefined
  SignIn: undefined
  Onboarding: undefined
  Main: NavigatorScreenParams<MainTabParamList>
}

const Stack = createNativeStackNavigator<HomeStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList>,
    NativeStackScreenProps<AppStackParamList>
  >
>

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IngredientDetails"
        component={IngredientDetailsScreen}
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="SchedulePickup"
        component={SchedulePickupScreen}
        options={{
          headerTitle: "Schedule Pickup",
          headerBackTitle: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
            fontSize: 24,
            fontWeight: "600",
          },
        }}
      />
    </Stack.Navigator>
  )
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.palette.primary500,
        tabBarInactiveTintColor: colors.palette.neutral500,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.separator,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Icon icon="components" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="GroceryList"
        component={GroceryListScreen}
        initialParams={{ initialView: "grocery" }}
        options={{
          title: "Grocery List",
          tabBarIcon: ({ color, size }) => <Icon icon="basket" color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.navigate("GroceryList", { initialView: "grocery" })
          },
        })}
      />
      <Tab.Screen
        name="Wishlist"
        component={GroceryListScreen}
        initialParams={{ initialView: "wishlist" }}
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => <Icon icon="heart" color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.navigate("GroceryList", { initialView: "wishlist" })
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon icon="components" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}
