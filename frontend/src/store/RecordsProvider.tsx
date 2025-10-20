import React, { createContext, useContext, useState } from 'react';
import { useFetchFilterValues, useFetchRecords } from '../hooks/recordQueries';

export interface Record {
  dar_id: string;
  source_url: string;
  title: string;
}

export interface FilterValues {
  repositories: {
    source_repository: string;
    count: number;
  }[];
  resolved: {
    resolved: boolean;
    count: number;
  }[];
}

interface RecordsContextType {
  pageSize: number;
  currentPage: number;
  resolvedFilter: boolean | undefined;
  repositoryFilter: string[];
  searchQuery: string;
  setCurrentPage: (page: number) => void;
  setPageSize: (page: number) => void;
  setResolvedFilter: (resolved: boolean | undefined) => void;
  setRepositoryFilter: (repository: string[]) => void;
  setSearchQuery: (title: string) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider = ({ children }: { children: React.ReactNode }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>(undefined);
  const [repositoryFilter, setRepositoryFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const value = {
    pageSize,
    currentPage,
    resolvedFilter,
    repositoryFilter,
    searchQuery,
    setCurrentPage,
    setPageSize,
    setResolvedFilter,
    setRepositoryFilter,
    setSearchQuery,
  };

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
};

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('Context cannot be undefined.');
  }

  const { currentPage, pageSize, resolvedFilter, repositoryFilter, searchQuery } = context;

  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    error: recordsError,
  } = useFetchRecords(currentPage, pageSize, resolvedFilter, repositoryFilter, searchQuery);

  const {
    data: filterValuesData,
    isLoading: isFilterLoading,
    error: filterError,
  } = useFetchFilterValues(resolvedFilter, repositoryFilter, searchQuery);

  return {
    ...context,
    records: recordsData?.records || [],
    totalRecords: recordsData?.totalCount || 0,
    totalPages: recordsData?.totalPages || 0,
    isLoading: isRecordsLoading,
    error: recordsError,

    filterValues: filterValuesData || { repositories: [], resolved: [] },
    isFilterLoading,
    filterError,
  };
};
