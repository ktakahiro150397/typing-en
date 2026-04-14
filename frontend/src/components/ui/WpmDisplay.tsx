interface Props {
  wpm: number
  className?: string
  intSize?: string
  decSize?: string
}

export function WpmDisplay({
  wpm,
  className = 'text-[#1d4ed8]',
  intSize = 'text-3xl',
  decSize = 'text-xl',
}: Props) {
  const fixed = wpm.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  return (
    <span className={className}>
      <span className={`font-bold ${intSize}`}>{intPart}</span>
      <span className={`font-bold ${decSize} opacity-70`}>.{decPart}</span>
    </span>
  )
}
