"use client"

import * as React from "react"
import { ProjectProvider } from "./context/CreateProjectContext"

export default function CreateProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProjectProvider>{children}</ProjectProvider>
}
