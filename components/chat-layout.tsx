"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { X, Save } from "lucide-react"
import { motion } from "framer-motion"

export default function ChatLayout({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex-none h-14 border-b px-4 flex items-center justify-between bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
        <h1 className="text-sm font-medium">Чат с Get2B</h1>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 hover:bg-primary/10 transition-colors duration-300"
            >
              <Save className="h-4 w-4" />
              Сохранить разговор
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 transition-colors duration-300"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
