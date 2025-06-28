// context/AlertsContext.tsx
import React, { createContext, useContext } from 'react';
import type { UseAlertsHook } from '../hooks/useAlerts';

export const AlertsContext = createContext<UseAlertsHook | null>(null);

export const useAlertsContext = () => {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlertsContext must be used within AlertsContextProvider');
  return context;
};

const AlertsContextProvider: React.FC<{ value: UseAlertsHook; children: React.ReactNode }> = ({ value, children }) => (
  <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
);

export default AlertsContextProvider;
