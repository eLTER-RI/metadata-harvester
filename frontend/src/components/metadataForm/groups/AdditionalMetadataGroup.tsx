import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const AdditionalMetadataGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalMetadata',
  });
  const addAdditionalMetadata = () => {
    append({
      name: '',
      value: '',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="info circle" />
        Additional Metadata
        <Header.Subheader>Custom metadata fields</Header.Subheader>
      </Header>
      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Metadata Field {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Field Name *</label>
              <Form.Input
                placeholder="Name of the metadata field"
                {...register(`additionalMetadata.${index}.name`)}
                error={errors.additionalMetadata?.[index]?.name ? { content: 'Field name is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>Field Value *</label>
              <Form.Input
                placeholder="Value of the metadata field"
                {...register(`additionalMetadata.${index}.value`)}
                error={errors.additionalMetadata?.[index]?.value ? { content: 'Field value is required' } : false}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}
      <Button
        type="button"
        icon="plus"
        content="Add Metadata Field"
        onClick={addAdditionalMetadata}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
