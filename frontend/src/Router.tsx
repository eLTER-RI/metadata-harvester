import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { LandingPage } from './pages/landingPage/LandingPage';
import { HomePage } from './pages/homepage';
import { HarvestPage } from './pages/harvest';
import { RecordForm } from './pages/recordForm/RecordForm';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path={'/'} element={<HomePage />} />
      <Route path={'/harvested_records'} element={<LandingPage />} />
      <Route path={'/harvest'} element={<HarvestPage />} />
      <Route path={'/:darId/edit'} element={<RecordForm />} />
    </>,
  ),
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
