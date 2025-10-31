import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GroupDiffAccordion } from '../../rules/GroupDiffAccordion';

export const TitlesGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'titles',
  });

  const addTitle = () => {
    append({
      titleText: '',
      titleLanguage: '',
    });
  };

  return (
    <Segment>
      <Header as="h3">
        <Icon name="header" />
        Titles
        <Header.Subheader>Provide titles for the dataset</Header.Subheader>
      </Header>

      <GroupDiffAccordion basePath="metadata.titles" />

      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Title {index + 1}</Header>
            {fields.length > 1 && (
              <Button
                icon="trash"
                color="red"
                size="small"
                onClick={() => {
                  remove(index);
                }}
              />
            )}
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Title Text *</label>
              <Form.TextArea
                placeholder="Enter the title of the dataset"
                {...register(`titles.${index}.titleText`)}
                error={errors.titles?.[index]?.titleText ? { content: 'Title text is required' } : false}
              />
            </Form.Field>
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Title Language</label>
              <Form.Input placeholder="e.g., English, en" {...register(`titles.${index}.titleLanguage`)} />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}
      <Button type="button" icon="plus" content="Add Title" onClick={addTitle} style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
