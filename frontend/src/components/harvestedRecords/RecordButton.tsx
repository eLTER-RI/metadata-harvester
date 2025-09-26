import axios from 'axios';
import { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';

interface ActionButtonProps {
  darId: string;
  isResolved: boolean;
}

export const ActionButton = ({ darId, isResolved }: ActionButtonProps) => {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);

    try {
      await axios.patch(`http://localhost:3000/api/records/${darId}/status`, {
        status: isResolved ? 'unresolved' : 'resolved',
        resolvedBy: 'admin',
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dropdown text="Actions" icon="list" floating labeled button className="icon">
      <Dropdown.Menu>
        <Dropdown.Item key={'edit'} icon={'edit'} text="Edit" />
        <Dropdown.Item
          key={'resolve'}
          icon={isResolved ? 'x' : 'check'}
          text="Resolve"
          disabled={isResolving}
          onClick={() => handleResolve()}
        />
        <Dropdown.Item
          key={'detail'}
          icon={'eye'}
          text="Detail"
          href={`https://dar.elter-ri.eu/external-datasets/${darId}`}
          target="_blank"
          rel="noopener noreferrer"
        />
      </Dropdown.Menu>
    </Dropdown>
  );
};
