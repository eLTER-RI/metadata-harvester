// This file is a copy of constants.tsx from dar-mantle repository
/**
 * @author Michal Klinka
 */

import { SoHabitatType, SoHabitatValues, TimePeriodUnit } from 'elter-metadata-validation-schemas';

export const DescriptionTypeOptions = [
  {
    key: 'AdditionalInfo',
    text: 'Additional info',
    value: 'AdditionalInfo',
  },
  {
    key: 'Methods',
    text: 'Methods',
    value: 'Methods',
  },
  {
    key: 'SeriesInformation',
    text: 'Series information',
    value: 'SeriesInformation',
  },
  {
    key: 'TableOfContents',
    text: 'Table of contents',
    value: 'TableOfContents',
  },
  {
    key: 'TechnicalInfo',
    text: 'Technical info',
    value: 'TechnicalInfo',
  },
  {
    key: 'Other',
    text: 'Other',
    value: 'Other',
  },
];

export const ContributorTypeOptions = [
  {
    key: 'ContactPerson',
    text: 'Contact person',
    value: 'ContactPerson',
  },
  {
    key: 'DataCollector',
    text: 'Data collector',
    value: 'DataCollector',
  },
  {
    key: 'DataCurator',
    text: 'Data curator',
    value: 'DataCurator',
  },
  {
    key: 'DataManager',
    text: 'Data manager',
    value: 'DataManager',
  },
  {
    key: 'MetadataProvider',
    text: 'Metadata provider',
    value: 'MetadataProvider',
  },
  {
    key: 'Producer',
    text: 'Producer',
    value: 'Producer',
  },
  {
    key: 'ProjectLeader',
    text: 'Project leader',
    value: 'ProjectLeader',
  },
  {
    key: 'ProjectManager',
    text: 'Project manager',
    value: 'ProjectManager',
  },
  {
    key: 'ProjectMember',
    text: 'Project member',
    value: 'ProjectMember',
  },
  {
    key: 'RegistrationAuthority',
    text: 'Registration authority',
    value: 'RegistrationAuthority',
  },
  {
    key: 'RelatedPerson',
    text: 'Related person',
    value: 'RelatedPerson',
  },
  {
    key: 'Researcher',
    text: 'Researcher',
    value: 'Researcher',
  },
  {
    key: 'ResearchGroup',
    text: 'Research group',
    value: 'ResearchGroup',
  },
  {
    key: 'Other',
    text: 'Other',
    value: 'Other',
  },
];

export type CCLicenseType =
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-4.0'
  | 'CC-BY-NC-SA-4.0'
  | 'CC-BY-ND-4.0'
  | 'CC-BY-NC-ND-4.0';

export const LicenseTypeOptions: {
  key: CCLicenseType;
  text: string;
  value: CCLicenseType;
}[] = [
  {
    key: 'CC-BY-4.0',
    text: 'CC BY-4.0',
    value: 'CC-BY-4.0',
  },
  {
    key: 'CC-BY-SA-4.0',
    text: 'CC BY-SA-4.0',
    value: 'CC-BY-SA-4.0',
  },
  {
    key: 'CC-BY-NC-4.0',
    text: 'CC BY-NC-4.0',
    value: 'CC-BY-NC-4.0',
  },
  {
    key: 'CC-BY-NC-SA-4.0',
    text: 'CC BY-NC-SA-4.0',
    value: 'CC-BY-NC-SA-4.0',
  },
  {
    key: 'CC-BY-ND-4.0',
    text: 'CC BY-ND-4.0',
    value: 'CC-BY-ND-4.0',
  },
  {
    key: 'CC-BY-NC-ND-4.0',
    text: 'CC BY-NC-ND-4.0',
    value: 'CC-BY-NC-ND-4.0',
  },
];

export const LicenseToUrlMap: Record<CCLicenseType, string> = {
  'CC-BY-NC-4.0': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'CC-BY-NC-ND-4.0': 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  'CC-BY-NC-SA-4.0': 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  'CC-BY-ND-4.0': 'https://creativecommons.org/licenses/by-nd/4.0/',
  'CC-BY-SA-4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/',
};

export type AuthorSchemas = 'orcid' | 'ror' | 'wos' | 'scopus';

export const AuthorIdSchemaOptions: {
  key: AuthorSchemas;
  text: string;
  value: AuthorSchemas;
}[] = [
  {
    key: 'wos',
    text: 'ResearcherID',
    value: 'wos',
  },
  {
    key: 'orcid',
    text: 'ORCID',
    value: 'orcid',
  },
  {
    key: 'scopus',
    text: 'Scopus',
    value: 'scopus',
  },
];

export const AuthorIdSchemaToUrlMap = {
  ORCID: 'https://orcid.org/',
  SCOPUS: 'https://www.scopus.com/authid/detail.uri?authorId=',
  WOS: 'https://www.webofscience.com/wos/author/record/',
};

export const getTemporalResolutionUnits = (
  t: (k: string) => string,
): {
  key: TimePeriodUnit;
  text: string;
  value: TimePeriodUnit;
}[] => [
  {
    key: 'hz',
    text: t('hz'),
    value: 'hz',
  },
  {
    key: 'second',
    text: t('second'),
    value: 'second',
  },
  {
    key: 'minute',
    text: t('minute'),
    value: 'minute',
  },
  {
    key: 'hour',
    text: t('hour'),
    value: 'hour',
  },

  {
    key: 'day',
    text: t('day'),
    value: 'day',
  },
  {
    key: 'week',
    text: t('week'),
    value: 'week',
  },
  {
    key: 'month',
    text: t('month'),
    value: 'month',
  },
  {
    key: 'year',
    text: t('year'),
    value: 'year',
  },
];

export const getDataLevels = (
  t: (k: string) => string,
): {
  key: string;
  text: string;
  value: string;
}[] => [
  {
    key: '0',
    text: t('0'),
    value: '0',
  },
  {
    key: '1',
    text: t('1'),
    value: '1',
  },
  {
    key: '2',
    text: t('2'),
    value: '2',
  },
  {
    key: '3',
    text: t('3'),
    value: '3',
  },
];

export const getHabitatOptions = (
  t: (k: string) => string,
): {
  key: SoHabitatType;
  text: string;
  value: SoHabitatType;
}[] =>
  SoHabitatValues.map((val) => ({
    key: val,
    text: t(val),
    value: val,
  }));

export const RorUrlPrefix = 'https://ror.org/';
