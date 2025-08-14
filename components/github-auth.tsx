"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Loader2 } from "lucide-react"

interface GitHubAuthProps {
  onAuthenticated: (token: string) => void
}

export function GitHubAuth({ onAuthenticated }: GitHubAuthProps) {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async () => {
    if (!token.trim()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onAuthenticated(token)
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Github className="w-6 h-6" />
          </div>
        </div>
        <CardTitle>GitHub Authentication</CardTitle>
        <CardDescription>Enter your GitHub personal access token to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">Personal Access Token</Label>
          <Input
            id="token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Create a token at GitHub Settings → Developer settings → Personal access tokens
          </p>
        </div>
        <Button onClick={handleAuth} disabled={!token.trim() || isLoading} className="w-full gap-2">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
          {isLoading ? "Authenticating..." : "Connect GitHub"}
        </Button>
      </CardContent>
    </Card>
  )
}
