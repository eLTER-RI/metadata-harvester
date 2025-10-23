import { Form, Segment, Header } from 'semantic-ui-react';

export const SimpleMetadataGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        Basic Information
        <Header.Subheader>Provide basic metadata about the dataset</Header.Subheader>
      </Header>

      <Form.Group widths="equal">
        <Form.Field>
          <label>Publication Date</label>
          <Form.Input type="date" />
        </Form.Field>
        <Form.Field>
          <label>Language</label>
          <Form.Input placeholder="e.g., English, en" />
        </Form.Field>
      </Form.Group>

      <Form.Group widths="equal">
        <Form.Field>
          <label>Data Level Code</label>
          <Form.Select
            options={[
              { key: '0', text: 'Level 0', value: '0' },
              { key: '1', text: 'Level 1', value: '1' },
              { key: '2', text: 'Level 2', value: '2' },
              { key: '3', text: 'Level 3', value: '3' },
            ]}
            placeholder="Select data level"
          />
        </Form.Field>
        <Form.Field>
          <label>Data Level URI</label>
          <Form.Input placeholder="https://example.com/data-level" />
        </Form.Field>
      </Form.Group>

      <Form.Field>
        <label>Dataset Type</label>
        <Form.Input placeholder="Type of dataset" />
      </Form.Field>
    </Segment>
  );
};
