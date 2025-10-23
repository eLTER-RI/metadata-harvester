import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const ResponsibleOrganizationsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="building" />
        Responsible Organizations
        <Header.Subheader>Provide information about organizations responsible for the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Organization Name *</label>
            <Form.Input placeholder="Name of the organization" />
          </Form.Field>
          <Form.Field>
            <label>Organization Email</label>
            <Form.Input type="email" placeholder="org@example.com" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Organization" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
