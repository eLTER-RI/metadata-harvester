import { Geolocation } from '../../../src/store/commonStructure';

export type GeometryType = 'boundingBox' | 'boundingPolygon' | 'lineString' | 'point';

export const getGeometryType = (geoLocation: Geolocation | undefined): GeometryType => {
  if (!geoLocation) return 'boundingBox';
  if (geoLocation.boundingBox) return 'boundingBox';
  if (geoLocation.boundingPolygon) return 'boundingPolygon';
  if (geoLocation.lineString) return 'lineString';
  if (geoLocation.point) return 'point';
  return 'boundingBox';
};

export const createDefaultGeoLocation = (): Geolocation => ({
  geographicDescription: '',
  observationLocation: {
    deimsLocationID: '',
    deimsLocationName: '',
  },
  boundingBox: {
    westBoundLongitude: 0,
    eastBoundLongitude: 0,
    southBoundLatitude: 0,
    northBoundLatitude: 0,
  },
});

export const clearGeometryProperties = (geoLocation: Geolocation): Geolocation => {
  const updated = { ...geoLocation };
  delete updated.boundingBox;
  delete updated.boundingPolygon;
  delete updated.lineString;
  delete updated.point;
  return updated;
};

export const createDefaultGeometryData = (type: GeometryType): Partial<Geolocation> => {
  switch (type) {
    case 'boundingBox':
      return {
        boundingBox: {
          westBoundLongitude: 0,
          eastBoundLongitude: 0,
          southBoundLatitude: 0,
          northBoundLatitude: 0,
        },
      };
    case 'boundingPolygon':
      return {
        boundingPolygon: [
          {
            points: [{ latitude: 0, longitude: 0 }],
            inPolygonPoint: { latitude: 0, longitude: 0 },
          },
        ],
      };
    case 'lineString':
      return {
        lineString: [{ latitude: 0, longitude: 0 }],
      };
    case 'point':
      return {
        point: { latitude: 0, longitude: 0 },
      };
    default:
      return {};
  }
};

/**
 * Options for dropdown
 */
export const geometryTypeOptions = [
  { key: 'boundingBox', text: 'Bounding Box', value: 'boundingBox' },
  { key: 'boundingPolygon', text: 'Polygon', value: 'boundingPolygon' },
  { key: 'lineString', text: 'Line String', value: 'lineString' },
  { key: 'point', text: 'Point', value: 'point' },
];
