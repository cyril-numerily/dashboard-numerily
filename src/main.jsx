import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <Root />
      </TooltipProvider>
      <Toaster />
    </AuthProvider>
  </React.StrictMode>
);