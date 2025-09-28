import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface Record {
  dar_id: string;
  source_url: string;
  title: string;
}

interface RepositoryForFilter {
  source_repository: string;
  count: number;
}

interface RecordsContextType {
  records: Record[];
  totalRecords: number;
  totalPages: number;
  pageSize: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  repositories: RepositoryForFilter[];
  isReposLoading: boolean;
  reposError: string | null;
  resolvedFilter: boolean | undefined;
  repositoryFilter: string[];
  setCurrentPage: (page: number) => void;
  setPageSize: (page: number) => void;
  setResolvedFilter: (resolved: boolean | undefined) => void;
  setRepositoryFilter: (repository: string[]) => void;
  fetchRecords: () => void;
  fetchRepositories: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider = ({ children }: { children: React.ReactNode }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<RepositoryForFilter[]>([]);
  const [isReposLoading, setIsReposLoading] = useState<boolean>(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>(undefined);
  const [repositoryFilter, setRepositoryFilter] = useState<string[]>([]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        size: pageSize,
        resolved: resolvedFilter,
        repositories: repositoryFilter,
      };
      const response = await axios.get(`${API_BASE_URL}/records`, { params });
      const { records, totalCount, totalPages } = response.data;
      setRecords(records);
      setTotalRecords(totalCount);
      setTotalPages(totalPages);
      setError(null);
    } catch (e: any) {
      setError('Failed to fetch records. Please check the backend server.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepositories = async () => {
    setIsReposLoading(true);
    try {
      const params = {
        resolved: resolvedFilter,
        repositories: repositoryFilter,
      };
      const response = await axios.get(`${API_BASE_URL}/repositories`, { params });
      const repositories = response.data;
      setRepositories(repositories);
    } catch (e: any) {
      setReposError('Failed to fetch repositories. Please check the backend server.');
      console.error(e);
    } finally {
      setIsReposLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, pageSize, resolvedFilter, repositoryFilter]);

  useEffect(() => {
    fetchRepositories();
  }, [resolvedFilter, repositoryFilter]);

  const value = {
    records,
    totalRecords,
    totalPages,
    pageSize,
    currentPage,
    isLoading,
    error,
    repositories,
    isReposLoading,
    reposError,
    resolvedFilter,
    repositoryFilter,
    setCurrentPage,
    setPageSize,
    setResolvedFilter,
    setRepositoryFilter,
    fetchRecords,
    fetchRepositories,
  };

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
};

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('Context cannot be undefined.');
  }
  return context;
};
