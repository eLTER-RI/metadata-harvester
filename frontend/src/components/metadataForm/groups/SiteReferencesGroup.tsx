import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon, Message } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../backend/src/models/commonStructure';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { useState, useEffect } from 'react';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import { useFetchDeimsSites } from '../../../hooks/recordQueries';
import { useSyncSites } from '../../../hooks/recordMutations';

export const SiteReferencesGroup = () => {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'siteReferences',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);
  const { data: deimsSites = [], isLoading: isLoadingSites } = useFetchDeimsSites();
  const syncSitesMutation = useSyncSites();
  const [isSyncingSites, setIsSyncingSites] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (syncSitesMutation.isSuccess && isSyncingSites) {
      setSyncSuccessMessage('DEIMS sites synchronization started successfully.');
    }
  }, [syncSitesMutation.isSuccess, isSyncingSites]);

  const handleSyncSites = () => {
    if (isSyncingSites) return;
    setIsSyncingSites(true);
    setSyncSuccessMessage(null);
    syncSitesMutation.mutate();
  };

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

          <Form.Field>
            <label>Select a DEIMS Site *</label>
            <Button
              type="button"
              size="small"
              icon="sync"
              content="Sync DEIMS Sites"
              onClick={handleSyncSites}
              disabled={isSyncingSites}
              loading={isSyncingSites}
            />
            <Form.Select
              search
              clearable
              placeholder={isLoadingSites ? 'Loading sites' : 'Search and select a DEIMS site'}
              value={watch(`siteReferences.${index}.siteID`) || ''}
              options={deimsSites.map((site) => ({
                key: site.siteID,
                text: site.siteName,
                value: site.siteID,
              }))}
              loading={isLoadingSites}
              onChange={(_, { value }) => {
                if (value) {
                  const selectedSite = deimsSites.find((s) => s.siteID === value);
                  if (selectedSite) {
                    setValue(`siteReferences.${index}.siteID`, selectedSite.siteID);
                    setValue(`siteReferences.${index}.siteName`, selectedSite.siteName);
                  }
                } else {
                  setValue(`siteReferences.${index}.siteID`, '');
                  setValue(`siteReferences.${index}.siteName`, '');
                }
              }}
              error={errors.siteReferences?.[index]?.siteID ? { content: 'Site selection is required' } : false}
            />
            {syncSuccessMessage && (
              <Message success size="small">
                {syncSuccessMessage}
              </Message>
            )}
          </Form.Field>
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
