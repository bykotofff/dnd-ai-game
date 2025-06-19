// frontend/src/components/ui/loading-spinner.tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    color?: 'primary' | 'white' | 'muted'
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
}

const colorClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    muted: 'border-muted-foreground border-t-transparent'
}

export function LoadingSpinner({
                                   size = 'md',
                                   className,
                                   color = 'primary'
                               }: LoadingSpinnerProps) {
    return (
        <div className={cn(
            'animate-spin rounded-full border-2',
            sizeClasses[size],
            colorClasses[color],
            className
        )} />
    )
}