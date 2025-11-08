import { useState } from 'react';
import { Accordion, Checkbox, Dimmer, Header, Icon, List, Loader, Segment } from 'semantic-ui-react';
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
    setCurrentPage,
  } = useRecords();

  const [activeIndices, setActiveIndices] = useState<number[]>([]);

  const handleAccordionClick = (_e: any, titleProps: any) => {
    const { index } = titleProps;
    setActiveIndices((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
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
          <Header.Subheader>{filterError.message}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <div className="facets-container">
      <Header as="h3">Filters</Header>
      <div className="facet-list">
        <Accordion fluid className="facets-accordion" exclusive={false}>
          <Accordion.Title
            active={activeIndices.includes(0)}
            index={0}
            onClick={handleAccordionClick}
            className="facet-accordion-title"
          >
            <span>ASSET STATUS</span>
            <Icon
              name={activeIndices.includes(0) ? 'chevron down' : 'chevron right'}
              className="accordion-dropdown-icon"
            />
          </Accordion.Title>
          <Accordion.Content active={activeIndices.includes(0)} className="facet-accordion-content">
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
          </Accordion.Content>

          {filterValues?.repositories.length > 0 && (
            <>
              <Accordion.Title
                active={activeIndices.includes(1)}
                index={1}
                onClick={handleAccordionClick}
                className="facet-accordion-title"
              >
                <span>ASSET REPOSITORY</span>
                <Icon
                  name={activeIndices.includes(1) ? 'chevron down' : 'chevron right'}
                  className="accordion-dropdown-icon"
                />
              </Accordion.Title>
              <Accordion.Content active={activeIndices.includes(1)} className="facet-accordion-content">
                <List animated celled selection>
                  {filterValues?.repositories.map((option) => {
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
              </Accordion.Content>
            </>
          )}
        </Accordion>
      </div>
    </div>
  );
};
