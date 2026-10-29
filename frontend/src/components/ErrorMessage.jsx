import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-semibold text-red-700 underline underline-offset-2 sm:ml-auto"
        >
          Try again
        </button>
      )}
    </div>
  )
}
