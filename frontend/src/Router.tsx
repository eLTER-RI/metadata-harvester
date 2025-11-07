import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { LandingPage } from './pages/landingPage/LandingPage';
import { HomePage } from './pages/homepage';
import { HarvestPage } from './pages/harvest';
import { RecordPage } from './pages/createRecord';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path={'/'} element={<HomePage />} />
      <Route path={'/harvested_records'} element={<LandingPage />} />
      <Route path={'/harvest'} element={<HarvestPage />} />
      <Route path={'/create'} element={<RecordPage />} />
      <Route path={'/:darId/edit'} element={<RecordPage />} />
    </>,
  ),
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
