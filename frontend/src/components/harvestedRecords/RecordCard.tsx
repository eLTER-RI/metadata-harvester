import { Item, Grid, Icon, ItemExtra } from 'semantic-ui-react';
import { ActionButton } from './RecordButton';

interface RecordCardProps {
  record: any;
}

const RecordCard = ({ record }: RecordCardProps) => {
  const statusColor = record.is_resolved ? 'green' : 'red';

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
            {record.is_resolved && (
              <ItemExtra>
                <Icon name="check" color={statusColor} />
              </ItemExtra>
            )}
          </Grid.Column>
          <Grid.Column width={4} textAlign="right">
            <ActionButton record={record} />
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default RecordCard;
