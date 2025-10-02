import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { LandingPage } from './pages/landingPage/LandingPage';
import { EditRecordPage } from './pages/editRecord/EditRecordPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path={'/harvested_records'} element={<LandingPage />} />
      <Route path={'/harvested_records/:darId/edit'} element={<EditRecordPage />} />
    </>,
  ),
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
