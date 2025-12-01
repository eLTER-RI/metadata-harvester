import { Item, Grid, Button, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDeleteManualRecord } from '../../hooks/recordMutations';
import { getDarRecordUrl } from '../../utils/darUrl';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { OarForm } from '../oar/OarForm';

interface ManualRecordCardProps {
  record: {
    id: number;
    dar_id: string;
    created_at: string;
    created_by: string | null;
    title: string | null;
  };
}

const ManualRecordCard = ({ record }: ManualRecordCardProps) => {
  const { mutate: deleteRecord, isPending: isDeleting } = useDeleteManualRecord();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOarForm, setShowOarForm] = useState(false);

  const handleDelete = () => {
    deleteRecord(record.dar_id, {
      onSuccess: () => {
        setShowConfirm(false);
      },
      onError: () => {
        setShowConfirm(false);
      },
    });
  };

  return (
    <Item className="search-listing-item">
      <Item.Content className="content">
        <Grid columns={2} verticalAlign="middle">
          <Grid.Column>
            <Item.Header>{record.title || 'No Title'}</Item.Header>
            <Item.Content>
              <strong>DAR ID:</strong>{' '}
              <a href={getDarRecordUrl(record.dar_id)}>
                {record.dar_id}
                <Icon name="external alternate" size="small" style={{ marginLeft: '0.25em' }} />
              </a>
            </Item.Content>
            {record.created_at && <Item.Meta>Created: {new Date(record.created_at).toLocaleDateString()}</Item.Meta>}
          </Grid.Column>
          <Grid.Column>
            <Button.Group>
              <Button as={Link} to={`/${record.dar_id}/edit`} icon="edit" content="Edit" />
              <Button icon="cloud" content="Manage OAR Assets" onClick={() => setShowOarForm(true)} />
              <Button
                negative
                icon="trash"
                content="Delete"
                onClick={() => setShowConfirm(true)}
                loading={isDeleting}
                disabled={isDeleting}
              />
            </Button.Group>
            <DeleteConfirmModal
              open={showConfirm}
              onClose={() => setShowConfirm(false)}
              onConfirm={handleDelete}
              title="Delete Manual Record"
              itemName={record.title || record.dar_id}
              isLoading={isDeleting}
            />
            <OarForm
              darAssetId={record.dar_id}
              open={showOarForm}
              onClose={() => setShowOarForm(false)}
              asModal={true}
            />
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default ManualRecordCard;
