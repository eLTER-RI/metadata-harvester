import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { useState } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

export const ContactPointsGroup = () => {
  const { control, register } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactPoints',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addContactPoint = () => {
    append({
      contactName: '',
      contactEmail: '',
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
        <Icon name="mail" />
        Contact Points
        <Header.Subheader>Provide contact information for the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.contactPoints" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Contact Point {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Contact Name</label>
              <Form.Input
                placeholder="Name of the contact person"
                {...register(`contactPoints.${index}.contactName`)}
              />
            </Form.Field>
            <Form.Field>
              <label>Contact Email</label>
              <Form.Input
                type="email"
                placeholder="contact@example.com"
                {...register(`contactPoints.${index}.contactEmail`)}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Contact Point"
        onClick={addContactPoint}
        style={{ marginTop: '1rem' }}
      />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Contact Point"
        itemName={indexToDelete !== null ? `Contact Point ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
