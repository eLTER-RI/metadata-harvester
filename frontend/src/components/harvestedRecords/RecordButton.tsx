import { Dropdown } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { useResolveRecord, useReHarvestRecord } from '../../hooks/recordMutations';

interface ActionButtonProps {
  record: any;
}

export const ActionButton = ({ record }: ActionButtonProps) => {
  const { mutate: resolveRecord, isPending: isResolving } = useResolveRecord();
  const { mutate: reHarvestRecord, isPending: isReHarvesting } = useReHarvestRecord();

  const handleResolve = async () => {
    resolveRecord(record);
  };

  const handleReHarvest = async () => {
    if (record.source_url && record.source_repository) {
      reHarvestRecord({
        sourceUrl: record.source_url,
        repository: record.source_repository,
      });
    }
  };

  return (
    <Dropdown text="Actions" icon="list" floating labeled button className="icon">
      <Dropdown.Menu>
        <Dropdown.Item as={Link} to={`/${record.dar_id}/edit`} key={'edit'} icon={'edit'} text="Edit" />
        <Dropdown.Item
          key={'resolve'}
          icon={record.is_resolved ? 'x' : 'check'}
          text={record.is_resolved ? 'Unresolve' : 'Resolve'}
          disabled={isResolving}
          onClick={() => handleResolve()}
        />
        <Dropdown.Item
          key={'reharvest'}
          icon={'refresh'}
          text="Re-Harvest"
          disabled={isReHarvesting || !record.source_url || !record.source_repository}
          onClick={() => handleReHarvest()}
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
