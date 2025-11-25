import { Input } from 'semantic-ui-react';
import { useRecords } from '../../../store/RecordsProvider';
import { FilterAccordion } from './FilterAccordion';

interface SitesFilterProps {
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
}

export const SitesFilter = ({ index, isActive, onToggle }: SitesFilterProps) => {
  const { sitesFilter, setSitesFilter, setCurrentPage } = useRecords();

  return (
    <FilterAccordion title="SITES" index={index} isActive={isActive} onToggle={onToggle}>
      <Input
        placeholder="Search by ID or name"
        value={sitesFilter}
        onChange={(e) => {
          setSitesFilter(e.target.value);
          setCurrentPage(1);
        }}
        icon="search"
        iconPosition="left"
      />
    </FilterAccordion>
  );
};
