import { GridPattern } from '@/components/home/GridPattern'

export function HeroPattern() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-x-4 top-0 z-0 h-88 max-w-none overflow-hidden sm:-inset-x-6 sm:h-96 lg:-inset-x-8 lg:h-100"
    >
      <div className="absolute top-0 left-1/2 -ml-152 h-full w-325 max-w-none dark:mask-[linear-gradient(white,transparent)]">
        <div className="absolute inset-0 bg-linear-to-r from-brand-violet/45 to-brand-indigo/30 mask-[radial-gradient(farthest-side_at_top,white,transparent)] opacity-70 dark:from-brand-violet/55 dark:to-hero-glow dark:opacity-100">
          <GridPattern
            width={72}
            height={56}
            x={-12}
            y={4}
            squares={[
              [4, 3],
              [2, 1],
              [7, 3],
              [10, 6],
            ]}
            className="absolute inset-x-0 inset-y-[-50%] h-[200%] w-full skew-y-[-18deg] fill-brand-indigo/35 stroke-brand-violet/50 mix-blend-overlay dark:fill-white/2.5 dark:stroke-white/5 dark:mix-blend-normal"
          />
        </div>
        <svg
          viewBox="0 0 1113 440"
          aria-hidden="true"
          className="absolute top-0 left-1/2 -ml-76 w-278.25 fill-surface-page blur-[26px] dark:hidden"
        >
          <path d="M.016 439.5s-9.5-300 434-300S882.516 20 882.516 20V0h230.004v439.5H.016Z" />
        </svg>
      </div>
    </div>
  )
}
