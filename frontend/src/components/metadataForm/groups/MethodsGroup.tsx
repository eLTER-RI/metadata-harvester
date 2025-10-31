import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';

export const MethodsGroup = () => {
  const { control, register } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'methods',
  });

  const addMethod = () => {
    append({
      methodID: '',
      steps: [],
      sampling: {
        studyDescription: '',
        samplingDescription: '',
      },
      qualityControlDescription: '',
      instrumentationDescription: '',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="cogs" />
        Methods
        <Header.Subheader>Methodological information about the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.methods" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Method {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Field>
            <label>Method ID</label>
            <Form.Input placeholder="Method identifier" {...register(`methods.${index}.methodID`)} />
          </Form.Field>

          <Form.Field>
            <label>Instrumentation Description</label>
            <Form.TextArea
              placeholder="Describe the instruments used"
              {...register(`methods.${index}.instrumentationDescription`)}
              rows={3}
            />
          </Form.Field>

          <Form.Field>
            <label>Quality Control Description</label>
            <Form.TextArea
              placeholder="Describe quality control procedures"
              rows={3}
              {...register(`methods.${index}.qualityControlDescription`)}
            />
          </Form.Field>

          <Header as="h5">Sampling Information</Header>
          <Form.Field>
            <label>Study Description</label>
            <Form.TextArea
              placeholder="Describe the study design"
              rows={2}
              {...register(`methods.${index}.sampling.studyDescription`)}
            />
          </Form.Field>

          <Form.Field>
            <label>Sampling Description</label>
            <Form.TextArea
              placeholder="Describe sampling procedures"
              rows={2}
              {...register(`methods.${index}.sampling.samplingDescription`)}
            />
          </Form.Field>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add Method" onClick={addMethod} style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
