import { useFieldArray, useFormContext } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const CreatorsGroup = () => {
  const { control, register } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'creators',
  });

  const addCreator = () => {
    append({
      creatorGivenName: '',
      creatorFamilyName: '',
      creatorEmail: '',
      creatorAffiliation: {
        entityName: '',
      },
      creatorIDs: [],
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="user" />
        Creators
        <Header.Subheader>Provide information about creators of the dataset</Header.Subheader>
      </Header>

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Creator {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Given Name</label>
              <Form.Input placeholder="First name" {...register(`creators.${index}.creatorGivenName`)} />
            </Form.Field>
            <Form.Field>
              <label>Family Name</label>
              <Form.Input placeholder="Last name" {...register(`creators.${index}.creatorFamilyName`)} />
            </Form.Field>
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Email</label>
              <Form.Input
                type="email"
                placeholder="creator@example.com"
                {...register(`creators.${index}.creatorEmail`)}
              />
            </Form.Field>
            <Form.Field>
              <label>Affiliation</label>
              <Form.Input {...register(`creators.${index}.creatorAffiliation.entityName`)} />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add Creator" onClick={addCreator} style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
