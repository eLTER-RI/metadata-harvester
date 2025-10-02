import axios from 'axios';
import { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { useRecords } from '../../store/RecordsProvider';
import { Link } from 'react-router-dom';

interface ActionButtonProps {
  record: any;
}

export const ActionButton = ({ record }: ActionButtonProps) => {
  const { fetchRecords, fetchFilterValues } = useRecords();
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);

    try {
      await axios.patch(`http://localhost:3000/api/records/${record.dar_id}/status`, {
        status: record.is_resolved ? 'unresolved' : 'resolved',
        resolvedBy: 'admin',
      });
      fetchRecords();
      fetchFilterValues();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dropdown text="Actions" icon="list" floating labeled button className="icon">
      <Dropdown.Menu>
        <Dropdown.Item
          as={Link}
          to={`/harvested_records/${record.dar_id}/edit`}
          key={'edit'}
          icon={'edit'}
          text="Edit"
        />
        <Dropdown.Item
          key={'resolve'}
          icon={record.is_resolved ? 'x' : 'check'}
          text={record.is_resolved ? 'Unresolve' : 'Resolve'}
          disabled={isResolving}
          onClick={() => handleResolve()}
        />
        <Dropdown.Item
          key={'detail'}
          icon={'eye'}
          text="Detail"
          href={`https://dar.elter-ri.eu/external-datasets/${record.dar_id}`}
          target="_blank"
          rel="noopener noreferrer"
        />
      </Dropdown.Menu>
    </Dropdown>
  );
};
