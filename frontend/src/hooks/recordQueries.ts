import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api';

export const useFetchRecords = (
  currentPage: number,
  pageSize: number,
  resolvedFilter: boolean | undefined,
  repositoryFilter: string[],
  searchQuery: string,
) => {
  return useQuery({
    queryKey: ['records', { currentPage, pageSize, resolvedFilter, repositoryFilter, searchQuery }],
    queryFn: async () => {
      const params = {
        page: currentPage,
        size: pageSize,
        title: searchQuery || null,
        resolved: resolvedFilter,
        repositories: repositoryFilter,
      };
      return api.get('/records', { params });
    },
    placeholderData: keepPreviousData,
  });
};

export const useFetchFilterValues = (
  resolvedFilter: boolean | undefined,
  repositoryFilter: string[],
  searchQuery: string,
) => {
  return useQuery({
    queryKey: ['filters', { resolvedFilter, repositoryFilter, searchQuery }],
    queryFn: async () => {
      const params = {
        resolved: resolvedFilter,
        repositories: repositoryFilter,
        title: searchQuery || null,
      };

      const [repositories, resolved] = await Promise.all([
        api.get('/repositories', { params }),
        api.get('/resolved', { params }),
      ]);

      return { repositories, resolved };
    },
    placeholderData: keepPreviousData,
  });
};

export const useFetchRecord = (darId: string) => {
  return useQuery({
    queryKey: ['darRecord', darId],
    queryFn: async () => api.get(`/external-record/${darId}`),
  });
};
