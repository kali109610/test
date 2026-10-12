import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import { Hub } from './hub/Hub';
import { LabPage } from './framework/LabPage';

// The hosted preview build (`pnpm build:preview`) can't control the page URL, so it keeps routes in memory.
const Router = ({ children }: { children: ReactNode }) =>
  import.meta.env.VITE_ROUTER === 'memory' ? <MemoryRouter>{children}</MemoryRouter> : <BrowserRouter>{children}</BrowserRouter>;

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/lab/:id" element={<LabPage />} />
        <Route path="*" element={<Hub />} />
      </Routes>
    </Router>
  );
}
