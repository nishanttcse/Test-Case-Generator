interface GitHubFile {
  name: string
  path: string
  type: "file" | "dir"
  download_url?: string
  url: string
}

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  private: boolean
}

interface CreateFileRequest {
  path: string
  content: string
  message: string
  branch?: string
}

interface PullRequestData {
  title: string
  body: string
  head: string
  base: string
}

export class GitHubAPI {
  private token: string
  private baseUrl = "https://api.github.com"

  constructor(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async getUser() {
    return this.request("/user")
  }

  async getRepositories(): Promise<GitHubRepo[]> {
    const repos = await this.request("/user/repos?sort=updated&per_page=100")
    return repos.filter((repo: GitHubRepo) => !repo.private || true) // Include private repos for demo
  }

  async getRepositoryContents(owner: string, repo: string, path = ""): Promise<GitHubFile[]> {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`
    return this.request(endpoint)
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const file = await this.request(`/repos/${owner}/${repo}/contents/${path}`)
    if (file.content) {
      return atob(file.content.replace(/\n/g, ""))
    }
    throw new Error("File content not available")
  }

  async getRepository(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}`)
  }

  async getBranch(owner: string, repo: string, branch: string) {
    return this.request(`/repos/${owner}/${repo}/branches/${branch}`)
  }

  async createBranch(owner: string, repo: string, newBranch: string, fromBranch = "main") {
    try {
      // Get the SHA of the source branch
      const sourceBranch = await this.getBranch(owner, repo, fromBranch)
      const sha = sourceBranch.commit.sha

      // Create new branch
      return this.request(`/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha: sha,
        }),
      })
    } catch (error) {
      // If main branch doesn't exist, try master
      if (fromBranch === "main") {
        return this.createBranch(owner, repo, newBranch, "master")
      }
      throw error
    }
  }

  async createOrUpdateFile(owner: string, repo: string, fileData: CreateFileRequest) {
    const { path, content, message, branch = "main" } = fileData

    try {
      // Check if file exists
      const existingFile = await this.request(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)

      // Update existing file
      return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: btoa(content),
          branch,
          sha: existingFile.sha,
        }),
      })
    } catch (error) {
      // File doesn't exist, create new file
      return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: btoa(content),
          branch,
        }),
      })
    }
  }

  async createPullRequest(owner: string, repo: string, prData: PullRequestData) {
    const { title, body, head, base } = prData

    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    })
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const repoData = await this.getRepository(owner, repo)
      return repoData.default_branch || "main"
    } catch (error) {
      return "main"
    }
  }
}

export function getFileLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: "JavaScript",
    jsx: "React",
    ts: "TypeScript",
    tsx: "React",
    py: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    php: "PHP",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    kt: "Kotlin",
    swift: "Swift",
  }
  return languageMap[ext || ""] || "Unknown"
}

export function isTestableFile(filename: string): boolean {
  const testableExtensions = [
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "java",
    "cpp",
    "c",
    "cs",
    "php",
    "rb",
    "go",
    "rs",
    "kt",
    "swift",
  ]
  const ext = filename.split(".").pop()?.toLowerCase()
  return testableExtensions.includes(ext || "")
}
