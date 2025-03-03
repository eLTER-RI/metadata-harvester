import { emptyDeimsApi as api } from './emptyDeimsApi';
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSites: build.query<GetSitesApiResponse, GetSitesApiArg>({
      query: () => ({ url: `/sites` }),
    }),
    getSitesByResourceId: build.query<
      GetSitesByResourceIdApiResponse,
      GetSitesByResourceIdApiArg
    >({
      query: (queryArg) => ({ url: `/sites/${queryArg.resourceId}` }),
    }),
    getDatasets: build.query<GetDatasetsApiResponse, GetDatasetsApiArg>({
      query: () => ({ url: `/datasets` }),
    }),
    getDatasetsByResourceId: build.query<
      GetDatasetsByResourceIdApiResponse,
      GetDatasetsByResourceIdApiArg
    >({
      query: (queryArg) => ({ url: `/datasets/${queryArg.resourceId}` }),
    }),
    getActivities: build.query<GetActivitiesApiResponse, GetActivitiesApiArg>({
      query: () => ({ url: `/activities` }),
    }),
    getActivitiesByResourceId: build.query<
      GetActivitiesByResourceIdApiResponse,
      GetActivitiesByResourceIdApiArg
    >({
      query: (queryArg) => ({ url: `/activities/${queryArg.resourceId}` }),
    }),
    getSensors: build.query<GetSensorsApiResponse, GetSensorsApiArg>({
      query: () => ({ url: `/sensors` }),
    }),
    getSensorsByResourceId: build.query<
      GetSensorsByResourceIdApiResponse,
      GetSensorsByResourceIdApiArg
    >({
      query: (queryArg) => ({ url: `/sensors/${queryArg.resourceId}` }),
    }),
    getLocationsByResourceId: build.query<
      GetLocationsByResourceIdApiResponse,
      GetLocationsByResourceIdApiArg
    >({
      query: (queryArg) => ({ url: `/locations/${queryArg.resourceId}` }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as deimsApi };
export type GetSitesApiResponse = /** status 200 A list of sites */ SiteList[];
export type GetSitesApiArg = void;
export type GetSitesByResourceIdApiResponse =
  /** status 200 JSON object containing a complete site record */ CompleteSiteRecord;
export type GetSitesByResourceIdApiArg = {
  /** The DEIMS.ID of the site record */
  resourceId: string;
};
export type GetDatasetsApiResponse =
  /** status 200 A list of datasets */ RecordList[];
export type GetDatasetsApiArg = void;
export type GetDatasetsByResourceIdApiResponse =
  /** status 200 JSON object containing all dataset information */ CompleteDatasetRecord;
export type GetDatasetsByResourceIdApiArg = {
  /** The uuid of the dataset record */
  resourceId: string;
};
export type GetActivitiesApiResponse =
  /** status 200 A list of activites */ RecordList[];
export type GetActivitiesApiArg = void;
export type GetActivitiesByResourceIdApiResponse =
  /** status 200 JSON object containing all activity information */ CompleteActivityRecord;
export type GetActivitiesByResourceIdApiArg = {
  /** The uuid of the activity record */
  resourceId: string;
};
export type GetSensorsApiResponse =
  /** status 200 A list of sensors */ RecordList[];
export type GetSensorsApiArg = void;
export type GetSensorsByResourceIdApiResponse =
  /** status 200 JSON object containing all sensor information */ CompleteSensorRecord;
export type GetSensorsByResourceIdApiArg = {
  /** The uuid of the sensor record */
  resourceId: string;
};
export type GetLocationsByResourceIdApiResponse =
  /** status 200 JSON object containing all location information */ CompleteLocationRecord;
export type GetLocationsByResourceIdApiArg = {
  /** The uuid of the location record */
  resourceId: string;
};
export type SiteList = {
  name?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  coordinates?: string;
  changed?: string;
};
export type AffiliationItem = {
  network?: {
    name?: string;
    id?: {
      prefix?: string;
      suffix?: string;
    };
  };
  siteCode?: string;
  verified?: boolean;
};
export type PersonRecord = {
  type?: string;
  name?: string;
  email?: string;
  orcid?: string;
};
export type OrganisationRecord = {
  type?: string;
  name?: string;
  url?: string;
};
export type UrlObject = {
  title?: string;
  value?: string;
};
export type TaxonomyTerm = {
  label?: string;
  uri?: string;
};
export type RecordList = {
  type?: string;
  title?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  changed?: string;
};
export type ReferencedRecord = {
  title?: string;
  type?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  changed?: string;
};
export type CompleteSiteRecord = {
  title?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  type?: string;
  created?: string;
  changed?: string;
  attributes?: {
    affiliation?: {
      networks?: AffiliationItem[];
      projects?: {
        label?: string;
        uri?: string;
      }[];
    };
    contact?: {
      siteManager?: PersonRecord[][];
      operatingOrganisation?: OrganisationRecord[][];
      metadataProvider?: (PersonRecord[] | OrganisationRecord[])[];
      fundingAgency?: (PersonRecord[] | OrganisationRecord[])[];
      siteUrl?: UrlObject[];
    };
    general?: {
      abstract?: string;
      keywords?: TaxonomyTerm[];
      status?: TaxonomyTerm[];
      yearEstablished?: number;
      yearClosed?: number;
      hierarchy?: {
        parent?: RecordList[];
        children?: RecordList[];
      };
      siteName?: string;
      shortName?: string;
      siteType?: string;
      protectionLevel?: TaxonomyTerm[];
      landUse?: TaxonomyTerm[];
      images?: string;
    };
    environmentalCharacteristics?: {
      airTemperature?: {
        avg?: number;
        min?: number;
        max?: number;
        unit?: string;
      };
      precipitation?: {
        annual?: number;
        min?: number;
        max?: number;
        unit?: string;
      };
      biogeographicalRegion?: string;
      biome?: string;
      ecosystemType?: TaxonomyTerm[];
      landforms?: TaxonomyTerm[];
      geoBonBiome?: string;
      geology?: string;
      hydrology?: string;
      soils?: string;
      vegetation?: string;
    };
    geographic?: {
      boundaries?: string;
      coordinates?: string;
      country?: string[];
      elevation?: {
        avg?: number;
        min?: number;
        max?: number;
        unit?: string;
      };
      size?: {
        size?: number;
        unit?: string;
      };
      relatedLocations?: ReferencedRecord[];
    };
    focusDesignScale?: {
      experiments?: {
        design?: string;
        scale?: string;
      };
      observations?: {
        design?: string;
        scale?: string;
      };
      parameters?: TaxonomyTerm[];
      researchTopics?: TaxonomyTerm[];
    };
    infrastructure?: {
      accessibleAllYear?: boolean;
      accessType?: string;
      allPartsAccessible?: boolean;
      maintenanceInterval?: number;
      permanentPowerSupply?: boolean;
      operation?: {
        permanent?: boolean;
        notes?: string;
        siteVisitInterval?: string;
      };
      notes?: string;
      collection?: TaxonomyTerm[];
      data?: {
        policy?: {
          url?: UrlObject[];
          rights?: string[];
          notes?: string;
        };
      };
    };
    relatedResources?: ReferencedRecord[];
  };
};
export type ResourceNotFound = {
  status?: string;
  detail?: string;
  title?: string;
  source?: {
    pointer?: string;
  };
};
export type CompleteDatasetRecord = {
  title?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  type?: string;
  created?: string;
  changed?: string;
  attributes?: {
    general?: {
      abstract?: string;
      keywords?: TaxonomyTerm[];
      inspire?: TaxonomyTerm[];
      dateRange?: {
        from?: string;
        to?: string;
      };
      language?: string;
      relatedSite?: ReferencedRecord[];
    };
    contact?: {
      corresponding?: PersonRecord[] | OrganisationRecord[];
      creator?: PersonRecord[] | OrganisationRecord[];
      metadata?: PersonRecord[] | OrganisationRecord[];
    };
    observations?: {
      parameters?: TaxonomyTerm[];
      speciesGroup?: TaxonomyTerm[];
    };
    geographic?: {
      boundaries?: string;
      abstract?: string;
      elevation?: {
        min?: number;
        max?: number;
        unit?: string;
      };
    };
    onlineDistribution?: {
      dataPolicyUrl?: UrlObject[];
      doi?: string;
      onlineLocation?: {
        function?: string;
        url?: {
          title?: string;
          value?: string;
        };
        email?: string;
      }[];
    };
    legal?: {
      accesUse?: {
        label?: string;
        uri?: string;
      };
      rights?: string[];
      legalAct?: string;
      citation?: string;
    };
    method?: {
      instrumentation?: string[];
      qualityAssurance?: string[];
      methodUrl?: UrlObject[];
      methodDescription?: string[];
      samplingTimeUnit?: TaxonomyTerm[];
      spatialDesign?: TaxonomyTerm[];
      spatialScale?: TaxonomyTerm[];
      temporalResolution?: TaxonomyTerm[];
    };
  };
};
export type CompleteActivityRecord = {
  title?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  type?: string;
  created?: string;
  changed?: string;
  attributes?: {
    general?: {
      relatedSite?: ReferencedRecord[];
      abstract?: string;
      keywords?: TaxonomyTerm[];
      dateRange?: {
        from?: string;
        to?: string;
      };
    };
    contact?: {
      corresponding?: (PersonRecord[] | OrganisationRecord[])[];
      metadataProvider?: (PersonRecord[] | OrganisationRecord[])[];
    };
    geographic?: {
      boundaries?: string;
    };
    availability?: {
      digitally?: boolean;
      forEcopotential?: boolean;
      openData?: boolean;
      notes?: string;
      source?: {
        url?: UrlObject[];
      };
    };
    observation?: {
      parameter?: TaxonomyTerm[];
    };
    resolution?: {
      spatial?: TaxonomyTerm[];
      temporal?: TaxonomyTerm[];
    };
    relatedResources?: ReferencedRecord[];
  };
};
export type CompleteSensorRecord = {
  title?: string;
  id?: {
    prefix?: string;
    suffix?: string;
  };
  type?: string;
  created?: string;
  changed?: string;
  attributes?: {
    general?: {
      relatedSite?: ReferencedRecord[];
      abstract?: string;
      contact?: (PersonRecord[] | OrganisationRecord[])[];
      dateRange?: {
        from?: string;
        to?: string;
      };
      keywords?: TaxonomyTerm[];
    };
    geographic?: {
      coordinates?: string;
      trajectory?: string;
      elevation?: {
        value?: string;
        unit?: string;
      };
    };
    observation?: {
      sensorType?: TaxonomyTerm[];
      resultAcquisitionSource?: string;
      observedProperty?: {
        property?: string;
        unitofMeasurement?: string;
      }[];
    };
  };
};
export type CompleteLocationRecord = {
  geometry?: {
    type?: string;
    coordinates?: number[];
  };
  properties?: {
    title?: string;
    id?: {
      prefix?: string;
      suffix?: string;
    };
    created?: string;
    changed?: string;
    locationType?: TaxonomyTerm[];
    relatedSite?: ReferencedRecord[];
    abstract?: string;
    elevation?: {
      avg?: number;
      min?: number;
      max?: number;
      unit?: string;
    };
    images?: string;
  };
};
export const {
  useGetSitesQuery,
  useGetSitesByResourceIdQuery,
  useGetDatasetsQuery,
  useGetDatasetsByResourceIdQuery,
  useGetActivitiesQuery,
  useGetActivitiesByResourceIdQuery,
  useGetSensorsQuery,
  useGetSensorsByResourceIdQuery,
  useGetLocationsByResourceIdQuery,
} = injectedRtkApi;
