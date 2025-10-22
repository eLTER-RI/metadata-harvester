import { Container, Header, Segment, Loader, Dimmer } from 'semantic-ui-react';
import { useFetchFilterValues, useFetchRecords } from '../../hooks/recordQueries';

export const HomePage = () => {
  const filterValuesQuery = useFetchFilterValues(undefined, [], '');
  const recordsQuery = useFetchRecords(1, 1, undefined, [], '');

  const isLoading = filterValuesQuery.isLoading || recordsQuery.isLoading;
  const hasError = filterValuesQuery.isError || recordsQuery.isError;

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Segment style={{ height: '50vh' }}>
          <Dimmer active inverted>
            <Loader>Loading records...</Loader>
          </Dimmer>
        </Segment>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Segment style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Header as="h1" style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            Welcome to eLTER Data Harvester!
          </Header>
          <p style={{ fontSize: '1.3em' }}>
            The eLTER Data Harvester is a tool for collecting and managing research data from multiple repositories.
            Harvest datasets from various repositories, and then explore and manage your eLTER records.
          </p>
        </Segment>

        {hasError && (
          <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Header as="h2" color="red">
              Error loading statistics.
              <Header.Subheader>There was an error loading the statistics.</Header.Subheader>
            </Header>
          </Segment>
        )}
      </Container>
    </div>
  );
};
