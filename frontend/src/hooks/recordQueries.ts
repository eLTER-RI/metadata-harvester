import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { FilterValues, Record, ManualRecord } from '../store/RecordsProvider';

interface RecordsResponse {
  records: Record[];
  totalCount: number;
  totalPages: number;
}

export interface ManualRecordsResponse {
  records: ManualRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const useFetchRecords = (
  currentPage: number,
  pageSize: number,
  resolvedFilter: boolean | undefined,
  repositoryFilter: string[],
  sitesFilter: string,
  habitatsFilter: string,
  keywordsFilter: string,
  datasetTypeFilter: string,
  searchQuery: string,
  orderBy?: 'last_harvested' | 'last_seen_at' | 'status',
  orderDirection?: 'asc' | 'desc',
) => {
  return useQuery<RecordsResponse>({
    queryKey: [
      'records',
      {
        currentPage,
        pageSize,
        resolvedFilter,
        repositoryFilter,
        sitesFilter,
        habitatsFilter,
        keywordsFilter,
        datasetTypeFilter,
        searchQuery,
        orderBy,
        orderDirection,
      },
    ],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        size: pageSize,
        title: searchQuery || null,
        resolved: resolvedFilter,
      };

      if (orderBy) {
        params.orderBy = orderBy;
      }
      if (orderDirection) {
        params.orderDirection = orderDirection;
      }

      if (repositoryFilter.length > 0) {
        params['repositories[]'] = repositoryFilter;
      }
      if (sitesFilter) {
        params.sites = sitesFilter;
      }
      if (habitatsFilter) {
        params.habitats = habitatsFilter;
      }
      if (keywordsFilter) {
        params.keywords = keywordsFilter;
      }
      if (datasetTypeFilter) {
        params.datasetTypes = datasetTypeFilter;
      }

      const response = await api.get<RecordsResponse>('/records', { params });
      return response.data || { records: [], totalCount: 0, totalPages: 0 };
    },
    placeholderData: keepPreviousData,
  });
};

export const useFetchFilterValues = (
  resolvedFilter: boolean | undefined,
  repositoryFilter: string[],
  sitesFilter: string,
  habitatsFilter: string,
  keywordsFilter: string,
  datasetTypeFilter: string,
  searchQuery: string,
) => {
  return useQuery<FilterValues>({
    queryKey: [
      'filters',
      { resolvedFilter, repositoryFilter, sitesFilter, habitatsFilter, keywordsFilter, datasetTypeFilter, searchQuery },
    ],
    queryFn: async (): Promise<FilterValues> => {
      const params: any = {
        resolved: resolvedFilter,
        title: searchQuery || null,
      };

      if (repositoryFilter.length > 0) {
        params['repositories[]'] = repositoryFilter;
      }
      if (sitesFilter) {
        params.sites = sitesFilter;
      }
      if (habitatsFilter) {
        params.habitats = habitatsFilter;
      }
      if (keywordsFilter) {
        params.keywords = keywordsFilter;
      }
      if (datasetTypeFilter) {
        params.datasetTypes = datasetTypeFilter;
      }

      const [repoResponse, resolvedResponse] = await Promise.all([
        api.get<FilterValues['repositories']>('/repositories', { params }),
        api.get<FilterValues['resolved']>('/resolved', { params }),
      ]);
      return {
        repositories: repoResponse.data || [],
        resolved: resolvedResponse.data || [],
      };
    },
    placeholderData: keepPreviousData,
  });
};

export const useFetchRecord = (darId: string | undefined) => {
  return useQuery({
    queryKey: ['record', darId],
    queryFn: async () => {
      const response = await api.get(`/external-record/${darId}`);
      return response.data || null;
    },
    enabled: !!darId,
  });
};

export const useFetchRules = (darId: string | undefined) => {
  return useQuery({
    queryKey: ['rules', darId],
    queryFn: async () => {
      const response = await api.get(`/records/${darId}/rules`);
      return response.data || [];
    },
    enabled: !!darId,
  });
};

export const useFetchHarvestedRecord = (darId: string | undefined) => {
  return useQuery({
    queryKey: ['harvestedRecord', darId],
    queryFn: async () => {
      try {
        const response = await api.get(`/records/${darId}`);
        return response.data;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!darId,
    retry: false,
  });
};

export const useFetchManualRecords = (currentPage: number, pageSize: number, searchQuery: string) => {
  return useQuery<ManualRecordsResponse>({
    queryKey: ['manualRecords', { currentPage, pageSize, searchQuery }],
    queryFn: async () => {
      const params = {
        page: currentPage,
        size: pageSize,
        title: searchQuery || '',
      };
      const response = await api.get<ManualRecordsResponse>('/manual-records', { params });
      return response.data || { records: [], totalCount: 0, currentPage: 1, totalPages: 0 };
    },
    placeholderData: keepPreviousData,
  });
};

export const useFetchOarAssets = (darAssetId: string | undefined) => {
  return useQuery({
    queryKey: ['oar', darAssetId],
    queryFn: async () => {
      const response = await api.get('/oar', { params: { darAssetId } });
      return response.data || [];
    },
    enabled: !!darAssetId,
  });
};

export interface DeimsSite {
  siteID: string;
  siteName: string;
  siteData?: any;
}

export const useFetchDeimsSites = () => {
  return useQuery<DeimsSite[]>({
    queryKey: ['deims-sites'],
    queryFn: async () => {
      const response = await api.get<DeimsSite[]>('/deims-sites');
      return response.data || [];
    },
    staleTime: 30 * 60 * 1000, // cache for 30 minutes
  });
};
