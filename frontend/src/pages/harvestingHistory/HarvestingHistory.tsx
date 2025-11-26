import { useState } from 'react';
import { Container, Header, Table, Button, Icon, Label, ButtonGroup, Segment, Dimmer, Loader } from 'semantic-ui-react';
import { useFetchRecords } from '../../hooks/recordQueries';
import { useReHarvestRecord } from '../../hooks/recordMutations';
import { getDarRecordUrl } from '../../utils/darUrl';
import RecordsPagination from '../../components/pagination/Pagination';

type SortField = 'last_harvested' | 'last_seen_at' | 'status';
type SortDirection = 'asc' | 'desc';
const PAGE_SIZE = 50;

export const HarvestingHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('last_harvested');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { data, isLoading } = useFetchRecords(
    currentPage,
    PAGE_SIZE,
    undefined,
    [],
    '',
    '',
    '',
    '',
    '',
    sortField,
    sortDirection,
  );
  const reHarvestMutation = useReHarvestRecord();

  const records = data?.records || [];

  const handleReHarvest = (sourceUrl: string, repository: string) => {
    reHarvestMutation.mutate({
      sourceUrl,
      repository,
      checkHarvestChanges: false,
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortedValue = (field: SortField): 'ascending' | 'descending' | undefined => {
    if (sortField !== field) {
      return undefined;
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'in_progress':
        return 'blue';
      default:
        return 'grey';
    }
  };

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading records...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (records.length === 0) {
    return (
      <Container style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Header as="h1">
          <Icon name="database" />
          Harvested Records History
        </Header>
        <Segment textAlign="center">
          <Header as="h3">No records found.</Header>
        </Segment>
      </Container>
    );
  }

  return (
    <Container style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Header as="h1" style={{ marginBottom: '1.5rem' }}>
        <Icon name="database" />
        Harvested Records History
      </Header>

      <Table sortable compact celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Repository</Table.HeaderCell>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell sorted={getSortedValue('status')} onClick={() => handleSort('status')}>
              Status
            </Table.HeaderCell>
            <Table.HeaderCell sorted={getSortedValue('last_harvested')} onClick={() => handleSort('last_harvested')}>
              Last Harvested
            </Table.HeaderCell>
            <Table.HeaderCell sorted={getSortedValue('last_seen_at')} onClick={() => handleSort('last_seen_at')}>
              Last Seen
            </Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {records.map((record: any) => {
            return (
              <Table.Row key={record.source_url}>
                <Table.Cell>
                  <strong>{record.source_repository}</strong>
                </Table.Cell>
                <Table.Cell>{record.title ?? 'No title'}</Table.Cell>
                <Table.Cell>
                  <Label color={getStatusColor(record.status)} size="small">
                    {record.status}
                  </Label>
                </Table.Cell>
                <Table.Cell>{record.last_harvested}</Table.Cell>
                <Table.Cell>{record.last_seen_at}</Table.Cell>
                <Table.Cell style={{ whiteSpace: 'nowrap' }}>
                  <ButtonGroup size="small">
                    {record.source_url && <Button compact icon="external" content="Source" href={record.source_url} />}
                    {record.dar_id && (
                      <Button compact icon="external" content="DAR" href={getDarRecordUrl(record.dar_id)} />
                    )}
                    <Button
                      compact
                      color={record.status === 'failed' ? 'orange' : 'blue'}
                      icon="refresh"
                      content="Re-harvest"
                      onClick={() => handleReHarvest(record.source_url, record.source_repository)}
                      loading={reHarvestMutation.isPending}
                    />
                  </ButtonGroup>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
      {data && (
        <RecordsPagination
          currentPage={currentPage}
          totalRecords={data.totalCount}
          totalPages={data.totalPages}
          pageSize={PAGE_SIZE}
          setCurrentPage={setCurrentPage}
        />
      )}
    </Container>
  );
};
