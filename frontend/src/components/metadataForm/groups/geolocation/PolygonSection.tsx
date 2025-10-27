import { useFormContext, useWatch } from 'react-hook-form';
import { Button, Header, Segment } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../../src/store/commonStructure';
import { CoordinateGroup } from './CoordinateGroup';

interface PolygonSectionProps {
  index: number;
}

export const PolygonSection = ({ index }: PolygonSectionProps) => {
  const { setValue, watch } = useFormContext<CommonDatasetMetadata>();
  const currentGeoLocation = useWatch({
    name: `geoLocations.${index}`,
  });

  const addPolygon = () => {
    const currentPolygons = watch(`geoLocations.${index}.boundingPolygon`) || [];
    const newPolygon = {
      points: [{ latitude: 0, longitude: 0 }],
      inPolygonPoint: { latitude: 0, longitude: 0 },
    };
    setValue(`geoLocations.${index}.boundingPolygon`, [...currentPolygons, newPolygon]);
  };

  const removePolygon = (polygonIndex: number) => {
    const currentPolygons = watch(`geoLocations.${index}.boundingPolygon`) || [];
    const newPolygons = currentPolygons.filter((_, index) => index !== polygonIndex);
    setValue(`geoLocations.${index}.boundingPolygon`, newPolygons);
  };

  const addPolygonPoint = (polygonIndex: number) => {
    const currentPolygon = watch(`geoLocations.${index}.boundingPolygon.${polygonIndex}`);
    const newPoints = [...(currentPolygon?.points || []), { latitude: 0, longitude: 0 }];
    setValue(`geoLocations.${index}.boundingPolygon.${polygonIndex}.points`, newPoints);
  };

  const removePolygonPoint = (polygonIndex: number, pointIndex: number) => {
    const currentPolygon = watch(`geoLocations.${index}.boundingPolygon.${polygonIndex}`);
    const newPoints = currentPolygon?.points?.filter((_, index) => index !== pointIndex) || [];
    setValue(`geoLocations.${index}.boundingPolygon.${polygonIndex}.points`, newPoints);
  };

  if (!currentGeoLocation?.boundingPolygon) {
    return null;
  }

  return (
    <>
      <Header as="h5">Polygons</Header>
      {currentGeoLocation.boundingPolygon.map((polygon: any, polygonIndex: number) => (
        <Segment key={polygonIndex} style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <Header as="h6">Polygon {polygonIndex + 1}</Header>
            <Button
              icon="trash"
              color="red"
              size="small"
              onClick={() => removePolygon(polygonIndex)}
              disabled={(currentGeoLocation.boundingPolygon?.length ?? 0) <= 1}
            />
          </div>

          <Header as="h6">Polygon Points</Header>
          {polygon.points?.map((_: any, pointIndex: number) => (
            <CoordinateGroup
              key={pointIndex}
              latitudeName={`geoLocations.${index}.boundingPolygon.${polygonIndex}.points.${pointIndex}.latitude`}
              longitudeName={`geoLocations.${index}.boundingPolygon.${polygonIndex}.points.${pointIndex}.longitude`}
              pointIndex={pointIndex}
              showActions={true}
              onRemove={() => removePolygonPoint(polygonIndex, pointIndex)}
              canRemove={(polygon.points?.length ?? 0) > 1}
            />
          ))}

          <Button
            type="button"
            icon="plus"
            content="Add Point"
            onClick={() => addPolygonPoint(polygonIndex)}
            style={{ marginBottom: '1rem' }}
          />

          <Header as="h6">Point Inside Polygon</Header>
          <CoordinateGroup
            latitudeName={`geoLocations.${index}.boundingPolygon.${polygonIndex}.inPolygonPoint.latitude`}
            longitudeName={`geoLocations.${index}.boundingPolygon.${polygonIndex}.inPolygonPoint.longitude`}
            latitudeLabel="Latitude"
            longitudeLabel="Longitude"
          />
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add Polygon" onClick={addPolygon} style={{ marginBottom: '1rem' }} />
    </>
  );
};
