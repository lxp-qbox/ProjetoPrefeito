
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface StepCircleProps {
  stepNumber: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

const StepCircle: React.FC<StepCircleProps> = ({ stepNumber, isCompleted, isCurrent }) => {
  const circleClasses = cn(
    "w-6 h-6 rounded-full flex items-center justify-center font-semibold border-2 text-xs", // Reduced size, added text-xs
    isCompleted
      ? "bg-emerald-600 text-white border-emerald-600"
      : isCurrent
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-muted text-muted-foreground border-border"
  );
  return <div className={circleClasses}>{stepNumber}</div>;
};

interface StepLabelProps {
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

const StepLabel: React.FC<StepLabelProps> = ({ label, isCompleted, isCurrent }) => {
  const textClasses = cn(
    "mt-1 text-xs text-center break-words w-14", // Reduced margin-top, width, kept text-xs
    (isCompleted || isCurrent)
      ? "font-medium"
      : "font-normal",
    isCompleted
      ? "text-emerald-600"
      : isCurrent
      ? "text-primary"
      : "text-muted-foreground"
  );
  return <span className={textClasses}>{label}</span>;
};

interface ConnectingLineProps {
  isCompleted: boolean;
}

const ConnectingLine: React.FC<ConnectingLineProps> = ({ isCompleted }) => {
  const lineClasses = cn(
    "h-1 flex-1",
    isCompleted ? "bg-emerald-600" : "bg-border"
  );
  return <div className={lineClasses} />;
};

interface OnboardingStepperProps {
  steps: string[];
  currentStep: number; // 1-based index
}

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({ steps, currentStep }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex justify-between items-start w-full px-1"> {/* Reduced overall padding */}
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrentStep = stepNumber === currentStep;
        const isLastStep = index === steps.length - 1;

        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <StepCircle
                stepNumber={stepNumber}
                isCompleted={isCompleted}
                isCurrent={isCurrentStep}
              />
              <StepLabel
                label={label}
                isCompleted={isCompleted}
                isCurrent={isCurrentStep}
              />
            </div>
            {!isLastStep && (
              <div className="flex-grow flex items-center h-6 mx-0.5"> {/* Reduced height and margin */}
                 <ConnectingLine isCompleted={isCompleted} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OnboardingStepper;
