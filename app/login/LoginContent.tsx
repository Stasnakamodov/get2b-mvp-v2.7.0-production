"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginFormSimple } from "../../components/login-form-simple"
import { ThemeToggle } from "@/components/theme-toggle"
import { PresentationSlides } from "@/components/login/PresentationSlides"

export default function LoginContent() {
  return (
    <div className="relative grid min-h-svh overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-blue-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-40 h-[560px] w-[560px] rounded-full bg-orange-500/10 blur-[140px]" />

      <div className="relative flex flex-col gap-4 overflow-auto p-6 md:p-10">
        <div className="flex items-center justify-between">
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
      <div className="relative h-svh overflow-hidden lg:block">
        <PresentationSlides />
      </div>
    </div>
  )
}
