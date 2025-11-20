import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Form, Button, Message } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../backend/src/models/commonStructure';
import { SiteReferencesGroup } from './metadataForm/groups/SiteReferencesGroup';
import { KeywordsGroup } from './metadataForm/groups/KeywordsGroup';
import { DatasetTypeGroup } from './metadataForm/groups/DatasetTypeGroup';
import { HabitatReferencesGroup } from './metadataForm/groups/HabitatReferencesGroup';

interface CurationFormProps {
  data: CommonDatasetMetadata;
  onSubmit: (data: CommonDatasetMetadata) => void;
  isLoading?: boolean;
}

export const CurationForm = ({ data, onSubmit, isLoading = false }: CurationFormProps) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<CommonDatasetMetadata>({
    defaultValues: data,
    mode: 'onChange',
  });

  const { handleSubmit } = form;

  const onFormSubmit = (formData: CommonDatasetMetadata) => {
    setValidationErrors([]);
    try {
      onSubmit(formData);
    } catch (error) {
      if (error instanceof Error) {
        setValidationErrors([error.message]);
      }
    }
  };

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleSubmit(onFormSubmit)}>
        {validationErrors.length > 0 && (
          <Message negative>
            <Message.Header>Validation Errors</Message.Header>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Message>
        )}

        <DatasetTypeGroup />
        <HabitatReferencesGroup />
        <SiteReferencesGroup />
        <KeywordsGroup />

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Button
            type="submit"
            primary
            size="large"
            icon="save"
            loading={isLoading}
            disabled={isLoading}
            content={isLoading ? 'Saving...' : 'Save Changes'}
          />
        </div>
      </Form>
    </FormProvider>
  );
};
