import { Button, Message, Modal, List, Loader } from 'semantic-ui-react';
import { useFetchOarAssets } from '../../hooks/recordQueries';
import { useParams } from 'react-router-dom';

interface OarFormProps {
  darAssetId?: string;
  open?: boolean;
  onClose?: () => void;
  asModal?: boolean;
}

export const OarForm = ({ darAssetId: propDarAssetId, open, onClose, asModal = false }: OarFormProps) => {
  const { darId } = useParams();
  const darAssetId = propDarAssetId || darId;
  const { data: assets = [], isLoading } = useFetchOarAssets(darAssetId);

  const content = (
    <>
      {isLoading ? (
        <Loader active />
      ) : assets.length === 0 ? (
        <Message info>No online services found.</Message>
      ) : (
        <List divided>
          {assets.map((asset: any) => (
            <List.Item key={asset.id}>
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
