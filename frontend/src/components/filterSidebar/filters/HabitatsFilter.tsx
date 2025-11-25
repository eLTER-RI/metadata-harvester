import { Input } from 'semantic-ui-react';
import { useRecords } from '../../../store/RecordsProvider';
import { FilterAccordion } from './FilterAccordion';

interface HabitatsFilterProps {
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
}

export const HabitatsFilter = ({ index, isActive, onToggle }: HabitatsFilterProps) => {
  const { habitatsFilter, setHabitatsFilter, setCurrentPage } = useRecords();

  return (
    <FilterAccordion title="HABITAT REFERENCE" index={index} isActive={isActive} onToggle={onToggle}>
      <Input
        placeholder="Search (e.g., A, B, C1)..."
        value={habitatsFilter}
        onChange={(e) => {
          setHabitatsFilter(e.target.value);
          setCurrentPage(1);
        }}
        icon="search"
        iconPosition="left"
      />
    </FilterAccordion>
  );
};
