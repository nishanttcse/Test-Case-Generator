"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitHubAuth } from "@/components/github-auth"
import { RepositorySelector } from "@/components/repository-selector"
import { FileBrowser } from "@/components/file-browser"
import { GitHubAPI, getFileLanguage, isTestableFile } from "@/lib/github-api"
import { Github, FileCode, TestTube, GitPullRequest, ArrowLeft } from "lucide-react"
import { TestGeneration } from "@/components/test-generation"
import { TestCaseManager } from "@/components/test-case-manager"
import { PRCreator } from "@/components/pr-creator"
import type { GeneratedTestCode, TestCaseSummary } from "@/lib/ai-service"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  private: boolean
}

interface FileItem {
  name: string
  path: string
  type: "file" | "directory"
  language?: string
  children?: FileItem[]
}

type AppState =
  | "landing"
  | "auth"
  | "repo-select"
  | "file-browser"
  | "test-generation"
  | "test-management"
  | "pr-creation"

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("landing")
  const [githubApi, setGithubApi] = useState<GitHubAPI | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [fileContents, setFileContents] = useState<Array<{ path: string; content: string }>>([])
  const [prTestCases, setPrTestCases] = useState<GeneratedTestCode[]>([])
  const [prTestSummaries, setPrTestSummaries] = useState<TestCaseSummary[]>([])

  const handleAuthentication = (token: string) => {
    const api = new GitHubAPI(token)
    setGithubApi(api)
    setAppState("repo-select")
  }

  const handleRepositorySelect = async (repo: Repository) => {
    setSelectedRepo(repo)
    setIsLoadingFiles(true)

    try {
      const [owner, repoName] = repo.full_name.split("/")
      const repoFiles = await githubApi!.getRepositoryContents(owner, repoName)
      const fileTree = await buildFileTree(repoFiles, owner, repoName, "")
      setFiles(fileTree)
      setAppState("file-browser")
    } catch (error) {
      console.error("Error loading repository files:", error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const buildFileTree = async (items: any[], owner: string, repo: string, basePath: string): Promise<FileItem[]> => {
    const fileTree: FileItem[] = []

    for (const item of items) {
      if (item.type === "dir") {
        try {
          const children = await githubApi!.getRepositoryContents(owner, repo, item.path)
          const childTree = await buildFileTree(children, owner, repo, item.path)
          fileTree.push({
            name: item.name,
            path: item.path,
            type: "directory",
            children: childTree,
          })
        } catch (error) {
          // Skip directories we can't access
          fileTree.push({
            name: item.name,
            path: item.path,
            type: "directory",
            children: [],
          })
        }
      } else if (item.type === "file" && isTestableFile(item.name)) {
        fileTree.push({
          name: item.name,
          path: item.path,
          type: "file",
          language: getFileLanguage(item.name),
        })
      }
    }

    return fileTree
  }

  const handleFileSelect = (filePath: string, selected: boolean) => {
    if (selected) {
      setSelectedFiles([...selectedFiles, filePath])
    } else {
      setSelectedFiles(selectedFiles.filter((path) => path !== filePath))
    }
  }

  const handleGenerateTests = async () => {
    if (!githubApi || !selectedRepo || selectedFiles.length === 0) return

    try {
      const [owner, repoName] = selectedRepo.full_name.split("/")
      const contents: Array<{ path: string; content: string }> = []

      for (const filePath of selectedFiles) {
        try {
          const content = await githubApi.getFileContent(owner, repoName, filePath)
          contents.push({ path: filePath, content })
        } catch (error) {
          console.error(`Error loading content for ${filePath}:`, error)
        }
      }

      setFileContents(contents)
      setAppState("test-generation")
    } catch (error) {
      console.error("Error loading file contents:", error)
    }
  }

  const handleBack = () => {
    switch (appState) {
      case "repo-select":
        setAppState("landing")
        setGithubApi(null)
        break
      case "file-browser":
        setAppState("repo-select")
        setSelectedRepo(null)
        setFiles([])
        setSelectedFiles([])
        break
      case "test-generation":
        setAppState("file-browser")
        break
      case "test-management":
        setAppState("test-generation")
        break
      case "pr-creation":
        setAppState("test-generation")
        break
    }
  }

  const handleManageTests = () => {
    setAppState("test-management")
  }

  const handleCreatePR = (testCases: GeneratedTestCode[], summaries: TestCaseSummary[]) => {
    setPrTestCases(testCases)
    setPrTestSummaries(summaries)
    setAppState("pr-creation")
  }

  if (appState === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <TestTube className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">TestGen AI</h1>
                  <p className="text-sm text-muted-foreground">Intelligent Test Case Generator</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-medium">
                Workik AI Assignment
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Generate Test Cases with AI</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect your GitHub repository and let AI generate comprehensive test cases for your codebase. Support
                for React, Python, and more frameworks.
              </p>
            </div>

            {/* GitHub Connection Card */}
            <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Github className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle className="text-xl">Connect GitHub Repository</CardTitle>
                <CardDescription>
                  Authenticate with GitHub to access your repositories and generate test cases
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button size="lg" className="gap-2" onClick={() => setAppState("auth")}>
                  <Github className="w-5 h-5" />
                  Connect GitHub
                </Button>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileCode className="w-6 h-6 text-primary" />
                    <CardTitle className="text-lg">File Browser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Browse and select multiple files from your repository to generate targeted test cases.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TestTube className="w-6 h-6 text-primary" />
                    <CardTitle className="text-lg">AI Test Generation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Generate comprehensive test cases using AI for React, Python, and other frameworks.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <GitPullRequest className="w-6 h-6 text-primary" />
                    <CardTitle className="text-lg">Auto PR Creation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Automatically create pull requests with generated test cases directly to your repository.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Process Steps */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Simple 4-step process to generate and integrate test cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold mx-auto">
                      1
                    </div>
                    <h4 className="font-medium">Connect GitHub</h4>
                    <p className="text-sm text-muted-foreground">Authenticate and select repository</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold mx-auto">
                      2
                    </div>
                    <h4 className="font-medium">Select Files</h4>
                    <p className="text-sm text-muted-foreground">Choose files for test generation</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold mx-auto">
                      3
                    </div>
                    <h4 className="font-medium">Generate Tests</h4>
                    <p className="text-sm text-muted-foreground">AI creates test case summaries</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold mx-auto">
                      4
                    </div>
                    <h4 className="font-medium">Create PR</h4>
                    <p className="text-sm text-muted-foreground">Auto-generate pull request</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {appState !== "landing" && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <TestTube className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">TestGen AI</h1>
                  {selectedRepo && <p className="text-sm text-muted-foreground">{selectedRepo.full_name}</p>}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="font-medium">
              Workik AI Assignment
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {appState === "auth" && <GitHubAuth onAuthenticated={handleAuthentication} />}

          {appState === "repo-select" && githubApi && (
            <RepositorySelector githubApi={githubApi} onRepositorySelect={handleRepositorySelect} />
          )}

          {appState === "file-browser" && (
            <div>
              {isLoadingFiles ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading repository files...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <FileBrowser
                  files={files}
                  selectedFiles={selectedFiles}
                  onFileSelect={handleFileSelect}
                  onGenerateTests={handleGenerateTests}
                />
              )}
            </div>
          )}

          {appState === "test-generation" && (
            <TestGeneration
              selectedFiles={fileContents}
              onBack={handleBack}
              onManageTests={handleManageTests}
              onCreatePR={handleCreatePR}
            />
          )}

          {appState === "test-management" && <TestCaseManager onBack={handleBack} />}

          {/* Added PR creation component */}
          {appState === "pr-creation" && githubApi && selectedRepo && (
            <PRCreator
              githubApi={githubApi}
              repository={{
                owner: selectedRepo.full_name.split("/")[0],
                name: selectedRepo.full_name.split("/")[1],
                full_name: selectedRepo.full_name,
              }}
              testCases={prTestCases}
              testSummaries={prTestSummaries}
              onBack={handleBack}
            />
          )}
        </div>
      </main>
    </div>
  )
}
