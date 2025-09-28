import React, { useEffect, useState } from 'react';
import { Container, Dimmer, Header, Item, Loader, Segment } from 'semantic-ui-react';
import RecordCard from './RecordCard';
import axios from 'axios';
import RecordsPagination from '../pagination/Pagination';

interface RecordsListProps {
  repositoryFilter?: string;
  resolvedFilter?: boolean;
}

interface Record {
  dar_id: string;
  source_url: string;
  title: string;
}

interface ApiResponse {
  records: Record[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface FetchParams {
  resolved?: boolean;
  repository?: string;
  page?: number;
  size?: number;
}

const API_BASE_URL = 'http://localhost:3000/records';
const RECORDS_PER_PAGE = 10;

export const RecordsList = ({ repositoryFilter, resolvedFilter }: RecordsListProps) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params: FetchParams = {
        page: currentPage,
        size: RECORDS_PER_PAGE,
      };
      if (resolvedFilter !== undefined) {
        params.resolved = resolvedFilter;
      }
      if (repositoryFilter) {
        params.repository = repositoryFilter;
      }
      const response = await axios.get<ApiResponse>(API_BASE_URL, { params });
      const { records, totalCount, totalPages } = response.data;
      setRecords(records);
      setTotalRecords(totalCount);
      setCurrentPage(currentPage);
      setTotalPages(totalPages);
    } catch (e: any) {
      setError('Failed to fetch records. Please check the backend server.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchRecords();
  }, [resolvedFilter, repositoryFilter]);

  if (isLoading) {
    return (
      <Segment style={{ height: '50vh' }}>
        <Dimmer active inverted>
          <Loader>Loading records...</Loader>
        </Dimmer>
      </Segment>
    );
  }

  if (error) {
    return (
      <Segment style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header as="h2" color="red">
          Error loading records.
          <Header.Subheader>{error}</Header.Subheader>
        </Header>
      </Segment>
    );
  }

  return (
    <Container>
      <Item.Group divided>
        {records.map((record, index) => (
          <RecordCard key={index} record={record} fetchRecords={fetchRecords} />
        ))}
      </Item.Group>
      <RecordsPagination
        currentPage={currentPage}
        totalResults={totalRecords}
        totalPages={totalPages}
        pageSize={RECORDS_PER_PAGE}
        setCurrentPage={setCurrentPage}
      />
    </Container>
  );
};

export default RecordsList;
