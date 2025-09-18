export default function Loading() {
  return (
    <div className="container mx-auto py-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  )
}