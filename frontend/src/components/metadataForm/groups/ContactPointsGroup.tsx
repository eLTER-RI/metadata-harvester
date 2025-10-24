import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const ContactPointsGroup = () => {
  const { control, register } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactPoints',
  });

  const addContactPoint = () => {
    append({
      contactName: '',
      contactEmail: '',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="mail" />
        Contact Points
        <Header.Subheader>Provide contact information for the dataset</Header.Subheader>
      </Header>
      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Contact Point {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Contact Name</label>
              <Form.Input
                placeholder="Name of the contact person"
                {...register(`contactPoints.${index}.contactName`)}
              />
            </Form.Field>
            <Form.Field>
              <label>Contact Email</label>
              <Form.Input
                type="email"
                placeholder="contact@example.com"
                {...register(`contactPoints.${index}.contactEmail`)}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Contact Point"
        onClick={addContactPoint}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
