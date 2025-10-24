import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

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
  return (
    <Segment>
      <Header as="h3">
        <Icon name="linkify" />
        Related Identifiers
        <Header.Subheader>Identifiers of related resources</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Related ID *</label>
            <Form.Input placeholder="Related ID" />
          </Form.Field>
          <Form.Field>
            <label>ID Type</label>
            <Form.Select options={identifierTypeOptions} placeholder="Select ID type" />
          </Form.Field>
        </Form.Group>

        <Form.Group widths="equal">
          <Form.Field>
            <label>Resource Type</label>
            <Form.Select options={resourceTypeOptions} placeholder="Select resource type" />
          </Form.Field>
          <Form.Field>
            <label>Relation Type</label>
            <Form.Select options={relationTypeOptions} placeholder="Select relation type" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Related Identifier" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
