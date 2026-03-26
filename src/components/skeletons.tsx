import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const PageHeaderSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-72" />
  </div>
);

export const CardSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  </Card>
);

export const BalanceCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-32 mt-1" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-10 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const QuickActionsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="flex items-center gap-4 p-5">
          <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8">
    <PageHeaderSkeleton />
    <QuickActionsSkeleton />
    <div className="grid gap-6 lg:grid-cols-2">
      <CardSkeleton lines={5} />
      <CardSkeleton lines={5} />
    </div>
    <div>
      <Skeleton className="h-6 w-40 mb-3" />
      <CardSkeleton lines={4} />
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="max-w-2xl mx-auto">
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-36" />
      </CardContent>
    </Card>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6">
    <PageHeaderSkeleton />
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-32" />
      </CardContent>
    </Card>
  </div>
);
