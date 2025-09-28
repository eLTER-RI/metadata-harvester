import { Container, Grid, Header } from 'semantic-ui-react';
import RecordsList from '../../components/harvestedRecords/RecordsList';
import { FilterSidebar } from '../../components/filterSidebar/FilterSidebar';

export const LandingPage = () => {
  return (
    <Container>
      <Header as="h1">Harvested Records</Header>
      <Grid columns={2}>
        <Grid.Column computer={4} as="aside">
          <FilterSidebar />
        </Grid.Column>
        <Grid.Column computer={12}>
          <RecordsList />
        </Grid.Column>
      </Grid>
    </Container>
  );
};
