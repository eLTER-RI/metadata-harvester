import { Grid, Card, Header, Icon } from 'semantic-ui-react';

type StatisticsProps = {
  totalRecords: number;
  repositoriesWithRecords: number;
  resolvedCount: number;
  unresolvedCount: number;
  repositoryStats: Array<{ source_repository: string; count: number }>;
};

export const Statistics = ({
  totalRecords,
  repositoriesWithRecords,
  resolvedCount,
  unresolvedCount,
  repositoryStats,
}: StatisticsProps) => {
  return (
    <>
      <Grid columns={2} style={{ marginTop: '2rem' }}>
        <Grid.Column>
          <Card fluid>
            <Card.Content>
              <Header as="h2">
                <Icon name="chart bar" />
                Statistics
              </Header>
              <Grid columns={2}>
                <Grid.Column textAlign="center">
                  <Card>
                    <Card.Content textAlign="center">
                      <Icon name="database" size="large" style={{ color: 'dodgerBlue', marginBottom: '1rem' }} />
                      <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '1rem' }}>{totalRecords}</div>
                      <div style={{ fontSize: '1.3em', color: '#666' }}>Total Records</div>
                    </Card.Content>
                  </Card>
                </Grid.Column>
                <Grid.Column textAlign="center">
                  <Card>
                    <Card.Content textAlign="center">
                      <Icon name="server" size="large" style={{ color: 'MediumSeaGreen', marginBottom: '1rem' }} />
                      <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '1rem' }}>
                        {repositoriesWithRecords}
                      </div>
                      <div style={{ fontSize: '1.3em' }}>Active Repositories</div>
                    </Card.Content>
                  </Card>
                </Grid.Column>
              </Grid>
            </Card.Content>
          </Card>
        </Grid.Column>

        <Grid.Column>
          <Card fluid>
            <Card.Content>
              <Header as="h2">
                <Icon name="check circle" />
                Resolution Status
              </Header>
              <Grid columns={2}>
                <Grid.Column textAlign="center">
                  <Card>
                    <Card.Content textAlign="center">
                      <Icon
                        name="check circle"
                        size="large"
                        style={{ color: 'MediumSeaGreen', marginBottom: '1rem' }}
                      />
                      <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '1rem' }}>{resolvedCount}</div>
                      <div style={{ fontSize: '1.3em', color: '#666' }}>Resolved</div>
                    </Card.Content>
                  </Card>
                </Grid.Column>
                <Grid.Column textAlign="center">
                  <Card>
                    <Card.Content textAlign="center">
                      <Icon name="clock" size="large" style={{ color: 'orange', marginBottom: '1rem' }} />
                      <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '1rem' }}>
                        {unresolvedCount}
                      </div>
                      <div style={{ fontSize: '1.3em', color: '#666' }}>Unresolved</div>
                    </Card.Content>
                  </Card>
                </Grid.Column>
              </Grid>
            </Card.Content>
          </Card>
        </Grid.Column>
      </Grid>

      {repositoryStats.length > 0 && (
        <Grid columns={1} style={{ marginTop: '2rem' }}>
          <Grid.Column>
            <Card fluid>
              <Card.Content>
                <Header as="h2">
                  <Icon name="database" />
                  Records per Repository
                </Header>
                <Grid columns={repositoryStats.length as any} stackable>
                  {repositoryStats.map((repo: { source_repository: string; count: number }) => (
                    <Grid.Column key={repo.source_repository} textAlign="center">
                      <Card>
                        <Card.Content textAlign="center">
                          <Icon name="archive" size="large" style={{ color: 'maroon', marginBottom: '1rem' }} />
                          <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {repo.count}
                          </div>
                          <div style={{ fontSize: '1.3em' }}>{repo.source_repository}</div>
                        </Card.Content>
                      </Card>
                    </Grid.Column>
                  ))}
                </Grid>
              </Card.Content>
            </Card>
          </Grid.Column>
        </Grid>
      )}
    </>
  );
};
