import React, { useState } from 'react';
import { Accordion, Checkbox, List } from 'semantic-ui-react';
import { useRecords } from '../../store/RecordsProvider';

export const FilterSidebar = () => {
  const {
    resolvedFilter,
    setResolvedFilter,
    repositoryFilter,
    setRepositoryFilter,
    repositories = [],
    isReposLoading,
    reposError,
  } = useRecords();

  const resolvedOptions = [
    { key: 'resolved', text: 'Resolved', value: true },
    { key: 'unresolved', text: 'Unresolved', value: false },
  ];

  const [activeIndices, setActiveIndices] = useState<any>([]);

  const handleAccordionClick = (e: any, titleProps: any) => {
    const { index } = titleProps;
    const newIndex = activeIndices.includes(index)
      ? activeIndices.filter((i: any) => i !== index)
      : [...activeIndices, index];
    setActiveIndices(newIndex);
  };

  return (
    <Accordion exclusive={true} fluid styled>
      <Accordion.Title active={activeIndices.includes(0)} index={0} onClick={handleAccordionClick}>
        Status
        <i className="dropdown icon"></i>
      </Accordion.Title>
      <Accordion.Content active={activeIndices.includes(0)}>
        <List>
          {resolvedOptions.map((option) => (
            <List.Item key={option.key}>
              <Checkbox
                label={option.text}
                checked={resolvedFilter === option.value}
                onClick={() => setResolvedFilter(option.value)}
              />
            </List.Item>
          ))}
        </List>
      </Accordion.Content>

      {(!isReposLoading || !reposError) && (
        <>
          <Accordion.Title active={activeIndices.includes(1)} index={1} onClick={handleAccordionClick}>
            Repository
            <i className="dropdown icon"></i>
          </Accordion.Title>
          <Accordion.Content active={activeIndices.includes(1)}>
            <List>
              {repositories?.map((option) => (
                <List.Item key={option.source_repository}>
                  <Checkbox
                    label={`${option.source_repository} (${option.count})`}
                    value={option.source_repository}
                    checked={repositoryFilter.includes(option.source_repository)}
                    onClick={() => {
                      let newFilters = [...repositoryFilter];
                      if (newFilters.includes(option.source_repository)) {
                        newFilters = newFilters.filter((filter) => filter !== option.source_repository);
                      } else {
                        newFilters.push(option.source_repository);
                      }
                      setRepositoryFilter(newFilters);
                    }}
                  />
                </List.Item>
              ))}
            </List>
          </Accordion.Content>
        </>
      )}
    </Accordion>
  );
};
