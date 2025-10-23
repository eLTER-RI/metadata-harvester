import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const CreatorsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="user" />
        Creators
        <Header.Subheader>Provide information about creators of the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Given Name</label>
            <Form.Input placeholder="First name" />
          </Form.Field>
          <Form.Field>
            <label>Family Name</label>
            <Form.Input placeholder="Last name" />
          </Form.Field>
        </Form.Group>

        <Form.Group widths="equal">
          <Form.Field>
            <label>Email</label>
            <Form.Input type="email" placeholder="creator@example.com" />
          </Form.Field>
          <Form.Field>
            <label>Affiliation</label>
            <Form.Input />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Creator" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
