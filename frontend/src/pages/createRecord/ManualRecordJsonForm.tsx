import { useState } from 'react';
import { Container, Header, Form, Button, Message, Segment, TextArea, Input } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import { useCreateManualRecord } from '../../hooks/recordMutations';

export const CreateRecordPage = () => {
  const navigate = useNavigate();
  const { mutate: createRecord, error: createError, isPending: isCreating } = useCreateManualRecord();
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleJsonSubmit = () => {
    setJsonError(null);
    setSuccessMessage(null);

    if (!jsonInput.trim()) {
      setJsonError('Paste JSON data');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const metadata = parsed.metadata || parsed;
      if (!metadata.assetType) {
        setJsonError('Metadata must include assetType');
        return;
      }

      createRecord(
        { metadata },
        {
          onSuccess: (data) => {
            setSuccessMessage(`Record created with DAR id: ${data.dar_id}`);
            setTimeout(() => {
              navigate('/');
            }, 2000);
          },
          onError: () => {},
        },
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        setJsonError(`Invalid JSON: ${error.message}`);
      } else {
        setJsonError('Failed to parse JSON');
      }
    }
  };

  // address /edit/dar_id
  return (
    <Container>
      <Header as="h1">Create New Record</Header>
      <Message info>
        <Message.Header>Creating a New Record</Message.Header>
        <p>
          Paste the metadata of the record in the JSON format. The record will be created in DAR and you will also be
          able to edit it from Harvester later.
        </p>
      </Message>
      <Segment>
        <Form>
          <Form.Field>
            <TextArea
              placeholder='Paste JSON here, e.g. {"assetType": "Dataset", "titles": [{"titleText": "My Dataset", "titleLanguage": "en"}], ...}'
              rows={15}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Field>
          {jsonError && (
            <Message negative>
              <Message.Header>JSON Error</Message.Header>
              <p>{jsonError}</p>
            </Message>
          )}
          {successMessage && (
            <Message positive>
              <Message.Header>Success!</Message.Header>
              <p>{successMessage}</p>
            </Message>
          )}
          {createError && (
            <Message negative>
              <Message.Header>Error Creating Record</Message.Header>
              <p>{createError.message || 'Failed to create record'}</p>
            </Message>
          )}
          <Button
            primary
            type="button"
            onClick={handleJsonSubmit}
            loading={isCreating}
            disabled={isCreating || !jsonInput.trim()}
          >
            Create Record
          </Button>
        </Form>
      </Segment>
    </Container>
  );
};
