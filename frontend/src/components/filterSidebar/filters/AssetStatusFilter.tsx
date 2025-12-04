import { Checkbox, List } from 'semantic-ui-react';
import { useRecords } from '../../../store/RecordsProvider';
import { FilterAccordion } from './FilterAccordion';

interface AssetStatusFilterProps {
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
}

export const AssetStatusFilter = ({ index, isActive, onToggle }: AssetStatusFilterProps) => {
  const { resolvedFilter, setResolvedFilter, filterValues, setCurrentPage } = useRecords();

  return (
    <FilterAccordion title="ASSET STATUS" index={index} isActive={isActive} onToggle={onToggle}>
      <List animated celled selection className="facet-list-items">
        {filterValues?.resolved.map((option) => {
          const label = option.resolved ? 'Resolved' : 'Unresolved';
          const id = `${label.toLowerCase()}-facet-checkbox`;
          const isChecked = resolvedFilter !== undefined && resolvedFilter === option.resolved;
          return (
            <List.Item
              key={option.resolved ? 'resolved' : 'unresolved'}
              className="facet-list-item"
              onClick={() => {
                setResolvedFilter(isChecked ? undefined : option.resolved);
                setCurrentPage(1);
              }}
            >
              <div className="content facet-value-element">
                <Checkbox
                  id={id}
                  checked={isChecked}
                  className="facet-checkbox"
                  label={label}
                  onChange={() => {
                    setResolvedFilter(isChecked ? undefined : option.resolved);
                    setCurrentPage(1);
                  }}
                />
                <span id={`${label.toLowerCase()}-count`} className="facet-count">
                  ({option.count})
                </span>
              </div>
            </List.Item>
          );
        })}
      </List>
    </FilterAccordion>
  );
};
