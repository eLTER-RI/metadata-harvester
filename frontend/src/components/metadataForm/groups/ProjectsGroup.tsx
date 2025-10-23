import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const ProjectsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="folder" />
        Projects
        <Header.Subheader>Provide projects associated with the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Project Name *</label>
            <Form.Input placeholder="Name of the project" />
          </Form.Field>
          <Form.Field>
            <label>Project ID</label>
            <Form.Input placeholder="Project identifier" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Project" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
