import { Input } from 'semantic-ui-react';
import { useRecords } from '../../../store/RecordsProvider';
import { FilterAccordion } from './FilterAccordion';

interface KeywordsFilterProps {
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
}

export const KeywordsFilter = ({ index, isActive, onToggle }: KeywordsFilterProps) => {
  const { keywordsFilter, setKeywordsFilter, setCurrentPage } = useRecords();

  return (
    <FilterAccordion title="KEYWORDS" index={index} isActive={isActive} onToggle={onToggle}>
      <Input
        placeholder="Search by keyword"
        value={keywordsFilter}
        onChange={(e) => {
          setKeywordsFilter(e.target.value);
          setCurrentPage(1);
        }}
        icon="search"
        iconPosition="left"
      />
    </FilterAccordion>
  );
};
