import { Panel, Skeleton } from "../ui.jsx";

function TileSkeleton() {
  return (
    <Panel className="flex flex-col gap-3 p-6">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded-md" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
    </Panel>
  );
}

function ChartSkeleton({ className = "" }) {
  return (
    <Panel className={`p-6 ${className}`}>
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-5 h-[240px] w-full rounded-lg" />
    </Panel>
  );
}

function ListSkeleton({ rows = 4, className = "" }) {
  return (
    <Panel className={`p-6 ${className}`}>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-2 h-3 w-44" />
      <ul className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <li key={index} className="flex items-center gap-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="ml-auto h-5 w-24 rounded-full" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// Shown while /api/analytics is in flight.
export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <ChartSkeleton className="xl:col-span-7" />
        <ListSkeleton className="xl:col-span-5" />
        <ChartSkeleton className="xl:col-span-8" />
        <ListSkeleton rows={5} className="xl:col-span-4" />
      </div>
      <Skeleton className="h-[92px] w-full rounded-xl" />
    </div>
  );
}
