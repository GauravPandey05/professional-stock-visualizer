import React, { useState, useCallback, createContext, useContext } from 'react';
import { cn } from '../../utils/cn';

// Context for tab state management
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs provider');
  }
  return context;
};

// Main Tabs container component
export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const activeTab = value !== undefined ? value : internalValue;
  
  const setActiveTab = useCallback((tabId: string) => {
    if (value === undefined) {
      setInternalValue(tabId);
    }
    onValueChange?.(tabId);
  }, [value, onValueChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, orientation }}>
      <div 
        className={cn(
          'tabs-container',
          orientation === 'vertical' ? 'flex' : 'block',
          className
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tab list container
export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  const { orientation } = useTabsContext();

  return (
    <div
      className={cn(
        'tabs-list',
        'inline-flex items-center justify-start',
        'bg-muted p-1 rounded-lg',
        orientation === 'horizontal' 
          ? 'flex-row w-full' 
          : 'flex-col w-48 min-h-full',
        className
      )}
      role="tablist"
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
};

// Individual tab trigger
export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  variant?: 'default' | 'professional' | 'minimal';
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  disabled = false,
  className,
  children,
  icon,
  badge,
  variant = 'default',
}) => {
  const { activeTab, setActiveTab, orientation } = useTabsContext();
  const isActive = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setActiveTab(value);
    }
  };

  const variants = {
    default: {
      base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      active: 'bg-background text-foreground shadow-sm',
      inactive: 'text-muted-foreground hover:text-foreground hover:bg-background/50'
    },
    professional: {
      base: 'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-semibold transition-all duration-200 border-b-2',
      active: 'text-primary border-primary bg-primary/5',
      inactive: 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50'
    },
    minimal: {
      base: 'inline-flex items-center justify-center whitespace-nowrap px-2 py-1 text-sm font-medium transition-all',
      active: 'text-foreground',
      inactive: 'text-muted-foreground hover:text-foreground'
    }
  };

  const variantStyles = variants[variant];

  return (
    <button
      className={cn(
        variantStyles.base,
        isActive ? variantStyles.active : variantStyles.inactive,
        disabled && 'opacity-50 cursor-not-allowed',
        orientation === 'vertical' && 'w-full justify-start',
        className
      )}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {icon && (
        <span className={cn('flex-shrink-0', children && 'mr-2')}>
          {icon}
        </span>
      )}
      
      <span className="truncate">{children}</span>
      
      {badge && (
        <span className={cn(
          'ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full',
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        )}>
          {badge}
        </span>
      )}
    </button>
  );
};

// Tab content container
export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  forceMount?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className,
  children,
  forceMount = false,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      className={cn(
        'tabs-content',
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        !isActive && forceMount && 'hidden',
        className
      )}
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

// Animated tab indicator (optional enhancement)
export interface TabsIndicatorProps {
  className?: string;
}

export const TabsIndicator: React.FC<TabsIndicatorProps> = ({ className }) => {
  const { activeTab } = useTabsContext();

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ease-out',
        className
      )}
      style={{
        transform: `translateX(${activeTab ? '100%' : '0%'})`,
        width: '100%'
      }}
    />
  );
};

// Professional-grade tab group with enhanced features
export interface ProfessionalTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    disabled?: boolean;
    content: React.ReactNode;
  }>;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'professional' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  showIndicator?: boolean;
}

export const ProfessionalTabs: React.FC<ProfessionalTabsProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  variant = 'professional',
  orientation = 'horizontal',
  className,
  showIndicator = false,
}) => {
  const firstTabId = tabs[0]?.id || '';
  const initialTab = defaultTab || activeTab || firstTabId;

  return (
    <Tabs
      defaultValue={initialTab}
      value={activeTab}
      onValueChange={onTabChange}
      orientation={orientation}
      className={className}
    >
      <div className="relative">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              icon={tab.icon}
              badge={tab.badge}
              variant={variant}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {showIndicator && <TabsIndicator />}
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Hook for managing tab state externally
export const useTabs = (initialTab?: string) => {
  const [activeTab, setActiveTab] = useState(initialTab || '');
  
  const switchTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const switchToNext = useCallback((tabIds: string[]) => {
    const currentIndex = tabIds.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    setActiveTab(tabIds[nextIndex]);
  }, [activeTab]);

  const switchToPrevious = useCallback((tabIds: string[]) => {
    const currentIndex = tabIds.indexOf(activeTab);
    const prevIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;
    setActiveTab(tabIds[prevIndex]);
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab: switchTab,
    switchToNext,
    switchToPrevious,
  };
};

// Compound export for easier imports
export default {
  Root: Tabs,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  Indicator: TabsIndicator,
  Professional: ProfessionalTabs,
};