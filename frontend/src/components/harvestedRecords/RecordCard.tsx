import { Item, Grid } from 'semantic-ui-react';
import { ActionButton } from './RecordButton';

interface RecordCardProps {
  record: any;
}

const RecordCard = ({ record }: RecordCardProps) => {
  return (
    <Item className="search-listing-item">
      <Item.Content className="content">
        <Grid columns={2} verticalAlign="middle">
          <Grid.Column>
            <Item.Header>{record.title || 'No Title'}</Item.Header>
            <Item.Content>
              <strong>Source URL:</strong>{' '}
              <a href={record.source_url} target="_blank" rel="noopener noreferrer">
                {record.source_url}
              </a>
            </Item.Content>
          </Grid.Column>
          <Grid.Column width={4} textAlign="right">
            <ActionButton darId={record.dar_id} isResolved={record.resolved} />
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default RecordCard;
