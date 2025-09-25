"use client"

import React from "react"

export default function TestComponent() {
  // Условный рендер
  if (true) {
    return (
      <div>Conditional render</div>
    )
  }

  const handleFunction = async () => {
    console.log("test")
  }

  return (
    <div className="container">
      <div>Main return</div>
    </div>
  )
}