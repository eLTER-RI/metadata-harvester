import { Modal, Button, Header, Icon } from 'semantic-ui-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  content?: string;
  itemName?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  isLoading = false,
}: DeleteConfirmModalProps) => {
  const defaultContent = itemName
    ? `Are you sure you want to delete "${itemName}"?`
    : 'Are you sure you want to delete this item?';

  return (
    <Modal open={open} onClose={onClose} size="small">
      <Header icon="trash" content={title} />
      <Modal.Content>{defaultContent}</Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading} disabled={isLoading}>
          <Icon name="trash" />
          Delete
        </Button>
      </Modal.Actions>
    </Modal>
  );
};
