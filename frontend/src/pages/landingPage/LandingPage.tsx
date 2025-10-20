import { Container, Grid, Header, Input } from 'semantic-ui-react';
import RecordsList from '../../components/harvestedRecords/RecordsList';
import { FilterSidebar } from '../../components/filterSidebar/FilterSidebar';
import { useRecords } from '../../store/RecordsProvider';
import { useState } from 'react';

export const LandingPage = () => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('RecordsPagination must be used within a RecordsProvider');
  }

  const { setSearchQuery, setCurrentPage } = context;
  const [searchBarContent, setSearchBarContent] = useState<string>('');

  const handleSearch = () => {
    setSearchQuery(searchBarContent);
    setCurrentPage(1);
  };

  return (
    <Container>
      <Header as="h1">Harvested Records</Header>
      <Grid columns={2}>
        <Grid.Column computer={12}>
          <Input
            fluid
            icon={{ name: 'search', link: true, onClick: handleSearch }}
            placeholder="Search by title..."
            onChange={(e) => setSearchBarContent(e.target.value)}
            value={searchBarContent}
          />
          <RecordsList />
        </Grid.Column>
        <Grid.Column computer={4} as="aside">
          <FilterSidebar />
        </Grid.Column>
      </Grid>
    </Container>
  );
};
