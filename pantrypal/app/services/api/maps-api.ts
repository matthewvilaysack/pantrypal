import { ApiResponse } from "apisauce"
import { Api } from "./api"
import { supabase } from "../auth/supabase"
import Config from "@/config"
import * as Location from "expo-location"

// Debug logging
console.log('Maps API Config:', {
  MAPBOX_TOKEN: Config.MAPBOX_TOKEN ? '[PRESENT]' : '[MISSING]',
  GOOGLE_PLACES_API_KEY: Config.GOOGLE_PLACES_API_KEY ? '[PRESENT]' : '[MISSING]'
})

const MAPBOX_TOKEN = Config.MAPBOX_TOKEN
const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY

if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "undefined") {
  console.error('GOOGLE_PLACES_API_KEY is not configured in Config')
}

if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "undefined") {
  console.error('MAPBOX_TOKEN is not configured in Config')
}

export interface FoodBank {
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
  distance?: string // Optional distance from current location
}

export type LocationError = 
  | "NO_SESSION"
  | "NO_PREFERENCES"
  | "NO_LOCATION"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "GEOCODING_ERROR"
  | "API_KEY_ERROR"
  | "PERMISSION_DENIED"

export class MapsApi {
  private api: Api

  constructor(api: Api) {
    this.api = api
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number; error?: LocationError }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        return { lat: 0, lng: 0, error: "PERMISSION_DENIED" }
      }

      const location = await Location.getCurrentPositionAsync({})
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      return { lat: 0, lng: 0, error: "NO_LOCATION" }
    }
  }

  async getDirectionsUrl(startLat: number, startLng: number, endLat: number, endLng: number): Promise<string> {
    // Using Google Maps URL scheme for directions
    return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`
  }

  async getUserPreferredLocation(): Promise<{ lat: number; lng: number; error?: LocationError } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        return { lat: 0, lng: 0, error: "NO_SESSION" }
      }

      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('location')
        .eq('user_id', session.user.id)
        .single()

      if (preferencesError) {
        console.error('Preferences error:', preferencesError)
        return { lat: 0, lng: 0, error: "SERVER_ERROR" }
      }

      if (!preferences?.location) {
        console.error('No location found in preferences')
        return { lat: 0, lng: 0, error: "NO_PREFERENCES" }
      }

      console.log('Retrieved location:', preferences.location)

      // Parse the location if it's a string (it might be stringified JSON)
      const locationData = typeof preferences.location === 'string' 
        ? JSON.parse(preferences.location) 
        : preferences.location

      // Check if we have valid coordinates
      if (locationData && 
          typeof locationData === 'object' &&
          'lat' in locationData && 
          'lng' in locationData &&
          typeof locationData.lat === 'number' &&
          typeof locationData.lng === 'number') {
        console.log('Using coordinates:', locationData)
        return {
          lat: locationData.lat,
          lng: locationData.lng
        }
      }

      // If location is a string (address), geocode it
      if (typeof preferences.location === 'string' && preferences.location.trim()) {
        try {
          // Don't geocode if it looks like coordinates
          if (preferences.location.includes('"lat"') || preferences.location.includes('"lng"')) {
            try {
              const parsed = JSON.parse(preferences.location)
              if (parsed.lat && parsed.lng) {
                return {
                  lat: parsed.lat,
                  lng: parsed.lng
                }
              }
            } catch (e) {
              console.error('Failed to parse location JSON:', e)
            }
          }

          const response = await fetch(`http://localhost:3000/api/geocode?address=${encodeURIComponent(preferences.location.trim())}`)
          
          if (!response.ok) {
            console.error('Geocoding response not OK:', response.status)
            return { lat: 0, lng: 0, error: "GEOCODING_ERROR" }
          }

          const data = await response.json()
          
          if (data.status === "REQUEST_DENIED") {
            console.error('Geocoding request denied:', data.error_message)
            return { lat: 0, lng: 0, error: "API_KEY_ERROR" }
          }
          
          if (data.status === "OK" && data.results && data.results[0]?.geometry?.location) {
            const { lat, lng } = data.results[0].geometry.location
            
            // Update the user's location with coordinates
            const { error: updateError } = await supabase
              .from('user_preferences')
              .update({ 
                location: { lat, lng }
              })
              .eq('user_id', session.user.id)

            if (updateError) {
              console.error('Error updating coordinates:', updateError)
              return { lat: 0, lng: 0, error: "SERVER_ERROR" }
            }

            console.log('Successfully updated coordinates:', { lat, lng })
            return { lat, lng }
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          return { lat: 0, lng: 0, error: "GEOCODING_ERROR" }
        }
      }

      console.error('Location format not recognized:', preferences.location)
      return { lat: 0, lng: 0, error: "NO_LOCATION" }
    } catch (error) {
      console.error('Error getting user location:', error)
      return { lat: 0, lng: 0, error: "NETWORK_ERROR" }
    }
  }

  async searchNearbyFoodBanks(searchLat: number, searchLng: number, currentLat?: number, currentLng?: number): Promise<{ foodBanks: FoodBank[]; error?: string }> {
    try {
      if (!searchLat || !searchLng) {
        return { foodBanks: [], error: "Invalid location coordinates" }
      }

      const response = await fetch(
        `http://localhost:3000/api/foodbanks?lat=${searchLat}&lng=${searchLng}`
      )

      if (!response.ok) {
        return { foodBanks: [], error: "Failed to fetch food banks" }
      }

      const data = await response.json()

      if (!data.results || data.status === "ZERO_RESULTS") {
        return { foodBanks: [], error: "No food banks found in your area" }
      }

      if (data.status === "REQUEST_DENIED") {
        return { foodBanks: [], error: "API request was denied" }
      }

      // Transform the results into our FoodBank interface
      const foodBanks = data.results.map((place: any) => {
        const foodBank: FoodBank = {
          place_id: place.place_id,
          name: place.name,
          vicinity: place.vicinity,
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            }
          },
          available_times: [
            "7:30pm",
            "7:45pm",
            "8:00pm",
            "8:15pm"
          ]
        }

        // Calculate distance from current location if provided
        if (currentLat && currentLng) {
          const distance = this.calculateDistance(
            currentLat,
            currentLng,
            place.geometry.location.lat,
            place.geometry.location.lng
          )
          foodBank.distance = `${distance.toFixed(1)} miles`
        }

        return foodBank
      })

      return { foodBanks }
    } catch (error) {
      console.error('Error searching food banks:', error)
      return { foodBanks: [], error: "Network error while fetching food banks" }
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Radius of the earth in miles
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in miles
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  async getMapboxStaticImage(latitude: number, longitude: number): Promise<{ url: string; error?: string }> {
    try {
      if (!latitude || !longitude) {
        return { url: "", error: "Invalid location coordinates" }
      }

      const response = await fetch(
        `http://localhost:3000/api/staticmap?lat=${latitude}&lng=${longitude}`
      )

      if (!response.ok) {
        return { url: "", error: "Failed to generate map image" }
      }

      // For static images, we'll return the proxy URL directly
      return { url: `http://localhost:3000/api/staticmap?lat=${latitude}&lng=${longitude}` }
    } catch (error) {
      console.error('Error generating map image:', error)
      return { url: "", error: "Network error while generating map" }
    }
  }

  async getDirections(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<{ 
    directions: {
      route: {
        distance: number;
        duration: number;
        eta: string;
        steps: Array<{
          instruction: string;
          distance: number;
          duration: number;
        }>;
      };
    }; 
    error?: string 
  }> {
    try {
      if (!startLat || !startLng || !endLat || !endLng) {
        return { 
          directions: {
            route: {
              distance: 0,
              duration: 0,
              eta: "",
              steps: []
            }
          }, 
          error: "Invalid coordinates" 
        }
      }

      const response = await fetch(
        `http://localhost:3000/api/directions?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`
      )

      if (!response.ok) {
        return { 
          directions: {
            route: {
              distance: 0,
              duration: 0,
              eta: "",
              steps: []
            }
          }, 
          error: "Failed to fetch directions" 
        }
      }

      const data = await response.json()
      return { directions: data }
    } catch (error) {
      console.error('Error getting directions:', error)
      return { 
        directions: {
          route: {
            distance: 0,
            duration: 0,
            eta: "",
            steps: []
          }
        }, 
        error: "Network error while fetching directions" 
      }
    }
  }
} 