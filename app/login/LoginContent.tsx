"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginFormSimple } from "../../components/login-form-simple"
import { ThemeToggle } from "@/components/theme-toggle"
import { PresentationSlides } from "@/components/login/PresentationSlides"

export default function LoginContent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10 overflow-auto bg-[#0f1117] text-white">
        <div className="flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Get2B
          </a>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginFormSimple />
          </div>
        </div>
      </div>
      <div className="relative bg-muted lg:block h-svh overflow-hidden">
        <PresentationSlides />
      </div>
    </div>
  )
}
