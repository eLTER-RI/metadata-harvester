import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const ProjectsGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects',
  });

  const addProject = () => {
    append({
      projectName: '',
      projectID: '',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="folder" />
        Projects
        <Header.Subheader>Provide projects associated with the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.projects" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Project {index + 1}</Header>
            <Button icon="trash" color="red" size="small" onClick={() => remove(index)} />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Project Name *</label>
              <Form.Input
                placeholder="Name of the project"
                {...register(`projects.${index}.projectName`)}
                error={errors.projects?.[index]?.projectName ? { content: 'Project name is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>Project ID</label>
              <Form.Input placeholder="Project identifier" {...register(`projects.${index}.projectID`)} />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add Project" onClick={addProject} style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
