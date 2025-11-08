import React from 'react';
import { Menu } from 'semantic-ui-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: 'statistics',
      path: '/',
      label: 'Statistics',
    },
    {
      name: 'harvest',
      path: '/harvest',
      label: 'Harvest',
    },
    {
      name: 'harvested_records',
      path: '/harvested_records',
      label: 'Harvested Records',
    },
    {
      name: 'manual_records',
      path: '/manual_records',
      label: 'Manual Records',
    },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/harvested_records') {
      return location.pathname === '/harvested_records' || location.pathname.startsWith('/harvested_records');
    }
    if (path === '/manual_records') {
      return location.pathname === '/manual_records' || location.pathname.startsWith('/manual_records');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Menu secondary pointing>
      {menuItems.map((item) => (
        <Menu.Item
          key={item.name}
          name={item.name}
          active={isActive(item.path)}
          onClick={() => handleItemClick(item.path)}
        >
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );
};
