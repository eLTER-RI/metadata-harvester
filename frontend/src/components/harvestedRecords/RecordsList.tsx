import React, { useEffect, useState } from 'react';
import { Container, Dimmer, Header, Item, Loader, Segment } from 'semantic-ui-react';
import { RecordCard } from './RecordCard';
import axios from 'axios';
import { title } from 'process';

interface Record {
  dar_id: string;
  source_url: string;
  title: string;
}

export const RecordsList = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [selectedRepository, setSelectedRepository] = useState(null);

  useEffect(() => {
      const BASE_API_URL = 'http://localhost:3000';
      const fetchRecords = async () => {
      setIsLoading(true);
      try {
          let url = `${BASE_API_URL}/records`;
          if (selectedRepository) {
          url += `?repository=${selectedRepository}`;
          }
          
          const response = await axios.get<Record[]>(url);
          setRecords(response.data);
      } catch (e: any) {
          setIsError(e.message);
      } finally {
          setIsLoading(false);
      }
      };

      fetchRecords();
  }, [selectedRepository]);

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading records...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (isError) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as='h2' color='red'>
          Error loading records.
          <Header.Subheader>{isError}</Header.Subheader>
        </Header>
      </Segment>
    );
  }


  return (
    <Container>
      <Header as='h1'>Harvested Records</Header>
      <Item.Group>
        {records.map((record, index) => (
          <RecordCard
            key={index}
            title={record.title}
            darId={record.dar_id}
            sourceUrl={record.source_url}
          />
        ))}
      </Item.Group>
    </Container>
  );
};

export default RecordsList;
