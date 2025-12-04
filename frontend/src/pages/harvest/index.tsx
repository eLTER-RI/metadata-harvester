import { Container, Header, Grid, Card, Button, Icon, Segment, Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
    description: 'Zenodo eLTER community and LTER-Italy community',
    color: 'violet',
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
  const [harvestingRepositories, setHarvestingRepositories] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (harvestMutation.isSuccess && harvestingRepositories.size > 0) {
      const reposList = Array.from(harvestingRepositories).join(', ');
      setSuccessMessage(`Harvesting job started successfully for: ${reposList}.`);
    }
  }, [harvestMutation.isSuccess, harvestingRepositories]);

  const handleHarvest = (repositoryName: string) => {
    if (harvestingRepositories.has(repositoryName)) return;

    setSuccessMessage(null);

    const reposToHarvest: string[] = [];
    if (repositoryName === 'ZENODO') {
      reposToHarvest.push('ZENODO', 'ZENODO_IT');
    } else {
      reposToHarvest.push(repositoryName);
    }

    setHarvestingRepositories((prev) => new Set([...prev, ...reposToHarvest]));

    reposToHarvest.forEach((repo) => {
      harvestMutation.mutate({
        repository: repo,
        checkHarvestChanges: false,
      });
    });
  };

  const handleHarvestAll = () => {
    setSuccessMessage(null);

    const allRepos: string[] = [];
    repositories.forEach((repo) => {
      if (repo.name === 'ZENODO') {
        allRepos.push('ZENODO', 'ZENODO_IT');
      } else {
        allRepos.push(repo.name);
      }
    });

    setHarvestingRepositories(new Set(allRepos));
    repositories.forEach((repo) => {
      if (repo.name === 'ZENODO') {
        harvestMutation.mutate({
          repository: 'ZENODO',
          checkHarvestChanges: false,
        });
        harvestMutation.mutate({
          repository: 'ZENODO_IT',
          checkHarvestChanges: false,
        });
      } else {
        harvestMutation.mutate({
          repository: repo.name,
          checkHarvestChanges: false,
        });
      }
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

          {successMessage && (
            <Message success style={{ marginBottom: '1rem' }}>
              <Message.Header>Harvesting Started Successfully</Message.Header>
              <p>{successMessage}</p>
            </Message>
          )}

          <Button
            primary
            size="large"
            onClick={handleHarvestAll}
            disabled={harvestingRepositories.size > 0}
            loading={harvestingRepositories.size > 0}
          >
            <Icon name="download" />
            Harvest All Repositories
          </Button>
          <Button as={Link} to="/harvest/history" secondary size="large">
            <Icon name="table" />
            View History
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

                  <Button
                    color={repo.color}
                    fluid
                    onClick={() => handleHarvest(repo.name)}
                    disabled={
                      harvestingRepositories.has(repo.name) ||
                      (repo.name === 'ZENODO' && harvestingRepositories.has('ZENODO_IT'))
                    }
                    loading={
                      harvestingRepositories.has(repo.name) ||
                      (repo.name === 'ZENODO' && harvestingRepositories.has('ZENODO_IT'))
                    }
                  >
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
