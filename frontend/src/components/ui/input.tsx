// frontend/src/components/ui/input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string
    label?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, label, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const [focused, setFocused] = React.useState(false)
        const inputId = id || React.useId()

        const isPassword = type === 'password'
        const inputType = isPassword && showPassword ? 'text' : type

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground mb-2"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        id={inputId}
                        type={inputType}
                        className={cn(
                            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
                            leftIcon && 'pl-10',
                            (rightIcon || isPassword) && 'pr-10',
                            error ? 'border-red-500 focus-visible:ring-red-500' : 'border-input',
                            focused && !error && 'border-primary',
                            className
                        )}
                        ref={ref}
                        onFocus={(e) => {
                            setFocused(true)
                            props.onFocus?.(e)
                        }}
                        onBlur={(e) => {
                            setFocused(false)
                            props.onBlur?.(e)
                        }}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}

                    {rightIcon && !isPassword && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {(error || helperText) && (
                    <p className={cn(
                        'text-xs mt-1',
                        error ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                        {error || helperText}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = 'Input'

export { Input }