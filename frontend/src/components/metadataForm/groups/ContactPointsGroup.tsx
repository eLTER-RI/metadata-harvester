import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const ContactPointsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="mail" />
        Contact Points
        <Header.Subheader>Provide contact information for the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Contact Name</label>
            <Form.Input placeholder="Name of the contact person" />
          </Form.Field>
          <Form.Field>
            <label>Contact Email</label>
            <Form.Input type="email" placeholder="contact@example.com" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Contact Point" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
