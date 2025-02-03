// app/screens/onboarding/components/group-type-step.tsx
import React, { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Button, Screen, Text, TextField } from "@/components"
import { colors, spacing } from "@/theme"
import { observer } from "mobx-react-lite"
import { useStores } from "@/models"
import { Api } from "@/services/api"
import { supabase } from "@/services/auth/supabase"

interface GroupTypeStepProps {
  onNext: () => void
  onBack: () => void
}

export const GroupTypeStep: FC<GroupTypeStepProps> = observer(function GroupTypeStep({ onNext }) {
  const { userPreferencesStore } = useStores()
  const [groupName, setGroupName] = useState("")
  const [groupId, setGroupId] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<"create" | "join" | null>(null)
  const api = new Api()

  const handleCreateGroup = async () => {
    if (isSubmitting) return
    if (!groupName) {
      setError("Please enter a group name")
      return
    }

    setIsSubmitting(true)
    setError("")

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      setError("Not authenticated")
      setIsSubmitting(false)
      return
    }

    const response = await api.createGroupWithMembership(groupName, session.user.id)
    if (response.kind === "ok" && response.data) {
      userPreferencesStore.setProp("groupType", "create")
      userPreferencesStore.setProp("groupName", response.data.group.name)
      onNext()
    } else {
      setError(response.error || "Failed to create group")
    }
    setIsSubmitting(false)
  }

  const handleJoinGroup = async () => {
    if (isSubmitting) return
    if (!groupId) {
      setError("Please enter a group ID")
      return
    }

    setIsSubmitting(true)
    setError("")

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      setError("Not authenticated")
      setIsSubmitting(false)
      return
    }

    console.log("Attempting to join group with ID:", groupId)
    const response = await api.joinGroupWithValidation(groupId, session.user.id)
    console.log("Join group response:", response)
    
    if (response.kind === "ok" && response.data) {
      userPreferencesStore.setProp("groupType", "join")
      userPreferencesStore.setProp("groupName", response.data.group.name)
      onNext()
    } else {
      setError(response.error || "Failed to join group")
    }
    setIsSubmitting(false)
  }

  const handleTypeSelect = (type: "create" | "join") => {
    setSelectedType(type)
    setError("")
    setGroupName("")
    setGroupId("")
  }

  return (
    <Screen preset="scroll" contentContainerStyle={$container} safeAreaEdges={["top", "bottom"]}>
      <View style={$content}>
        <Text
          testID="group-type-step"
          text="Would you like to create or join a group?"
          preset="heading"
          style={$title}
        />
        
        <View style={$buttonContainer}>
          <Button
            testID="select-create"
            text="Create a New Group"
            onPress={() => handleTypeSelect("create")}
            style={[$typeButton, selectedType === "create" && $selectedButton]}
            disabled={isSubmitting}
          />
          <Button
            testID="select-join"
            text="Join Existing Group"
            onPress={() => handleTypeSelect("join")}
            style={[$typeButton, selectedType === "join" && $selectedButton]}
            disabled={isSubmitting}
          />
        </View>

        {selectedType === "create" && (
          <View style={$section}>
            <Text text="Enter your group name" preset="subheading" style={$sectionTitle} />
            <TextField
              testID="group-name-input"
              value={groupName}
              onChangeText={(text) => {
                setGroupName(text)
                setError("")
              }}
              placeholder="Enter group name"
              helper={error && groupName === "" ? error : undefined}
              status={error && groupName === "" ? "error" : undefined}
              editable={!isSubmitting}
            />
            <Button
              testID="group-type-create"
              text={isSubmitting ? "Creating Group..." : "Create Group"}
              onPress={handleCreateGroup}
              style={$button}
              disabled={isSubmitting || !groupName}
            />
          </View>
        )}

        {selectedType === "join" && (
          <View style={$section}>
            <Text text="Enter the group ID" preset="subheading" style={$sectionTitle} />
            <TextField
              testID="group-id-input"
              value={groupId}
              onChangeText={(text) => {
                setGroupId(text)
                setError("")
              }}
              placeholder="Enter group ID"
              helper={error && groupId === "" ? error : undefined}
              status={error && groupId === "" ? "error" : undefined}
              editable={!isSubmitting}
            />
            <Button
              testID="group-type-join"
              text={isSubmitting ? "Joining Group..." : "Join Group"}
              onPress={handleJoinGroup}
              style={$button}
              disabled={isSubmitting || !groupId}
            />
          </View>
        )}

        {error ? (
          <Text
            text={error}
            style={[$errorText, { color: colors.error }]}
            preset="formHelper"
          />
        ) : null}
      </View>
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $content: ViewStyle = {
  padding: spacing.lg,
}

const $title: TextStyle = {
  marginBottom: spacing.xl,
  textAlign: "center",
}

const $buttonContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: spacing.xl,
}

const $typeButton: ViewStyle = {
  flex: 1,
  marginHorizontal: spacing.xs,
}

const $selectedButton: ViewStyle = {
  backgroundColor: colors.palette.neutral800,
}

const $section: ViewStyle = {
  marginBottom: spacing.xl,
}

const $sectionTitle: TextStyle = {
  marginBottom: spacing.md,
}

const $button: ViewStyle = {
  marginTop: spacing.md,
}

const $errorText: TextStyle = {
  textAlign: "center",
  marginTop: spacing.sm,
}