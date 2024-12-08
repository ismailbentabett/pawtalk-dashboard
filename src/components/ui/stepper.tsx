import * as React from "react"
import { Check } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: { title: string; description: string }[]
  currentStep: number
}

export function Stepper({ steps, currentStep, className, ...props }: StepperProps) {
  return (
    <div className={cn("flex justify-between", className)} {...props}>
      {steps.map((step, index) => (
        <div key={step.title} className="flex items-center">
          <div className="relative">
            <div
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                index < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : index === currentStep
                  ? "border-primary"
                  : "border-muted"
              )}
            >
              {index < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 w-full h-0.5",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium">{step.title}</div>
            <div className="text-xs text-muted-foreground">{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  currentStep: number
}

export function StepperContent({ step, currentStep, children, className, ...props }: StepperContentProps) {
  if (step !== currentStep) return null

  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  )
}

export interface StepperNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
}

export function StepperNavigation({ currentStep, totalSteps, onNext, onPrevious, className, ...props }: StepperNavigationProps) {
  return (
    <div className={cn("flex justify-between mt-6", className)} {...props}>
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
      >
        Previous
      </Button>
      <Button
        onClick={onNext}
        disabled={currentStep === totalSteps - 1}
      >
        Next
      </Button>
    </div>
  )
}

