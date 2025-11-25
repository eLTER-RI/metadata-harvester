import { Input } from 'semantic-ui-react';
import { useRecords } from '../../../store/RecordsProvider';
import { FilterAccordion } from './FilterAccordion';

interface DatasetTypeFilterProps {
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
}

export const DatasetTypeFilter = ({ index, isActive, onToggle }: DatasetTypeFilterProps) => {
  const { datasetTypeFilter, setDatasetTypeFilter, setCurrentPage } = useRecords();

  return (
    <FilterAccordion title="DATASET TYPE" index={index} isActive={isActive} onToggle={onToggle}>
      <Input
        placeholder="Search (e.g., SOGEO_001, SOBIO_014)..."
        value={datasetTypeFilter}
        onChange={(e) => {
          setDatasetTypeFilter(e.target.value);
          setCurrentPage(1);
        }}
        icon="search"
        iconPosition="left"
      />
    </FilterAccordion>
  );
};
