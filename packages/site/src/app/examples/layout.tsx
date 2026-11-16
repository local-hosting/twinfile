export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <article className="flex h-full flex-col pt-16 pb-10">
      <div className="mx-auto w-full max-w-2xl flex-auto lg:max-w-5xl">
        {children}
      </div>
    </article>
  )
}
