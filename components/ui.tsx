// Simple reusable UI components for the admin panel
import { ButtonHTMLAttributes, ReactNode } from 'react'

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    children: ReactNode
}

export function Button({
    variant = 'default',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
        default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    }

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    }

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function Input({ className = '', ...props }: InputProps) {
    return (
        <input
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
            {...props}
        />
    )
}

// Label Component
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: ReactNode
}

export function Label({ className = '', children, ...props }: LabelProps) {
    return (
        <label
            className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
            {...props}
        >
            {children}
        </label>
    )
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export function Textarea({ className = '', ...props }: TextareaProps) {
    return (
        <textarea
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
            {...props}
        />
    )
}

// Badge Component
interface BadgeProps {
    children: ReactNode
    variant?: 'default' | 'outline'
    className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const variantStyles = {
        default: 'bg-gray-100 text-gray-800',
        outline: 'border border-gray-300 text-gray-700'
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    )
}

// Switch Component
interface SwitchProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
}

export function Switch({ checked, onCheckedChange, disabled = false }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-blue-600' : 'bg-gray-200'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    )
}

// Select Components
interface SelectProps {
    value: string
    onValueChange: (value: string) => void
    children: ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
            {children}
        </select>
    )
}

export function SelectTrigger({ children }: { children: ReactNode }) {
    return <>{children}</>
}

export function SelectValue() {
    return null
}

export function SelectContent({ children }: { children: ReactNode }) {
    return <>{children}</>
}

interface SelectItemProps {
    value: string
    children: ReactNode
}

export function SelectItem({ value, children }: SelectItemProps) {
    return <option value={value}>{children}</option>
}

// Dialog Components
interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />
            <div className="relative z-50 w-full max-w-lg">
                {children}
            </div>
        </div>
    )
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-lg shadow-xl p-6 ${className}`}>
            {children}
        </div>
    )
}

export function DialogHeader({ children }: { children: ReactNode }) {
    return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children }: { children: ReactNode }) {
    return <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
}

export function DialogDescription({ children }: { children: ReactNode }) {
    return <p className="text-sm text-gray-500 mt-1">{children}</p>
}
