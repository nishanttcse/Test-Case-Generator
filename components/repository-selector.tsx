"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { GitHubAPI } from "@/lib/github-api"
import { Search, GitBranch, Lock, Unlock, Loader2 } from "lucide-react"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  private: boolean
}

interface RepositorySelectorProps {
  githubApi: GitHubAPI
  onRepositorySelect: (repo: Repository) => void
}

export function RepositorySelector({ githubApi, onRepositorySelect }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRepositories()
  }, [])

  useEffect(() => {
    const filtered = repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredRepos(filtered)
  }, [repositories, searchQuery])

  const loadRepositories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const repos = await githubApi.getRepositories()
      setRepositories(repos)
      setFilteredRepos(repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading repositories...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={loadRepositories} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Repository</CardTitle>
        <CardDescription>Choose a repository to generate test cases for</CardDescription>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onRepositorySelect(repo)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium truncate">{repo.name}</h3>
                    {repo.private ? (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Unlock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{repo.description || "No description"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {repo.language && (
                      <Badge variant="secondary" className="text-xs">
                        {repo.language}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{repo.full_name}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Select
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
