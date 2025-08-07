'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select } from './select'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

// Form Context for managing form state and accessibility
interface FormContextType {
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  announceError: (fieldName: string, error: string) => void
  announceSuccess: (message: string) => void
}

const FormContext = React.createContext<FormContextType | undefined>(undefined)

export function useFormContext() {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error('Form components must be used within a Form')
  }
  return context
}

// Enhanced Form Provider
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  errors?: Record<string, string>
  touched?: Record<string, boolean>
  isSubmitting?: boolean
  onSubmit?: (e: React.FormEvent) => void
  children: React.ReactNode
}

export function Form({
  children,
  errors = {},
  touched = {},
  isSubmitting = false,
  onSubmit,
  className,
  ...props
}: FormProps) {
  const [announcer, setAnnouncer] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    // Create announcer for form errors
    const announcerEl = document.createElement('div')
    announcerEl.setAttribute('aria-live', 'assertive')
    announcerEl.setAttribute('aria-atomic', 'true')
    announcerEl.className = 'sr-only'
    announcerEl.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    
    document.body.appendChild(announcerEl)
    setAnnouncer(announcerEl)

    return () => {
      if (announcerEl.parentNode) {
        announcerEl.parentNode.removeChild(announcerEl)
      }
    }
  }, [])

  const announceError = (fieldName: string, error: string) => {
    if (announcer) {
      announcer.textContent = `${fieldName} 필드에 오류가 있습니다: ${error}`
    }
  }

  const announceSuccess = (message: string) => {
    if (announcer) {
      announcer.textContent = message
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (isSubmitting) {
      e.preventDefault()
      return
    }
    
    // Check for errors before submitting
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) {
      e.preventDefault()
      const firstError = Object.entries(errors)[0]
      announceError(firstError[0], firstError[1])
      
      // Focus first error field
      const errorField = document.querySelector(`[name="${firstError[0]}"]`) as HTMLElement
      if (errorField) {
        errorField.focus()
      }
      return
    }

    if (onSubmit) {
      onSubmit(e)
    }
  }

  const contextValue: FormContextType = {
    errors,
    touched,
    isSubmitting,
    announceError,
    announceSuccess,
  }

  return (
    <FormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className={cn('space-y-4', className)}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  )
}

// Enhanced Form Field
interface FormFieldProps {
  name: string
  label: string
  required?: boolean
  description?: string
  children: React.ReactElement
  className?: string
}

export function FormField({
  name,
  label,
  required = false,
  description,
  children,
  className,
}: FormFieldProps) {
  const { errors, touched } = useFormContext()
  const error = touched[name] ? errors[name] : undefined
  const hasError = Boolean(error)
  
  const fieldId = `field-${name}`
  const errorId = `${fieldId}-error`
  const descriptionId = `${fieldId}-description`

  // Clone child to add accessibility props
  const childWithProps = React.cloneElement(children, {
    id: fieldId,
    name,
    'aria-invalid': hasError,
    'aria-describedby': [
      description ? descriptionId : '',
      hasError ? errorId : '',
    ].filter(Boolean).join(' ') || undefined,
    'aria-required': required,
  })

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId} className={cn(required && 'required')}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="필수 입력">
            *
          </span>
        )}
      </Label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {childWithProps}
      
      {hasError && (
        <div
          id={errorId}
          className="flex items-center gap-2 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// Accessible Input with enhanced features
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  instructions?: string
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, success, instructions, className, ...props }, ref) => {
    const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
    const instructionsId = `${id}-instructions`
    const errorId = `${id}-error`

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id}>
            {label}
            {props.required && (
              <span className="text-destructive ml-1" aria-label="필수 입력">*</span>
            )}
          </Label>
        )}
        
        {instructions && (
          <p id={instructionsId} className="text-sm text-muted-foreground">
            {instructions}
          </p>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive',
              success && 'border-green-500 focus-visible:ring-green-500',
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={[
              instructions ? instructionsId : '',
              error ? errorId : '',
            ].filter(Boolean).join(' ') || undefined}
            {...props}
          />
          
          {success && (
            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        
        {error && (
          <div
            id={errorId}
            className="flex items-center gap-2 text-sm text-destructive"
            role="alert"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)
AccessibleInput.displayName = 'AccessibleInput'

// Form Group for related fields
interface FormGroupProps {
  legend: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormGroup({ legend, description, children, className }: FormGroupProps) {
  return (
    <fieldset className={cn('space-y-4 border rounded-lg p-4', className)}>
      <legend className="text-lg font-medium px-2">
        {legend}
      </legend>
      
      {description && (
        <p className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      
      {children}
    </fieldset>
  )
}

// Progress indicator for multi-step forms
interface FormProgressProps {
  currentStep: number
  totalSteps: number
  steps: Array<{ label: string; description?: string }>
  className?: string
}

export function FormProgress({ currentStep, totalSteps, steps, className }: FormProgressProps) {
  return (
    <nav 
      aria-label="양식 진행 상황"
      className={cn('mb-8', className)}
    >
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <li key={index} className="flex-1">
              <div
                className={cn(
                  'flex items-center',
                  index < steps.length - 1 && 'w-full'
                )}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                      isCompleted && 'bg-primary border-primary text-primary-foreground',
                      isCurrent && 'border-primary text-primary',
                      !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  <div className="mt-2 text-center">
                    <div className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-primary',
                      !isCurrent && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-border mx-4" />
                )}
              </div>
            </li>
          )
        })}
      </ol>
      
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`단계 ${currentStep} / ${totalSteps}: ${steps[currentStep - 1]?.label}`}
      </div>
    </nav>
  )
}