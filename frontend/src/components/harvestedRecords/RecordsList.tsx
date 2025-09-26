import React, { useEffect, useState } from 'react';
import { Container, Dimmer, Header, Item, Loader, Segment } from 'semantic-ui-react';
import RecordCard from './RecordCard';
import axios from 'axios';

interface Record {
  dar_id: string;
  source_url: string;
  title: string;
}

interface RecordsListProps {
  repositoryFilter?: string;
  resolvedFilter?: boolean;
}

interface FetchParams {
  resolved?: boolean;
  repository?: string;
}

const API_BASE_URL = 'http://localhost:3000/records';

export const RecordsList = ({ repositoryFilter, resolvedFilter }: RecordsListProps) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params: FetchParams = {};
      if (resolvedFilter !== undefined) {
        params.resolved = resolvedFilter;
      }
      if (repositoryFilter) {
        params.repository = repositoryFilter;
      }

      const response = await axios.get<Record[]>(API_BASE_URL, { params });
      setRecords(response.data);
    } catch (e: any) {
      setError('Failed to fetch records. Please check the backend server.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [resolvedFilter, repositoryFilter]);

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading records...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (error) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading records.
          <Header.Subheader>{error}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Container>
      <Header as="h1">Harvested Records</Header>
      <Item.Group divided>
        {records.map((record, index) => (
          <RecordCard key={index} record={record} fetchRecords={fetchRecords} />
        ))}
      </Item.Group>
    </Container>
  );
};

export default RecordsList;
