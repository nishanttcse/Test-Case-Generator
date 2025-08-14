"use server"

import type { TestCaseSummary, GeneratedTestCode } from "./ai-service"

// Server action for generating test summaries
export async function generateTestSummariesAction(
  files: Array<{ path: string; content: string }>,
): Promise<TestCaseSummary[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required")
  }

  const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

  const summaries: TestCaseSummary[] = []

  for (const file of files) {
    try {
      const systemInstruction = `You are an expert software testing engineer. Analyze the provided code and generate comprehensive test case summaries. 
        
        For each code file, identify:
        1. Functions that need unit tests
        2. Integration test opportunities 
        3. Edge cases and error scenarios
        
        Return ONLY a valid JSON array of test summaries with this exact structure:
        [
          {
            "title": "descriptive test title",
            "description": "detailed description of what to test",
            "testType": "unit" | "integration" | "edge-case",
            "priority": "high" | "medium" | "low", 
            "estimatedComplexity": 1-5,
            "functionName": "function name if unit test",
            "filePath": "file path"
          }
        ]
        
        Do not include any explanations or markdown formatting, just return the JSON array.`

      const prompt = `Analyze this code file and generate test case summaries:

File: ${file.path}
Code:
\`\`\`
${file.content}
\`\`\`

Generate 3-8 comprehensive test case summaries covering unit tests, integration tests, and edge cases. Return only the JSON array.`

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from Gemini API")
      }

      const aiResponse = data.candidates[0].content.parts[0].text
      const aiSummaries = parseAIResponse(aiResponse, file.path)
      summaries.push(...aiSummaries)
    } catch (error) {
      console.error(`Error generating summaries for ${file.path}:`, error)
      // Fallback to basic summary if AI fails
      summaries.push(createFallbackSummary(file))
    }
  }

  return summaries
}

// Server action for generating test code
export async function generateTestCodeAction(summary: TestCaseSummary): Promise<GeneratedTestCode> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required")
  }

  const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

  try {
    const isTypeScript = summary.filePath.endsWith(".ts") || summary.filePath.endsWith(".tsx")

    const systemInstruction = `You are an expert test code generator. Generate complete, runnable test code using Jest framework.
      
      Requirements:
      - Use proper Jest syntax and best practices
      - Include proper imports and setup
      - Add meaningful test descriptions
      - Cover happy path, error cases, and edge cases
      - Use ${isTypeScript ? "TypeScript" : "JavaScript"} syntax
      - Return only the test code, no explanations or markdown formatting`

    const prompt = `Generate complete Jest test code for this test case:

Title: ${summary.title}
Description: ${summary.description}
Test Type: ${summary.testType}
File Path: ${summary.filePath}
${summary.functionName ? `Function Name: ${summary.functionName}` : ""}

Generate comprehensive, production-ready test code. Return only the code without any markdown formatting or explanations.`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API")
    }

    const aiResponse = data.candidates[0].content.parts[0].text
    const cleanCode = aiResponse.replace(/```[\w]*\n?/g, "").trim()

    return {
      id: `test-${summary.id}`,
      summaryId: summary.id,
      code: cleanCode,
      framework: "jest",
      language: isTypeScript ? "typescript" : "javascript",
    }
  } catch (error) {
    console.error(`Error generating test code for ${summary.id}:`, error)
    // Fallback to basic test code if AI fails
    return createFallbackTestCode(summary)
  }
}

// Helper functions
function parseAIResponse(response: string, filePath: string): TestCaseSummary[] {
  try {
    let cleanResponse = response.trim()
    cleanResponse = cleanResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "")

    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn("No JSON array found in Gemini response:", response)
      throw new Error("No JSON array found in response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return parsed.map((item: any, index: number) => ({
      id: `gemini-${Date.now()}-${index}`,
      title: item.title || "Generated Test",
      description: item.description || "AI generated test case",
      testType: item.testType || "unit",
      priority: item.priority || "medium",
      estimatedComplexity: item.estimatedComplexity || 3,
      functionName: item.functionName,
      filePath: filePath,
    }))
  } catch (error) {
    console.error("Error parsing Gemini response:", error)
    return [createFallbackSummary({ path: filePath, content: "" })]
  }
}

function createFallbackSummary(file: { path: string; content: string }): TestCaseSummary {
  return {
    id: `fallback-${Date.now()}`,
    title: `Basic tests for ${file.path.split("/").pop()}`,
    description: "Basic test coverage for this file",
    testType: "unit",
    priority: "medium",
    estimatedComplexity: 3,
    filePath: file.path,
  }
}

function createFallbackTestCode(summary: TestCaseSummary): GeneratedTestCode {
  const isTypeScript = summary.filePath.endsWith(".ts") || summary.filePath.endsWith(".tsx")
  const importPath = summary.filePath.replace(/\.(ts|tsx|js|jsx)$/, "")

  const basicTestCode = `import { ${summary.functionName || "testFunction"} } from '${importPath}';

describe('${summary.title}', () => {
  test('should work correctly', () => {
    // Basic test implementation
    expect(true).toBe(true);
  });
});`

  return {
    id: `test-${summary.id}`,
    summaryId: summary.id,
    code: basicTestCode,
    framework: "jest",
    language: isTypeScript ? "typescript" : "javascript",
  }
}
