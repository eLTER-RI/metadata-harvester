import { Navigation } from './navigation/Navigation';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <>
      <Navigation />
      <div>
        <Outlet />
      </div>
    </>
  );
};
