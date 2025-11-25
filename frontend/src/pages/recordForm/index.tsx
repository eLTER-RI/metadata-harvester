import { useParams } from 'react-router-dom';
import { Container, Dimmer, Loader, Segment, Message } from 'semantic-ui-react';
import { useFetchRecord, useFetchHarvestedRecord } from '../../hooks/recordQueries';
import { RecordForm } from './RecordForm';
import { ManualRecordJsonForm } from './ManualRecordJsonForm';
import { CommonDatasetMetadata } from '../../../../backend/src/models/commonStructure';

export const RecordPage = () => {
  const { darId } = useParams();
  const { data: darRecord, isLoading: darLoading, error: darError } = useFetchRecord(darId);
  const { data: harvestedRecord, isLoading: harvestedLoading } = useFetchHarvestedRecord(darId);
  const isManualRecord = darId ? harvestedRecord === null && !harvestedLoading : false;

  if (darId && (darLoading || harvestedLoading)) {
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

  if (darId && isManualRecord) {
    return <ManualRecordJsonForm initialData={darRecord?.metadata as CommonDatasetMetadata} darId={darId} />;
  }

  if (darId) {
    return <RecordForm />;
  }

  return <ManualRecordJsonForm />;
};
