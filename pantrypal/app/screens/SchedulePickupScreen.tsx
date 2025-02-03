import React, { FC, useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { View, ViewStyle, TextStyle, ImageStyle, ActivityIndicator, Image, Linking, Alert } from "react-native"
import { Button, Screen, Text } from "@/components"
import { HomeStackScreenProps } from "@/navigators/MainNavigator"
import { colors, spacing } from "@/theme"
import { MapsApi } from "@/services/api/maps-api"
import { Api } from "@/services/api"

export const SchedulePickupScreen = observer(function SchedulePickupScreen(props: HomeStackScreenProps<"SchedulePickup">) {
  const { route } = props
  const { foodBank } = route.params
  const [selectedTime, setSelectedTime] = useState("")
  const [mapImage, setMapImage] = useState("")
  const [loading, setLoading] = useState(true)
  const mapsApi = new MapsApi(new Api())

  useEffect(() => {
    loadMapImage()
  }, [foodBank])

  const loadMapImage = async () => {
    try {
      const currentLocation = await mapsApi.getCurrentLocation()
      if (!currentLocation || currentLocation.error) {
        throw new Error("Could not get current location")
      }

      const { lat: destLat, lng: destLng } = foodBank.geometry.location
      const { lat: startLat, lng: startLng } = currentLocation

      // Get route coordinates from Mapbox Directions API
      const routeResponse = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${destLng},${destLat}?geometries=geojson&access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`
      )
      const routeData = await routeResponse.json()
      
      if (!routeData.routes?.[0]?.geometry?.coordinates) {
        throw new Error("Could not get route")
      }

      // Convert route coordinates to path string
      const path = routeData.routes[0].geometry.coordinates
        .map(coord => coord.join(","))
        .join(";")

      // Create static map URL with route path and markers
      const zoom = 12 // Slightly zoomed out to show more context
      const width = 600
      const height = 400
      
      // Use a simpler terrain style (light-v11) and add the route path
      const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/path-2+4A90E2(${path}),pin-s-a+00ff00(${startLng},${startLat}),pin-s-b+ff0000(${destLng},${destLat})/${(startLng + destLng)/2},${(startLat + destLat)/2},${zoom},0/${width}x${height}@2x?access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`
      
      setMapImage(url)
    } catch (error) {
      console.error("Error loading map image:", error)
      Alert.alert("Error", "Failed to load map with route")
    } finally {
      setLoading(false)
    }
  }

  const handleGetDirections = () => {
    const { lat, lng } = foodBank.geometry.location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    Linking.openURL(url)
  }

  const handleConfirmPickup = () => {
    if (!selectedTime) {
      Alert.alert("Error", "Please select a pickup time")
      return
    }
    // Handle pickup confirmation
    Alert.alert("Success", "Pickup scheduled successfully!")
  }

  return (
    <Screen preset="scroll" style={$root} contentContainerStyle={$container} safeAreaEdges={["bottom"]}>
      <View style={$mapContainer}>
        {loading ? (
          <ActivityIndicator style={$loading} />
        ) : (
          <Image source={{ uri: mapImage }} style={$map} resizeMode="cover" />
        )}
      </View>

      <View style={$content}>
        <View style={$addressContainer}>
          <Text text={foodBank.name} style={$name} />
          <Text text={foodBank.vicinity} style={$address} />
          <Button
            text="Get Directions"
            onPress={handleGetDirections}
            style={$directionsButton}
            preset="default"
          />
        </View>

        <View style={$timesContainer}>
          <Text text="Available Pickup Times" style={$sectionTitle} />
          <View style={$timesList}>
            {foodBank.available_times?.map((time) => (
              <Button
                key={time}
                text={time}
                onPress={() => setSelectedTime(time)}
                style={[
                  $timeButton,
                  selectedTime === time && $selectedTimeButton
                ]}
                textStyle={[
                  $timeButtonText,
                  selectedTime === time && $selectedTimeButtonText
                ]}
                preset="default"
              />
            ))}
          </View>
        </View>

        <Button
          text="Confirm Pickup"
          onPress={handleConfirmPickup}
          style={$confirmButton}
          preset={selectedTime ? "default" : "disabled"}
        />
      </View>
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $container: ViewStyle = {
  flex: 1,
}

const $mapContainer: ViewStyle = {
  height: 250,
  backgroundColor: colors.palette.neutral200,
}

const $map: ImageStyle = {
  width: "100%",
  height: "100%",
}

const $loading: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $content: ViewStyle = {
  flex: 1,
  padding: spacing.lg,
}

const $addressContainer: ViewStyle = {
  marginBottom: spacing.lg,
}

const $name: TextStyle = {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: spacing.xs,
}

const $address: TextStyle = {
  fontSize: 16,
  color: colors.textDim,
  marginBottom: spacing.md,
}

const $directionsButton: ViewStyle = {
  marginTop: spacing.xs,
}

const $timesContainer: ViewStyle = {
  marginBottom: spacing.xl,
}

const $sectionTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: spacing.md,
}

const $timesList: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
}

const $timeButton: ViewStyle = {
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.palette.neutral200,
  borderRadius: spacing.md,
  minWidth: 100,
}

const $selectedTimeButton: ViewStyle = {
  backgroundColor: colors.palette.primary100,
}

const $timeButtonText: TextStyle = {
  fontSize: 14,
  color: colors.text,
}

const $selectedTimeButtonText: TextStyle = {
  color: colors.palette.primary500,
  fontWeight: "600",
}

const $confirmButton: ViewStyle = {
  marginTop: "auto",
}
