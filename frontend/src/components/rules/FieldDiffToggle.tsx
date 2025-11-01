import { useState, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionTitle, Icon, Label } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { useFetchRules } from '../../hooks/recordQueries';
import { useFormContext } from 'react-hook-form';
import { DiffView } from './DiffView';
import { getNestedValue } from '../../../../shared/utils';

type Rule = { target_path: string; before_value?: any; orig_value?: any };

interface FieldDiffToggleProps {
  basePath: string;
}

export const FieldDiffToggle = ({ basePath }: FieldDiffToggleProps) => {
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

  const hasDifference = JSON.stringify(prev) !== JSON.stringify(curr);
  if (!hasDifference) return null;

  return (
    <div style={{ textAlign: 'left', display: 'flex', alignItems: 'flex-start' }}>
      <Label color="blue" basic size="mini" style={{ marginTop: '0.5rem' }}>
        Changed
      </Label>
      <div>
        <Accordion fluid>
          <AccordionTitle as="h4" active={open} index={0} onClick={() => setOpen((v) => !v)}>
            <Icon name="dropdown" />
            Changes
          </AccordionTitle>
          <AccordionContent active={open}>
            <div style={{ textAlign: 'left' }}>
              <DiffView oldValue={prev} newValue={curr} splitView={true} />
            </div>
          </AccordionContent>
        </Accordion>
      </div>
    </div>
  );
};
