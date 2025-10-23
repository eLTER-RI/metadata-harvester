import React from 'react';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const TemporalCoverageGroup: React.FC = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="calendar" />
        Temporal Coverage
        <Header.Subheader>Provide time period covered by the dataset</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Group widths="equal">
          <Form.Field>
            <label>Start Date *</label>
            <Form.Input type="date" />
          </Form.Field>
          <Form.Field>
            <label>End Date *</label>
            <Form.Input type="date" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Temporal Coverage" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
