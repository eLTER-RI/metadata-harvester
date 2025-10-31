import { useFieldArray, useFormContext } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { CommonDatasetMetadata, IdentifierType } from '../../../../../src/store/commonStructure';
import { RelatedResourceType, RelationTypeValues } from 'elter-metadata-validation-schemas';

const identifierTypeOptions = [
  { key: 'DOI', text: 'DOI', value: 'DOI' },
  { key: 'URL', text: 'URL', value: 'URL' },
  { key: 'ISBN', text: 'ISBN', value: 'ISBN' },
  { key: 'ISSN', text: 'ISSN', value: 'ISSN' },
  { key: 'ORCID', text: 'ORCID', value: 'ORCID' },
  { key: 'Handle', text: 'Handle', value: 'Handle' },
  { key: 'Other', text: 'Other', value: 'Other' },
];

const resourceTypeOptions = [
  { key: 'Dataset', text: 'Dataset', value: 'Dataset' },
  { key: 'JournalArticle', text: 'Journal Article', value: 'JournalArticle' },
  { key: 'Book', text: 'Book', value: 'Book' },
  { key: 'Software', text: 'Software', value: 'Software' },
  { key: 'Other', text: 'Other', value: 'Other' },
];

const relationTypeOptions = [
  { key: 'IsCitedBy', text: 'Is Cited By', value: 'IsCitedBy' },
  { key: 'Cites', text: 'Cites', value: 'Cites' },
  { key: 'IsSupplementTo', text: 'Is Supplement To', value: 'IsSupplementTo' },
  { key: 'IsPartOf', text: 'Is Part Of', value: 'IsPartOf' },
  { key: 'HasPart', text: 'Has Part', value: 'HasPart' },
  { key: 'References', text: 'References', value: 'References' },
  { key: 'IsReferencedBy', text: 'Is Referenced By', value: 'IsReferencedBy' },
  { key: 'Other', text: 'Other', value: 'Other' },
];

export const RelatedIdentifiersGroup = () => {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'relatedIdentifiers',
  });

  const addRelatedIdentifier = () => {
    append({
      relatedID: '',
      relatedIDType: 'DOI',
      relatedResourceType: 'Dataset',
      relationType: 'References',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="linkify" />
        Related Identifiers
        <Header.Subheader>Identifiers of related resources</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.relatedIdentifiers" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Related Identifier {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>
          <Form.Group widths="equal">
            <Form.Field
              {...register(`relatedIdentifiers.${index}.relatedID`)}
              error={errors.relatedIdentifiers?.[index]?.relatedID ? { content: 'Related ID is required' } : false}
            >
              <label>Related ID *</label>
              <Form.Input placeholder="Related ID" />
            </Form.Field>
            <Form.Field>
              <label>ID Type</label>
              <Form.Select
                options={identifierTypeOptions}
                placeholder="Select ID type"
                value={watch(`relatedIdentifiers.${index}.relatedIDType`) || ''}
                onChange={(_, { value }) =>
                  setValue(`relatedIdentifiers.${index}.relatedIDType`, value as IdentifierType)
                }
              />
            </Form.Field>
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Resource Type</label>
              <Form.Select
                options={resourceTypeOptions}
                placeholder="Select resource type"
                value={watch(`relatedIdentifiers.${index}.relatedResourceType`) || ''}
                onChange={(_, { value }) =>
                  setValue(`relatedIdentifiers.${index}.relatedResourceType`, value as RelatedResourceType)
                }
              />
            </Form.Field>
            <Form.Field>
              <label>Relation Type</label>
              <Form.Select
                options={relationTypeOptions}
                placeholder="Select relation type"
                value={watch(`relatedIdentifiers.${index}.relationType`) || ''}
                onChange={(_, { value }) =>
                  setValue(`relatedIdentifiers.${index}.relationType`, value as RelationTypeValues)
                }
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Related Identifier"
        onClick={addRelatedIdentifier}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
