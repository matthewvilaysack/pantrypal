export interface UserPreferences {
  groupType: 'create' | 'join'
  groupName?: string
  location: string
  name: {
    first: string
    last: string
  }
  familySize: {
    adults: number
    teenagers: number
    children: number
    infants: number

  }
  age: number
  allergies: ('dairy-free' | 'egg-free' | 'gluten-free')[]
  foodsToAvoid: ('alcohol' | 'pork' | 'fish')[]
  onboardingCompleted: boolean
} 