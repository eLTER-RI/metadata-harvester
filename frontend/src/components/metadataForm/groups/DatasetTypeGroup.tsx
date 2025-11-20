import { useFormContext } from 'react-hook-form';
import { Form, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { CommonDatasetMetadata, DatasetTypeCode } from '../../../../../backend/src/models/commonStructure';
import { FieldDiffToggle } from '../../rules/FieldDiffToggle';

const DATASET_TYPE_CODES: DatasetTypeCode[] = [
  'SOGEO_001',
  'SOGEO_003',
  'SOGEO_167',
  'SOGEO_048',
  'SOGEO_155',
  'SOHYD_004',
  'SOHYD_005',
  'SOHYD_006',
  'SOHYD_169',
  'SOHYD_170',
  'SOHYD_171',
  'SOHYD_010',
  'SOHYD_011',
  'SOHYD_012',
  'SOHYD_168',
  'SOHYD_058',
  'SOHYD_059',
  'SOHYD_062',
  'SOHYD_064',
  'SOHYD_067',
  'SOHYD_164',
  'SOHYD_165',
  'SOHYD_166',
  'SOHYD_174',
  'SOBIO_014',
  'SOBIO_017',
  'SOBIO_018',
  'SOBIO_019',
  'SOBIO_021',
  'SOBIO_022',
  'SOBIO_096',
  'SOHYD_172',
  'SOHYD_173',
  'SOATM_027',
  'SOATM_028',
  'SOATM_098',
  'SOATM_103',
  'SOATM_108',
  'SOATM_176',
  'SOBIO_023',
  'SOBIO_177',
  'SOBIO_024',
  'SOBIO_090',
  'SOBIO_091',
  'SOBIO_092',
  'SOBIO_093',
  'SOBIO_015',
  'SOBIO_016',
  'SOBIO_025',
  'SOBIO_026',
  'SOBIO_095',
  'SOBIO_140',
  'SOSOC_031',
  'SOSOC_030',
  'SOSOC_114',
  'SOSOC_032',
  'SOSOC_036',
  'SOSOC_037',
  'SOSOC_040',
  'SOSOC_042',
  'SOSOC_043',
  'SOSOC_044',
  'SOSOC_045',
  'SOSOC_183',
  'SOSOC_184',
  'NotSpecified',
];

export const DatasetTypeGroup = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CommonDatasetMetadata>();

  return (
    <Segment>
      <Header as="h3">
        <Icon name="database" />
        Dataset Type
        <Header.Subheader>Select the type of dataset</Header.Subheader>
      </Header>

      <FieldDiffToggle basePath="metadata.datasetType" />

      <Form.Group widths="equal">
        <Form.Field>
          <label>Dataset Type Code</label>
          <Form.Select
            options={DATASET_TYPE_CODES.map((code) => ({
              key: code,
              text: code,
              value: code,
            }))}
            placeholder="Select dataset type code"
            value={watch('datasetType')?.datasetTypeCode || ''}
            onChange={(_, { value }) => {
              const currentDatasetType = watch('datasetType');
              if (value) {
                setValue('datasetType', {
                  datasetTypeCode: value as DatasetTypeCode,
                  datasetTypeURI: currentDatasetType?.datasetTypeURI || '',
                });
              }
            }}
            error={errors.datasetType?.datasetTypeCode ? { content: 'Invalid dataset type code' } : false}
          />
        </Form.Field>
        <Form.Field>
          <label>Dataset Type URI</label>
          <Form.Input
            placeholder="https://example.com/dataset-type"
            value={watch('datasetType')?.datasetTypeURI || ''}
            onChange={(e) => {
              const currentDatasetType = watch('datasetType');
              if (currentDatasetType?.datasetTypeCode) {
                setValue('datasetType', {
                  datasetTypeCode: currentDatasetType.datasetTypeCode,
                  datasetTypeURI: e.target.value,
                });
              }
            }}
          />
        </Form.Field>
      </Form.Group>
      {watch('datasetType') && (
        <Button
          type="button"
          icon="trash"
          content="Clear Dataset Type"
          onClick={() => setValue('datasetType', undefined)}
          style={{ marginTop: '1rem' }}
        />
      )}
    </Segment>
  );
};
