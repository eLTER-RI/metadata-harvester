import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { LandingPage } from './pages/landingPage/LandingPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path={'/harvested_records'} element={<LandingPage />} />
    </>,
  ),
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
