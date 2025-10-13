import { CommonDataset } from '../../../src/store/commonStructure';
import { appendValue, getNestedValue, setNestedValue } from '../../../src/utilities/rules';

describe('Rules Utility Functions', () => {
  let sampleRecord: CommonDataset;

  beforeEach(() => {
    sampleRecord = {
      metadata: {
        assetType: 'DOI',
        publicationDate: '2025-10-09-22:30:00',
        descriptions: [
          {
            descriptionType: 'abstract',
            descriptionText: 'This file gathers data about the oxygen levels in lake Kivesjärvi.',
          },
          {
            descriptionType: 'description',
            descriptionText: 'The lake that is a subject of measurements is located in Finland.',
          },
        ],
        creators: [
          {
            creatorGivenName: 'Lauri',
            creatorFamilyName: 'Suomalainen',
          },
        ],
        dataLevel: {
          dataLevelCode: '1',
          dataLevelURI: 'someuri',
        },
        datasetType: 'Dataset',
        taxonomicCoverages: ['first', 'second', 'third'],
        externalSourceInformation: {},
      },
    };
  });

  describe('getNestedValue', () => {
    it('should find nested simple type value', () => {
      expect(getNestedValue(sampleRecord, 'metadata.datasetType')).toBe('Dataset');
    });

    it('should find nested array and single value in it', () => {
      expect(getNestedValue(sampleRecord, 'metadata.taxonomicCoverages')).toEqual(['first', 'second', 'third']);
      expect(getNestedValue(sampleRecord, 'metadata.taxonomicCoverages[0]')).toBe('first');
    });

    it('should find nested structure', () => {
      expect(getNestedValue(sampleRecord, 'metadata.dataLevel')).toEqual({
        dataLevelCode: '1',
        dataLevelURI: 'someuri',
      });
      expect(getNestedValue(sampleRecord, 'metadata.dataLevel.dataLevelCode')).toBe('1');
      expect(getNestedValue(sampleRecord, 'metadata.dataLevel.dataLevelURI')).toBe('someuri');
    });

    it('should get values from a nested array', () => {
      expect(getNestedValue(sampleRecord, 'metadata.descriptions')).toEqual([
        {
          descriptionType: 'abstract',
          descriptionText: 'This file gathers data about the oxygen levels in lake Kivesjärvi.',
        },
        {
          descriptionType: 'description',
          descriptionText: 'The lake that is a subject of measurements is located in Finland.',
        },
      ]);
      expect(getNestedValue(sampleRecord, 'metadata.descriptions[0]')).toEqual({
        descriptionType: 'abstract',
        descriptionText: 'This file gathers data about the oxygen levels in lake Kivesjärvi.',
      });
      expect(getNestedValue(sampleRecord, 'metadata.descriptions[0].descriptionText')).toBe(
        'This file gathers data about the oxygen levels in lake Kivesjärvi.',
      );
      expect(getNestedValue(sampleRecord, 'metadata.descriptions[0].descriptionType')).toBe('abstract');
      expect(getNestedValue(sampleRecord, 'metadata.descriptions[1].descriptionText')).toBe(
        'The lake that is a subject of measurements is located in Finland.',
      );
      expect(getNestedValue(sampleRecord, 'metadata.descriptions[1].descriptionType')).toBe('description');
    });
  });

  describe('setNestedValue', () => {
    it('should replace nested simple type value', () => {
      setNestedValue(sampleRecord, 'metadata.assetType', '2023-10-09');
      expect(sampleRecord.metadata.assetType).toBe('2023-10-09');
    });

    it('should replace nested structure', () => {
      setNestedValue(sampleRecord, 'metadata.dataLevel', {
        dataLevelCode: '2',
        dataLevelURI: 'otheruri',
      });
      expect(sampleRecord.metadata.dataLevel).toEqual({
        dataLevelCode: '2',
        dataLevelURI: 'otheruri',
      });
      setNestedValue(sampleRecord, 'metadata.dataLevel.dataLevelCode', '3');
      setNestedValue(sampleRecord, 'metadata.dataLevel.dataLevelURI', 'thirduri');
      expect(sampleRecord.metadata.dataLevel).toEqual({
        dataLevelCode: '3',
        dataLevelURI: 'thirduri',
      });
    });

    it('should replace values from a nested array of structs', () => {
      setNestedValue(sampleRecord, 'metadata.creators', [
        {
          creatorGivenName: 'Tommi',
          creatorFamilyName: 'Ranskalainen',
        },
      ]);
      expect(sampleRecord.metadata.creators).toEqual([
        {
          creatorGivenName: 'Tommi',
          creatorFamilyName: 'Ranskalainen',
        },
      ]);
      setNestedValue(sampleRecord, 'metadata.creators[0].creatorGivenName', 'Aino');
      setNestedValue(sampleRecord, 'metadata.creators[0].creatorFamilyName', 'Korhonen');
      expect(sampleRecord.metadata.creators).toEqual([
        {
          creatorGivenName: 'Aino',
          creatorFamilyName: 'Korhonen',
        },
      ]);

      setNestedValue(sampleRecord, 'metadata.descriptions', [
        { descriptionType: 'different type', descriptionText: 'new value' },
      ]);
      expect(sampleRecord.metadata.descriptions).toEqual([
        { descriptionType: 'different type', descriptionText: 'new value' },
      ]);
      setNestedValue(sampleRecord, 'metadata.descriptions[0]', {
        type: 'aaaaa',
        value: 'bbbb.',
      });
      expect(sampleRecord.metadata.descriptions).toBeDefined();
      expect(sampleRecord.metadata.descriptions![0]).toEqual({
        type: 'aaaaa',
        value: 'bbbb.',
      });
      setNestedValue(sampleRecord, 'metadata.descriptions[0].descriptionText', 'first description value');
      expect(sampleRecord.metadata.descriptions![0].descriptionText).toBe('first description value');
      setNestedValue(sampleRecord, 'metadata.descriptions[0].descriptionType', 'first description type');
      expect(sampleRecord.metadata.descriptions![0].descriptionType).toBe('first description type');
    });

    describe('appendValue', () => {
      it('should append a value to an existing simple array', () => {
        appendValue(sampleRecord, 'metadata.taxonomicCoverages', 'fourth');
        expect(sampleRecord.metadata.taxonomicCoverages).toEqual(['first', 'second', 'third', 'fourth']);
      });

      it('should create a new array if the property does not exist', () => {
        expect(sampleRecord.metadata.keywords).toBeUndefined();
        appendValue(sampleRecord, 'metadata.keywords', 'new-item');
        expect(sampleRecord.metadata.keywords).toEqual(['new-item']);
      });

      it('should overwrite already defined non-array property with a new array containing the value', () => {
        expect(sampleRecord.metadata.assetType).toEqual('DOI');
        appendValue(sampleRecord, 'metadata.assetType', 'value appended to not-array like property');
        expect(sampleRecord.metadata.assetType).toEqual(['value appended to not-array like property']);
      });

      it('should not add undefined non-array property with a new array containing the value', () => {
        appendValue(sampleRecord, 'pids', 'value appended to undefined property');
        expect(sampleRecord.pids).toEqual(['value appended to undefined property']);
      });
    });
  });
});
