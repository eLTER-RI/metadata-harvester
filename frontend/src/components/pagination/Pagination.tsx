import { Pagination } from 'semantic-ui-react';

interface PaginationProps {
  currentPage: number;
  totalRecords: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
}

const RecordsPagination = ({ currentPage, totalRecords, totalPages, pageSize, setCurrentPage }: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Math.ceil(totalRecords / pageSize);
  if (currentPage > pages) setCurrentPage(totalPages);

  const handlePageChange = (activePage: number | string | undefined) => {
    const newPage = Number(activePage);
    setCurrentPage(newPage);
  };

  return (
    <Pagination
      activePage={currentPage}
      totalPages={totalPages}
      onPageChange={(_, { activePage }) => handlePageChange(activePage)}
      size={'small'}
    />
  );
};

export default RecordsPagination;
