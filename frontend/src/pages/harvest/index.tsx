import { Container, Header, Grid, Card, Button, Icon, Segment } from 'semantic-ui-react';
import { useHarvestRepository } from '../../hooks/recordMutations';

interface RepositoryInfo {
  name: string;
  displayName: string;
  description: string;
  color: 'blue' | 'green' | 'violet' | 'orange' | 'teal' | 'purple';
}

const repositories: RepositoryInfo[] = [
  {
    name: 'B2SHARE_EUDAT',
    displayName: 'B2SHARE EUDAT',
    description: 'European research data repository',
    color: 'blue',
  },
  {
    name: 'B2SHARE_JUELICH',
    displayName: 'B2SHARE Juelich',
    description: 'Juelich research data repository',
    color: 'teal',
  },
  {
    name: 'ZENODO',
    displayName: 'Zenodo',
    description: 'Zenodo eLTER community',
    color: 'violet',
  },
  {
    name: 'ZENODO_IT',
    displayName: 'Zenodo Italy',
    description: 'Zenodo LTER-Italy community',
    color: 'purple',
  },
  {
    name: 'DATAREGISTRY',
    displayName: 'Data Registry',
    description: 'LTER Italy data registry',
    color: 'orange',
  },
  {
    name: 'SITES',
    displayName: 'Sites',
    description: 'LTER Sites',
    color: 'green',
  },
];

export const HarvestPage = () => {
  const harvestMutation = useHarvestRepository();

  const handleHarvest = (repositoryName: string) => {
    harvestMutation.mutate({
      repository: repositoryName,
      checkHarvestChanges: false,
    });
  };

  const handleHarvestAll = () => {
    repositories.forEach((repo) => {
      harvestMutation.mutate({
        repository: repo.name,
        checkHarvestChanges: false,
      });
    });
  };

  return (
    <div>
      <Container style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Segment>
          <Header as="h1" style={{ color: 'grey', marginBottom: '1rem' }}>
            <Icon name="cloud download" />
            Data Harvesting
          </Header>
          <p style={{ fontSize: '1.1em', marginBottom: '1.5rem' }}>
            Harvest metadata from multiple repositories. Harvesting is done periodically but you can trigger the process
            manually.
          </p>

          <Button primary size="large" style={{ marginBottom: '1rem' }} onClick={handleHarvestAll}>
            <Icon name="download" />
            Harvest All Repositories
          </Button>
        </Segment>

        <Grid columns={2} stackable>
          {repositories.map((repo) => (
            <Grid.Column key={repo.name}>
              <Card fluid style={{ borderRadius: '8px' }}>
                <Card.Content>
                  <Card.Header style={{ marginBottom: '0.5rem' }}>
                    <Icon name="database" color={repo.color} />
                    {repo.displayName}
                  </Card.Header>
                  <Card.Description style={{ marginBottom: '1rem' }}>{repo.description}</Card.Description>

                  <Button color={repo.color} fluid onClick={() => handleHarvest(repo.name)}>
                    <Icon name="download" />
                    Start Harvest
                  </Button>
                </Card.Content>
              </Card>
            </Grid.Column>
          ))}
        </Grid>
      </Container>
    </div>
  );
};
