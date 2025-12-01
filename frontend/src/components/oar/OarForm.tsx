import { Button, Message, Modal, List, Loader, Form, Input } from 'semantic-ui-react';
import { useFetchOarAssets } from '../../hooks/recordQueries';
import { useParams } from 'react-router-dom';
import { useCreateOarAsset, useDeleteOarAsset } from '../../hooks/recordMutations';
import { useState } from 'react';

interface OarFormProps {
  darAssetId?: string;
  open?: boolean;
  onClose?: () => void;
  asModal?: boolean;
}

export const OarForm = ({ darAssetId: propDarAssetId, open, onClose, asModal = false }: OarFormProps) => {
  const { darId } = useParams();
  const darAssetId = propDarAssetId || darId;
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { data: assets = [], isLoading } = useFetchOarAssets(darAssetId);
  const { mutate: createOarAsset, isPending: isCreating } = useCreateOarAsset();
  const { mutate: deleteOarAsset, isPending: isDeleting } = useDeleteOarAsset();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !darAssetId) return;

    createOarAsset(
      { url: url.trim(), darAssetId },
      {
        onSuccess: () => {
          setMessage({ type: 'success', text: 'Online services and data record created successfully.' });
          setUrl('');
        },
        onError: (err: any) => {
          setMessage({
            type: 'error',
            text: err?.response?.data?.error || 'Failed to create online services and data record.',
          });
        },
      },
    );
  };

  const handleDelete = (assetId: string) => {
    deleteOarAsset(assetId, {
      onSuccess: () => {
        setMessage({ type: 'success', text: 'Online services and data deleted.' });
      },
      onError: (err: any) => {
        setMessage({
          type: 'error',
          text: err?.response?.data?.error || 'Failed to delete online services and data record.',
        });
      },
    });
  };

  const content = (
    <>
      {message && (
        <Message negative={message.type === 'error'} success={message.type === 'success'}>
          {message.text}
        </Message>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Field>
          <Input
            placeholder="https://example.com/geoserver"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isCreating}
            action={
              <Button type="submit" primary loading={isCreating}>
                Create
              </Button>
            }
          />
        </Form.Field>
      </Form>

      {isLoading ? (
        <Loader active />
      ) : assets.length === 0 ? (
        <Message info>No online services found.</Message>
      ) : (
        <List divided>
          {assets.map((asset: any) => (
            <List.Item key={asset.id}>
              <List.Content floated="right">
                <Button
                  negative
                  size="small"
                  icon="trash"
                  onClick={() => handleDelete(asset.id)}
                  loading={isDeleting}
                  disabled={isDeleting}
                />
              </List.Content>
              <List.Content>
                <List.Header>{asset.onlineUrl}</List.Header>
                <List.Description>
                  {asset.serviceType}
                  {asset.state}
                </List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      )}
    </>
  );

  if (asModal) {
    return (
      <Modal open={open ?? false} onClose={onClose}>
        <Modal.Header>Online services and data</Modal.Header>
        <Modal.Content>{content}</Modal.Content>
        <Modal.Actions>
          <Button onClick={onClose}>Close</Button>
        </Modal.Actions>
      </Modal>
    );
  }

  return <>{content}</>;
};
