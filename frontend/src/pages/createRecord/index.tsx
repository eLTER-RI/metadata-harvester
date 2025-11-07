import { useParams } from 'react-router-dom';
import { RecordForm } from '../recordForm/RecordForm';
import { ManualRecordJsonForm } from './ManualRecordJsonForm';

export const RecordPage = () => {
  const { id: darId } = useParams<{ id?: string }>();

  if (darId) {
    return <RecordForm />;
  }

  return <ManualRecordJsonForm />;
};
