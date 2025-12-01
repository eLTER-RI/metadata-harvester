import { useState, useEffect } from 'react';
import { Container, Header, Form, Button, Message, Segment, TextArea } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import { useCreateManualRecord, useUpdateManualRecord } from '../../hooks/recordMutations';
import { CommonDatasetMetadata } from '../../../../backend/src/models/commonStructure';

interface ManualRecordJsonFormProps {
  initialData?: CommonDatasetMetadata;
  darId?: string;
}

export const ManualRecordJsonForm = ({ initialData, darId }: ManualRecordJsonFormProps = {}) => {
  const navigate = useNavigate();
  const { mutate: createRecord, error: createError, isPending: isCreating } = useCreateManualRecord();
  const { mutate: updateRecord, error: updateError, isPending: isUpdating } = useUpdateManualRecord();
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditMode = !!darId && !!initialData;
  const isSaving = isCreating || isUpdating;
  const saveError = createError || updateError;

  useEffect(() => {
    if (initialData) {
      try {
        const formattedJson = JSON.stringify({ metadata: initialData }, null, 2);
        setJsonInput(formattedJson);
      } catch {
        try {
          const formattedJson = JSON.stringify(initialData, null, 2);
          setJsonInput(formattedJson);
        } catch {
          setJsonInput('');
          setJsonError('Failed to format initial data as JSON');
        }
      }
    }
  }, [initialData]);

  const handleJsonSubmit = () => {
    setJsonError(null);
    setSuccessMessage(null);

    if (!jsonInput.trim()) {
      setJsonError(isEditMode ? 'JSON data cannot be empty' : 'Paste JSON data');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const metadata = parsed.metadata || parsed;
      if (!metadata.assetType) {
        setJsonError('Metadata must include assetType');
        return;
      }

      if (isEditMode && darId) {
        updateRecord(
          { darId, metadata: metadata as CommonDatasetMetadata },
          {
            onSuccess: () => {
              setSuccessMessage('Record updated successfully');
              setTimeout(() => {
                navigate('/manual_records');
              }, 2000);
            },
            onError: () => {},
          },
        );
      } else {
        createRecord(
          { metadata: metadata as CommonDatasetMetadata },
          {
            onSuccess: (data) => {
              setSuccessMessage(`Record created with DAR id: ${data.dar_id}`);
              setTimeout(() => {
                navigate('/manual_records');
              }, 2000);
            },
            onError: () => {},
          },
        );
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setJsonError(`Invalid JSON: ${error.message}`);
      } else {
        setJsonError('Failed to parse JSON');
      }
    }
  };

  return (
    <Container>
      <Header as="h1">{isEditMode ? `Edit Record ${darId}` : 'Create New Record'}</Header>
      <Message info>
        <Message.Header>{isEditMode ? 'Updating Manual Record' : 'Creating a New Record'}</Message.Header>
        <p>
          {isEditMode
            ? 'Edit the metadata of the record in the JSON format. Changes will be saved to the manual records database and updated in DAR.'
            : 'Paste the metadata of the record in the JSON format. The record will be created in DAR and you will also be able to edit it from Harvester later.'}
        </p>
      </Message>
      <Segment>
        <Form>
          <Form.Field>
            <label>{isEditMode ? 'Edit Record Metadata (JSON)' : 'Record Metadata (JSON)'}</label>
            <TextArea
              placeholder='Paste JSON here, e.g. {"assetType": "Dataset", "titles": [{"titleText": "My Dataset", "titleLanguage": "en"}], ...}'
              rows={15}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError(null);
              }}
              style={{ fontFamily: 'monospace', fontSize: '14px' }}
              disabled={isSaving}
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

          {saveError && (
            <Message negative>
              <Message.Header>Error {isEditMode ? 'Updating Record' : 'Creating Record'}</Message.Header>
              <p>
                {(saveError as any)?.response?.data?.error ||
                  saveError?.message ||
                  `Failed to ${isEditMode ? 'update' : 'create'} record`}
              </p>
            </Message>
          )}

          <Button
            primary
            type="button"
            onClick={handleJsonSubmit}
            loading={isSaving}
            disabled={isSaving || !jsonInput.trim()}
            icon={isEditMode ? 'save' : 'plus'}
            content={
              isSaving ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create Record'
            }
          />
        </Form>
      </Segment>
    </Container>
  );
};
