"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue)
      } else {
        setSelectedValue(newValue)
      }
    },
    [onValueChange],
  )

  const contextValue = React.useMemo(
    () => ({
      value: value !== undefined ? value : selectedValue,
      onValueChange: handleValueChange,
    }),
    [value, selectedValue, handleValueChange],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children, onClick, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component")
  }

  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "",
        className,
      )}
      onClick={(e) => {
        context.onValueChange(value)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component")
  }

  const isSelected = context.value === value

  if (!isSelected) return null

  return (
    <div
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
