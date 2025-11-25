import { useState } from 'react';
import { Accordion, Dimmer, Header, Loader, Segment } from 'semantic-ui-react';
import { useRecords } from '../../store/RecordsProvider';
import { AssetStatusFilter } from './filters/AssetStatusFilter';
import { RepositoryFilter } from './filters/RepositoryFilter';
import { SitesFilter } from './filters/SitesFilter';
import { HabitatsFilter } from './filters/HabitatsFilter';
import { KeywordsFilter } from './filters/KeywordsFilter';
import { DatasetTypeFilter } from './filters/DatasetTypeFilter';

export const FilterSidebar = () => {
  const { isFilterLoading, filterError } = useRecords();

  const [activeIndices, setActiveIndices] = useState<number[]>([]);

  const handleAccordionToggle = (index: number) => {
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
          <AssetStatusFilter index={0} isActive={activeIndices.includes(0)} onToggle={handleAccordionToggle} />
          <RepositoryFilter index={1} isActive={activeIndices.includes(1)} onToggle={handleAccordionToggle} />
          <SitesFilter index={2} isActive={activeIndices.includes(2)} onToggle={handleAccordionToggle} />
          <HabitatsFilter index={3} isActive={activeIndices.includes(3)} onToggle={handleAccordionToggle} />
          <KeywordsFilter index={4} isActive={activeIndices.includes(4)} onToggle={handleAccordionToggle} />
          <DatasetTypeFilter index={5} isActive={activeIndices.includes(5)} onToggle={handleAccordionToggle} />
        </Accordion>
      </div>
    </div>
  );
};
