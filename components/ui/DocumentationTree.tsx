"use client"

import * as React from "react"
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeNode {
  id: string
  title: string
  type: "folder" | "page"
  children?: TreeNode[]
  href?: string
  isOpen?: boolean
}

interface DocumentationTreeProps {
  data: TreeNode[]
  className?: string
  onNodeClick?: (node: TreeNode) => void
}

const TreeNode: React.FC<{
  node: TreeNode
  level: number
  onToggle: (nodeId: string) => void
  onNodeClick: (node: TreeNode) => void
  isOpen: boolean
}> = ({ node, level, onToggle, onNodeClick, isOpen }) => {
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === "folder"

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      onToggle(node.id)
    } else {
      onNodeClick(node)
    }
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "text-sm font-medium",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
          <>
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
          </>
        ) : (
          <FileText className="w-4 h-4 text-gray-600" />
        )}
        <span className="truncate">{node.title}</span>
      </div>
      
      {isFolder && hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onNodeClick={onNodeClick}
              isOpen={child.isOpen || false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const DocumentationTree: React.FC<DocumentationTreeProps> = ({
  data,
  className,
  onNodeClick
}) => {
  const [openNodes, setOpenNodes] = React.useState<Set<string>>(new Set())

  const handleToggle = (nodeId: string) => {
    const newOpenNodes = new Set(openNodes)
    if (newOpenNodes.has(nodeId)) {
      newOpenNodes.delete(nodeId)
    } else {
      newOpenNodes.add(nodeId)
    }
    setOpenNodes(newOpenNodes)
  }

  const handleNodeClick = (node: TreeNode) => {
    if (onNodeClick) {
      onNodeClick(node)
    }
  }

  const isNodeOpen = (nodeId: string) => openNodes.has(nodeId)

  return (
    <div className={cn("w-full", className)}>
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onToggle={handleToggle}
          onNodeClick={handleNodeClick}
          isOpen={isNodeOpen(node.id)}
        />
      ))}
    </div>
  )
} 