"use client"

import React from "react"
import BackgroundPaths from "@/components/kokonutui/background-paths"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function BackgroundDemoPage() {
  return (
    <div className="min-h-screen relative">
      {/* Фон с анимированными линиями */}
      <BackgroundPaths />

      {/* Только кнопка "Кто мы" в верхнем правом углу */}
      <div className="absolute top-6 right-6 z-10">
        <Link href="/who-we-are">
          <Button variant="ghost" className="text-white">
            Кто мы
          </Button>
        </Link>
      </div>
    </div>
  )
}
