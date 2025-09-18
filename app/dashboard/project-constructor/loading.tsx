import * as React from "react"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-6"></div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 w-full bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="h-[500px] w-full bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
