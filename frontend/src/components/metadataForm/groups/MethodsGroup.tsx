import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const MethodsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="cogs" />
        Methods
        <Header.Subheader>Methodological information about the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Field>
          <label>Method ID</label>
          <Form.Input placeholder="Method identifier" />
        </Form.Field>

        <Form.Field>
          <label>Instrumentation Description</label>
          <Form.TextArea placeholder="Describe the instruments used" rows={3} />
        </Form.Field>

        <Form.Field>
          <label>Quality Control Description</label>
          <Form.TextArea placeholder="Describe quality control procedures" rows={3} />
        </Form.Field>

        <Header as="h5">Sampling Information</Header>
        <Form.Field>
          <label>Study Description</label>
          <Form.TextArea placeholder="Describe the study design" rows={2} />
        </Form.Field>

        <Form.Field>
          <label>Sampling Description</label>
          <Form.TextArea placeholder="Describe sampling procedures" rows={2} />
        </Form.Field>
      </Segment>
      <Button type="button" icon="plus" content="Add Method" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
