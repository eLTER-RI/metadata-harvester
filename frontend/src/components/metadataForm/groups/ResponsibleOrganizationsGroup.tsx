import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const ResponsibleOrganizationsGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'responsibleOrganizations',
  });

  const addOrganization = () => {
    append({
      organizationName: '',
      organizationEmail: '',
      organizationIDs: [],
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="building" />
        Responsible Organizations
        <Header.Subheader>Provide information about organizations responsible for the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.responsibleOrganizations" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Organization {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Organization Name *</label>
              <Form.Input
                placeholder="Name of the organization"
                {...register(`responsibleOrganizations.${index}.organizationName`)}
                error={
                  errors.responsibleOrganizations?.[index]?.organizationName
                    ? { content: 'Organization name is required' }
                    : false
                }
              />
            </Form.Field>
            <Form.Field>
              <label>Organization Email</label>
              <Form.Input
                type="email"
                placeholder="org@example.com"
                {...register(`responsibleOrganizations.${index}.organizationEmail`)}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Organization"
        onClick={addOrganization}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
