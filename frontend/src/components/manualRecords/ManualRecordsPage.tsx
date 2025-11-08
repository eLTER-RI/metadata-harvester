import { Container, Header, Input, Button, Segment, Icon } from 'semantic-ui-react';
import { useState, useEffect, useCallback } from 'react';
import ManualRecordsList from './ManualRecordsList';
import { useManualRecords } from '../../store/RecordsProvider';

export const ManualRecordsPage = () => {
  const { setSearchQuery, setCurrentPage, searchQuery } = useManualRecords();
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
      <Header as="h1">Manual Records</Header>

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

      <ManualRecordsList />
    </Container>
  );
};
