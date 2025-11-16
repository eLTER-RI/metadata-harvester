import { Item, Grid, Icon, ItemExtra, Button } from 'semantic-ui-react';
import { ActionButton } from './RecordButton';
import { useResolveRecord } from '../../hooks/recordMutations';

interface RecordCardProps {
  record: any;
}

const RecordCard = ({ record }: RecordCardProps) => {
  const statusColor = record.is_resolved ? 'green' : 'red';
  const { mutate: resolveRecord, isPending: isResolving } = useResolveRecord();

  const handleResolve = () => {
    resolveRecord(record);
  };

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
            <Button.Group>
              <Button
                color={record.is_resolved ? 'grey' : 'green'}
                onClick={handleResolve}
                disabled={isResolving}
                loading={isResolving}
              >
                <Icon name={record.is_resolved ? 'x' : 'check'} />
                {record.is_resolved ? 'Unresolve' : 'Resolve'}
              </Button>
              <ActionButton record={record} />
            </Button.Group>
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default RecordCard;
