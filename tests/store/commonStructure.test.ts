import { AlternateIdentifier, parseDOIUrl, parsePID, toPID } from '../../src/store/commonStructure';

describe('commonStructure helper functions', () => {
  describe('parseDOIUrl', () => {
    it('should correctly parse a valid https DOI URL', () => {
      const url = 'https://doi.org/10.1234/j.phys.rev';
      expect(parseDOIUrl(url)).toEqual({ provider: 'doi.org', identifier: '10.1234/j.phys.rev' });
    });

    it('should return null for an invalid URL', () => {
      const url = 'invalid url from repository';
      expect(parseDOIUrl(url)).toBeNull();
    });

    it('should return null for a URL without an identifier part', () => {
      const url = 'https://doi.org/';
      expect(parseDOIUrl(url)).toBeNull();
    });
  });

  describe('parsePID', () => {
    it('should correctly parse http url', () => {
      const url = 'http://metadata.somethig.org/10.9.2025/abc';
      expect(parsePID(url)).toEqual({
        doi: {
          provider: 'metadata.somethig.org',
          identifier: '10.9.2025/abc',
        },
      });
    });

    it('should correctly parses https url', () => {
      const url = 'https://metadata.somethig.org/10.9.2025/abc';
      expect(parsePID(url)).toEqual({
        doi: {
          provider: 'metadata.somethig.org',
          identifier: '10.9.2025/abc',
        },
      });
    });

    it('should return null for a URL without an identifier part', () => {
      const url = 'https://doi.org/';
      expect(parsePID(url)).toBeUndefined();
    });

    it('should return null for an invalid URL', () => {
      const url = 'invalid url from repository';
      expect(parsePID(url)).toBeUndefined();
    });
  });

  describe('toPID', () => {
    it('should toPID find and parse the DOI from a list of identifiers', () => {
      const identifiers: AlternateIdentifier[] = [
        { alternateID: '12345', alternateIDType: 'ARK' },
        { alternateID: 'https://doi.org/10.9.2025/aaa', alternateIDType: 'DOI' },
      ];
      expect(toPID(identifiers)).toEqual({
        doi: {
          provider: 'doi.org',
          identifier: '10.9.2025/aaa',
        },
      });
    });

    it('toPID should return undefined if no DOI is found', () => {
      const identifiers: AlternateIdentifier[] = [{ alternateID: '12345', alternateIDType: 'ARK' }];
      expect(toPID(identifiers)).toBeUndefined();
    });
  });
});
