import { Container, Header, Table, Button, Icon, Label, ButtonGroup, Segment, Dimmer, Loader } from 'semantic-ui-react';
import { useFetchRecords } from '../../hooks/recordQueries';
import { useReHarvestRecord } from '../../hooks/recordMutations';
import { getDarRecordUrl } from '../../utils/darUrl';

export const HarvestingHistory = () => {
  const { data, isLoading } = useFetchRecords(1, 1000000, undefined, [], '', '', '', '', '');
  const reHarvestMutation = useReHarvestRecord();

  const records = data?.records || [];

  const handleReHarvest = (sourceUrl: string, repository: string) => {
    reHarvestMutation.mutate({
      sourceUrl,
      repository,
      checkHarvestChanges: false,
    });
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

      <Table compact celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Repository</Table.HeaderCell>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Last Harvested</Table.HeaderCell>
            <Table.HeaderCell>Last Seen</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '1%', whiteSpace: 'nowrap' }}>Actions</Table.HeaderCell>
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
    </Container>
  );
};
