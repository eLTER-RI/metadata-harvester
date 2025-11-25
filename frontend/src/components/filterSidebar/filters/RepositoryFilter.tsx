import { Checkbox, List } from 'semantic-ui-react';
import { useRecords } from '../../../store/RecordsProvider';
import { FilterAccordion } from './FilterAccordion';

interface RepositoryFilterProps {
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
}

export const RepositoryFilter = ({ index, isActive, onToggle }: RepositoryFilterProps) => {
  const { repositoryFilter, setRepositoryFilter, filterValues, setCurrentPage } = useRecords();

  if (!filterValues?.repositories.length) {
    return null;
  }

  return (
    <FilterAccordion title="ASSET REPOSITORY" index={index} isActive={isActive} onToggle={onToggle}>
      <List animated celled selection>
        {filterValues.repositories.map((option) => {
          const id = `${option.source_repository}-facet-checkbox`;
          const isChecked = repositoryFilter.includes(option.source_repository);
          return (
            <List.Item
              key={option.source_repository}
              onClick={() => {
                let newFilters = [...repositoryFilter];
                if (isChecked) {
                  newFilters = newFilters.filter((filter) => filter !== option.source_repository);
                } else {
                  newFilters.push(option.source_repository);
                }
                setRepositoryFilter(newFilters);
                setCurrentPage(1);
              }}
            >
              <div>
                <Checkbox
                  id={id}
                  checked={isChecked}
                  className="facet-checkbox"
                  label={option.source_repository}
                  onChange={() => {
                    let newFilters = [...repositoryFilter];
                    if (isChecked) {
                      newFilters = newFilters.filter((filter) => filter !== option.source_repository);
                    } else {
                      newFilters.push(option.source_repository);
                    }
                    setRepositoryFilter(newFilters);
                    setCurrentPage(1);
                  }}
                />
                <span id={`${option.source_repository}-count`} className="facet-count">
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
