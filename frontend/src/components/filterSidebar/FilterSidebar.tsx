import React, { useState } from 'react';
import { Accordion, Checkbox, List } from 'semantic-ui-react';
import { useRecords } from '../../store/RecordsProvider';

export const FilterSidebar = () => {
  const { resolvedFilter, setResolvedFilter, repositoryFilter, setRepositoryFilter } = useRecords();
  const resolvedOptions = [
    { key: 'resolved', text: 'Resolved', value: true },
    { key: 'unresolved', text: 'Unresolved', value: false },
  ];

  const repositoryOptions = [
    { key: 'zenodo', text: 'ZENODO', value: 'ZENODO' },
    { key: 'sites', text: 'SITES', value: 'SITES' },
    { key: 'dataregistry', text: 'DATAREGISTRY', value: 'DATAREGISTRY' },
    { key: 'b2share_eudat', text: 'B2SHARE EUDAT', value: 'B2SHARE_EUDAT' },
    { key: 'b2share_juelich', text: 'B2SHARE JUELICH', value: 'B2SHARE_JUELICH' },
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

      <Accordion.Title active={activeIndices.includes(1)} index={1} onClick={handleAccordionClick}>
        Repository
        <i className="dropdown icon"></i>
      </Accordion.Title>
      <Accordion.Content active={activeIndices.includes(1)}>
        <List>
          {repositoryOptions.map((option) => (
            <List.Item key={option.key}>
              <Checkbox
                label={option.text}
                value={option.value}
                checked={repositoryFilter.includes(option.value)}
                onClick={() => {
                  let newFilters = [...repositoryFilter];
                  if (newFilters.includes(option.value)) {
                    newFilters = newFilters.filter((filter) => filter !== option.value);
                  } else {
                    newFilters.push(option.value);
                  }
                  setRepositoryFilter(newFilters);
                }}
              />
            </List.Item>
          ))}
        </List>
      </Accordion.Content>
    </Accordion>
  );
};
