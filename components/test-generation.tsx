"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { AIService, type TestCaseSummary, type GeneratedTestCode } from "@/lib/ai-service"
import { Loader2, Brain, CheckCircle, Code, FileText, Zap } from "lucide-react"

interface TestGenerationProps {
  selectedFiles: Array<{ path: string; content: string }>
  onBack: () => void
  onManageTests: () => void // Added onManageTests prop
  // Added props for PR creation
  onCreatePR?: (testCases: GeneratedTestCode[], summaries: TestCaseSummary[]) => void
}

export function TestGeneration({ selectedFiles, onBack, onManageTests, onCreatePR }: TestGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [testSummaries, setTestSummaries] = useState<TestCaseSummary[]>([])
  const [selectedSummaries, setSelectedSummaries] = useState<Set<string>>(new Set())
  const [generatedTests, setGeneratedTests] = useState<GeneratedTestCode[]>([])
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [activeTab, setActiveTab] = useState("summaries")

  const generateSummaries = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const summaries = await AIService.generateTestSummaries(selectedFiles)

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setTestSummaries(summaries)

      // Auto-select high priority tests
      const highPriorityIds = summaries.filter((s) => s.priority === "high").map((s) => s.id)
      setSelectedSummaries(new Set(highPriorityIds))
    } catch (error) {
      console.error("Error generating test summaries:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTestCode = async () => {
    if (selectedSummaries.size === 0) return

    setIsGeneratingCode(true)
    const selectedSummaryList = testSummaries.filter((s) => selectedSummaries.has(s.id))
    const generatedCodes: GeneratedTestCode[] = []

    for (const summary of selectedSummaryList) {
      try {
        const testCode = await AIService.generateTestCode(summary)
        generatedCodes.push(testCode)
      } catch (error) {
        console.error(`Error generating test code for ${summary.id}:`, error)
      }
    }

    setGeneratedTests(generatedCodes)
    setActiveTab("generated")
    setIsGeneratingCode(false)
  }

  const toggleSummarySelection = (summaryId: string) => {
    const newSelection = new Set(selectedSummaries)
    if (newSelection.has(summaryId)) {
      newSelection.delete(summaryId)
    } else {
      newSelection.add(summaryId)
    }
    setSelectedSummaries(newSelection)
  }

  const selectAllSummaries = () => {
    setSelectedSummaries(new Set(testSummaries.map((s) => s.id)))
  }

  const clearAllSummaries = () => {
    setSelectedSummaries(new Set())
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case "unit":
        return <CheckCircle className="h-4 w-4" />
      case "integration":
        return <Zap className="h-4 w-4" />
      case "edge-case":
        return <Brain className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Test Generation</h2>
          <p className="text-muted-foreground">
            Generate comprehensive test cases for {selectedFiles.length} selected files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Added Create PR button */}
          {generatedTests.length > 0 && onCreatePR && (
            <Button variant="default" onClick={() => onCreatePR(generatedTests, testSummaries)}>
              Create PR
            </Button>
          )}
          {generatedTests.length > 0 && (
            <Button variant="outline" onClick={onManageTests}>
              Manage Tests
            </Button>
          )}
          <Button variant="outline" onClick={onBack}>
            Back to Files
          </Button>
        </div>
      </div>

      {/* Generation Status */}
      {testSummaries.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Generate Test Case Summaries
            </CardTitle>
            <CardDescription>AI will analyze your code and suggest comprehensive test cases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing code structure and generating test cases...
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            )}
            <Button onClick={generateSummaries} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Test Summaries
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Management */}
      {testSummaries.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summaries">Test Summaries ({testSummaries.length})</TabsTrigger>
            <TabsTrigger value="generated">Generated Tests ({generatedTests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summaries" className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllSummaries}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllSummaries}>
                  Clear All
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedSummaries.size} of {testSummaries.length} selected
                </span>
              </div>
              <Button onClick={generateTestCode} disabled={selectedSummaries.size === 0 || isGeneratingCode}>
                {isGeneratingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Generate Test Code ({selectedSummaries.size})
                  </>
                )}
              </Button>
            </div>

            {/* Test Summaries */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {testSummaries.map((summary) => (
                  <Card key={summary.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedSummaries.has(summary.id)}
                          onCheckedChange={() => toggleSummarySelection(summary.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getTestTypeIcon(summary.testType)}
                            <CardTitle className="text-base">{summary.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getPriorityColor(summary.priority)}>
                              {summary.priority}
                            </Badge>
                            <Badge variant="secondary">{summary.testType}</Badge>
                            <Badge variant="outline">Complexity: {summary.estimatedComplexity}/5</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">{summary.description}</p>
                      <div className="text-xs text-muted-foreground">
                        File: {summary.filePath}
                        {summary.functionName && ` • Function: ${summary.functionName}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="generated" className="space-y-4">
            {generatedTests.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <Code className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No test code generated yet. Select summaries and generate code.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {generatedTests.map((test) => {
                    const summary = testSummaries.find((s) => s.id === test.summaryId)
                    return (
                      <Card key={test.id}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            {summary?.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{test.framework}</Badge>
                            <Badge variant="outline">{test.language}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{test.code}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
