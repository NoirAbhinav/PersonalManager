interface Props {
  name: string
  color: string
}

export default function CategoryBadge({ name, color }: Props) {
  if (!name) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        Uncategorized
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: color + '20',
        color: color,
      }}
    >
      {name}
    </span>
  )
}