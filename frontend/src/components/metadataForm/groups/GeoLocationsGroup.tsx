import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';

export const GeoLocationsGroup = () => {
  return (
    <Segment>
      <Header as="h3">
        <Icon name="map marker alternate" />
        Geographic Locations
        <Header.Subheader>Provide geographic coverage and location information</Header.Subheader>
      </Header>

      <Segment style={{ marginBottom: '1rem' }}>
        <Form.Field>
          <label>Geographic Description</label>
          <Form.TextArea placeholder="Describe the geographic area covered" rows={3} />
        </Form.Field>

        <Header as="h5">Bounding Box</Header>
        <Form.Group widths="equal">
          <Form.Field>
            <label>West Bound Longitude</label>
            <Form.Input type="number" step="0.000001" />
          </Form.Field>
          <Form.Field>
            <label>East Bound Longitude</label>
            <Form.Input type="number" step="0.000001" />
          </Form.Field>
        </Form.Group>

        <Form.Group widths="equal">
          <Form.Field>
            <label>South Bound Latitude</label>
            <Form.Input type="number" step="0.000001" />
          </Form.Field>
          <Form.Field>
            <label>North Bound Latitude</label>
            <Form.Input type="number" step="0.000001" />
          </Form.Field>
        </Form.Group>

        <Header as="h5">Observation Location</Header>
        <Form.Group widths="equal">
          <Form.Field>
            <label>DEIMS Location ID</label>
            <Form.Input placeholder="DEIMS site identifier" />
          </Form.Field>
          <Form.Field>
            <label>DEIMS Location Name</label>
            <Form.Input placeholder="Location name" />
          </Form.Field>
        </Form.Group>
      </Segment>

      <Button type="button" icon="plus" content="Add Geographic Location" style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
