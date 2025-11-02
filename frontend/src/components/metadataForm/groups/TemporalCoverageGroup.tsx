import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { useState } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

export const TemporalCoverageGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'temporalCoverages',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addTemporalCoverage = () => {
    append({
      startDate: '',
      endDate: '',
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
        <Icon name="calendar" />
        Temporal Coverage
        <Header.Subheader>Provide time period covered by the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.temporalCoverages" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Time Period {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Start Date *</label>
              <Form.Input
                type="date"
                {...register(`temporalCoverages.${index}.startDate`)}
                error={errors.temporalCoverages?.[index]?.startDate ? { content: 'Start date is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>End Date *</label>
              <Form.Input
                type="date"
                {...register(`temporalCoverages.${index}.endDate`)}
                error={errors.temporalCoverages?.[index]?.endDate ? { content: 'End date is required' } : false}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Temporal Coverage"
        onClick={addTemporalCoverage}
        style={{ marginTop: '1rem' }}
      />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Temporal Coverage"
        itemName={indexToDelete !== null ? `Time Period ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
