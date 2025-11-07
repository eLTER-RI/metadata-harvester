import { useParams } from 'react-router-dom';
import { RecordForm } from './RecordForm';
import { ManualRecordJsonForm } from './ManualRecordJsonForm';

export const RecordPage = () => {
  const { darId } = useParams();

  if (darId) {
    return <RecordForm />;
  }

  return <ManualRecordJsonForm />;
};
