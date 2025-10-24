import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const LicensesGroup: React.FC = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'licenses',
  });

  const addLicense = () => {
    append({
      licenseCode: '',
      licenseURI: '',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="copyright" />
        Licenses
        <Header.Subheader>License information for the dataset</Header.Subheader>
      </Header>

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">License {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>License Code *</label>
              <Form.Input
                placeholder="e.g., CC-BY-4.0"
                {...register(`licenses.${index}.licenseCode`)}
                error={errors.licenses?.[index]?.licenseCode ? { content: 'License code is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>License URI</label>
              <Form.Input
                placeholder="https://creativecommons.org/licenses/by/4.0/"
                {...register(`licenses.${index}.licenseURI`)}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add License" onClick={addLicense} style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
