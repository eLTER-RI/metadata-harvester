import { getNestedValue } from '../../../src/utilities/rules';

describe('Rules Utility Functions', () => {
  let testObj: any;

  beforeEach(() => {
    testObj = {
      metadata: {
        created_at: '2025-10-09-22:30:00',
        descriptions: [
          { type: 'abstract', value: 'This file gathers data about the oxygen levels in lake Kivesjärvi.' },
          { type: 'description', value: 'The lake that is a subject of measurements is located in Finland.' },
        ],
        creator: {
          creatorFirstName: 'Lauri',
          creatorLastName: 'Suomalainen',
        },
      },
      versions: ['a1b2c3d4', 'z9y8x7w6'],
      organisation: 'Åbo Forskningsgrupp',
    };
  });

  describe('getNestedValue', () => {
    it('should find not-nested simple type value', () => {
      expect(getNestedValue(testObj, 'organisation')).toBe('Åbo Forskningsgrupp');
    });

    it('should find not-nested array and single value', () => {
      expect(getNestedValue(testObj, 'versions')).toEqual(['a1b2c3d4', 'z9y8x7w6']);
      expect(getNestedValue(testObj, 'versions[0]')).toBe('a1b2c3d4');
    });

    it('should find nested simple type value', () => {
      expect(getNestedValue(testObj, 'metadata.created_at')).toBe('2025-10-09-22:30:00');
    });

    it('should find nested structure', () => {
      expect(getNestedValue(testObj, 'metadata.creator')).toEqual({
        creatorFirstName: 'Lauri',
        creatorLastName: 'Suomalainen',
      });
      expect(getNestedValue(testObj, 'metadata.creator.creatorFirstName')).toBe('Lauri');
      expect(getNestedValue(testObj, 'metadata.creator.creatorLastName')).toBe('Suomalainen');
    });

    it('should get values from a nested array', () => {
      expect(getNestedValue(testObj, 'metadata.descriptions')).toEqual([
        { type: 'abstract', value: 'This file gathers data about the oxygen levels in lake Kivesjärvi.' },
        { type: 'description', value: 'The lake that is a subject of measurements is located in Finland.' },
      ]);
      expect(getNestedValue(testObj, 'metadata.descriptions[0]')).toEqual({
        type: 'abstract',
        value: 'This file gathers data about the oxygen levels in lake Kivesjärvi.',
      });
      expect(getNestedValue(testObj, 'metadata.descriptions[0].value')).toBe(
        'This file gathers data about the oxygen levels in lake Kivesjärvi.',
      );
      expect(getNestedValue(testObj, 'metadata.descriptions[0].type')).toBe('abstract');
      expect(getNestedValue(testObj, 'metadata.descriptions[1].value')).toBe(
        'The lake that is a subject of measurements is located in Finland.',
      );
      expect(getNestedValue(testObj, 'metadata.descriptions[1].type')).toBe('description');
    });
  });
});
