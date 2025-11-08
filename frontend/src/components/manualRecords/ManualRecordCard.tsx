import { Item, Grid } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react';

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
  return (
    <Item className="search-listing-item">
      <Item.Content className="content">
        <Grid columns={2} verticalAlign="middle">
          <Grid.Column>
            <Item.Header>{record.title || 'No Title'}</Item.Header>
            <Item.Content>
              <strong>DAR ID:</strong> {record.dar_id}
            </Item.Content>
            {record.created_at && <Item.Meta>Created: {new Date(record.created_at).toLocaleDateString()}</Item.Meta>}
          </Grid.Column>
          <Grid.Column>
            <Button as={Link} to={`/${record.dar_id}/edit`} icon="edit" content="Edit" />
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default ManualRecordCard;
