interface PagePlaceholderProps {
  title: string
}

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="mb-2 text-lg font-medium text-neutral-400">{title}</div>
        <div className="text-sm text-neutral-300">Under development</div>
      </div>
    </div>
  )
}
