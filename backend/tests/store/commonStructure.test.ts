import {
  AlternateIdentifier,
  formatDate,
  getChecksum,
  getLicenseURI,
  isValidEntityIdSchema,
  normalizeDate,
  parseDOIUrl,
  parsePID,
  toPID,
} from '../../src/store/commonStructure';

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

  describe('isValidEntityIdSchema', () => {
    it('should return true for valid schema', () => {
      expect(isValidEntityIdSchema('ror')).toBe(true);
      expect(isValidEntityIdSchema('orcid')).toBe(true);
      expect(isValidEntityIdSchema('wos')).toBe(true);
      expect(isValidEntityIdSchema('scopus')).toBe(true);
    });

    it('should return true for valid schema with different casing', () => {
      expect(isValidEntityIdSchema('ROR')).toBe(true);
    });

    it('should return false for invalid schema', () => {
      expect(isValidEntityIdSchema('invalid_schema')).toBe(false);
    });

    it('should return false no schema', () => {
      expect(isValidEntityIdSchema(undefined)).toBe(false);
    });
  });

  describe('normalizeDate and formatDate', () => {
    it('should normalizeDate handle DD.MM.YYYY', () => {
      expect(normalizeDate('08.10.2025')).toBe('2025-10-08');
    });

    it('should normalizeDate handle DD/MM/YYYY', () => {
      expect(normalizeDate('08/10/2025')).toBe('2025-10-08');
    });

    it('should formatDate handle a full ISO string', () => {
      expect(formatDate('2025-10-08T12:00:00Z')).toBe('2025-10-08');
    });

    it('should not change on normalized date', () => {
      expect(normalizeDate('2025-10-08')).toBe('2025-10-08');
    });

    it('should formatDate return undefined for invalid date string', () => {
      expect(formatDate('invalid date')).toBeUndefined();
    });
  });

  describe('getLicenseURI', () => {
    it('should return url for cc by', () => {
      expect(getLicenseURI('cc by')).toBe('https://creativecommons.org/licenses/by/4.0/');
    });

    it('should return url for cc by-nc', () => {
      expect(getLicenseURI('cc by-nc')).toBe('https://creativecommons.org/licenses/by-nc/4.0/');
    });

    it('should return url for cc-zero', () => {
      expect(getLicenseURI('cc-zero')).toBe('https://creativecommons.org/publicdomain/zero/1.0/');
    });

    it('should return url for cc-by-sa-4.0', () => {
      expect(getLicenseURI('cc-by-sa-4.0')).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    });

    it('should return url for cc by-nc-nd', () => {
      expect(getLicenseURI('cc by-nc-nd')).toBe('https://creativecommons.org/licenses/by-nc-nd/4.0/');
    });

    it('should return url for cc-by-sa-4.0', () => {
      expect(getLicenseURI('cc-by-sa-4.0')).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    });

    it('should return undefined for an unknown license ID', () => {
      expect(getLicenseURI('my-custom-license')).toBeUndefined();
    });
  });

  describe('getChecksum', () => {
    it('should remove the prefix', () => {
      const checksum = 'md5:d41d8cd98f00b204e9800998ecf8427e';
      expect(getChecksum(checksum)).toBe('d41d8cd98f00b204e9800998ecf8427e');

      const checksum2 = 'sha1:d41d8cd98f00b204e9800998ecf8427e';
      expect(getChecksum(checksum2)).toBe('d41d8cd98f00b204e9800998ecf8427e');

      const checksum3 = 'sha256:d41d8cd98f00b204e9800998ecf8427e';
      expect(getChecksum(checksum3)).toBe('d41d8cd98f00b204e9800998ecf8427e');

      const checksum4 = 'sha512:d41d8cd98f00b204e9800998ecf8427e';
      expect(getChecksum(checksum4)).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should not remove different prefix', () => {
      const checksum = 'xxxxx:d41d8cd98f00b204e9800998ecf8427e';
      expect(getChecksum(checksum)).toBe('xxxxx:d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should handle checksums without a prefix', () => {
      const checksum = 'd41d8cd98f00b204e9800998ecf8427e';
      expect(getChecksum(checksum)).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should return undefined for non-string input', () => {
      expect(getChecksum(null)).toBeUndefined();
      expect(getChecksum(12345)).toBeUndefined();
    });
  });
});
