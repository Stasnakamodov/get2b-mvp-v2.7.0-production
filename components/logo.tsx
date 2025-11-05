import React from "react"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-3xl">
      <span className="inline-block">
        <span className="text-white">Get</span>
        <span className="text-orange-500">2B</span>
      </span>
    </Link>
  )
}
