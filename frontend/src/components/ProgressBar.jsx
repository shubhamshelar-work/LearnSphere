export default function ProgressBar({ value, label, size = 'md' }) {
  const clamped = Math.min(100, Math.max(0, value))
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-medium text-ink">{clamped}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-primary-100 ${barHeight}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
