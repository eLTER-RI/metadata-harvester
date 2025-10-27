import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const TemporalCoverageGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'temporalCoverages',
  });

  const addTemporalCoverage = () => {
    append({
      startDate: '',
      endDate: '',
    });
  };
  return (
    <Segment>
      <Header as="h3">
        <Icon name="calendar" />
        Temporal Coverage
        <Header.Subheader>Provide time period covered by the dataset</Header.Subheader>
      </Header>

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Time Period {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Start Date *</label>
              <Form.Input
                type="date"
                {...register(`temporalCoverages.${index}.startDate`)}
                error={errors.temporalCoverages?.[index]?.startDate ? { content: 'Start date is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>End Date *</label>
              <Form.Input
                type="date"
                {...register(`temporalCoverages.${index}.endDate`)}
                error={errors.temporalCoverages?.[index]?.endDate ? { content: 'End date is required' } : false}
              />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button
        type="button"
        icon="plus"
        content="Add Temporal Coverage"
        onClick={addTemporalCoverage}
        style={{ marginTop: '1rem' }}
      />
    </Segment>
  );
};
