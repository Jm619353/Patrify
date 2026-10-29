const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const pageSize = Math.min(
    Math.max(Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  return { page, pageSize, offset: (page - 1) * pageSize, limit: pageSize };
};

const buildMeta = ({ page, pageSize, total }) => {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

module.exports = { parsePagination, buildMeta, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
