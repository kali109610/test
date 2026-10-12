import { BrowserRouter, Route, Routes } from 'react-router';
import { Hub } from './hub/Hub';
import { LabPage } from './framework/LabPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/lab/:id" element={<LabPage />} />
        <Route path="*" element={<Hub />} />
      </Routes>
    </BrowserRouter>
  );
}
