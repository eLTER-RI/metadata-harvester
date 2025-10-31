import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';

export const SiteReferencesGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'siteReferences',
  });

  const addSiteReference = () => {
    append({
      siteID: '',
      siteName: '',
    });
  };
  return (
    <Segment>
      <Header as="h3">
        <Icon name="map pin" />
        Site References
        <Header.Subheader>Provide data about research sites associated with the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.siteReferences" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Site Reference {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Site ID *</label>
              <Form.Input
                placeholder="Site identifier"
                {...register(`siteReferences.${index}.siteID`)}
                error={errors.siteReferences?.[index]?.siteID ? { content: 'Site ID is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>Site Name *</label>
              <Form.Input
                placeholder="Name of the site"
                {...register(`siteReferences.${index}.siteName`)}
                error={errors.siteReferences?.[index]?.siteName ? { content: 'Site name is required' } : false}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Site Reference"
        onClick={addSiteReference}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
