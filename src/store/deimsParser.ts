import {
  CommonDatasetMetadata,
  Coordinates,
  Creator,
  Description,
  extractIdentifiers,
  SpatialCoverage,
} from './commonStructure';
import {
  CompleteDatasetRecord,
  OrganisationRecord,
  PersonRecord,
} from './deimsApi';

function parseDeimsCreator(c: PersonRecord | OrganisationRecord): Creator {
  if (c.type === 'person') {
    const creator: PersonRecord = c as PersonRecord;
    return {
      type: 'Person',
      name: creator.name,
      email: creator.email,
    };
  } else if (c.type === 'organisation') {
    const creator: OrganisationRecord = c as OrganisationRecord;
    return {
      type: 'Organization',
      name: creator.name,
    };
  } else {
    return {
      type: 'Unknown',
      name: c.name,
    };
  }
}

// eslint-disable-next-line
function extractDeimsSpatialCoverage(input: any): SpatialCoverage[] {
  return (
    // eslint-disable-next-line
    input.geographic?.map((entry: any) => {
      let coordinates: Coordinates[] | null = null;
      let type: 'point' | 'polygon' | 'box' | 'unknown' = 'unknown';

      if (entry.boundaries.startsWith('POINT')) {
        const match = entry.boundaries.match(/POINT \(([^ ]+) ([^ ]+)\)/);
        if (match) {
          coordinates = [
            {
              latitude: parseFloat(match[2]),
              longitude: parseFloat(match[1]),
            },
          ];
          type = 'point';
        }
      } else if (entry.boundaries.startsWith('POLYGON')) {
        const match = entry.boundaries.match(/POLYGON \(\((.+?)\)\)/);
        if (match) {
          // eslint-disable-next-line
          coordinates = match[1].split(', ').map((coord: any) => {
            const [lon, lat] = coord.split(' ').map(parseFloat);
            return { latitude: lat, longitude: lon };
          });
          type = 'polygon';
        }
      } else if (entry.boundaries.startsWith('MULTIPOLYGON')) {
        const match = entry.boundaries.match(/MULTIPOLYGON \(\(\((.+?)\)\)\)/);
        if (match) {
          // eslint-disable-next-line
          coordinates = match[1].split(')), ((').flatMap((polygon: any) =>
            // eslint-disable-next-line
            polygon.split(', ').map((coord: any) => {
              const [lon, lat] = coord.split(' ').map(parseFloat);
              return { latitude: lat, longitude: lon };
            }),
          );
          type = 'polygon';
        }
      }

      return {
        place: entry.abstract || undefined,
        type,
        coordinates,
        elevation: entry.elevation
          ? {
              min: entry.elevation.min ? parseFloat(entry.elevation.min) : null,
              max: entry.elevation.max ? parseFloat(entry.elevation.max) : null,
              unit: entry.elevation.unit || null,
            }
          : null,
        box: null,
      };
    }) || []
  );
}

export const mapDeimsToCommonDatasetMetadata = (
  deims: CompleteDatasetRecord,
): CommonDatasetMetadata => {
  const descriptions: Description[] = [];
  if (deims.attributes?.general?.abstract) {
    descriptions.push({
      descriptionText: deims.attributes?.general?.abstract,
      descriptionType: 'Abstract',
    });
  }
  if (deims.attributes?.method) {
    descriptions.push({
      descriptionText: deims.attributes?.method?.toString(),
      descriptionType: 'Methods',
    });
  }

  return {
    alternateIdentifiers: extractIdentifiers(
      deims.attributes?.onlineDistribution,
    ),
    relatedIdentifiers: [],
    titles: [
      {
        titleText: deims.title || '',
        titleLanguage: deims.attributes?.general?.language,
      },
    ],
    creators:
      deims.attributes?.contact?.creator?.map((c) => parseDeimsCreator(c)) ||
      deims.attributes?.contact?.corresponding?.map((c) =>
        parseDeimsCreator(c),
      ) ||
      [],
    descriptions: descriptions,
    keywords: deims.attributes?.general?.keywords
      ?.filter((k) => k && k.label)
      .map((k) => k.label as string),
    access:
      deims.attributes?.legal?.accessUse
        // eslint-disable-next-line
        ?.map((entry: any) => entry.label)
        .join('; ') || 'unknown',
    temporalCoverages: [
      {
        startDate: deims.attributes?.general?.dateRange?.from,
        endDate: deims.attributes?.general?.dateRange?.to,
      },
    ],
    spatialCoverages: extractDeimsSpatialCoverage(deims.attributes?.geographic),
    responsibleOrganizations: [],
    contactPoints: [],
    contributors: [],
    publicationDate: [],
    language: deims.attributes?.general?.language
      ? [deims.attributes?.general?.language]
      : [],
    licenses: [],
    temporalResolution: [],
    taxonomicCoverages: [],
    methods: [],
    projects: [],
    siteReferences: [],
    habitatReferences: [],
    dataLevel: '',
    additionalMetadata: [],
  };
};
