import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata, HabitatReference } from '../../../../../backend/src/models/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { useState } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

const HABITAT_CODES = ['A', 'B', 'C1', 'C2', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type HabitatCode = HabitatReference['soHabitatCode'];

export const HabitatReferencesGroup = () => {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'habitatReferences',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addHabitatReference = () => {
    append({
      soHabitatCode: 'A',
      soHabitatURI: '',
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
        <Icon name="leaf" />
        Habitat References
        <Header.Subheader>Select habitats references of the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.habitatReferences" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Habitat Reference {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Habitat Code *</label>
              <Form.Select
                options={HABITAT_CODES.map((code) => ({
                  key: code,
                  text: code,
                  value: code,
                }))}
                placeholder="Select habitat code"
                value={watch(`habitatReferences.${index}.soHabitatCode`) || ''}
                onChange={(_, { value }) => setValue(`habitatReferences.${index}.soHabitatCode`, value as HabitatCode)}
                error={
                  errors.habitatReferences?.[index]?.soHabitatCode ? { content: 'Habitat code is required' } : false
                }
              />
            </Form.Field>
            <Form.Field>
              <label>Habitat URI</label>
              <Form.Input
                placeholder="https://example.com/habitat"
                {...register(`habitatReferences.${index}.soHabitatURI`)}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Habitat Reference"
        onClick={addHabitatReference}
        style={{ marginTop: '1rem' }}
      />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Habitat Reference"
        itemName={indexToDelete !== null ? `Habitat Reference ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
