import { Container, Header, Dimmer, Loader, Segment, Message } from 'semantic-ui-react';
import { MetadataForm } from '../../components/MetadataForm';
import { useRecordForm } from './useRecordForm';

export const RecordForm = () => {
  const { darId, formData, validationErrors, isSaving, isLoading, fetchError, saveError, isManualRecord, handleSave } =
    useRecordForm();

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading record and rules...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (fetchError) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading data.
          <Header.Subheader>{fetchError.message}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Container>
      <Header as="h1">Edit Record {darId}</Header>
      {isManualRecord ? (
        <Message info>
          <Message.Header>Updating Manual Record</Message.Header>
          <p>Changes will be saved to the manual records database and updated in DAR.</p>
        </Message>
      ) : (
        <Message info>
          <Message.Header>Rule Generation and Re-Harvest</Message.Header>
          <p>
            Modification to this record will stay as long as the previous value will stay the same on the source
            repository.
          </p>
        </Message>
      )}
      {saveError && (
        <Message negative>
          <Message.Header>Error {isManualRecord ? 'Updating Manual Record' : 'Saving Rules'}</Message.Header>
          <p>{saveError?.message || 'An error occurred'}</p>
        </Message>
      )}

      {validationErrors && (
        <Message negative>
          <Message.Header>Validation Errors</Message.Header>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Message>
      )}

      {formData && <MetadataForm data={formData} onSubmit={(data) => handleSave(data)} isLoading={isSaving} />}
    </Container>
  );
};
