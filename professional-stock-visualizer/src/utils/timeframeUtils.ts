import type { Timeframe } from '../types/chart';

// Convert timeframe to milliseconds
export const timeframeToMs = (timeframe: Timeframe): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  
  switch (timeframe) {
    case '1D':
      return msPerDay;
    case '5D':
      return 5 * msPerDay;
    case '1M':
      return 30 * msPerDay;
    case '3M':
      return 90 * msPerDay;
    case '6M':
      return 180 * msPerDay;
    case '1Y':
      return 365 * msPerDay;
    case '2Y':
      return 2 * 365 * msPerDay;
    case '5Y':
      return 5 * 365 * msPerDay;
    case 'MAX':
    default:
      return 10 * 365 * msPerDay; // 10 years for MAX
  }
};

// Get start date for timeframe
export const getStartDateForTimeframe = (timeframe: Timeframe, endDate?: Date): Date => {
  const end = endDate || new Date();
  const timeframeMs = timeframeToMs(timeframe);
  
  if (timeframe === 'MAX') {
    return new Date('2000-01-01'); // Start from year 2000 for MAX
  }
  
  return new Date(end.getTime() - timeframeMs);
};

// Format date for chart display
export const formatChartDate = (date: string | Date, timeframe: Timeframe): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (timeframe) {
    case '1D':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '5D':
      return d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
    case '1M':
    case '3M':
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case '6M':
    case '1Y':
      return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
    case '2Y':
    case '5Y':
    case 'MAX':
    default:
      return d.toLocaleDateString([], { month: 'short', year: 'numeric' });
  }
};

// Get appropriate interval for timeframe (for data aggregation)
export const getIntervalForTimeframe = (timeframe: Timeframe): string => {
  switch (timeframe) {
    case '1D':
      return '5m';  // 5-minute intervals
    case '5D':
      return '15m'; // 15-minute intervals
    case '1M':
      return '1h';  // 1-hour intervals
    case '3M':
      return '4h';  // 4-hour intervals
    case '6M':
    case '1Y':
      return '1d';  // Daily intervals
    case '2Y':
    case '5Y':
    case 'MAX':
    default:
      return '1w';  // Weekly intervals
  }
};

// Check if market is open (US Eastern Time)
export const isMarketOpen = (date?: Date): boolean => {
  const now = date || new Date();
  const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60;    // 4:00 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
};

// Get market status
export const getMarketStatus = (date?: Date): 'open' | 'closed' | 'pre-market' | 'after-hours' => {
  const now = date || new Date();
  const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const day = easternTime.getDay();
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Weekend
  if (day === 0 || day === 6) {
    return 'closed';
  }
  
  // Market hours
  const preMarketStart = 4 * 60;     // 4:00 AM
  const marketOpen = 9 * 60 + 30;    // 9:30 AM
  const marketClose = 16 * 60;       // 4:00 PM
  const afterHoursEnd = 20 * 60;     // 8:00 PM
  
  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    return 'open';
  } else if (timeInMinutes >= preMarketStart && timeInMinutes < marketOpen) {
    return 'pre-market';
  } else if (timeInMinutes >= marketClose && timeInMinutes < afterHoursEnd) {
    return 'after-hours';
  } else {
    return 'closed';
  }
};

// Get next market open time
export const getNextMarketOpen = (date?: Date): Date => {
  const now = date || new Date();
  const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  let nextOpen = new Date(easternTime);
  nextOpen.setHours(9, 30, 0, 0); // Set to 9:30 AM
  
  const day = easternTime.getDay();
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // If it's already past market open today, move to next day
  if (timeInMinutes >= 9 * 60 + 30) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // Skip weekends
  const nextDay = nextOpen.getDay();
  if (nextDay === 0) { // Sunday
    nextOpen.setDate(nextOpen.getDate() + 1); // Move to Monday
  } else if (nextDay === 6) { // Saturday
    nextOpen.setDate(nextOpen.getDate() + 2); // Move to Monday
  }
  
  return nextOpen;
};

// Calculate trading days between two dates
export const getTradingDaysBetween = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not weekend
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// Get trading sessions for different markets
export const getTradingSessions = () => {
  return {
    'US': {
      name: 'US Market',
      timezone: 'America/New_York',
      premarket: { start: '04:00', end: '09:30' },
      regular: { start: '09:30', end: '16:00' },
      afterhours: { start: '16:00', end: '20:00' },
    },
    'EU': {
      name: 'European Market',
      timezone: 'Europe/London',
      regular: { start: '08:00', end: '16:30' },
    },
    'ASIA': {
      name: 'Asian Market',
      timezone: 'Asia/Tokyo',
      regular: { start: '09:00', end: '15:00' },
    },
  };
};

// Check if date is a trading day (excludes weekends and major holidays)
export const isTradingDay = (date: Date): boolean => {
  const day = date.getDay();
  
  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Major US holidays (simplified list)
  const year = date.getFullYear();
  const month = date.getMonth();
  const dateNum = date.getDate();
  
  const holidays = [
    // New Year's Day
    new Date(year, 0, 1),
    // Independence Day
    new Date(year, 6, 4),
    // Christmas Day
    new Date(year, 11, 25),
    // Thanksgiving (4th Thursday in November)
    new Date(year, 10, getThursdayOfMonth(year, 10, 4)),
    // Labor Day (1st Monday in September)
    new Date(year, 8, getMondayOfMonth(year, 8, 1)),
  ];
  
  return !holidays.some(holiday => 
    holiday.getDate() === dateNum && 
    holiday.getMonth() === month
  );
};

// Helper function to get nth Thursday of month
const getThursdayOfMonth = (year: number, month: number, nth: number): number => {
  const firstDay = new Date(year, month, 1);
  const firstThursday = firstDay.getDay() <= 4 
    ? 1 + (4 - firstDay.getDay())
    : 1 + (11 - firstDay.getDay());
  return firstThursday + (nth - 1) * 7;
};

// Helper function to get nth Monday of month
const getMondayOfMonth = (year: number, month: number, nth: number): number => {
  const firstDay = new Date(year, month, 1);
  const firstMonday = firstDay.getDay() <= 1 
    ? 1 + (1 - firstDay.getDay())
    : 1 + (8 - firstDay.getDay());
  return firstMonday + (nth - 1) * 7;
};

// Format time for different locales
export const formatTimeForLocale = (date: Date, locale: string = 'en-US'): string => {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

// Get time until market open/close
export const getTimeUntilMarketEvent = (date?: Date): {
  event: 'open' | 'close';
  timeRemaining: string;
  timestamp: Date;
} => {
  const now = date || new Date();
  const status = getMarketStatus(now);
  
  if (status === 'open') {
    const marketClose = new Date(now);
    marketClose.setHours(16, 0, 0, 0);
    const diff = marketClose.getTime() - now.getTime();
    
    return {
      event: 'close',
      timeRemaining: formatDuration(diff),
      timestamp: marketClose
    };
  } else {
    const nextOpen = getNextMarketOpen(now);
    const diff = nextOpen.getTime() - now.getTime();
    
    return {
      event: 'open',
      timeRemaining: formatDuration(diff),
      timestamp: nextOpen
    };
  }
};

// Format duration in human readable format
const formatDuration = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};