import { Container, Header, Form, Button, Message, Segment, TextArea } from 'semantic-ui-react';

export const CreateRecordPage = () => {
  return (
    <Container>
      <Header as="h1">{'Create New Record'}</Header>
      <Message info>
        <Message.Header>{'Creating a New Record'}</Message.Header>
        <p>
          Paste the metadata of the record in the JSON format. The record will be created in DAR and you will also be
          able to edit it from Harvester later.
        </p>
      </Message>
      <Segment>
        <Form>
          <Form.Field>
            <label>JSON Data</label>
            <TextArea
              placeholder='Paste JSON here, e.g. {"assetType": "Dataset", "titles": [{"titleText": "My Dataset", "titleLanguage": "en"}], ...}'
              rows={15}
            />
          </Form.Field>
          <Button primary type="button">
            {'Create Record'}
          </Button>
        </Form>
      </Segment>
    </Container>
  );
};
