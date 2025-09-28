import { Pagination } from 'semantic-ui-react';
import { useRecords } from '../../store/RecordsProvider';

const RecordsPagination = () => {
  const { currentPage, totalRecords, totalPages, pageSize, setCurrentPage } = useRecords();
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
