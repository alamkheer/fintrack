import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { runInitialSeed } from './services/db/seed';
import { SettingsProvider } from './contexts/SettingsContext';
import { WalletProvider } from './contexts/WalletContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { ToastProvider } from './contexts/ToastContext';
import { EntryProvider } from './contexts/EntryContext';
import { Layout } from './components/layout/Layout';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wallets = lazy(() => import('./pages/Wallets'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Categories = lazy(() => import('./pages/Categories'));

export default function App() {
  // Apply theme on load (temporarily using system default, will link to settings later)
  useEffect(() => {
    runInitialSeed().catch(console.error);
  }, []);

  return (
    <SettingsProvider>
      <WalletProvider>
        <CategoryProvider>
          <ExpenseProvider>
            <BudgetProvider>
              <BrowserRouter>
                <ToastProvider>
                  <EntryProvider>
                    <Layout>
                      <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/wallets" element={<Wallets />} />
                          <Route path="/budgets" element={<Budgets />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/settings/categories" element={<Categories />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </EntryProvider>
                </ToastProvider>
              </BrowserRouter>
            </BudgetProvider>
          </ExpenseProvider>
        </CategoryProvider>
      </WalletProvider>
    </SettingsProvider>
  );
}
