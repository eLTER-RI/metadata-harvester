import { Form } from 'semantic-ui-react';
import { CoordinateInput } from './CoordinateInput';

interface CoordinateGroupProps {
  latitudeName: any;
  longitudeName: any;
  latitudeLabel?: string;
  longitudeLabel?: string;
  pointIndex?: number;
  showActions?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
}

export const CoordinateGroup = ({
  latitudeName,
  longitudeName,
  latitudeLabel,
  longitudeLabel,
  pointIndex,
  showActions = false,
  onRemove,
  canRemove = true,
}: CoordinateGroupProps) => {
  const latLabel = latitudeLabel || (pointIndex !== undefined ? `Latitude ${pointIndex + 1}` : 'Latitude');
  const lngLabel = longitudeLabel || (pointIndex !== undefined ? `Longitude ${pointIndex + 1}` : 'Longitude');

  return (
    <Form.Group widths="equal">
      <CoordinateInput name={latitudeName} label={latLabel} placeholder="-90 to 90" />
      <CoordinateInput name={longitudeName} label={lngLabel} placeholder="-180 to 180" />
      {showActions && onRemove && (
        <Form.Field>
          <label>Actions</label>
          <Form.Button icon="minus" color="red" size="small" onClick={onRemove} disabled={!canRemove} />
        </Form.Field>
      )}
    </Form.Group>
  );
};
