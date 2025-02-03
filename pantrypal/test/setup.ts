import * as ReactNative from "react-native"
import mockFile from "./mockFile"

// Mock process.env.EXPO_OS
process.env.EXPO_OS = "ios"

// libraries to mock
jest.doMock("react-native", () => {
  // Extend ReactNative
  return Object.setPrototypeOf(
    {
      Image: {
        ...ReactNative.Image,
        resolveAssetSource: jest.fn((_source) => mockFile),
        getSize: jest.fn(
          (
            uri: string,
            success: (width: number, height: number) => void,
            failure?: (_error: any) => void,
          ) => success(100, 100),
        ),
      },
    },
    ReactNative,
  )
})

jest.mock("i18next", () => ({
  currentLocale: "en",
  t: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
  translate: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
}))

jest.mock("expo-localization", () => ({
  ...jest.requireActual("expo-localization"),
  getLocales: () => [{ languageTag: "en-US", textDirection: "ltr" }],
}))

jest.mock("../app/i18n/i18n.ts", () => ({
  i18n: {
    isInitialized: true,
    language: "en",
    t: (key: string, params: Record<string, string>) => {
      return `${key} ${JSON.stringify(params)}`
    },
    numberToCurrency: jest.fn(),
  },
}))

jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(),
  setNavigationBarBackgroundColorAsync: jest.fn(),
  setNavigationBarStyleAsync: jest.fn(),
  setStatusBarBackgroundColorAsync: jest.fn(),
  setStatusBarStyleAsync: jest.fn(),
}))

// Mock app config
jest.mock("../app/config", () => ({
  __esModule: true,
  default: {
    API_URL: "http://localhost:3000",
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_ANON_KEY: "test-key",
  }
}))
