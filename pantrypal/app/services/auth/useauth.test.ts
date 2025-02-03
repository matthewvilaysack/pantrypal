import React from "react"
import { renderHook, act } from "@testing-library/react-hooks"
import { AuthProvider, useAuth } from "./useAuth"
import { supabase } from "./supabase"

jest.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize auth state correctly", async () => {
    const session = { access_token: "test_token" }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session } })
    supabase.auth.onAuthStateChange.mockReturnValueOnce({ data: { subscription: { unsubscribe: jest.fn() } } })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe("test_token")
  })

  it("should handle signIn correctly", async () => {
    const session = { access_token: "test_token" }
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { session } })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    await act(async () => {
      await result.current.signIn({ email: "test@example.com", password: "password" })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe("test_token")
  })

  it("should handle signUp correctly", async () => {
    const session = { access_token: "test_token" }
    supabase.auth.signUp.mockResolvedValueOnce({ data: { session } })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    await act(async () => {
      await result.current.signUp({ email: "test@example.com", password: "password" })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe("test_token")
  })

  it("should handle signOut correctly", async () => {
    supabase.auth.signOut.mockResolvedValueOnce({})

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeUndefined()
  })

  it("should handle signIn errors correctly", async () => {
    const error = new Error("SignIn error")
    supabase.auth.signInWithPassword.mockRejectedValueOnce(error)

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    await act(async () => {
      try {
        await result.current.signIn({ email: "test@example.com", password: "password" })
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeUndefined()
  })

  it("should handle signUp errors correctly", async () => {
    const error = new Error("SignUp error")
    supabase.auth.signUp.mockRejectedValueOnce(error)

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    await act(async () => {
      try {
        await result.current.signUp({ email: "test@example.com", password: "password" })
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeUndefined()
  })

  it("should handle signOut errors correctly", async () => {
    const error = new Error("SignOut error")
    supabase.auth.signOut.mockRejectedValueOnce(error)

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    await act(async () => {
      try {
        await result.current.signOut()
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe("test_token")
  })
})
