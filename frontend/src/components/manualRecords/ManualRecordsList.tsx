import { Dimmer, Header, Item, Loader, Segment, Icon } from 'semantic-ui-react';
import ManualRecordCard from './ManualRecordCard';
import { useManualRecords } from '../../store/RecordsProvider';

export const ManualRecordsList = () => {
  const { records, isLoading, error, searchQuery } = useManualRecords();

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading manual records...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (error) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading manual records.
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
              No manual records found
            </Header>
            <p style={{ color: 'grey', fontSize: '1.1em', marginBottom: '1.5rem' }}>
              No manual records match your search criteria.
            </p>
          </>
        ) : (
          <>
            <Icon name="file outline" size="huge" style={{ color: 'grey', marginBottom: '1rem' }} />
            <Header as="h2" style={{ color: 'grey' }}>
              No manual records available
            </Header>
            <p style={{ color: 'grey', fontSize: '1.1em', marginBottom: '1.5rem' }}>
              No manual records have been created yet.
            </p>
          </>
        )}
      </Segment>
    );
  }

  return (
    <>
      <Item.Group relaxed divided>
        {records.map((record, index) => (
          <ManualRecordCard key={index} record={record} />
        ))}
      </Item.Group>
    </>
  );
};

export default ManualRecordsList;
