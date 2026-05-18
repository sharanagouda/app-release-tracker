import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ReleasesPage } from './pages/ReleasesPage';
import { ReleaseDetailPage } from './pages/ReleaseDetailPage';
import { CodePushPage } from './pages/CodePushPage';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/releases" replace />} />
            <Route path="/releases" element={<ReleasesPage />} />
            <Route path="/releases/:id" element={<ReleaseDetailPage />} />
            <Route path="/codepush" element={<CodePushPage />} />
            {/* Catch-all: redirect to releases */}
            <Route path="*" element={<Navigate to="/releases" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
