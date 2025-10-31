import React, { useMemo, useState } from 'react';
import { Icon, Segment, Accordion, AccordionTitle, AccordionContent } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { useFetchRules } from '../../hooks/recordQueries';
import { useFormContext } from 'react-hook-form';
import { DiffView } from './DiffView';
import { getNestedValue } from '../../../../shared/utils';

type Rule = { target_path: string; before_value?: any; orig_value?: any };

interface GroupDiffToggleProps {
  basePath: string;
}

export const GroupDiffAccordion = ({ basePath }: GroupDiffToggleProps) => {
  const { darId } = useParams();
  const { data: rules } = useFetchRules(darId);
  const { getValues } = useFormContext();
  const [open, setOpen] = useState(false);

  const { prev, curr, hasRule } = useMemo(() => {
    const typed: Rule[] = rules || [];
    const rule = typed.find((r) => r.target_path === basePath);
    const formPath = basePath.startsWith('metadata.') ? basePath.slice('metadata.'.length) : basePath;
    const currVal = getNestedValue(getValues(), formPath);
    return { prev: rule?.before_value, curr: currVal, hasRule: !!rule };
  }, [rules, basePath, getValues]);

  if (!hasRule) return null;

  return (
    <Segment>
      <Accordion styled>
        <AccordionTitle as="h4" active={open} index={0} onClick={() => setOpen((v) => !v)}>
          <Icon name="dropdown" />
          Changes
        </AccordionTitle>
        <AccordionContent active={open}>
          <DiffView oldValue={prev} newValue={curr} splitView={true} />
        </AccordionContent>
      </Accordion>
    </Segment>
  );
};
