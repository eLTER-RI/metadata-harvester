import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../backend/src/models/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { useState } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';

export const SiteReferencesGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'siteReferences',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const addSiteReference = () => {
    append({
      siteID: '',
      siteName: '',
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
        <Icon name="map pin" />
        Site References
        <Header.Subheader>Provide data about research sites associated with the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.siteReferences" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Site Reference {index + 1}</Header>
            <Button type="button" icon="trash" color="red" size="small" onClick={() => handleDeleteClick(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Site ID *</label>
              <Form.Input
                placeholder="Site identifier"
                {...register(`siteReferences.${index}.siteID`)}
                error={errors.siteReferences?.[index]?.siteID ? { content: 'Site ID is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>Site Name *</label>
              <Form.Input
                placeholder="Name of the site"
                {...register(`siteReferences.${index}.siteName`)}
                error={errors.siteReferences?.[index]?.siteName ? { content: 'Site name is required' } : false}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Site Reference"
        onClick={addSiteReference}
        style={{ marginTop: '1rem' }}
      />
      <DeleteConfirmModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Site Reference"
        itemName={indexToDelete !== null ? `Site Reference ${indexToDelete + 1}` : undefined}
      />
    </Segment>
  );
};
