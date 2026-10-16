import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-md animate-fade-in safe-top">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
      <span>Mode Offline — Data tersimpan di perangkat dan akan disinkronkan.</span>
    </div>
  );
};
