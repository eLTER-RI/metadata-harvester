import React, { useState } from 'react';
import { Form, Segment, Header, Button, Message } from 'semantic-ui-react';
import { useForm, FormProvider } from 'react-hook-form';
import { CommonDatasetMetadata } from '../../../src/store/commonStructure';
import { TitlesGroup } from './metadataForm/groups/TitlesGroup';
import { CreatorsGroup } from './metadataForm/groups/CreatorsGroup';
import { ContactPointsGroup } from './metadataForm/groups/ContactPointsGroup';
import { DescriptionsGroup } from './metadataForm/groups/DescriptionsGroup';
import { KeywordsGroup } from './metadataForm/groups/KeywordsGroup';
import { GeoLocationsGroup } from './metadataForm/groups/GeoLocationsGroup';
import { TemporalCoverageGroup } from './metadataForm/groups/TemporalCoverageGroup';
import { LicensesGroup } from './metadataForm/groups/LicensesGroup';
import { ResponsibleOrganizationsGroup } from './metadataForm/groups/ResponsibleOrganizationsGroup';
import { ContributorsGroup } from './metadataForm/groups/ContributorsGroup';
import { ProjectsGroup } from './metadataForm/groups/ProjectsGroup';
import { SiteReferencesGroup } from './metadataForm/groups/SiteReferencesGroup';
import { AdditionalMetadataGroup } from './metadataForm/groups/AdditionalMetadataGroup';
import { RelatedIdentifiersGroup } from './metadataForm/groups/RelatedIdentifiersGroup';
import { AlternateIdentifiersGroup } from './metadataForm/groups/AlternateIdentifiersGroup';
import { MethodsGroup } from './metadataForm/groups/MethodsGroup';
import { SimpleMetadataGroup } from './metadataForm/groups/SimpleMetadataGroup';

interface MetadataFormProps {
  data: CommonDatasetMetadata;
  onSubmit: (data: CommonDatasetMetadata) => void;
  rules?: any[];
}

export const MetadataForm = ({ data, onSubmit }: MetadataFormProps) => {
  const [activeGroup, setActiveGroup] = useState<string>('titles');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<CommonDatasetMetadata>({
    defaultValues: data,
    mode: 'onChange',
  });

  const { handleSubmit } = form;

  const onFormSubmit = (formData: CommonDatasetMetadata) => {
    setValidationErrors([]);
    try {
      onSubmit(formData);
    } catch (error) {
      if (error instanceof Error) {
        setValidationErrors([error.message]);
      }
    }
  };

  const metadataGroups = [
    { id: 'titles', label: 'Titles', required: true },
    { id: 'creators', label: 'Creators', required: true },
    { id: 'contactPoints', label: 'Contact Points', required: false },
    { id: 'descriptions', label: 'Descriptions', required: true },
    { id: 'keywords', label: 'Keywords', required: false },
    { id: 'geoLocations', label: 'Geographic Locations', required: false },
    { id: 'temporalCoverages', label: 'Temporal Coverage', required: false },
    { id: 'licenses', label: 'Licenses', required: false },
    { id: 'responsibleOrganizations', label: 'Responsible Organizations', required: false },
    { id: 'contributors', label: 'Contributors', required: false },
    { id: 'projects', label: 'Projects', required: false },
    { id: 'siteReferences', label: 'Site References', required: false },
    { id: 'additionalMetadata', label: 'Additional Metadata', required: false },
    { id: 'relatedIdentifiers', label: 'Related Identifiers', required: false },
    { id: 'alternateIdentifiers', label: 'Alternate Identifiers', required: false },
    { id: 'methods', label: 'Methods', required: false },
    { id: 'simple', label: 'Basic Information', required: false },
  ];

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleSubmit(onFormSubmit)}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ width: '18rem', flexShrink: 0 }}>
            <Segment>
              <Header as="h4">Metadata Sections</Header>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metadataGroups.map((group) => (
                  <Button
                    key={group.id}
                    fluid
                    basic={activeGroup !== group.id}
                    primary={activeGroup === group.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveGroup(group.id);
                    }}
                    style={{ textAlign: 'left' }}
                  >
                    {group.label}
                    {group.required && <span style={{ color: 'red' }}> *</span>}
                  </Button>
                ))}
              </div>
            </Segment>
          </div>

          <div style={{ flex: 1 }}>
            {validationErrors.length > 0 && (
              <Message negative>
                <Message.Header>Validation Errors</Message.Header>
                <ul>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Message>
            )}

            {activeGroup === 'titles' && <TitlesGroup />}
            {activeGroup === 'creators' && <CreatorsGroup />}
            {activeGroup === 'contactPoints' && <ContactPointsGroup />}
            {activeGroup === 'descriptions' && <DescriptionsGroup />}
            {activeGroup === 'keywords' && <KeywordsGroup />}
            {activeGroup === 'geoLocations' && <GeoLocationsGroup />}
            {activeGroup === 'temporalCoverages' && <TemporalCoverageGroup />}
            {activeGroup === 'licenses' && <LicensesGroup />}
            {activeGroup === 'responsibleOrganizations' && <ResponsibleOrganizationsGroup />}
            {activeGroup === 'contributors' && <ContributorsGroup />}
            {activeGroup === 'projects' && <ProjectsGroup />}
            {activeGroup === 'siteReferences' && <SiteReferencesGroup />}
            {activeGroup === 'additionalMetadata' && <AdditionalMetadataGroup />}
            {activeGroup === 'relatedIdentifiers' && <RelatedIdentifiersGroup />}
            {activeGroup === 'alternateIdentifiers' && <AlternateIdentifiersGroup />}
            {activeGroup === 'methods' && <MethodsGroup />}
            {activeGroup === 'simple' && <SimpleMetadataGroup />}
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Button
            type="submit"
            primary
            size="large"
            icon="save"
            content="Generate Rules & Trigger Re-Harvest"
            style={{ minWidth: '300px' }}
          />
        </div>
      </Form>
    </FormProvider>
  );
};
