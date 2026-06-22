import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    text?: string;
    fullPage?: boolean;
    className?: string;
}

export default function LoadingSpinner({ size = 8, text, fullPage = false, className = '' }: LoadingSpinnerProps) {
    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30" style={{ width: size * 5, height: size * 5, margin: -size * 2 }} />
                <Loader2 className="text-blue-600 animate-spin relative z-10" style={{ width: size * 4, height: size * 4 }} />
            </div>
            {text && <p className="text-sm text-gray-500 font-medium animate-pulse">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
}