import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon, Dropdown } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import {
  getGeometryType,
  createDefaultGeoLocation,
  clearGeometryProperties,
  createDefaultGeometryData,
  geometryTypeOptions,
  GeometryType,
} from '../../../utils/geolocationUtils';
import {
  BoundingBoxSection,
  LineStringSection,
  ObservationLocationSection,
  PointSection,
  PolygonSection,
} from './geolocation';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';

export const GeoLocationsGroup: React.FC = () => {
  const { control, register, watch, setValue } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'geoLocations',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addGeoLocation = () => {
    const newGeoLocation = createDefaultGeoLocation();
    append(newGeoLocation);
  };

  const handleDeleteClick = (index: number) => {
    setIndexToDelete(index);
    setModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (indexToDelete !== null) {
      remove(indexToDelete);
      setModalOpen(false);
      setIndexToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setIndexToDelete(null);
  };

  const handleGeometryTypeChange = (index: number, type: GeometryType) => {
    const currentGeoLocation = watch(`geoLocations.${index}`);
    if (!currentGeoLocation) return;
    const updatedGeoLocation = clearGeometryProperties(currentGeoLocation);
    const newGeometryData = createDefaultGeometryData(type);
    const finalGeoLocation = { ...updatedGeoLocation, ...newGeometryData };
    setValue(`geoLocations.${index}`, finalGeoLocation);
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="map marker alternate" />
        Geographic Locations
        <Header.Subheader>Geographic coverage and location information</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.contactPoints" />

      {fields.map((field, index) => {
        const currentGeoLocation = watch(`geoLocations.${index}`);
        const currentGeometryType = getGeometryType(currentGeoLocation);

        return (
          <Segment key={field.id} style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <Header as="h4">Location {index + 1}</Header>
              <Button icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
            </div>

            <Form.Field>
              <label>Geographic Description</label>
              <Form.TextArea
                placeholder="Describe the geographic area covered"
                rows={3}
                {...register(`geoLocations.${index}.geographicDescription`)}
              />
            </Form.Field>

            <Form.Field>
              <label>Geometry Type</label>
              <Dropdown
                selection
                options={geometryTypeOptions}
                value={currentGeometryType}
                onChange={(_, { value }) => handleGeometryTypeChange(index, value as GeometryType)}
                placeholder="Select geometry type"
              />
            </Form.Field>

            {currentGeometryType === 'boundingBox' && <BoundingBoxSection index={index} />}
            {currentGeometryType === 'boundingPolygon' && <PolygonSection index={index} />}
            {currentGeometryType === 'lineString' && <LineStringSection index={index} />}
            {currentGeometryType === 'point' && <PointSection index={index} />}

            <ObservationLocationSection index={index} />
          </Segment>
        );
      })}

      <Button
        type="button"
        icon="plus"
        content="Add Geographic Location"
        onClick={addGeoLocation}
        style={{ marginTop: '1rem' }}
      />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Geographic Location"
        itemName={indexToDelete !== null ? `Location ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
