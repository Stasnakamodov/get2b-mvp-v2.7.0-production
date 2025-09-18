import * as React from "react"

export default function Loading() {
  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
