import { Container, Header, Dimmer, Loader, Segment, Message } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { useFetchRecord } from '../../hooks/recordQueries';
import { useEffect, useState } from 'react';
import { cloneDeep, set } from 'lodash';
import { JsonForm } from '../../components/editRecord/JsonForm';

export const EditRecordPage = () => {
  const { darId } = useParams();
  const { data: originalRecord, isLoading, error } = useFetchRecord(darId);
  const [editedRecord, setEditedRecord] = useState<any>(null);

  useEffect(() => {
    if (originalRecord) {
      setEditedRecord(cloneDeep(originalRecord));
    }
  }, [originalRecord]);

  const handleDataChange = (path: string, value: any) => {
    const newRecord = cloneDeep(editedRecord);
    set(newRecord, path, value);
    setEditedRecord(newRecord);
  };

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
          <Header.Subheader>{error.message}</Header.Subheader>
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
      {editedRecord && <JsonForm data={editedRecord} onDataChange={handleDataChange} />}
    </Container>
  );
};
