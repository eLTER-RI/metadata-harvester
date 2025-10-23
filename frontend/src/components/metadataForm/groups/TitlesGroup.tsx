import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const TitlesGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="header" />
        Titles
        <Header.Subheader>Provide titles for the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Title Text *</label>
            <Form.TextArea placeholder="Enter the title of the dataset" />
          </Form.Field>
        </Form.Group>

        <Form.Group widths="equal">
          <Form.Field>
            <label>Title Language</label>
            <Form.Input placeholder="e.g., English, en" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Title" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
