import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { ContributorTypeOptions } from '../constants';

export const ContributorsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="users" />
        Contributors
        <Header.Subheader>Provide the list of contributors</Header.Subheader>
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
            <Form.Input type="email" placeholder="contributor@example.com" />
          </Form.Field>
          <Form.Field>
            <label>Contributor Type</label>
            <Form.Select options={ContributorTypeOptions} placeholder="Select contributor type" />
          </Form.Field>
        </Form.Group>

        <Form.Field>
          <label>Affiliation</label>
          <Form.Input />
        </Form.Field>
      </Segment>

      <Button type="button" icon="plus" content="Add Contributor" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
