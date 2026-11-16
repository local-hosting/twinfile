import { Button } from '@/components/Button'

export default function NotFound() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-16 text-center">
      <p className="tf-eyebrow">404</p>
      <h1 className="mt-2 text-2xl font-bold text-prose-heading">
        Page not found
      </h1>
      <p className="mt-2 text-base text-prose-body">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <Button href="/" arrow="right" className="mt-8">
        Back to docs
      </Button>
    </div>
  )
}
