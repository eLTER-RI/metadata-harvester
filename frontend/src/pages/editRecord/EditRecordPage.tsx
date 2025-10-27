import { Container, Header, Dimmer, Loader, Segment, Message } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { useFetchRecord } from '../../hooks/recordQueries';
import { useEffect, useState } from 'react';
import { CommonDatasetMetadata } from '../../../../src/store/commonStructure';
import { MetadataForm } from '../../components/MetadataForm';

export const EditRecordPage = () => {
  const { darId } = useParams();
  const { data: originalRecord, isLoading, error: fetchError } = useFetchRecord(darId);
  const [formData, setFormData] = useState<CommonDatasetMetadata | undefined>();
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);

  useEffect(() => {
    if (originalRecord) {
      const commonFormData: CommonDatasetMetadata = {
        assetType: originalRecord.metadata?.assetType || 'Dataset',
        datasetType: originalRecord.metadata?.datasetType,
        alternateIdentifiers: originalRecord.metadata?.alternateIdentifiers || [],
        titles: originalRecord.metadata?.titles || [],
        creators: originalRecord.metadata?.creators || [],
        contactPoints: originalRecord.metadata?.contactPoints || [],
        descriptions: originalRecord.metadata?.descriptions || [],
        keywords: originalRecord.metadata?.keywords || [],
        temporalCoverages: originalRecord.metadata?.temporalCoverages || [],
        geoLocations: originalRecord.metadata?.geoLocations || [],
        licenses: originalRecord.metadata?.licenses || [],
        files: originalRecord.metadata?.files || [],
        responsibleOrganizations: originalRecord.metadata?.responsibleOrganizations || [],
        contributors: originalRecord.metadata?.contributors || [],
        publicationDate: originalRecord.metadata?.publicationDate,
        taxonomicCoverages: originalRecord.metadata?.taxonomicCoverages || [],
        methods: originalRecord.metadata?.methods || [],
        language: originalRecord.metadata?.language,
        projects: originalRecord.metadata?.projects || [],
        siteReferences: originalRecord.metadata?.siteReferences || [],
        additionalMetadata: originalRecord.metadata?.additionalMetadata || [],
        habitatReferences: originalRecord.metadata?.habitatReferences || [],
        relatedIdentifiers: originalRecord.metadata?.relatedIdentifiers || [],
        dataLevel: originalRecord.metadata?.dataLevel,
        externalSourceInformation: originalRecord.metadata?.externalSourceInformation || {
          externalSourceName: '',
          externalSourceURI: '',
          externalSourceInfo: '',
        },
      };
      setFormData(commonFormData);
    }
  }, [originalRecord]);

  const handleSave = async (data: CommonDatasetMetadata) => {
    setValidationErrors(null);
    setFormData(data);
  };

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading record...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (fetchError) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading data.
          <Header.Subheader>{fetchError.message}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Container>
      <Header as="h1">Edit Record {darId}</Header>
      <Message info>
        <Message.Header>Rule Generation and Re-Harvest</Message.Header>
        <p>
          Modification to this record will stay as long as the previous value will stay the same on the source
          repository.
        </p>
      </Message>

      {validationErrors && (
        <Message negative>
          <Message.Header>Validation Errors</Message.Header>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Message>
      )}

      {formData && <MetadataForm data={formData} onSubmit={handleSave} />}
    </Container>
  );
};
