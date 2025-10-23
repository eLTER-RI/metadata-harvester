import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const SiteReferencesGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="map pin" />
        Site References
        <Header.Subheader>Provide data about research sites associated with the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Site ID *</label>
            <Form.Input placeholder="Site identifier" />
          </Form.Field>
          <Form.Field>
            <label>Site Name *</label>
            <Form.Input placeholder="Name of the site" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Site Reference" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
