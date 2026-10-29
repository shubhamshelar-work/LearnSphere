export default function DashboardStatCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
