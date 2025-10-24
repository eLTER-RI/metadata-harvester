import { useFormContext, useFieldArray } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const KeywordsGroup = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'keywords',
  });

  const addKeyword = () => {
    append({
      keywordLabel: '',
      keywordURI: '',
    });
  };
  return (
    <Segment>
      <Header as="h3">
        <Icon name="tags" />
        Keywords
        <Header.Subheader>Add keywords for the dataset</Header.Subheader>
      </Header>
      {fields.map((field, index) => (
        <Segment key={field.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Header as="h4">Keyword {index + 1}</Header>
            <Button
              icon="trash"
              color="red"
              size="small"
              onClick={() => {
                remove(index);
              }}
            />
          </div>

          <Form.Group widths="equal">
            <Form.Field>
              <label>Keyword Label *</label>
              <Form.Input
                placeholder="Enter keyword or tag"
                {...register(`keywords.${index}.keywordLabel`)}
                error={errors.keywords?.[index]?.keywordLabel ? { content: 'Keyword label is required' } : false}
              />
            </Form.Field>
            <Form.Field>
              <label>Keyword URI</label>
              <Form.Input placeholder="https://example.com/keyword" {...register(`keywords.${index}.keywordURI`)} />
            </Form.Field>
          </Form.Group>
        </Segment>
      ))}

      <Button type="button" icon="plus" content="Add Keyword" onClick={addKeyword} style={{ marginTop: '1rem' }} />
    </Segment>
  );
};
