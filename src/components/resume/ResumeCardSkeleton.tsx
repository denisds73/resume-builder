import Skeleton from '@/components/Skeleton'

/**
 * Mirrors ResumeCard's geometry so the layout doesn't shift when real
 * data arrives. Width is governed by the parent grid; aspect of the
 * preview area matches the 8.5x11 thumbnail used in the real card.
 */
export default function ResumeCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface/40">
      <div className="relative aspect-[8.5/11] w-full overflow-hidden bg-bg-card">
        <span className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="block h-[78%] w-[60%] rounded-md" />
        </span>
      </div>
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  )
}
