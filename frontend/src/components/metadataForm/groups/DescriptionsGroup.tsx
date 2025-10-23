import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

const descriptionTypeOptions = [
  { key: 'Abstract', text: 'Abstract', value: 'Abstract' },
  { key: 'AdditionalInfo', text: 'Additional Info', value: 'AdditionalInfo' },
  { key: 'Methods', text: 'Methods', value: 'Methods' },
  { key: 'SeriesInformation', text: 'Series Information', value: 'SeriesInformation' },
  { key: 'TableOfContents', text: 'Table of Contents', value: 'TableOfContents' },
  { key: 'TechnicalInfo', text: 'Technical Info', value: 'TechnicalInfo' },
  { key: 'Other', text: 'Other', value: 'Other' },
];

export const DescriptionsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="file text" />
        Descriptions
        <Header.Subheader>Provide descriptions of the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Field>
          <label>Description Type</label>
          <Form.Select options={descriptionTypeOptions} placeholder="Select description type" />
        </Form.Field>

        <Form.Field>
          <label>Description Text *</label>
          <Form.TextArea placeholder="Enter the description" rows={4} />
        </Form.Field>
      </Segment>

      <Button type="button" icon="plus" content="Add Description" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
