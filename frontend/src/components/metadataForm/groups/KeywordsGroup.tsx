import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../backend/src/models/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { useState } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

export const KeywordsGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'keywords',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addKeyword = () => {
    append({
      keywordLabel: '',
      keywordURI: '',
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
        <Icon name="tags" />
        Keywords
        <Header.Subheader>Add keywords for the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.keywords" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Keyword {index + 1}</Header>
            <Button type="button" icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Keyword Label *</label>
              <Form.Input
                placeholder="Enter keyword or tag"
                {...register(`keywords.${index}.keywordLabel`)}
                error={errors.keywords?.[index]?.keywordLabel ? { content: 'Keyword label is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>Keyword URI</label>
              <Form.Input placeholder="https://example.com/keyword" {...register(`keywords.${index}.keywordURI`)} />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add Keyword" onClick={addKeyword} style={{ marginTop: '1rem' }} />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Keyword"
        itemName={indexToDelete !== null ? `Keyword ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
