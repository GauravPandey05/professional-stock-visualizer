// pages/AlertsPage.tsx
import React from 'react';
import { useAlertsContext } from '../context/AlertsContext';
import AlertsList from '../components/alerts/AlertsList';
import AlertCreator from '../components/alerts/AlertCreator';

const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];

const AlertsPage: React.FC = () => {
  const {
    alerts,
    addPriceAlert,
    addTechnicalAlert,
    addNewsAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    clearTriggeredAlerts,
    markNotificationAsRead,
    clearAllNotifications,
    testAlert,
    updateSettings,
  } = useAlertsContext();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Smart Alerts</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <AlertCreator
            onCreatePriceAlert={addPriceAlert}
            onCreateTechnicalAlert={addTechnicalAlert}
            onCreateNewsAlert={addNewsAlert}
            symbols={symbols}
            currentPrice={150.25}
          />
        </div>
        <div className="md:col-span-2">
          <AlertsList
            priceAlerts={alerts.priceAlerts}
            technicalAlerts={alerts.technicalAlerts}
            newsAlerts={alerts.newsAlerts}
            notifications={alerts.notifications}
            onToggleAlert={toggleAlert}
            onDeleteAlert={deleteAlert}
            onMarkNotificationRead={markNotificationAsRead}
            onClearNotifications={clearAllNotifications}
            onClearTriggeredAlerts={clearTriggeredAlerts}
          />
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
