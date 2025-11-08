import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/landingPage/LandingPage';
import { HomePage } from './pages/homepage';
import { HarvestPage } from './pages/harvest';
import { RecordPage } from './pages/recordForm';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path={'/'} element={<HomePage />} />
      <Route path={'/harvested_records'} element={<LandingPage />} />
      <Route path={'/harvest'} element={<HarvestPage />} />
      <Route path={'/create'} element={<RecordPage />} />
      <Route path={'/:darId/edit'} element={<RecordPage />} />
    </Route>,
  ),
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
