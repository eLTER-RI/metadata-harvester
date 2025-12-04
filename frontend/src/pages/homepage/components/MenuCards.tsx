import { Grid, Card, Header, Icon, Button } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';

export const MenuCards = () => {
  const navigate = useNavigate();

  const navigateToRecords = () => {
    navigate('/harvested_records');
  };
  const navigateToHarvesting = () => {
    navigate('/harvest');
  };
  const navigateToCreate = () => {
    navigate('/create');
  };

  return (
    <Grid columns={3} stackable>
      <Grid.Row column={3} stretched>
        <Grid.Column>
          <Card fluid>
            <Card.Content style={{ padding: '2rem' }}>
              <div>
                <Icon name="search" size="huge" style={{ color: 'mediumSeaGreen', marginBottom: '1rem' }} />
                <Header as="h2">Explore Harvested Data</Header>
                <p style={{ marginBottom: '1.5rem' }}>
                  Discover and access a eLTER datasets from multiple repositories.
                </p>
                <Button primary size="large" onClick={navigateToRecords} style={{ backgroundColor: 'mediumSeaGreen' }}>
                  <Icon name="list" />
                  View Harvested Records
                </Button>
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>

        <Grid.Column>
          <Card fluid>
            <Card.Content style={{ padding: '2rem' }}>
              <div>
                <Icon name="cloud download" size="huge" style={{ color: 'dodgerBlue', marginBottom: '1rem' }} />
                <Header as="h2">Start Data Harvesting</Header>
                <p style={{ marginBottom: '1.5rem' }}>Trigger harvesting jobs to update them on DAR.</p>
                <Button secondary size="large" onClick={navigateToHarvesting} style={{ backgroundColor: 'dodgerBlue' }}>
                  <Icon name="download" />
                  Start Harvesting
                </Button>
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>

        <Grid.Column>
          <Card fluid>
            <Card.Content style={{ padding: '2rem' }}>
              <div>
                <Icon name="plus circle" size="huge" style={{ color: 'orange', marginBottom: '1rem' }} />
                <Header as="h2">Create New Record</Header>
                <p style={{ marginBottom: '1.5rem' }}>Manually create a new record by pasting JSON.</p>
                <Button size="large" onClick={navigateToCreate} style={{ backgroundColor: 'orange', color: 'white' }}>
                  <Icon name="plus" />
                  Create Record
                </Button>
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};
