import { Container, Header, Dimmer, Loader, Segment, Message } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export const EditRecordPage = () => {
  const { darId } = useParams();

  const [originalRecord, setOriginalRecord] = useState<any>(null);
  const [editedRecord, setEditedRecord] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setIsLoading(true);
      try {
        const recordResponse = await axios.get(`http://localhost:3000/api/external-record/${darId}`);
        setOriginalRecord(recordResponse.data);
        setEditedRecord(recordResponse.data);
      } catch (e) {
        setError('Failed to fetch record data.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecord();
  }, [darId]);

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading record...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (error) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading data.
          <Header.Subheader>{error}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Container>
      <Header as="h1">Edit Record {darId}</Header>
      <Message info>
        <Message.Header>Rule Generation and Re-Harvest</Message.Header>
        <p>
          Modification to this record will stay as long as the previous value will stay the same on the source
          repository.
        </p>
      </Message>
      <p>{originalRecord.id}</p>
      <p>{editedRecord.metadata.titles.join(' ')}</p>
    </Container>
  );
};
