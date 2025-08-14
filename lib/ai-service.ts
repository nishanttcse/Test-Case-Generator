import fetch from "node-fetch"

// Mock AI service for test case generation
export interface TestCaseSummary {
  id: string
  title: string
  description: string
  testType: "unit" | "integration" | "edge-case"
  priority: "high" | "medium" | "low"
  estimatedComplexity: number // 1-5 scale
  functionName?: string
  filePath: string
}

export interface GeneratedTestCode {
  id: string
  summaryId: string
  code: string
  framework: "jest" | "vitest" | "mocha"
  language: "javascript" | "typescript"
}

// Real AI service using Gemini API
export class AIService {
  private static readonly GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

  private static async callGeminiAPI(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required")
    }

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

    try {
      const response = await fetch(`${this.GEMINI_API_URL}?key=${apiKey}`, {
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

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Gemini API call failed:", error)
      throw error
    }
  }

  static async generateTestSummaries(files: Array<{ path: string; content: string }>): Promise<TestCaseSummary[]> {
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

        const response = await this.callGeminiAPI(prompt, systemInstruction)

        // Parse AI response and create summaries
        const aiSummaries = this.parseAIResponse(response, file.path)
        summaries.push(...aiSummaries)
      } catch (error) {
        console.error(`Error generating summaries for ${file.path}:`, error)
        // Fallback to basic summary if AI fails
        summaries.push(this.createFallbackSummary(file))
      }
    }

