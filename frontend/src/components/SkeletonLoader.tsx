/**
 * SkeletonLoader — animated placeholder while content loads.
 * Used for progressive rendering and perceived performance.
 */

interface SkeletonProps {
  lines?: number;
  className?: string;
}

export default function SkeletonLoader({ lines = 3, className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-hidden="true" role="presentation">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
            i === lines - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
