import { useParams, useNavigate } from 'react-router-dom';
import { useFetchRecord, useFetchRules, useFetchHarvestedRecord } from '../../hooks/recordQueries';
import { useCreateRules, useUpdateManualRecord } from '../../hooks/recordMutations';
import { useEffect, useState } from 'react';
import { CommonDatasetMetadata } from '../../../../src/store/commonStructure';
import { generateRules } from '../../utils/generateRules';
import { ZodError } from 'zod';

export const useRecordForm = () => {
  const { darId } = useParams();
  const navigate = useNavigate();
  const { data: originalRecord, isLoading, error: fetchError } = useFetchRecord(darId);
  const { data: rules, isLoading: rulesLoading } = useFetchRules(darId);
  const { data: harvestedRecord, isLoading: harvestedLoading } = useFetchHarvestedRecord(darId);
  const { mutate: createRules, error: saveError } = useCreateRules();
  const { mutate: updateManualRecord, error: updateManualError } = useUpdateManualRecord();
  const [formData, setFormData] = useState<CommonDatasetMetadata | undefined>();
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isManualRecord = harvestedRecord === null && !harvestedLoading;

  useEffect(() => {
    if (saveSuccess) {
      const redirectPath = isManualRecord ? '/manual_records' : '/harvested_records';
      navigate(redirectPath, { replace: true });
    }
  }, [saveSuccess, navigate, isManualRecord]);

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

  const handleSave = async (data: CommonDatasetMetadata, onSuccess?: () => void) => {
    setValidationErrors(null);
    setFormData(data);
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (harvestedLoading || harvestedRecord === undefined) {
        setIsSaving(false);
        return;
      }

      if (harvestedRecord !== null) {
        const originalMetadata = originalRecord?.metadata || {};
        const rulesToCreate = generateRules(originalMetadata, data, rules || [], darId!);

        if (rulesToCreate.length === 0) {
          setSaveSuccess(true);
          setIsSaving(false);
          if (onSuccess) onSuccess();
          return;
        }

        createRules(
          { darId: darId!, rules: rulesToCreate },
          {
            onSuccess: () => {
              setSaveSuccess(true);
              setIsSaving(false);
              if (onSuccess) onSuccess();
            },
            onError: () => {
              setIsSaving(false);
            },
          },
        );
      } else {
        updateManualRecord(
          { darId: darId!, metadata: data },
          {
            onSuccess: () => {
              setSaveSuccess(true);
              setIsSaving(false);
              if (onSuccess) onSuccess();
            },
            onError: () => {
              setIsSaving(false);
            },
          },
        );
      }
    } catch (error) {
      setIsSaving(false);
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => {
          return `${err.path.join('.')} ${err.message}`;
        });
        setValidationErrors(formattedErrors);
      }
    }
  };

  return {
    darId,
    originalRecord,
    formData,
    validationErrors,
    isSaving,
    isLoading: isLoading || rulesLoading || harvestedLoading,
    fetchError,
    saveError: saveError || updateManualError,
    isManualRecord,
    handleSave,
  };
};
