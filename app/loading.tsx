import { LoaderCircle } from 'lucide-react'

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <LoaderCircle className="size-8 animate-spin" />
        <p className="text-sm font-medium">Memuat...</p>
      </div>
    </main>
  )
}
