import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  thumbClassName?: string;
  trackClassName?: string;
  rangeClassName?: string;
  minStepsBetweenThumbs?: number;
  formatLabel?: (value: number) => string;
  showLabels?: boolean;
  showTooltip?: boolean;
  variant?: 'default' | 'professional' | 'minimal';
}

export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue = [0],
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = 'horizontal',
  className,
  thumbClassName,
  trackClassName,
  rangeClassName,
  minStepsBetweenThumbs = 0,
  formatLabel = (val) => val.toString(),
  showLabels = false,
  showTooltip = false,
  variant = 'default',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [activeThumb, setActiveThumb] = useState<number | null>(null);
  const [showTooltips, setShowTooltips] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const currentValue = value !== undefined ? value : internalValue;
  const isRange = currentValue.length > 1;
  const isVertical = orientation === 'vertical';

  // Calculate percentage position for a value
  const getPercentage = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  // Calculate value from percentage
  const getValueFromPercentage = useCallback((percentage: number) => {
    const rawValue = min + (percentage / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  // Get slider bounds
  const getSliderBounds = useCallback(() => {
    if (!sliderRef.current) return null;
    
    const rect = sliderRef.current.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Calculate percentage from mouse/touch position
  const getPercentageFromPosition = useCallback((clientX: number, clientY: number) => {
    const bounds = getSliderBounds();
    if (!bounds) return 0;

    let percentage: number;
    
    if (isVertical) {
      percentage = ((bounds.height - (clientY - bounds.top)) / bounds.height) * 100;
    } else {
      percentage = ((clientX - bounds.left) / bounds.width) * 100;
    }

    return Math.max(0, Math.min(100, percentage));
  }, [isVertical, getSliderBounds]);

  // Update value with constraints
  const updateValue = useCallback((newValue: number[], commitValue = false) => {
    let constrainedValue = [...newValue];

    // Apply min/max constraints
    constrainedValue = constrainedValue.map(val => Math.max(min, Math.min(max, val)));

    // Apply step constraints
    constrainedValue = constrainedValue.map(val => Math.round(val / step) * step);

    // Apply minimum distance between thumbs
    if (isRange && minStepsBetweenThumbs > 0) {
      const minDistance = minStepsBetweenThumbs * step;
      if (constrainedValue[1] - constrainedValue[0] < minDistance) {
        if (activeThumb === 0) {
          constrainedValue[1] = Math.min(max, constrainedValue[0] + minDistance);
        } else {
          constrainedValue[0] = Math.max(min, constrainedValue[1] - minDistance);
        }
      }
    }

    // Sort values for range slider
    if (isRange) {
      constrainedValue.sort((a, b) => a - b);
    }

    if (value === undefined) {
      setInternalValue(constrainedValue);
    }

    onValueChange?.(constrainedValue);
    
    if (commitValue) {
      onValueCommit?.(constrainedValue);
    }
  }, [value, min, max, step, isRange, minStepsBetweenThumbs, activeThumb, onValueChange, onValueCommit]);

  // Handle mouse/touch start
  const handlePointerDown = useCallback((event: React.PointerEvent, thumbIndex: number) => {
    if (disabled) return;

    event.preventDefault();
    setIsDragging(true);
    setActiveThumb(thumbIndex);
    setShowTooltips(true);

    const handlePointerMove = (e: PointerEvent) => {
      const percentage = getPercentageFromPosition(e.clientX, e.clientY);
      const newValue = getValueFromPercentage(percentage);
      
      const updatedValue = [...currentValue];
      updatedValue[thumbIndex] = newValue;
      updateValue(updatedValue);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setActiveThumb(null);
      setShowTooltips(false);
      updateValue(currentValue, true);
      
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [disabled, currentValue, getPercentageFromPosition, getValueFromPercentage, updateValue]);

  // Handle track click
  const handleTrackClick = useCallback((event: React.MouseEvent) => {
    if (disabled || isDragging) return;

    const percentage = getPercentageFromPosition(event.clientX, event.clientY);
    const clickValue = getValueFromPercentage(percentage);

    if (isRange) {
      // Find closest thumb
      const distances = currentValue.map(val => Math.abs(val - clickValue));
      const closestThumbIndex = distances.indexOf(Math.min(...distances));
      
      const updatedValue = [...currentValue];
      updatedValue[closestThumbIndex] = clickValue;
      updateValue(updatedValue, true);
    } else {
      updateValue([clickValue], true);
    }
  }, [disabled, isDragging, isRange, currentValue, getPercentageFromPosition, getValueFromPercentage, updateValue]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, thumbIndex: number) => {
    if (disabled) return;

    let delta = 0;
    const largeStep = step * 10;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        delta = step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -step;
        break;
      case 'PageUp':
        delta = largeStep;
        break;
      case 'PageDown':
        delta = -largeStep;
        break;
      case 'Home':
        delta = min - currentValue[thumbIndex];
        break;
      case 'End':
        delta = max - currentValue[thumbIndex];
        break;
      default:
        return;
    }

    event.preventDefault();
    const updatedValue = [...currentValue];
    updatedValue[thumbIndex] = currentValue[thumbIndex] + delta;
    updateValue(updatedValue, true);
  }, [disabled, step, min, max, currentValue, updateValue]);

  // Variant styles
  const variants = {
    default: {
      track: 'bg-muted',
      range: 'bg-primary',
      thumb: 'bg-background border-2 border-primary shadow-md hover:shadow-lg',
    },
    professional: {
      track: 'bg-muted/50',
      range: 'bg-gradient-to-r from-primary to-primary/80',
      thumb: 'bg-primary shadow-lg hover:shadow-xl border border-primary/20',
    },
    minimal: {
      track: 'bg-muted/30',
      range: 'bg-foreground',
      thumb: 'bg-foreground',
    },
  };

  const variantStyle = variants[variant];

  return (
    <div
      className={cn(
        'slider-container relative touch-none select-none',
        isVertical ? 'w-5 h-full min-h-32' : 'h-5 w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Labels */}
      {showLabels && (
        <div className={cn(
          'flex justify-between text-xs text-muted-foreground mb-2',
          isVertical && 'flex-col h-full absolute -left-8 top-0'
        )}>
          <span>{formatLabel(min)}</span>
          <span>{formatLabel(max)}</span>
        </div>
      )}

      {/* Track */}
      <div
        ref={sliderRef}
        className={cn(
          'slider-track relative rounded-full cursor-pointer',
          isVertical ? 'w-2 h-full' : 'h-2 w-full',
          variantStyle.track,
          trackClassName
        )}
        onClick={handleTrackClick}
      >
        {/* Range */}
        <div
          className={cn(
            'slider-range absolute rounded-full transition-all duration-150',
            isVertical ? 'w-full' : 'h-full',
            variantStyle.range,
            rangeClassName
          )}
          style={
            isVertical
              ? {
                  bottom: `${getPercentage(currentValue[0])}%`,
                  height: isRange 
                    ? `${getPercentage(currentValue[1]) - getPercentage(currentValue[0])}%`
                    : `${getPercentage(currentValue[0])}%`,
                }
              : {
                  left: isRange ? `${getPercentage(currentValue[0])}%` : '0%',
                  width: isRange 
                    ? `${getPercentage(currentValue[1]) - getPercentage(currentValue[0])}%`
                    : `${getPercentage(currentValue[0])}%`,
                }
          }
        />

        {/* Thumbs */}
        {currentValue.map((val, index) => (
          <div key={index}>
            <div
              className={cn(
                'slider-thumb absolute w-5 h-5 rounded-full cursor-grab transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isDragging && activeThumb === index && 'cursor-grabbing scale-110',
                variantStyle.thumb,
                thumbClassName
              )}
              style={
                isVertical
                  ? {
                      bottom: `calc(${getPercentage(val)}% - 10px)`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }
                  : {
                      left: `calc(${getPercentage(val)}% - 10px)`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }
              }
              tabIndex={disabled ? -1 : 0}
              role="slider"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={val}
              aria-valuetext={formatLabel(val)}
              aria-orientation={orientation}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />

            {/* Tooltip */}
            {(showTooltip || showTooltips) && (
              <div
                className={cn(
                  'absolute px-2 py-1 text-xs bg-popover text-popover-foreground rounded border shadow-md pointer-events-none z-10 transition-opacity duration-150',
                  showTooltips ? 'opacity-100' : 'opacity-0'
                )}
                style={
                  isVertical
                    ? {
                        bottom: `calc(${getPercentage(val)}% - 6px)`,
                        left: '120%',
                        transform: 'translateY(50%)',
                      }
                    : {
                        left: `calc(${getPercentage(val)}% - 50%)`,
                        bottom: '120%',
                        transform: 'translateX(50%)',
                      }
                }
              >
                {formatLabel(val)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Range slider helper component
export interface RangeSliderProps extends Omit<SliderProps, 'defaultValue'> {
  defaultValue?: [number, number];
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  defaultValue = [0, 100],
  ...props
}) => {
  return <Slider {...props} defaultValue={defaultValue} />;
};

export default Slider;