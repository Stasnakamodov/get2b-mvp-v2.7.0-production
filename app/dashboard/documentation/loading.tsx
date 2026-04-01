import { Loader2, BookOpen } from "lucide-react"

export default function DocumentationLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <BookOpen className="w-10 h-10 text-blue-200 dark:text-blue-900" />
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin absolute -top-1 -right-2" />
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">
        Загрузка документации...
      </p>
    </div>
  )
}
