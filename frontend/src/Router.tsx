import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { LandingPage } from './pages/landingPage/LandingPage';
import { EditRecordPage } from './pages/editRecord/EditRecordPage';
import { HomePage } from './pages/homepage';
import { HarvestPage } from './pages/harvest';
import { CreateRecordPage } from './pages/createRecord/CreateRecordPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path={'/'} element={<HomePage />} />
      <Route path={'/harvested_records'} element={<LandingPage />} />
      <Route path={'/harvested_records/:darId/edit'} element={<EditRecordPage />} />
      <Route path={'/harvest'} element={<HarvestPage />} />
      <Route path={'/create'} element={<CreateRecordPage />} />
    </>,
  ),
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
