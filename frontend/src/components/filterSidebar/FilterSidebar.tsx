import React, { useState } from 'react';
import { Accordion, Checkbox, Dimmer, Header, List, Loader, Segment } from 'semantic-ui-react';
import { useRecords } from '../../store/RecordsProvider';

export const FilterSidebar = () => {
  const {
    resolvedFilter,
    setResolvedFilter,
    repositoryFilter,
    setRepositoryFilter,
    filterValues,
    isFilterLoading,
    filterError,
  } = useRecords();

  const [activeIndices, setActiveIndices] = useState<any>([]);
  const handleAccordionClick = (e: any, titleProps: any) => {
    const { index } = titleProps;
    const newIndex = activeIndices.includes(index)
      ? activeIndices.filter((i: any) => i !== index)
      : [...activeIndices, index];
    setActiveIndices(newIndex);
  };

  if (isFilterLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading filters...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (filterError) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading filters.
          <Header.Subheader>{filterError}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Accordion exclusive={true} fluid styled>
      <Accordion.Title active={activeIndices.includes(0)} index={0} onClick={handleAccordionClick}>
        Status
        <i className="dropdown icon"></i>
      </Accordion.Title>
      <Accordion.Content active={activeIndices.includes(0)}>
        <List>
          {filterValues?.resolved.map((option) => (
            <List.Item key={option.resolved ? 'resolved' : 'unresolved'}>
              <Checkbox
                label={option.resolved ? `Resolved (${option.count})` : `Unresolved (${option.count})`}
                checked={resolvedFilter != undefined && resolvedFilter === option.resolved}
                onClick={() => {
                  setResolvedFilter(resolvedFilter === option.resolved ? undefined : option.resolved);
                }}
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
          {filterValues?.repositories.map((option) => (
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
    </Accordion>
  );
};
