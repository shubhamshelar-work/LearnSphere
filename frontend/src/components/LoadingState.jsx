export default function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      <p className="mt-4 text-sm text-muted">{message}</p>
    </div>
  )
}