    return summaries
  }

  static async generateTestCode(summary: TestCaseSummary): Promise<GeneratedTestCode> {
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

      const response = await this.callGeminiAPI(prompt, systemInstruction)

      // Clean up the response (remove any markdown formatting if present)
      const cleanCode = response.replace(/```[\w]*\n?/g, "").trim()

      return {
        id: `test-${summary.id}`,
        summaryId: summary.id,
        code: cleanCode,
        framework: "jest",
        language: isTypeScript ? "typescript" : "javascript",
      }
    } catch (error) {
      console.error(`Error generating test code for ${summary.id}:`, error)
      // Fallback to mock generation if AI fails
      return MockAIService.generateTestCode(summary)
    }
  }

  private static parseAIResponse(response: string, filePath: string): TestCaseSummary[] {
    try {
      // Clean the response and extract JSON
      let cleanResponse = response.trim()

      // Remove any markdown formatting
      cleanResponse = cleanResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "")

      // Extract JSON array from response
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
      console.error("Raw response:", response)
      // Return a basic summary if parsing fails
      return [this.createFallbackSummary({ path: filePath, content: "" })]
    }
  }

  private static createFallbackSummary(file: { path: string; content: string }): TestCaseSummary {
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
}

// Mock AI service - replace with real AI integration
export class MockAIService {
  static async generateTestSummaries(files: Array<{ path: string; content: string }>): Promise<TestCaseSummary[]> {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const summaries: TestCaseSummary[] = []

    files.forEach((file, fileIndex) => {
      // Extract function names and classes from code
      const functions = this.extractFunctions(file.content)
      const classes = this.extractClasses(file.content)

      // Generate test summaries for functions
      functions.forEach((func, index) => {
        summaries.push({
          id: `${fileIndex}-func-${index}`,
          title: `Test ${func} function`,
          description: `Unit tests for the ${func} function including happy path, error cases, and edge cases`,
          testType: "unit",
          priority: "high",
          estimatedComplexity: Math.floor(Math.random() * 3) + 2,
          functionName: func,
          filePath: file.path,
        })
      })

      // Generate integration test summaries
      if (functions.length > 1) {
        summaries.push({
          id: `${fileIndex}-integration`,
          title: `Integration tests for ${file.path.split("/").pop()}`,
          description: `Test the interaction between multiple functions in this module`,
          testType: "integration",
          priority: "medium",
          estimatedComplexity: 4,
          filePath: file.path,
        })
      }

      // Generate edge case tests
      summaries.push({
        id: `${fileIndex}-edge`,
        title: `Edge case tests for ${file.path.split("/").pop()}`,
        description: `Test boundary conditions, null inputs, and error scenarios`,
        testType: "edge-case",
        priority: "medium",
        estimatedComplexity: 3,
        filePath: file.path,
      })
    })

    return summaries
  }

  static async generateTestCode(summary: TestCaseSummary): Promise<GeneratedTestCode> {
    // Simulate code generation time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const isTypeScript = summary.filePath.endsWith(".ts") || summary.filePath.endsWith(".tsx")
    const framework = "jest" // Default to Jest

    let testCode = ""

    if (summary.testType === "unit" && summary.functionName) {
      testCode = this.generateUnitTestCode(summary.functionName, summary.filePath, isTypeScript)
    } else if (summary.testType === "integration") {
      testCode = this.generateIntegrationTestCode(summary.filePath, isTypeScript)
    } else {
      testCode = this.generateEdgeCaseTestCode(summary.filePath, isTypeScript)
    }

    return {
      id: `test-${summary.id}`,
      summaryId: summary.id,
      code: testCode,
      framework: framework as "jest",
      language: isTypeScript ? "typescript" : "javascript",
    }
  }

  private static extractFunctions(code: string): string[] {
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:\s*$$[^)]*$$\s*=>|(\w+)$$[^)]*$$\s*{)/g
    const functions: string[] = []
    let match

    while ((match = functionRegex.exec(code)) !== null) {
      const funcName = match[1] || match[2] || match[3] || match[4]
      if (funcName && !functions.includes(funcName)) {
        functions.push(funcName)
      }
    }

    return functions.slice(0, 5) // Limit to 5 functions per file
  }

  private static extractClasses(code: string): string[] {
    const classRegex = /class\s+(\w+)/g
    const classes: string[] = []
    let match

    while ((match = classRegex.exec(code)) !== null) {
      classes.push(match[1])
    }

    return classes
  }

  private static generateUnitTestCode(functionName: string, filePath: string, isTypeScript: boolean): string {
    const importPath = filePath.replace(/\.(ts|tsx|js|jsx)$/, "")
    const extension = isTypeScript ? "ts" : "js"

    return `import { ${functionName} } from '${importPath}';

describe('${functionName}', () => {
  test('should handle valid input correctly', () => {
    // Arrange
    const input = /* valid input */;
    const expected = /* expected output */;
    
    // Act
    const result = ${functionName}(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
  
  test('should handle edge cases', () => {
    // Test null/undefined inputs
    expect(() => ${functionName}(null)).not.toThrow();
    expect(() => ${functionName}(undefined)).not.toThrow();
  });
  
  test('should handle invalid input', () => {
    // Test with invalid input
    const invalidInput = /* invalid input */;
    expect(() => ${functionName}(invalidInput)).toThrow();
  });
});`
  }

  private static generateIntegrationTestCode(filePath: string, isTypeScript: boolean): string {
    const moduleName =
      filePath
        .split("/")
        .pop()
        ?.replace(/\.(ts|tsx|js|jsx)$/, "") || "module"
    const importPath = filePath.replace(/\.(ts|tsx|js|jsx)$/, "")

    return `import * as ${moduleName} from '${importPath}';

describe('${moduleName} integration tests', () => {
  test('should work with multiple functions together', () => {
    // Test the interaction between multiple functions
    // This is a placeholder - customize based on actual module structure
    expect(true).toBe(true);
  });
  
  test('should handle complex workflows', () => {
    // Test end-to-end workflows within the module
    expect(true).toBe(true);
  });
});`
  }

  private static generateEdgeCaseTestCode(filePath: string, isTypeScript: boolean): string {
    const moduleName =
      filePath
        .split("/")
        .pop()
        ?.replace(/\.(ts|tsx|js|jsx)$/, "") || "module"
    const importPath = filePath.replace(/\.(ts|tsx|js|jsx)$/, "")

    return `import * as ${moduleName} from '${importPath}';

describe('${moduleName} edge cases', () => {
  test('should handle boundary conditions', () => {
    // Test with boundary values (empty arrays, max/min numbers, etc.)
    expect(true).toBe(true);
  });
  
  test('should handle error conditions gracefully', () => {
    // Test error scenarios and recovery
    expect(true).toBe(true);
  });
  
  test('should handle concurrent operations', () => {
    // Test race conditions and async edge cases
    expect(true).toBe(true);
  });
});`
  }
}
