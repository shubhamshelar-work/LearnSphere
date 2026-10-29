import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
        <Inbox className="h-7 w-7 text-primary-600" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
