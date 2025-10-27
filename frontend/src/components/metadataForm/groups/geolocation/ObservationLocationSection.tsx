import { useFormContext } from 'react-hook-form';
import { Form, Header } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../../src/store/commonStructure';

interface ObservationLocationSectionProps {
  index: number;
}

export const ObservationLocationSection = ({ index }: ObservationLocationSectionProps) => {
  const { register } = useFormContext<CommonDatasetMetadata>();

  return (
    <>
      <Header as="h5">Observation Location</Header>
      <Form.Group widths="equal">
        <Form.Field>
          <label>DEIMS Location ID</label>
          <Form.Input
            placeholder="DEIMS site identifier"
            {...register(`geoLocations.${index}.observationLocation.deimsLocationID`)}
          />
        </Form.Field>
        <Form.Field>
          <label>DEIMS Location Name</label>
          <Form.Input
            placeholder="Name of the location"
            {...register(`geoLocations.${index}.observationLocation.deimsLocationName`)}
          />
        </Form.Field>
      </Form.Group>
    </>
  );
};
