import { Header } from 'semantic-ui-react';
import { CoordinateGroup } from './CoordinateGroup';

interface PointSectionProps {
  index: number;
}

export const PointSection = ({ index }: PointSectionProps) => {
  return (
    <>
      <Header as="h5">Point</Header>
      <CoordinateGroup
        latitudeName={`geoLocations.${index}.point.latitude`}
        longitudeName={`geoLocations.${index}.point.longitude`}
      />
    </>
  );
};
