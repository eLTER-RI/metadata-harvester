import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

export const LicensesGroup: React.FC = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'licenses',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addLicense = () => {
    append({
      licenseCode: '',
      licenseURI: '',
    });
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

  return (
    <Segment>
      <Header as="h3">
        <Icon name="copyright" />
        Licenses
        <Header.Subheader>License information for the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.licenses" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">License {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>License Code *</label>
              <Form.Input
                placeholder="e.g., CC-BY-4.0"
                {...register(`licenses.${index}.licenseCode`)}
                error={errors.licenses?.[index]?.licenseCode ? { content: 'License code is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>License URI</label>
              <Form.Input
                placeholder="https://creativecommons.org/licenses/by/4.0/"
                {...register(`licenses.${index}.licenseURI`)}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add License" onClick={addLicense} style={{ marginTop: '1rem' }} />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete License"
        itemName={indexToDelete !== null ? `License ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
