"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitHubAuth } from "@/components/github-auth"
import { RepositorySelector } from "@/components/repository-selector"
import { FileBrowser } from "@/components/file-browser"
import { GitHubAPI, getFileLanguage, isTestableFile } from "@/lib/github-api"
import { Github, FileCode, TestTube, GitPullRequest, ArrowLeft, Sparkles, Zap, Shield } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        <header className="border-b border-white/20 bg-gradient-to-r from-white/90 to-indigo-50/90 backdrop-blur-xl dark:from-slate-900/90 dark:to-indigo-900/90 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <TestTube className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    TestGen AI
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Intelligent Test Case Generator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-3xl -z-10" />
              <div className="space-y-4">
                <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
                  Generate Test Cases with AI
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  Connect your GitHub repository and let AI generate comprehensive test cases for your codebase.
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {" "}
                    Support for React, Python, and more frameworks.
                  </span>
                </p>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg backdrop-blur-sm border border-indigo-100 dark:border-indigo-800">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Powered</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg backdrop-blur-sm border border-green-100 dark:border-green-800">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Secure</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg backdrop-blur-sm border border-purple-100 dark:border-purple-800">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Smart</span>
                </div>
              </div>
            </div>

            <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/25 bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-900 dark:to-indigo-900/20 group">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-900 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <Github className="w-10 h-10 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Connect GitHub Repository
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                  Authenticate with GitHub to access your repositories and generate intelligent test cases
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <Button
                  size="lg"
                  className="gap-3 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => setAppState("auth")}
                >
                  <Github className="w-6 h-6" />
                  Connect GitHub
                </Button>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-900/20 border-blue-100 dark:border-blue-800">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <FileCode className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">File Browser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Browse and select multiple files from your repository to generate targeted test cases with
                    intelligent filtering.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-900/20 border-purple-100 dark:border-purple-800">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <TestTube className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      AI Test Generation
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Generate comprehensive test cases using advanced AI for React, Python, and other popular frameworks.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-green-50/50 dark:from-slate-900 dark:to-green-900/20 border-green-100 dark:border-green-800">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <GitPullRequest className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      Auto PR Creation
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Automatically create pull requests with generated test cases directly to your repository with one
                    click.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 border-slate-200 dark:border-slate-700 shadow-xl">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">How It Works</CardTitle>
                <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                  Simple 4-step process to generate and integrate test cases seamlessly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-8">
                  {[
                    {
                      step: 1,
                      title: "Connect GitHub",
                      desc: "Authenticate and select repository",
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      step: 2,
                      title: "Select Files",
                      desc: "Choose files for test generation",
                      color: "from-purple-500 to-pink-500",
                    },
                    {
                      step: 3,
                      title: "Generate Tests",
                      desc: "AI creates test case summaries",
                      color: "from-green-500 to-emerald-500",
                    },
                    {
                      step: 4,
                      title: "Create PR",
                      desc: "Auto-generate pull request",
                      color: "from-orange-500 to-red-500",
                    },
                  ].map((item, index) => (
                    <div key={index} className="text-center space-y-4 group">
                      <div className="relative">
                        <div
                          className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${item.color} text-white rounded-2xl text-xl font-bold mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                        >
                          {item.step}
                        </div>
                        {index < 3 && (
                          <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600" />
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{item.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <header className="border-b border-white/20 bg-gradient-to-r from-white/90 to-indigo-50/90 backdrop-blur-xl dark:from-slate-900/90 dark:to-indigo-900/90 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {appState !== "landing" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <TestTube className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    TestGen AI
                  </h1>
                  {selectedRepo && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{selectedRepo.full_name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
