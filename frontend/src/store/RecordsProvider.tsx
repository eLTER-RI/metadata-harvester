import React, { createContext, useContext, useState } from 'react';
import { useFetchFilterValues, useFetchRecords, useFetchManualRecords } from '../hooks/recordQueries';

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

export interface ManualRecord {
  id: number;
  dar_id: string;
  created_at: string;
  created_by: string | null;
  title: string | null;
}

interface RecordsContextType {
  pageSize: number;
  currentPage: number;
  resolvedFilter: boolean | undefined;
  repositoryFilter: string[];
  sitesFilter: string;
  habitatsFilter: string;
  keywordsFilter: string;
  datasetTypeFilter: string;
  searchQuery: string;
  setCurrentPage: (page: number) => void;
  setPageSize: (page: number) => void;
  setResolvedFilter: (resolved: boolean | undefined) => void;
  setRepositoryFilter: (repository: string[]) => void;
  setSitesFilter: (sites: string) => void;
  setHabitatsFilter: (habitats: string) => void;
  setKeywordsFilter: (keywords: string) => void;
  setDatasetTypeFilter: (datasetTypes: string) => void;
  setSearchQuery: (title: string) => void;
  manualRecordsPageSize: number;
  manualRecordsCurrentPage: number;
  manualRecordsSearchQuery: string;
  setManualRecordsCurrentPage: (page: number) => void;
  setManualRecordsPageSize: (page: number) => void;
  setManualRecordsSearchQuery: (query: string) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider = ({ children }: { children: React.ReactNode }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>(undefined);
  const [repositoryFilter, setRepositoryFilter] = useState<string[]>([]);
  const [sitesFilter, setSitesFilter] = useState<string>('');
  const [habitatsFilter, setHabitatsFilter] = useState<string>('');
  const [keywordsFilter, setKeywordsFilter] = useState<string>('');
  const [datasetTypeFilter, setDatasetTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualRecordsPageSize, setManualRecordsPageSize] = useState(10);
  const [manualRecordsCurrentPage, setManualRecordsCurrentPage] = useState(1);
  const [manualRecordsSearchQuery, setManualRecordsSearchQuery] = useState('');

  const value = {
    pageSize,
    currentPage,
    resolvedFilter,
    repositoryFilter,
    sitesFilter,
    habitatsFilter,
    keywordsFilter,
    datasetTypeFilter,
    searchQuery,
    setCurrentPage,
    setPageSize,
    setResolvedFilter,
    setRepositoryFilter,
    setSitesFilter,
    setHabitatsFilter,
    setKeywordsFilter,
    setDatasetTypeFilter,
    setSearchQuery,
    manualRecordsPageSize,
    manualRecordsCurrentPage,
    manualRecordsSearchQuery,
    setManualRecordsCurrentPage,
    setManualRecordsPageSize,
    setManualRecordsSearchQuery,
  };

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
};

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('Context cannot be undefined.');
  }

  const {
    currentPage,
    pageSize,
    resolvedFilter,
    repositoryFilter,
    sitesFilter,
    habitatsFilter,
    keywordsFilter,
    datasetTypeFilter,
    searchQuery,
  } = context;

  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    error: recordsError,
  } = useFetchRecords(
    currentPage,
    pageSize,
    resolvedFilter,
    repositoryFilter,
    sitesFilter,
    habitatsFilter,
    keywordsFilter,
    datasetTypeFilter,
    searchQuery,
  );

  const {
    data: filterValuesData,
    isLoading: isFilterLoading,
    error: filterError,
  } = useFetchFilterValues(
    resolvedFilter,
    repositoryFilter,
    sitesFilter,
    habitatsFilter,
    keywordsFilter,
    datasetTypeFilter,
    searchQuery,
  );

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

export const useManualRecords = () => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('Context cannot be undefined.');
  }

  const { manualRecordsCurrentPage, manualRecordsPageSize, manualRecordsSearchQuery } = context;

  const {
    data: manualRecordsData,
    isLoading: isManualRecordsLoading,
    error: manualRecordsError,
  } = useFetchManualRecords(manualRecordsCurrentPage, manualRecordsPageSize, manualRecordsSearchQuery);

  return {
    pageSize: manualRecordsPageSize,
    currentPage: manualRecordsCurrentPage,
    searchQuery: manualRecordsSearchQuery,
    setCurrentPage: context.setManualRecordsCurrentPage,
    setPageSize: context.setManualRecordsPageSize,
    setSearchQuery: context.setManualRecordsSearchQuery,
    records: manualRecordsData?.records || [],
    totalRecords: manualRecordsData?.totalCount || 0,
    totalPages: manualRecordsData?.totalPages || 0,
    isLoading: isManualRecordsLoading,
    error: manualRecordsError,
  };
};
