function patternIdFromProps(
  width: number,
  height: number,
  x: string | number,
  y: string | number,
  squares: Array<[number, number]> | undefined,
) {
  const sq = squares?.map(([a, b]) => `${a}x${b}`).join('-') ?? 'none'
  const slug = (value: string | number) =>
    String(value).replace(/[^a-zA-Z0-9]+/g, '-')
  return `grid-${width}-${height}-${slug(x)}-${slug(y)}-${sq}`
}

export function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentPropsWithoutRef<'svg'> & {
  width: number
  height: number
  x: string | number
  y: string | number
  squares: Array<[x: number, y: number]>
}) {
  let patternId = patternIdFromProps(width, height, x, y, squares)

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  )
}
