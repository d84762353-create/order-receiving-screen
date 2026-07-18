'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4 bg-background">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Terjadi Kesalahan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.digest ? `Error ID: ${error.digest}` : 'Silakan coba lagi.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
        >
          Coba Lagi
        </button>
      </div>
    </main>
  )
}
