import { CommonDataset } from '../../src/models/commonStructure';
import { commonDatasetSchema } from '../../src/models/commonStructure.zod.gen';
import { RuleDbRecord } from '../../src/store/dao/rulesDao';
import { applyRuleToRecord } from '../../src/utilities/rules';
import { appendValue, getNestedValue, setNestedValue } from '../../../shared/utils';

jest.mock('../../src/models/commonStructure.zod.gen', () => ({
  commonDatasetSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('../../src/services/serviceLogging', () => ({
  log: jest.fn(),
}));

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
        datasetType: { datasetTypeCode: 'NotSpecified' },
        taxonomicCoverages: ['first', 'second', 'third'],
        externalSourceInformation: {},
      },
    };
  });

  describe('getNestedValue', () => {
    it('should find nested simple type value', () => {
      expect(getNestedValue(sampleRecord, 'metadata.datasetType')).toEqual({ datasetTypeCode: 'NotSpecified' });
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

  describe('applyRules Advanced Scenarios', () => {
    let sampleRecord2: CommonDataset;

    beforeEach(() => {
      sampleRecord2 = {
        metadata: {
          assetType: 'Dataset',
          titles: [{ titleText: 'Some title of a record from remote repository' }],
          descriptions: [
            {
              descriptionText: 'Description text.',
              descriptionType: 'Abstract',
            },
          ],
          externalSourceInformation: {
            externalSourceName: 'Zenodo',
          },
        },
      };

      (commonDatasetSchema.safeParse as jest.Mock).mockReturnValue({ success: true });
    });

    it('should accept creating an array for valid metadata field when the field not yet filled in', () => {
      const rules: RuleDbRecord[] = [
        {
          id: '1',
          dar_id: 'abc-def',
          target_path: 'metadata.keywords',
          before_value: undefined,
          after_value: [{ keywordLabel: 'First Keyword' }],
        },
      ];

      const changedFst = applyRuleToRecord(sampleRecord2, rules[0]);

      expect(changedFst).toBe(true);
      expect(sampleRecord2.metadata.keywords).toEqual([{ keywordLabel: 'First Keyword' }]);
    });

    it('should apply rules that depend on each other within the same batch', () => {
      const rules: RuleDbRecord[] = [
        {
          id: '1',
          dar_id: 'abc-def',
          target_path: 'metadata.keywords',
          before_value: undefined,
          after_value: [{ keywordLabel: 'First Keyword' }],
        },
        {
          id: '2',
          dar_id: 'ghi-jkl',
          target_path: 'metadata.keywords',
          before_value: [{ keywordLabel: 'First Keyword' }],
          after_value: [{ keywordLabel: 'First Keyword' }, { keywordLabel: 'Second Keyword' }],
        },
      ];

      const changedFst = applyRuleToRecord(sampleRecord2, rules[0]);
      const changedSnd = applyRuleToRecord(sampleRecord2, rules[1]);

      expect(changedFst).toBe(true);
      expect(changedSnd).toBe(true);
      expect(sampleRecord2.metadata.keywords).toEqual([
        { keywordLabel: 'First Keyword' },
        { keywordLabel: 'Second Keyword' },
      ]);
    });

    it('should fail a rule if not valid new field name', () => {
      (commonDatasetSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { flatten: () => 'Mocked validation error' },
      });
      const originalRecordState = JSON.parse(JSON.stringify(sampleRecord2));
      const rule: RuleDbRecord = {
        id: '2',
        dar_id: 'ghi-jkl',
        target_path: 'metadata.keywords',
        before_value: undefined,
        after_value: [{ notExistingFieldName: 'Second Keyword' }],
      };

      const changed = applyRuleToRecord(sampleRecord2, rule);

      expect(changed).toBe(false);
      expect(sampleRecord2).toEqual(originalRecordState);

      const rule2: RuleDbRecord = {
        id: '2',
        dar_id: 'ghi-jkl',
        target_path: 'metadata.keywords[0]',
        before_value: undefined,
        after_value: { notExistingFieldName: 'Second Keyword' },
      };

      const changed2 = applyRuleToRecord(sampleRecord2, rule2);

      expect(changed2).toBe(false);
      expect(sampleRecord2).toEqual(originalRecordState);
    });

    it('should fail a rule if not valid target path name', () => {
      (commonDatasetSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { flatten: () => 'Mocked validation error' },
      });
      const originalRecordState = JSON.parse(JSON.stringify(sampleRecord2));
      const rule: RuleDbRecord = {
        id: '1',
        dar_id: 'abc-def',
        target_path: 'metadata.idonotexist',
        before_value: undefined,
        after_value: { keywordLabel: 'First Keyword' },
      };

      const changed = applyRuleToRecord(sampleRecord2, rule);

      expect(changed).toBe(false);
      expect(sampleRecord2).toEqual(originalRecordState);
    });

    it('should success with rule updating a strictly typed field', () => {
      const rule: RuleDbRecord = {
        id: '1',
        dar_id: 'abc-def',
        target_path: 'metadata.assetType',
        before_value: 'Dataset',
        after_value: 'Book',
      };

      const changed = applyRuleToRecord(sampleRecord2, rule);

      expect(changed).toBe(true);
      expect(sampleRecord2.metadata.assetType).toEqual('Book');
    });

    it('should fail a rule if not a valid primitive type to insert', () => {
      (commonDatasetSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { flatten: () => 'Mocked validation error' },
      });
      const originalRecordState = JSON.parse(JSON.stringify(sampleRecord2));
      const rule: RuleDbRecord = {
        id: '1',
        dar_id: 'abc-def',
        target_path: 'metadata.datasetType',
        before_value: { datasetTypeCode: 'NotSpecified' },
        after_value: { keywordLabel: 'First Keyword' },
      };

      const rule2: RuleDbRecord = {
        id: '1',
        dar_id: 'abc-def',
        target_path: 'metadata.assetType',
        before_value: 'Dataset',
        after_value: 'something else',
      };

      const changed = applyRuleToRecord(sampleRecord2, rule);
      const changed2 = applyRuleToRecord(sampleRecord2, rule2);

      expect(changed).toBe(false);
      expect(changed2).toBe(false);
      expect(sampleRecord2).toEqual(originalRecordState);
    });

    it('should allow changing non-atomic field by rules', () => {
      const rule: RuleDbRecord = {
        id: '222',
        dar_id: 'ccc-ddd',
        target_path: 'metadata.descriptions',
        before_value: [{ descriptionText: 'Description text.', descriptionType: 'Abstract' }],
        after_value: [{ descriptionText: 'replaced description', descriptionType: 'Other' }],
      };

      const changed = applyRuleToRecord(sampleRecord2, rule);

      expect(changed).toBe(true);
      expect(sampleRecord2.metadata.descriptions).toEqual([
        { descriptionText: 'replaced description', descriptionType: 'Other' },
      ]);
    });

    it('should correctly handle replacing two parts of object', () => {
      const rules: RuleDbRecord[] = [
        {
          id: '222',
          dar_id: 'ccc-ddd',
          target_path: 'metadata.descriptions[0].descriptionType',
          before_value: 'Abstract',
          after_value: 'Other',
        },
        {
          id: '333',
          dar_id: 'eee-fff',
          target_path: 'metadata.descriptions[0].descriptionText',
          before_value: 'Description text.',
          after_value: 'replaced specific description text',
        },
      ];

      const changedFst = applyRuleToRecord(sampleRecord2, rules[0]);
      const changedSnd = applyRuleToRecord(sampleRecord2, rules[1]);

      expect(changedFst).toBe(true);
      expect(changedSnd).toBe(true);
      expect(sampleRecord2.metadata.descriptions).toEqual([
        { descriptionText: 'replaced specific description text', descriptionType: 'Other' },
      ]);
    });

    // A cleanup of db should prevent this, but this shoudl still work
    it('should update to the original value', () => {
      const rule1: RuleDbRecord = {
        id: '6',
        dar_id: 'opq-rst',
        target_path: 'metadata.titles[0].titleText',
        before_value: 'Some title of a record from remote repository',
        after_value: 'Intermediate Title',
      };
      const rule2: RuleDbRecord = {
        id: '7',
        dar_id: 'opq-rst',
        target_path: 'metadata.titles[0].titleText',
        before_value: 'Intermediate Title',
        after_value: 'Some title of a record from remote repository',
      };

      const changedFst = applyRuleToRecord(sampleRecord2, rule1);
      const changedSnd = applyRuleToRecord(sampleRecord2, rule2);

      expect(changedFst).toBe(true);
      expect(changedSnd).toBe(true);
      expect(sampleRecord2.metadata.titles).toBeDefined();
      expect(sampleRecord2.metadata.titles![0].titleText).toBe('Some title of a record from remote repository');
    });
  });
});
