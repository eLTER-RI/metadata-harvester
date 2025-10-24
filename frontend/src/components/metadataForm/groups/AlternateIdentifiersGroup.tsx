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

export const AlternateIdentifiersGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="tag" />
        Alternate Identifiers
        <Header.Subheader>Provide alternative identifiers for the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Alternate ID *</label>
            <Form.Input placeholder="Alternate ID" />
          </Form.Field>
          <Form.Field>
            <label>ID Type</label>
            <Form.Select options={identifierTypeOptions} placeholder="Select ID type" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Alternate Identifier" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
