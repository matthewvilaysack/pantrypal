// app/services/api/openai-api.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, // Add this to your .env file
})

export const categorizeFoodItem = async (foodName: string) => {
  try {
    const prompt = `Categorize this food item: "${foodName}" into exactly one of these categories: vegetables, meat, fruit, dairy, baked. Only respond with the category name in lowercase, nothing else.`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,  // We want consistent categorization
      max_tokens: 10,  // We only need one word
    })

    return response.choices[0].message.content?.trim().toLowerCase()
  } catch (error) {
    console.error('Error categorizing food:', error)
    throw error
  }
}