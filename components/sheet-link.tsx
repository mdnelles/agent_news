function SheetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 13h8v2H8v-2zm0 4h8v2H8v-2z" />
    </svg>
  )
}

export function SheetLink({
  url,
  className = '',
  showLabel = false,
}: {
  url: string
  className?: string
  showLabel?: boolean
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Google Sheets"
      className={`inline-flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors ${className}`}
    >
      <SheetIcon className="w-3.5 h-3.5 shrink-0" />
      {showLabel && <span>Sheet</span>}
    </a>
  )
}
