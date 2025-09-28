import { Pagination } from 'semantic-ui-react';

interface RecordsPaginationProps {
  currentPage: number;
  totalResults: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
}

const RecordsPagination = ({
  currentPage,
  totalResults,
  totalPages,
  pageSize,
  setCurrentPage,
}: RecordsPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Math.ceil(totalResults / pageSize);
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
