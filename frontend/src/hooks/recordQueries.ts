import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { FilterValues, Record } from '../store/RecordsProvider';

interface RecordsResponse {
  records: Record[];
  totalCount: number;
  totalPages: number;
}

export const useFetchRecords = (
  currentPage: number,
  pageSize: number,
  resolvedFilter: boolean | undefined,
  repositoryFilter: string[],
  searchQuery: string,
) => {
  return useQuery<RecordsResponse>({
    queryKey: ['records', { currentPage, pageSize, resolvedFilter, repositoryFilter, searchQuery }],
    queryFn: async () => {
      const params = {
        page: currentPage,
        size: pageSize,
        title: searchQuery || null,
        resolved: resolvedFilter,
        repositories: repositoryFilter,
      };
      const response = await api.get<RecordsResponse>('/records', { params });
      return response.data || { records: [], totalCount: 0, totalPages: 0 };
    },
    placeholderData: keepPreviousData,
  });
};

export const useFetchFilterValues = (
  resolvedFilter: boolean | undefined,
  repositoryFilter: string[],
  searchQuery: string,
) => {
  return useQuery<FilterValues>({
    queryKey: ['filters', { resolvedFilter, repositoryFilter, searchQuery }],
    queryFn: async (): Promise<FilterValues> => {
      const params = {
        resolved: resolvedFilter,
        repositories: repositoryFilter,
        title: searchQuery || null,
      };

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
