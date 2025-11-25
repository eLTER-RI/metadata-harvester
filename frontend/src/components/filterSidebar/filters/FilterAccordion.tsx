import { Accordion, Icon } from 'semantic-ui-react';

interface FilterAccordionProps {
  title: string;
  index: number;
  isActive: boolean;
  onToggle: (index: number) => void;
  children: React.ReactNode;
}

export const FilterAccordion = ({ title, index, isActive, onToggle, children }: FilterAccordionProps) => {
  return (
    <>
      <Accordion.Title
        active={isActive}
        index={index}
        onClick={() => onToggle(index)}
        className="facet-accordion-title"
      >
        <span>{title}</span>
        <Icon name={isActive ? 'chevron down' : 'chevron right'} className="accordion-dropdown-icon" />
      </Accordion.Title>
      <Accordion.Content active={isActive} className="facet-accordion-content">
        {children}
      </Accordion.Content>
    </>
  );
};

