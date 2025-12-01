import { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { useReHarvestRecord } from '../../hooks/recordMutations';
import { getDarRecordUrl } from '../../utils/darUrl';
import { OarForm } from '../oar/OarForm';

interface ActionButtonProps {
  record: any;
}

export const ActionButton = ({ record }: ActionButtonProps) => {
  const { mutate: reHarvestRecord, isPending: isReHarvesting } = useReHarvestRecord();
  const [showOarForm, setShowOarForm] = useState(false);

  const handleReHarvest = async () => {
    if (record.source_url && record.source_repository) {
      reHarvestRecord({
        sourceUrl: record.source_url,
        repository: record.source_repository,
      });
    }
  };

  return (
    <>
      <Dropdown text="Actions" icon="list" floating labeled button className="icon">
        <Dropdown.Menu>
          <Dropdown.Item
            key={'reharvest'}
            icon={'refresh'}
            text="Re-Harvest"
            disabled={isReHarvesting || !record.source_url || !record.source_repository}
            onClick={() => handleReHarvest()}
          />
          <Dropdown.Item key={'oar'} icon={'cloud'} text="Manage OAR Assets" onClick={() => setShowOarForm(true)} />
          <Dropdown.Item
            key={'detail'}
            icon={'eye'}
            text="Detail"
            href={getDarRecordUrl(record.dar_id)}
            target="_blank"
            rel="noopener noreferrer"
          />
        </Dropdown.Menu>
      </Dropdown>
      <OarForm darAssetId={record.dar_id} open={showOarForm} onClose={() => setShowOarForm(false)} asModal={true} />
    </>
  );
};
