"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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

const TreeNodeItem: React.FC<{
  node: TreeNode
  level: number
  onToggle: (nodeId: string) => void
  onNodeClick: (node: TreeNode) => void
  isOpen: boolean
  activePath: string | null
}> = ({ node, level, onToggle, onNodeClick, isOpen, activePath }) => {
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === "folder"
  const isActive = !isFolder && node.href === activePath

  const content = (
    <>
      {isFolder ? (
        <>
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            )
          ) : (
            <div className="w-4 h-4 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-blue-500 shrink-0" />
          )}
        </>
      ) : (
        <FileText className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-600" : "text-gray-600")} />
      )}
      <span className="truncate">{node.title}</span>
    </>
  )

  const itemClasses = cn(
    "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
    "text-sm font-medium",
    level > 0 && "ml-4",
    isActive
      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
      : "hover:bg-gray-100 dark:hover:bg-gray-800"
  )

  return (
    <div>
      {isFolder ? (
        <div
          className={itemClasses}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={(e) => { e.stopPropagation(); onToggle(node.id) }}
        >
          {content}
        </div>
      ) : node.href ? (
        <Link
          href={node.href}
          prefetch={true}
          className={itemClasses}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => onNodeClick(node)}
        >
          {content}
        </Link>
      ) : (
        <div
          className={itemClasses}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={(e) => { e.stopPropagation(); onNodeClick(node) }}
        >
          {content}
        </div>
      )}

      {isFolder && hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onNodeClick={onNodeClick}
              isOpen={child.isOpen || false}
              activePath={activePath}
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
  const pathname = usePathname()
  const [openNodes, setOpenNodes] = React.useState<Set<string>>(() => {
    // Auto-open folders that contain the active page
    const initial = new Set<string>()
    for (const folder of data) {
      if (folder.children?.some(child => child.href === pathname)) {
        initial.add(folder.id)
      }
    }
    return initial
  })

  // Keep folders open when navigating
  React.useEffect(() => {
    setOpenNodes(prev => {
      const next = new Set(prev)
      for (const folder of data) {
        if (folder.children?.some(child => child.href === pathname)) {
          next.add(folder.id)
        }
      }
      return next
    })
  }, [pathname, data])

  const handleToggle = (nodeId: string) => {
    setOpenNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const handleNodeClick = (node: TreeNode) => {
    if (onNodeClick) {
      onNodeClick(node)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {data.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          onToggle={handleToggle}
          onNodeClick={handleNodeClick}
          isOpen={openNodes.has(node.id)}
          activePath={pathname}
        />
      ))}
    </div>
  )
}
