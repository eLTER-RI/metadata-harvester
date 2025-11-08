import { useParams } from 'react-router-dom';
import { Container, Dimmer, Loader, Segment, Message } from 'semantic-ui-react';
import { useFetchRecord } from '../../hooks/recordQueries';
import { RecordForm } from './RecordForm';
import { ManualRecordJsonForm } from './ManualRecordJsonForm';

export const RecordPage = () => {
  const { darId } = useParams();
  const { data: darRecord, isLoading: darLoading, error: darError } = useFetchRecord(darId);

  if (darId && darLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Checking if record exists in DAR...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if ((darId && darError) || (darId && !darLoading && !darRecord)) {
    return (
      <Container>
        <Message negative>
          <Message.Header>Record Not Found</Message.Header>
          <p>
            Record with ID {darId} was not found in DAR.
            {darError && ` Error: ${darError.message}`}
          </p>
        </Message>
      </Container>
    );
  }

  if (darId) {
    return <RecordForm />;
  }

  return <ManualRecordJsonForm />;
};
