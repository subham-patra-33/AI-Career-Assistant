import React from 'react';
import BackButton from './BackButton';
import { cn } from '@/lib/utils';

/**
 * PageHeader Component
 * 
 * A reusable page header component that includes:
 * - Back button for easy navigation
 * - Page title and optional subtitle
 * - Optional action buttons slot
 * - Consistent styling across all pages
 * - Responsive layout (stacks on mobile)
 * 
 * Props:
 * - title: Page title (required)
 * - subtitle: Optional page subtitle/description
 * - backButtonProps: Props to pass to BackButton component
 * - action: Optional React node for action buttons
 * - className: Additional CSS classes
 * - showBorder: Whether to show a bottom border (default: true)
 */

const PageHeader = ({
  title,
  subtitle,
  backButtonProps = {},
  action,
  className = '',
  showBorder = true
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        'mb-6 pb-6',
        showBorder && 'border-b border-border dark:border-muted/30',
        className
      )}
    >
      {/* Left: Back Button + Title */}
      <div className="flex items-start gap-3 w-full sm:w-auto">
        <BackButton {...backButtonProps} />
        
        <div className="flex-1 sm:flex-none">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Optional Action Buttons */}
      {action && (
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
