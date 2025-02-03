# 🍲 React Native Food Bank Finder: Comprehensive Development Guide

## 📋 Table of Contents
1. [Project Setup](#project-setup)
2. [API Configuration](#api-configuration)
3. [Dependency Installation](#dependency-installation)
4. [Environment Configuration](#environment-configuration)
5. [Service Layer Implementation](#service-layer-implementation)
6. [Screen Development](#screen-development)
7. [Navigation Integration](#navigation-integration)
8. [Permissions Handling](#permissions-handling)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

## 🚀 Project Setup

### Prerequisites
- Node.js (v16+ recommended)
- React Native CLI or Expo
- Ignite CLI
- Google Cloud Console account
- Mapbox account

### Create Ignite Project
```bash
# Install Ignite CLI globally
npm install -g @infinitered/ignite

# Create new project
npx ignite-cli new FoodBankFinder

# Navigate to project directory
cd FoodBankFinder
```

## 🔐 API Configuration

### Google Cloud Console Setup
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable APIs:
   - Places API
   - Geocoding API

### Mapbox Configuration
1. Create account at [Mapbox](https://www.mapbox.com/)
2. Generate Access Token
3. Save token securely

## 📦 Dependency Installation
```bash
# Core React Native Mapping
npx expo install react-native-mapbox-gl

# Geolocation
npx expo install @react-native-community/geolocation

# Networking
npx expo install axios

# State Management
npx expo install @reduxjs/toolkit react-redux

# Additional Utilities
npx expo install react-native-permissions
```

## 🌍 Environment Configuration
Create `.env` file in project root:
```
GOOGLE_PLACES_API_KEY=your_google_places_api_key
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### Environment Type Definition
Create `types/env.d.ts`:
```typescript
declare module '@env' {
  export const GOOGLE_PLACES_API_KEY: string;
  export const MAPBOX_ACCESS_TOKEN: string;
}
```

## 💻 Service Layer Implementation

### Food Bank Service
`app/services/foodBankService.ts`:
```typescript
import axios from 'axios';
import { GOOGLE_PLACES_API_KEY } from '@env';

interface FoodBank {
  name: string;
  vicinity: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
}

export const fetchFoodBanks = async (
  latitude: number, 
  longitude: number
): Promise<FoodBank[]> => {
  try {
    const searchQueries = [
      'food bank',
      'food pantry',
      'hunger relief',
      'community food center'
    ];

    const allResults: FoodBank[] = [];

    // Perform multiple searches
    for (const query of searchQueries) {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: 16000, // 10 miles
            keyword: query,
            key: GOOGLE_PLACES_API_KEY
          }
        }
      );

      const validResults = response.data.results
        .filter((place: any) => 
          place.geometry?.location?.lat && 
          place.geometry?.location?.lng
        )
        .map((place: any) => ({
          name: place.name,
          vicinity: place.vicinity,
          location: place.geometry.location,
          rating: place.rating || 'N/A'
        }));

      allResults.push(...validResults);
    }

    // Remove duplicates and limit results
    return Array.from(
      new Set(allResults.map(b => b.name))
    ).map(name => 
      allResults.find(b => b.name === name)!
    ).slice(0, 10);
  } catch (error) {
    console.error('Food Bank Fetch Error:', error);
    throw error;
  }
};
```

## 🗺️ Screen Development
`app/screens/FoodBankFinderScreen.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Geolocation from '@react-native-community/geolocation';
import { fetchFoodBanks } from '../services/foodBankService';
import { MAPBOX_ACCESS_TOKEN } from '@env';

// Configure Mapbox
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export const FoodBankFinderScreen = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<FoodBank | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Request and get current location
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);

        try {
          const banks = await fetchFoodBanks(latitude, longitude);
          setFoodBanks(banks);
        } catch (err) {
          setError('Could not fetch food banks');
        }
      },
      (error) => {
        console.error(error);
        setError('Location access denied');
      }
    );
  }, []);

  const renderFoodBankMarker = (bank: FoodBank) => (
    <MapboxGL.PointAnnotation
      key={bank.name}
      id={bank.name}
      coordinate={[bank.location.lng, bank.location.lat]}
      onSelected={() => setSelectedBank(bank)}
    >
      <View style={styles.marker}>
        <Text>🏘️</Text>
      </View>
    </MapboxGL.PointAnnotation>
  );

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        {userLocation && (
          <MapboxGL.Camera
            centerCoordinate={userLocation}
            zoomLevel={10}
          />
        )}
        
        {/* User Location Marker */}
        {userLocation && (
          <MapboxGL.PointAnnotation
            id="user-location"
            coordinate={userLocation}
          >
            <View style={styles.userMarker}>
              <Text>📍</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Food Bank Markers */}
        {foodBanks.map(renderFoodBankMarker)}
      </MapboxGL.MapView>

      {/* Food Bank List */}
      <FlatList
        data={foodBanks}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.bankListItem}
            onPress={() => setSelectedBank(item)}
          >
            <Text style={styles.bankName}>{item.name}</Text>
            <Text>{item.vicinity}</Text>
            {item.rating && <Text>Rating: {item.rating}</Text>}
          </TouchableOpacity>
        )}
      />

      {/* Selected Bank Details */}
      {selectedBank && (
        <View style={styles.selectedBankDetails}>
          <Text style={styles.selectedBankName}>{selectedBank.name}</Text>
          <Text>{selectedBank.vicinity}</Text>
          <TouchableOpacity style={styles.directionsButton}>
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 0.7 },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bankListItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  bankName: {
    fontWeight: 'bold',
    fontSize: 16
  },
  selectedBankDetails: {
    padding: 15,
    backgroundColor: '#f9f9f9'
  },
  selectedBankName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  directionsButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  directionsButtonText: {
    color: 'white',
    textAlign: 'center'
  }
});
```

## 🧭 Navigation Integration
`app/navigators/AppNavigator.tsx`:
```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { FoodBankFinderScreen } from '../screens/FoodBankFinderScreen';

const Stack = createStackNavigator();

export const AppNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="FoodBankFinder" 
      component={FoodBankFinderScreen} 
      options={{ title: 'Food Banks Near You' }}
    />
  </Stack.Navigator>
);
```

## 🔒 Permissions Handling

### iOS Configuration (`Info.plist`)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to find nearby food banks</string>
```

### Android Configuration (`AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 🛠️ Troubleshooting
- Verify API keys
- Check network connectivity
- Ensure location services are enabled
- Use console logging for debugging

## 🚧 Advanced Features (Future Improvements)
- Implement route directions
- Add filters for food bank types
- Cache search results
- Offline support
- Detailed bank information

## 📦 Recommended Additional Packages
- `react-native-permissions`
- `@react-navigation/native`
- `@react-navigation/stack`

## 🏁 Final Steps
1. Install dependencies
2. Configure environment variables
3. Run the application
4. Test thoroughly

```bash
# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

## 📝 Notes
- This is a basic implementation
- Customize to fit your specific requirements
- Always handle errors gracefully
- Respect user privacy

---

**Happy Coding! 🚀👨‍💻**