import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';

const descriptionTypeOptions = [
  { key: 'Abstract', text: 'Abstract', value: 'Abstract' },
  { key: 'AdditionalInfo', text: 'Additional Info', value: 'AdditionalInfo' },
  { key: 'Methods', text: 'Methods', value: 'Methods' },
  { key: 'SeriesInformation', text: 'Series Information', value: 'SeriesInformation' },
  { key: 'TableOfContents', text: 'Table of Contents', value: 'TableOfContents' },
  { key: 'TechnicalInfo', text: 'Technical Info', value: 'TechnicalInfo' },
  { key: 'Other', text: 'Other', value: 'Other' },
];

export const DescriptionsGroup = () => {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'descriptions',
  });

  const addDescription = () => {
    append({
      descriptionText: '',
      descriptionType: 'Abstract',
    });
  };
  return (
    <Segment>
      <Header as="h3">
        <Icon name="file text" />
        Descriptions
        <Header.Subheader>Provide descriptions of the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.descriptions" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Description {index + 1}</Header>
            <Button
              icon="trash"
              color="red"
              size="small"
              onClick={() => {
                remove(index);
              }}
            />
          </div>
          <Form.Field>
            <label>Description Type</label>
            <Form.Select
              options={descriptionTypeOptions}
              placeholder="Select description type"
              value={watch(`descriptions.${index}.descriptionType`) || ''}
              onChange={(_, { value }) => setValue(`descriptions.${index}.descriptionType`, value as string)}
            />
          </Form.Field>

          <Form.Field>
            <label>Description Text *</label>
            <Form.TextArea
              placeholder="Enter the description"
              rows={4}
              {...register(`descriptions.${index}.descriptionText`)}
              error={
                errors.descriptions?.[index]?.descriptionText ? { content: 'Description text is required' } : false
              }
            />
          </Form.Field>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Description"
        onClick={addDescription}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
