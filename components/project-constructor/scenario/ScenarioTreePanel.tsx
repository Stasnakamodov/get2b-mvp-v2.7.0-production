'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  GitBranch,
  Plus,
  Check,
  Snowflake,
  Trash2,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  Truck,
} from 'lucide-react'
import type { ScenarioTreeNode, CreatorRole } from '@/types/scenario-mode.types'
import type { StepNumber } from '@/types/project-constructor.types'

interface ScenarioTreePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  treeData: ScenarioTreeNode[]
  activeScenarioId: string | null
  onCreateBranch: (parentId: string | null, step: StepNumber, name: string) => Promise<string | null>
  onSelectScenario: (id: string) => Promise<boolean>
  onSwitchScenario: (id: string) => void
  onDeleteScenario: (id: string) => Promise<boolean>
  loading: boolean
}

const roleIcons: Record<CreatorRole, React.ReactNode> = {
  client: <User className="h-3 w-3" />,
  manager: <Users className="h-3 w-3" />,
  supplier: <Truck className="h-3 w-3" />,
}

const roleLabels: Record<CreatorRole, string> = {
  client: 'Клиент',
  manager: 'Менеджер',
  supplier: 'Поставщик',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  frozen: 'bg-blue-100 text-blue-800',
  selected: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  active: 'Активный',
  frozen: 'Заморожен',
  selected: 'Выбран',
  archived: 'Архив',
}

function ScenarioNodeItem({
  node,
  activeScenarioId,
  onCreateBranch,
  onSelectScenario,
  onSwitchScenario,
  onDeleteScenario,
}: {
  node: ScenarioTreeNode
  activeScenarioId: string | null
  onCreateBranch: (parentId: string | null, step: StepNumber, name: string) => Promise<string | null>
  onSelectScenario: (id: string) => Promise<boolean>
  onSwitchScenario: (id: string) => void
  onDeleteScenario: (id: string) => Promise<boolean>
}) {
  const [expanded, setExpanded] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [creating, setCreating] = useState(false)

  const isCurrentActive = node.id === activeScenarioId
  const hasChildren = node.children.length > 0
  const canBranch = node.tree_depth < 3 && node.status === 'active'

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return
    setCreating(true)
    await onCreateBranch(node.id, node.branched_at_step || 1, newBranchName.trim())
    setNewBranchName('')
    setShowCreateForm(false)
    setCreating(false)
  }

  return (
    <div style={{ marginLeft: (node.tree_depth - 1) * 20 }}>
      {/* Нода */}
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg mb-1 cursor-pointer transition-all
          ${isCurrentActive
            ? 'bg-purple-50 border border-purple-300 shadow-sm'
            : 'hover:bg-gray-50 border border-transparent'
          }
          ${node.isFrozen ? 'opacity-60' : ''}
        `}
        onClick={() => {
          if (!node.isFrozen) {
            onSwitchScenario(node.id)
          }
        }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
            }
          </button>
        ) : (
          <div className="w-4.5" />
        )}

        {/* Branch icon */}
        <GitBranch className={`h-4 w-4 flex-shrink-0 ${isCurrentActive ? 'text-purple-600' : 'text-gray-400'}`} />

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium truncate ${isCurrentActive ? 'text-purple-900' : 'text-gray-700'}`}>
              {node.name}
            </span>
            {node.changedSteps.length > 0 && (
              <span className="text-xs text-gray-400">
                ({node.changedSteps.length} шаг.)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Creator role */}
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              {roleIcons[node.creator_role]}
              {roleLabels[node.creator_role]}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${statusColors[node.status]}`}>
          {node.isSelected && <Check className="h-3 w-3 mr-0.5" />}
          {node.isFrozen && <Snowflake className="h-3 w-3 mr-0.5" />}
          {statusLabels[node.status]}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {canBranch && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowCreateForm(!showCreateForm) }}
              className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
              title="Создать подветку"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {node.status === 'active' && !isCurrentActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectScenario(node.id) }}
              className="p-1 hover:bg-green-100 rounded text-gray-400 hover:text-green-600"
              title="Выбрать сценарий"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
          {node.status !== 'selected' && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteScenario(node.id) }}
              className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
              title="Удалить"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Create branch form */}
      {showCreateForm && (
        <div className="ml-8 mb-2 flex items-center gap-2">
          <Input
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="Название ветки..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
          />
          <Button
            size="sm"
            onClick={handleCreateBranch}
            disabled={creating || !newBranchName.trim()}
            className="h-8"
          >
            {creating ? '...' : 'OK'}
          </Button>
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ScenarioNodeItem
              key={child.id}
              node={child}
              activeScenarioId={activeScenarioId}
              onCreateBranch={onCreateBranch}
              onSelectScenario={onSelectScenario}
              onSwitchScenario={onSwitchScenario}
              onDeleteScenario={onDeleteScenario}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ScenarioTreePanel({
  open,
  onOpenChange,
  treeData,
  activeScenarioId,
  onCreateBranch,
  onSelectScenario,
  onSwitchScenario,
  onDeleteScenario,
  loading,
}: ScenarioTreePanelProps) {
  const [showRootCreate, setShowRootCreate] = useState(false)
  const [rootBranchName, setRootBranchName] = useState('')
  const [creatingRoot, setCreatingRoot] = useState(false)

  const handleCreateRoot = async () => {
    if (!rootBranchName.trim()) return
    setCreatingRoot(true)
    await onCreateBranch(null, 1, rootBranchName.trim())
    setRootBranchName('')
    setShowRootCreate(false)
    setCreatingRoot(false)
  }

  const totalScenarios = treeData.reduce(
    (count, node) => count + 1 + countChildren(node),
    0
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[380px] sm:max-w-[380px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-purple-600" />
            Сценарии
            <Badge variant="secondary" className="ml-1">{totalScenarios}</Badge>
          </SheetTitle>
          <SheetDescription>
            Альтернативные варианты конфигурации сделки
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
              Загрузка...
            </div>
          ) : treeData.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Нет сценариев</p>
              <p className="text-xs text-gray-400 mb-4">
                Создайте первый сценарий для начала работы с альтернативными вариантами
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {treeData.map((node) => (
                <ScenarioNodeItem
                  key={node.id}
                  node={node}
                  activeScenarioId={activeScenarioId}
                  onCreateBranch={onCreateBranch}
                  onSelectScenario={onSelectScenario}
                  onSwitchScenario={onSwitchScenario}
                  onDeleteScenario={onDeleteScenario}
                />
              ))}
            </div>
          )}

          {/* Create root branch */}
          <div className="mt-4 border-t pt-4">
            {showRootCreate ? (
              <div className="flex items-center gap-2">
                <Input
                  value={rootBranchName}
                  onChange={(e) => setRootBranchName(e.target.value)}
                  placeholder="Название сценария..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoot()}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleCreateRoot}
                  disabled={creatingRoot || !rootBranchName.trim()}
                  className="h-8"
                >
                  {creatingRoot ? '...' : 'OK'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRootCreate(false)}
                  className="h-8"
                >
                  X
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowRootCreate(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Новый сценарий
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function countChildren(node: ScenarioTreeNode): number {
  return node.children.reduce(
    (count, child) => count + 1 + countChildren(child),
    0
  )
}
