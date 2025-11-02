import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata, IdentifierType } from '../../../../../src/store/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { useState } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

const identifierTypeOptions = [
  { key: 'DOI', text: 'DOI', value: 'DOI' },
  { key: 'URL', text: 'URL', value: 'URL' },
  { key: 'ISBN', text: 'ISBN', value: 'ISBN' },
  { key: 'ISSN', text: 'ISSN', value: 'ISSN' },
  { key: 'ORCID', text: 'ORCID', value: 'ORCID' },
  { key: 'Handle', text: 'Handle', value: 'Handle' },
  { key: 'Other', text: 'Other', value: 'Other' },
];

export const AlternateIdentifiersGroup = () => {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'alternateIdentifiers',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addAlternateIdentifier = () => {
    append({
      alternateID: '',
      alternateIDType: 'DOI',
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
        <Icon name="tag" />
        Alternate Identifiers
        <Header.Subheader>Provide alternative identifiers for the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.alternateIdentifiers" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Alternate Identifier {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Alternate ID *</label>
              <Form.Input
                placeholder="Alternate ID"
                {...register(`alternateIdentifiers.${index}.alternateID`)}
                error={
                  errors.alternateIdentifiers?.[index]?.alternateID ? { content: 'Alternate ID is required' } : false
                }
              />
            </Form.Field>
            <Form.Field>
              <label>ID Type</label>
              <Form.Select
                value={watch(`alternateIdentifiers.${index}.alternateIDType`) || ''}
                onChange={(e, { value }) =>
                  setValue(`alternateIdentifiers.${index}.alternateIDType`, value as IdentifierType)
                }
                options={identifierTypeOptions}
                placeholder="Select ID type"
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        onClick={addAlternateIdentifier}
        content="Add Alternate Identifier"
        style={{ marginTop: '1rem' }}
      />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Alternate Identifier"
        itemName={indexToDelete !== null ? `Alternate Identifier ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
