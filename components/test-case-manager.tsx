"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FolderPlus, Edit, Trash2, FileText, Package, Search, Calendar } from "lucide-react"

interface TestSuite {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  testCases: TestCase[]
  framework: "jest" | "vitest" | "mocha" | "cypress"
  language: "javascript" | "typescript" | "python"
}

interface TestCase {
  id: string
  title: string
  description: string
  code: string
  testType: "unit" | "integration" | "e2e" | "edge-case"
  priority: "high" | "medium" | "low"
  status: "draft" | "ready" | "needs-review"
  filePath: string
  functionName?: string
  createdAt: Date
  updatedAt: Date
}

interface TestCaseManagerProps {
  onBack: () => void
}

export function TestCaseManager({ onBack }: TestCaseManagerProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [isCreateSuiteOpen, setIsCreateSuiteOpen] = useState(false)
  const [isEditTestOpen, setIsEditTestOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<TestCase | null>(null)
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())

  // Load test suites from localStorage on mount
  useEffect(() => {
    const savedSuites = localStorage.getItem("testgen-suites")
    if (savedSuites) {
      const parsed = JSON.parse(savedSuites)
      const suites = parsed.map((suite: any) => ({
        ...suite,
        createdAt: new Date(suite.createdAt),
        updatedAt: new Date(suite.updatedAt),
        testCases: suite.testCases.map((test: any) => ({
          ...test,
          createdAt: new Date(test.createdAt),
          updatedAt: new Date(test.updatedAt),
        })),
      }))
      setTestSuites(suites)
    } else {
      // Create sample data for demonstration
      const sampleSuite: TestSuite = {
        id: "sample-1",
        name: "User Authentication Tests",
        description: "Comprehensive test suite for user authentication functionality",
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ["auth", "security", "user-management"],
        framework: "jest",
        language: "typescript",
        testCases: [
          {
            id: "test-1",
            title: "Should authenticate valid user",
            description: "Test successful user authentication with valid credentials",
            code: `describe('User Authentication', () => {
  test('should authenticate valid user', async () => {
    const user = { email: 'test@example.com', password: 'password123' };
    const result = await authenticateUser(user);
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});`,
            testType: "unit",
            priority: "high",
            status: "ready",
            filePath: "src/auth/authenticate.ts",
            functionName: "authenticateUser",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "test-2",
            title: "Should reject invalid credentials",
            description: "Test authentication failure with invalid credentials",
            code: `test('should reject invalid credentials', async () => {
  const user = { email: 'test@example.com', password: 'wrongpassword' };
  const result = await authenticateUser(user);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Invalid credentials');
});`,
            testType: "unit",
            priority: "high",
            status: "ready",
            filePath: "src/auth/authenticate.ts",
            functionName: "authenticateUser",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }
      setTestSuites([sampleSuite])
    }
  }, [])

  // Save test suites to localStorage
  const saveTestSuites = (suites: TestSuite[]) => {
    localStorage.setItem("testgen-suites", JSON.stringify(suites))
    setTestSuites(suites)
  }

  const createTestSuite = (name: string, description: string, framework: string, language: string, tags: string[]) => {
    const newSuite: TestSuite = {
      id: `suite-${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags,
      testCases: [],
      framework: framework as TestSuite["framework"],
      language: language as TestSuite["language"],
    }
    saveTestSuites([...testSuites, newSuite])
    setIsCreateSuiteOpen(false)
  }

  const deleteTestSuite = (suiteId: string) => {
    const updatedSuites = testSuites.filter((suite) => suite.id !== suiteId)
    saveTestSuites(updatedSuites)
    if (selectedSuite?.id === suiteId) {
      setSelectedSuite(null)
    }
  }

  const updateTestCase = (suiteId: string, testCase: TestCase) => {
    const updatedSuites = testSuites.map((suite) => {
      if (suite.id === suiteId) {
        const updatedTestCases = suite.testCases.map((test) =>
          test.id === testCase.id ? { ...testCase, updatedAt: new Date() } : test,
        )
        return { ...suite, testCases: updatedTestCases, updatedAt: new Date() }
      }
      return suite
    })
    saveTestSuites(updatedSuites)
    setSelectedSuite(updatedSuites.find((s) => s.id === suiteId) || null)
  }

  const deleteTestCase = (suiteId: string, testId: string) => {
    const updatedSuites = testSuites.map((suite) => {
      if (suite.id === suiteId) {
        const updatedTestCases = suite.testCases.filter((test) => test.id !== testId)
        return { ...suite, testCases: updatedTestCases, updatedAt: new Date() }
      }
      return suite
    })
    saveTestSuites(updatedSuites)
    setSelectedSuite(updatedSuites.find((s) => s.id === suiteId) || null)
  }

  const exportTestSuite = (suite: TestSuite, format: "jest" | "zip" | "json") => {
    if (format === "json") {
      const dataStr = JSON.stringify(suite, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${suite.name.replace(/\s+/g, "-").toLowerCase()}.json`
      link.click()
    } else if (format === "jest") {
      const testCode = suite.testCases.map((test) => test.code).join("\n\n")
      const dataBlob = new Blob([testCode], { type: "text/plain" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${suite.name.replace(/\s+/g, "-").toLowerCase()}.test.js`
      link.click()
    }
  }

  const filteredTestCases =
    selectedSuite?.testCases.filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === "all" || test.testType === filterType
      const matchesPriority = filterPriority === "all" || test.priority === filterPriority
      return matchesSearch && matchesType && matchesPriority
    }) || []

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "needs-review":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Case Management</h2>
          <p className="text-muted-foreground">Organize, edit, and export your generated test cases</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Generation
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Test Suites Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Test Suites</h3>
            <Dialog open={isCreateSuiteOpen} onOpenChange={setIsCreateSuiteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Suite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Test Suite</DialogTitle>
                  <DialogDescription>Create a new test suite to organize your test cases</DialogDescription>
                </DialogHeader>
                <CreateSuiteForm onSubmit={createTestSuite} />
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {testSuites.map((suite) => (
                <Card
                  key={suite.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSuite?.id === suite.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedSuite(suite)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm">{suite.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">{suite.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTestSuite(suite.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{suite.testCases.length} tests</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {suite.framework}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suite.language}
                        </Badge>
                      </div>
                    </div>
                    {suite.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suite.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {suite.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{suite.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Test Cases Main Area */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSuite ? (
            <>
              {/* Suite Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {selectedSuite.name}
                      </CardTitle>
                      <CardDescription>{selectedSuite.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(format) => exportTestSuite(selectedSuite, format as any)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Export" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jest">Jest File</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {selectedSuite.createdAt.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {selectedSuite.testCases.length} test cases
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Filters and Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search test cases..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="e2e">E2E</SelectItem>
                        <SelectItem value="edge-case">Edge Case</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases List */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredTestCases.map((test) => (
                    <Card key={test.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{test.title}</CardTitle>
                            <CardDescription className="mt-1">{test.description}</CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={getPriorityColor(test.priority)}>
                                {test.priority}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(test.status)}>
                                {test.status}
                              </Badge>
                              <Badge variant="secondary">{test.testType}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTest(test)
                                setIsEditTestOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteTestCase(selectedSuite.id, test.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground mb-2">
                          {test.filePath} {test.functionName && `• ${test.functionName}`}
                        </div>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-32">
                          <code>{test.code}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Select a test suite to view and manage test cases</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Test Dialog */}
      <Dialog open={isEditTestOpen} onOpenChange={setIsEditTestOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
            <DialogDescription>Modify the test case details and code</DialogDescription>
          </DialogHeader>
          {editingTest && (
            <EditTestForm
              test={editingTest}
              onSubmit={(updatedTest) => {
                updateTestCase(selectedSuite!.id, updatedTest)
                setIsEditTestOpen(false)
                setEditingTest(null)
              }}
              onCancel={() => {
                setIsEditTestOpen(false)
                setEditingTest(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create Suite Form Component
function CreateSuiteForm({
  onSubmit,
}: { onSubmit: (name: string, description: string, framework: string, language: string, tags: string[]) => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [framework, setFramework] = useState("jest")
  const [language, setLanguage] = useState("typescript")
  const [tagsInput, setTagsInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    onSubmit(name, description, framework, language, tags)
    setName("")
    setDescription("")
    setFramework("jest")
    setLanguage("typescript")
    setTagsInput("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="suite-name">Suite Name</Label>
        <Input
          id="suite-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., User Authentication Tests"
          required
        />
      </div>
      <div>
        <Label htmlFor="suite-description">Description</Label>
        <Textarea
          id="suite-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this test suite covers..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="framework">Framework</Label>
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jest">Jest</SelectItem>
              <SelectItem value="vitest">Vitest</SelectItem>
              <SelectItem value="mocha">Mocha</SelectItem>
              <SelectItem value="cypress">Cypress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="auth, security, user-management"
        />
      </div>
      <DialogFooter>
        <Button type="submit">Create Suite</Button>
      </DialogFooter>
    </form>
  )
}

// Edit Test Form Component
function EditTestForm({
  test,
  onSubmit,
  onCancel,
}: {
  test: TestCase
  onSubmit: (test: TestCase) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(test.title)
  const [description, setDescription] = useState(test.description)
  const [code, setCode] = useState(test.code)
  const [priority, setPriority] = useState(test.priority)
  const [status, setStatus] = useState(test.status)
  const [testType, setTestType] = useState(test.testType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...test,
      title,
      description,
      code,
      priority: priority as TestCase["priority"],
      status: status as TestCase["status"],
      testType: testType as TestCase["testType"],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="test-title">Title</Label>
        <Input id="test-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="test-description">Description</Label>
        <Textarea id="test-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="test-type">Type</Label>
          <Select value={testType} onValueChange={setTestType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Unit</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="e2e">E2E</SelectItem>
              <SelectItem value="edge-case">Edge Case</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="test-code">Test Code</Label>
        <Textarea
          id="test-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  )
}
