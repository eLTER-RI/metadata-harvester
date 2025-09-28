import { Container, Dimmer, Header, Item, Loader, Segment } from 'semantic-ui-react';
import RecordCard from './RecordCard';
import RecordsPagination from '../pagination/Pagination';
import { useRecords } from '../../store/RecordsProvider';

export const RecordsList = () => {
  const { records, isLoading, error } = useRecords();

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading records...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (error) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading records.
          <Header.Subheader>{error}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Container>
      <Item.Group divided>
        {records.map((record, index) => (
          <RecordCard key={index} record={record} />
        ))}
      </Item.Group>
      <RecordsPagination />
    </Container>
  );
};

export default RecordsList;
