import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * BackButton Component
 * 
 * A reusable back navigation button with smooth transitions and fallback routing.
 * Features:
 * - Uses browser history (navigate(-1)) for seamless back navigation
 * - Falls back to a default route if no history is available
 * - Smooth hover and click animations
 * - Consistent styling across the application
 * - Dark/light mode compatible
 * - Maintains application state on navigation
 * 
 * Props:
 * - fallbackRoute: Where to navigate if no history (default: '/db')
 * - label: Optional text label (default: 'Back')
 * - showLabel: Whether to show text label (default: false)
 * - className: Additional CSS classes for customization
 * - ariaLabel: Custom aria-label for accessibility
 */

const BackButton = ({
  fallbackRoute = '/db',
  label = 'Back',
  showLabel = false,
  className = '',
  ariaLabel = 'Go back to previous page'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Track if we have history
  const hasHistory = window.history.length > 1;

  const handleBack = () => {
    // Try to go back first
    if (hasHistory) {
      // Prevent going back to login page
      navigate(-1);
    } else {
      // No history, navigate to fallback route
      navigate(fallbackRoute);
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2',
        'px-3 py-2 rounded-lg',
        'text-sm font-medium',
        'transition-all duration-200 ease-out',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        
        // Colors - matches theme
        'text-foreground',
        'bg-secondary/50 hover:bg-secondary',
        'dark:bg-muted/30 dark:hover:bg-muted/50',
        'focus-visible:ring-primary/50',
        
        // Hover effects
        'hover:shadow-sm active:scale-95',
        
        // Accessibility
        'cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        className
      )}
      title={ariaLabel}
    >
      {/* Back Arrow Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>

      {/* Optional Label */}
      {showLabel && (
        <span className="hidden sm:inline">{label}</span>
      )}
    </button>
  );
};

export default BackButton;
