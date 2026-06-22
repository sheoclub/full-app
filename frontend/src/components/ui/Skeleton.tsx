interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export default function Skeleton({ className = '', variant = 'text', width, height, count = 1 }: SkeletonProps) {
    const baseClass = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded bg-[length:200%_100%]';

    const variantClass = variant === 'circular' ? 'rounded-full' :
        variant === 'card' ? 'rounded-xl' :
            variant === 'rectangular' ? 'rounded-lg' : 'rounded';

    const style: React.CSSProperties = {
        width: width || (variant === 'circular' ? 40 : '100%'),
        height: height || (variant === 'text' ? 16 : variant === 'circular' ? 40 : 200),
    };

    const items = Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${baseClass} ${variantClass} ${className}`} style={style} />
    ));

    return <>{items}</>;
}

// Product card skeleton — commonly used
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Skeleton variant="rectangular" height={200} className="!rounded-none" />
            <div className="p-4 space-y-3">
                <Skeleton width="60%" height={12} />
                <Skeleton width="80%" height={16} />
                <Skeleton width="40%" height={14} />
                <Skeleton width="50%" height={18} />
            </div>
        </div>
    );
}

// Cart item skeleton
export function CartItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border">
            <Skeleton variant="rectangular" width={80} height={80} className="!rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={16} />
                <Skeleton width="30%" height={14} />
                <Skeleton width="20%" height={14} />
            </div>
            <Skeleton variant="circular" width={36} height={36} />
        </div>
    );
}

// Order detail skeleton
export function OrderDetailSkeleton() {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
                <Skeleton width="40%" height={28} />
                <Skeleton width="60%" height={16} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton variant="rectangular" width={64} height={64} className="!rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="50%" height={16} />
                            <Skeleton width="30%" height={14} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Dashboard stats skeleton
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="bg-white rounded-xl border p-5 space-y-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={24} />
                </div>
            ))}
        </div>
    );
}