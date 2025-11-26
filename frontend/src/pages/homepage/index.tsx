import { Container, Header, Segment, Loader, Dimmer } from 'semantic-ui-react';
import { useFetchFilterValues, useFetchRecords } from '../../hooks/recordQueries';
import { Statistics } from './components/Statistics';
import { MenuCards } from './components/MenuCards';

export const HomePage = () => {
  const {
    data: filterValues,
    isLoading: isFilterLoading,
    isError: isFilterError,
  } = useFetchFilterValues(undefined, [], '', '', '', '', '');
  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    isError: isRecordsError,
  } = useFetchRecords(1, 1, undefined, [], '', '', '', '', '');

  const totalRecords = recordsData?.totalCount || 0;
  const filterValuesData = filterValues || { repositories: [], resolved: [] };
  const resolvedCount = filterValuesData.resolved.find((r) => r.resolved === true)?.count || 0;
  const unresolvedCount = filterValuesData.resolved.find((r) => r.resolved === false)?.count || 0;

  if (isFilterLoading || isRecordsLoading) {
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

  if (isFilterError || isRecordsError) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Segment style={{ height: '50vh' }}>
          <Header as="h2" color="red">
            Error loading statistics.
          </Header>
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

        <Statistics
          totalRecords={totalRecords}
          repositoriesWithRecords={filterValuesData.repositories.length}
          resolvedCount={resolvedCount}
          unresolvedCount={unresolvedCount}
          repositoryStats={filterValuesData.repositories}
        />
        <MenuCards />
      </Container>
    </div>
  );
};
