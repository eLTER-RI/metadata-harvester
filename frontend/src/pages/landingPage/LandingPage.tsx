import { Container, Grid, Header, Input, Button, Segment, Icon } from 'semantic-ui-react';
import RecordsList from '../../components/harvestedRecords/RecordsList';
import { FilterSidebar } from '../../components/filterSidebar/FilterSidebar';
import { useRecords } from '../../store/RecordsProvider';
import { useState, useEffect, useCallback } from 'react';

export const LandingPage = () => {
  const { setSearchQuery, setCurrentPage, searchQuery } = useRecords();
  const [searchBarContent, setSearchBarContent] = useState<string>(searchQuery);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    setSearchBarContent(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setSearchQuery(searchBarContent.trim());
    setCurrentPage(1);
    setTimeout(() => setIsSearching(false), 300);
  }, [searchBarContent, setSearchQuery, setCurrentPage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container>
      <Header as="h1">Harvested Records</Header>

      <Segment>
        <Input
          fluid
          icon={isSearching ? <Icon name="spinner" loading /> : 'search'}
          placeholder="Search by title."
          value={searchBarContent}
          onChange={(e) => setSearchBarContent(e.target.value)}
          onKeyPress={handleKeyPress}
          loading={isSearching}
          action={
            <Button.Group>
              <Button icon="search" onClick={handleSearch} primary disabled={isSearching} />
            </Button.Group>
          }
        />
        {isSearching && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#999' }}>
            <Icon name="spinner" loading />
            Searching...
          </div>
        )}
      </Segment>

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
