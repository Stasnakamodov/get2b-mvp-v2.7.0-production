"use client"

import * as React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { ProjectError, NetworkError } from "@/lib/types"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Ошибка в компоненте:", error, errorInfo)

    // Здесь можно добавить логирование ошибок в сервис аналитики
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Если передан компонент для отображения ошибки, используем его
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Иначе отображаем стандартное сообщение об ошибке
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Произошла ошибка</h2>
          <p className="text-red-600 mb-4">
            {this.state.error instanceof ProjectError
              ? "Ошибка в проекте: "
              : this.state.error instanceof NetworkError
                ? "Ошибка сети: "
                : "Неизвестная ошибка: "}
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
