import { Item, Grid } from 'semantic-ui-react';
import { ActionButton } from './RecordButton';

interface RecordCardProps {
  darId: string;
  sourceUrl: string;
  title: string;
}

const RecordCard = ({ darId, title, sourceUrl }: RecordCardProps) => {
  return (
    <Item className="search-listing-item">
      <Item.Content className="content">
        <Grid columns={2} verticalAlign="middle">
          <Grid.Column>
            <Item.Header>{title || 'No Title'}</Item.Header>
            <Item.Content>
              <strong>Source URL:</strong>{' '}
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                {sourceUrl}
              </a>
            </Item.Content>
          </Grid.Column>
          <Grid.Column width={4} textAlign="right">
            <ActionButton darId={darId} />
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default RecordCard;
