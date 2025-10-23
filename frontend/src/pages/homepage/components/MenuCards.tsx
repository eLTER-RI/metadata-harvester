import { Grid, Card, Header, Icon, Button } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';

export const MenuCards = () => {
  const navigate = useNavigate();

  const navigateToRecords = () => {
    navigate('/harvested_records');
  };
  // TODO: Add a function to trigger to go to harvesting

  return (
    <Grid columns={2} stackable>
      <Grid.Column>
        <Card fluid>
          <Card.Content style={{ padding: '2rem' }}>
            <div>
              <Icon name="search" size="huge" style={{ color: 'mediumSeaGreen', marginBottom: '1rem' }} />
              <Header as="h2">Explore Harvested Data</Header>
              <p style={{ marginBottom: '1.5rem' }}>Discover and access a eLTER datasets from multiple repositories.</p>
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
              <Button secondary size="large" style={{ backgroundColor: 'dodgerBlue' }}>
                <Icon name="download" />
                Start Harvesting
              </Button>
            </div>
          </Card.Content>
        </Card>
      </Grid.Column>
    </Grid>
  );
};
