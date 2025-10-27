import { Form, Header } from 'semantic-ui-react';
import { CoordinateInput } from './CoordinateInput';

interface BoundingBoxSectionProps {
  index: number;
}

export const BoundingBoxSection = ({ index }: BoundingBoxSectionProps) => {
  return (
    <>
      <Header as="h5">Bounding Box</Header>
      <Form.Group widths="equal">
        <CoordinateInput
          name={`geoLocations.${index}.boundingBox.westBoundLongitude` as any}
          label="West Bound Longitude"
          placeholder="-180 to 180"
        />
        <CoordinateInput
          name={`geoLocations.${index}.boundingBox.eastBoundLongitude` as any}
          label="East Bound Longitude"
          placeholder="-180 to 180"
        />
      </Form.Group>

      <Form.Group widths="equal">
        <CoordinateInput
          name={`geoLocations.${index}.boundingBox.southBoundLatitude` as any}
          label="South Bound Latitude"
          placeholder="-90 to 90"
        />
        <CoordinateInput
          name={`geoLocations.${index}.boundingBox.northBoundLatitude` as any}
          label="North Bound Latitude"
          placeholder="-90 to 90"
        />
      </Form.Group>
    </>
  );
};
