import { Container, Dimmer, Header, Item, Loader, Segment, Icon } from 'semantic-ui-react';
import RecordCard from './RecordCard';
import RecordsPagination from '../pagination/Pagination';
import { useRecords } from '../../store/RecordsProvider';

export const RecordsList = () => {
  const { records, isLoading, error, searchQuery } = useRecords();

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
          <Header.Subheader>{error.message}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  if (records.length === 0) {
    return (
      <Segment style={{ textAlign: 'center', padding: '3rem' }}>
        {searchQuery ? (
          <>
            <Icon name="search" size="huge" style={{ color: 'grey', marginBottom: '1rem' }} />
            <Header as="h2" style={{ color: 'grey' }}>
              No records found
            </Header>
            <p style={{ color: 'grey', fontSize: '1.1em', marginBottom: '1.5rem' }}>
              No records match your search criteria.
            </p>
          </>
        ) : (
          <>
            <Icon name="search" size="huge" style={{ color: 'grey', marginBottom: '1rem' }} />
            <Header as="h2" style={{ color: 'grey' }}>
              No records available
            </Header>
            <p style={{ color: 'grey', fontSize: '1.1em', marginBottom: '1.5rem' }}>No harvested records found. </p>
          </>
        )}
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
