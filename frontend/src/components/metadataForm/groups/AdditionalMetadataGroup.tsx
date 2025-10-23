import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const AdditionalMetadataGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="info circle" />
        Additional Metadata
        <Header.Subheader>Custom metadata fields</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Field Name *</label>
            <Form.Input placeholder="Name of the metadata field" />
          </Form.Field>
          <Form.Field>
            <label>Field Value *</label>
            <Form.Input placeholder="Value of the metadata field" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Metadata Field" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
