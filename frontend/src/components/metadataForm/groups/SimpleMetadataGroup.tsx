import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Form, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../src/store/commonStructure';

export const SimpleMetadataGroup: React.FC = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();

  return (
    <Segment>
      <Header as="h3">
        <Icon name="info" />
        Basic Information
        <Header.Subheader>Basic metadata about the dataset</Header.Subheader>
      </Header>

      <Form.Group widths="equal">
        <Form.Field>
          <label>Publication Date</label>
          <Form.Input
            type="date"
            {...register('publicationDate')}
            error={errors.publicationDate ? { content: 'Invalid date format' } : false}
          />
        </Form.Field>
        <Form.Field>
          <label>Language</label>
          <Form.Input placeholder="e.g., English, en" {...register('language')} />
        </Form.Field>
      </Form.Group>

      <Form.Group widths="equal">
        <Form.Field>
          <label>Data Level Code</label>
          <Form.Select
            options={[
              { key: '0', text: 'Level 0', value: '0' },
              { key: '1', text: 'Level 1', value: '1' },
              { key: '2', text: 'Level 2', value: '2' },
              { key: '3', text: 'Level 3', value: '3' },
            ]}
            placeholder="Select data level"
            value={watch('dataLevel.dataLevelCode') || ''}
            onChange={(e, { value }) => setValue('dataLevel.dataLevelCode', value as string)}
          />
        </Form.Field>
        <Form.Field>
          <label>Data Level URI</label>
          <Form.Input placeholder="https://example.com/data-level" {...register('dataLevel.dataLevelURI')} />
        </Form.Field>
      </Form.Group>

      <Form.Field>
        <label>Dataset Type</label>
        <Form.Input placeholder="Type of dataset" {...register('datasetType')} />
      </Form.Field>
    </Segment>
  );
};
