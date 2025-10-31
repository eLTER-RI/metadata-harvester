import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { ContributorTypeOptions } from '../constants';
import { CommonDatasetMetadata, ContributorType } from '../../../../../src/store/commonStructure';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';

export const ContributorsGroup = () => {
  const { control, register, watch, setValue } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contributors',
  });

  const addContributor = () => {
    append({
      contributorGivenName: '',
      contributorFamilyName: '',
      contributorEmail: '',
      contributorAffiliation: {
        entityName: '',
      },
      contributorIDs: [],
      contributorType: 'Researcher',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="users" />
        Contributors
        <Header.Subheader>Provide the list of contributors</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.contributors" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Contributor {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>
          <Form.Group widths="equal">
            <Form.Field>
              <label>Given Name</label>
              <Form.Input placeholder="First name" {...register(`contributors.${index}.contributorGivenName`)} />
            </Form.Field>
            <Form.Field>
              <label>Family Name</label>
              <Form.Input placeholder="Last name" {...register(`contributors.${index}.contributorFamilyName`)} />
            </Form.Field>
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Email</label>
              <Form.Input
                type="email"
                placeholder="contributor@example.com"
                {...register(`contributors.${index}.contributorEmail`)}
              />
            </Form.Field>
            <Form.Field>
              <label>Contributor Type</label>
              <Form.Select
                options={ContributorTypeOptions}
                placeholder="Select contributor type"
                value={watch(`contributors.${index}.contributorType`) || ''}
                onChange={(e, { value }) => setValue(`contributors.${index}.contributorType`, value as ContributorType)}
              />
            </Form.Field>
          </Form.Group>

          <Form.Field>
            <label>Affiliation</label>
            <Form.Input {...register(`contributors.${index}.contributorAffiliation.entityName`)} />
          </Form.Field>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Contributor"
        onClick={addContributor}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
