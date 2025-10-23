import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const KeywordsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="tags" />
        Keywords
        <Header.Subheader>Add keywords for the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Keyword Label *</label>
            <Form.Input placeholder="Enter keyword or tag" />
          </Form.Field>
          <Form.Field>
            <label>Keyword URI</label>
            <Form.Input placeholder="https://example.com/keyword" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Keyword" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
