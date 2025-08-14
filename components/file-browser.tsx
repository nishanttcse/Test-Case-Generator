"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  FileCode,
  Folder,
  FolderOpen,
  Search,
  CheckSquare,
  Square,
  Eye,
  Filter,
  FileText,
  Code,
  Database,
  ImageIcon,
  Settings,
} from "lucide-react"

interface FileItem {
  name: string
  path: string
  type: "file" | "directory"
  language?: string
  children?: FileItem[]
}

interface FileBrowserProps {
  files: FileItem[]
  selectedFiles: string[]
  onFileSelect: (filePath: string, selected: boolean) => void
  onGenerateTests: () => void
}

const getFileIcon = (filename: string, language?: string) => {
  const ext = filename.split(".").pop()?.toLowerCase()

  if (language === "JavaScript" || language === "React") return <Code className="w-4 h-4 text-yellow-500" />
  if (language === "TypeScript") return <Code className="w-4 h-4 text-blue-500" />
  if (language === "Python") return <Code className="w-4 h-4 text-green-500" />
  if (language === "Java") return <Code className="w-4 h-4 text-red-500" />
  if (["json", "xml", "yaml", "yml"].includes(ext || "")) return <Settings className="w-4 h-4 text-gray-500" />
  if (["sql", "db"].includes(ext || "")) return <Database className="w-4 h-4 text-purple-500" />
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext || "")) return <ImageIcon className="w-4 h-4 text-pink-500" />
  if (["md", "txt", "doc"].includes(ext || "")) return <FileText className="w-4 h-4 text-blue-400" />

  return <FileCode className="w-4 h-4 text-gray-500" />
}

const getLanguageColor = (language?: string) => {
  const colors: Record<string, string> = {
    JavaScript: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    React: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    TypeScript: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Python: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Java: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "C++": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Go: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  }
  return colors[language || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

export function FileBrowser({ files, selectedFiles, onFileSelect, onGenerateTests }: FileBrowserProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set())
  const [previewFile, setPreviewFile] = useState<string | null>(null)

  // Get all files recursively for statistics and filtering
  const allFiles = useMemo(() => {
    const extractFiles = (items: FileItem[]): FileItem[] => {
      const result: FileItem[] = []
      for (const item of items) {
        if (item.type === "file") {
          result.push(item)
        } else if (item.children) {
          result.push(...extractFiles(item.children))
        }
      }
      return result
    }
    return extractFiles(files)
  }, [files])

  // Get unique languages for filtering
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>()
    allFiles.forEach((file) => {
      if (file.language) languages.add(file.language)
    })
    return Array.from(languages).sort()
  }, [allFiles])

  // Filter files based on search and language
  const filteredFiles = useMemo(() => {
    const filterItems = (items: FileItem[]): FileItem[] => {
      return items
        .filter((item) => {
          if (item.type === "directory") {
            const filteredChildren = item.children ? filterItems(item.children) : []
            return filteredChildren.length > 0 || item.name.toLowerCase().includes(searchQuery.toLowerCase())
          } else {
            const matchesSearch =
              searchQuery === "" ||
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.path.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesLanguage =
              selectedLanguages.size === 0 || (item.language && selectedLanguages.has(item.language))
            return matchesSearch && matchesLanguage
          }
        })
        .map((item) => {
          if (item.type === "directory" && item.children) {
            return { ...item, children: filterItems(item.children) }
          }
          return item
        })
    }
    return filterItems(files)
  }, [files, searchQuery, selectedLanguages])

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  const toggleLanguageFilter = (language: string) => {
    const newSelected = new Set(selectedLanguages)
    if (newSelected.has(language)) {
      newSelected.delete(language)
    } else {
      newSelected.add(language)
    }
    setSelectedLanguages(newSelected)
  }

  const selectAllFiles = () => {
    const allFilePaths = allFiles.map((file) => file.path)
    allFilePaths.forEach((path) => {
      if (!selectedFiles.includes(path)) {
        onFileSelect(path, true)
      }
    })
  }

  const clearAllFiles = () => {
    selectedFiles.forEach((path) => onFileSelect(path, false))
  }

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${depth * 16}px` }}>
        {item.type === "directory" ? (
          <div>
            <div
              className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md cursor-pointer group transition-colors"
              onClick={() => toggleDirectory(item.path)}
            >
              {expandedDirs.has(item.path) ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm font-medium flex-1">{item.name}</span>
              <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {item.children?.length || 0} items
              </Badge>
            </div>
            {expandedDirs.has(item.path) && item.children && (
              <div className="ml-2 border-l border-muted-foreground/20">{renderFileTree(item.children, depth + 1)}</div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md group transition-colors">
            <Checkbox
              checked={selectedFiles.includes(item.path)}
              onCheckedChange={(checked) => onFileSelect(item.path, !!checked)}
              className="shrink-0"
            />
            {getFileIcon(item.name, item.language)}
            <span className="text-sm flex-1 truncate">{item.name}</span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.language && (
                <Badge variant="secondary" className={`text-xs ${getLanguageColor(item.language)}`}>
                  {item.language}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPreviewFile(previewFile === item.path ? null : item.path)}
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    ))
  }

  const fileStats = {
    total: allFiles.length,
    selected: selectedFiles.length,
    byLanguage: allFiles.reduce(
      (acc, file) => {
        const lang = file.language || "Unknown"
        acc[lang] = (acc[lang] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  }

  return (
    <div className="space-y-6">
      {/* File Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Repository Files</CardTitle>
              <CardDescription>
                {fileStats.total} testable files found • {fileStats.selected} selected
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {selectedFiles.length} / {fileStats.total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {Object.entries(fileStats.byLanguage).map(([lang, count]) => (
              <Badge
                key={lang}
                variant="outline"
                className={`text-xs cursor-pointer transition-colors ${
                  selectedLanguages.has(lang) ? getLanguageColor(lang) : ""
                }`}
                onClick={() => toggleLanguageFilter(lang)}
              >
                {lang} ({count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files and directories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedLanguages.size > 0 ? `${selectedLanguages.size} languages filtered` : "All languages"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllFiles}
                  disabled={selectedFiles.length === allFiles.length}
                  className="gap-1 bg-transparent"
                >
                  <CheckSquare className="w-3 h-3" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={selectedFiles.length === 0}
                  className="gap-1 bg-transparent"
                >
                  <Square className="w-3 h-3" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            File Browser
            <Badge variant="secondary">{filteredFiles.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded-md">
            <div className="p-4 space-y-1">
              {filteredFiles.length > 0 ? (
                renderFileTree(filteredFiles)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No files match your search criteria</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* File Preview */}
      {previewFile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">File Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                ×
              </Button>
            </div>
            <CardDescription>{previewFile}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-md p-4 font-mono text-sm">
              <p className="text-muted-foreground">
                File preview functionality will be implemented with actual GitHub API integration.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Generate Tests Button */}
      <div className="flex justify-end">
        <Button onClick={onGenerateTests} disabled={selectedFiles.length === 0} size="lg" className="gap-2">
          <FileCode className="w-4 h-4" />
          Generate Test Cases ({selectedFiles.length} files)
        </Button>
      </div>
    </div>
  )
}
