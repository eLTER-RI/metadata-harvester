import { useFormContext, useWatch } from 'react-hook-form';
import { Button, Header } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../../src/store/commonStructure';
import { CoordinateGroup } from './CoordinateGroup';

interface LineStringSectionProps {
  index: number;
}

export const LineStringSection = ({ index }: LineStringSectionProps) => {
  const { setValue, watch } = useFormContext<CommonDatasetMetadata>();
  const currentGeoLocation = useWatch({
    name: `geoLocations.${index}`,
  });

  const addLineStringPoint = () => {
    const currentLineString = watch(`geoLocations.${index}.lineString`);
    const newPoints = [...(currentLineString || []), { latitude: 0, longitude: 0 }];
    setValue(`geoLocations.${index}.lineString`, newPoints);
  };

  const removeLineStringPoint = (pointIndex: number) => {
    const currentLineString = watch(`geoLocations.${index}.lineString`);
    const newPoints = currentLineString?.filter((_, index) => index !== pointIndex) || [];
    setValue(`geoLocations.${index}.lineString`, newPoints);
  };

  if (!currentGeoLocation?.lineString) {
    return null;
  }

  return (
    <>
      <Header as="h5">Line String</Header>
      {currentGeoLocation.lineString.map((_: any, pointIndex: number) => (
        <CoordinateGroup
          key={pointIndex}
          latitudeName={`geoLocations.${index}.lineString.${pointIndex}.latitude`}
          longitudeName={`geoLocations.${index}.lineString.${pointIndex}.longitude`}
          pointIndex={pointIndex}
          showActions={true}
          onRemove={() => removeLineStringPoint(pointIndex)}
          canRemove={(currentGeoLocation.lineString?.length ?? 0) > 1}
        />
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Point"
        onClick={addLineStringPoint}
        style={{ marginBottom: '1rem' }}
      />
    </>
  );
};
