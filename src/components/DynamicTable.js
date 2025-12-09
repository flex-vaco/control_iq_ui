import React, { useState, useMemo, useEffect } from 'react';
import { Table, Card, Form, Button, Pagination, Accordion } from 'react-bootstrap';
// import * as XLSX from 'xlsx';

const DynamicTable = ({ data, title, tableId, filterableColumns = null, columnHeaderMap = {}, itemsPerPage = 10, renderActions = null }) => {
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Get all unique column headers from the data (handle empty data case)
  // Exclude internal action fields and id fields (but keep them in row data for edit/delete)
  const headers = data && data.length > 0 
    ? Object.keys(data[0]).filter(key => {
        // Exclude fields starting with underscore (internal fields)
        if (key.startsWith('_')) return false;
        // Exclude fields ending with _id or just 'id' (but keep control_id and them in row data)
        if (key === 'control_id') return true; // Always show control_id
        if (key.endsWith('_id') || key === 'id') return false;
        return true;
      })
    : [];

  // Helper to format header keys (e.g., 'rcm_id' -> 'Rcm Id', 'control_id' -> 'Control')
  const formatHeader = (key) => {
    // Check if there's a custom mapping for this column
    if (columnHeaderMap[key]) {
      return columnHeaderMap[key];
    }
    // Special case for control_id
    if (key === 'control_id') {
      return 'Control';
    }
    if (key === 'testing_status') {
      return 'PBC Status';
    }
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const columnsToFilter = filterableColumns && filterableColumns.length > 0 
    ? filterableColumns.filter(col => headers.includes(col))
    : headers;

  // Filter data based on column-specific filters only
  const filteredData = useMemo(() => {
    // Handle empty data case
    if (!data || data.length === 0) {
      return [];
    }

    let result = [...data];

    // Apply column-specific filters
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        const filterLower = filterValue.toLowerCase();
        result = result.filter(row => {
          const value = String(row[column] || '').toLowerCase();
          return value.includes(filterLower);
        });
      }
    });

    return result;
  }, [data, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, data]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <Card.Header as="h5">{title}</Card.Header>
        <Card.Body>
          <p>No data available to display.</p>
        </Card.Body>
      </Card>
    );
  }

  // Handle filter change
  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(v => v && v.trim());

  // Export to Excel function
  // const handleExportToExcel = () => {
  //   if (!filteredData || filteredData.length === 0) {
  //     return;
  //   }

  //   // Prepare data for export - use filtered data (all filtered rows, not just current page)
  //   const exportData = filteredData.map(row => {
  //     const exportRow = {};
  //     headers.forEach(key => {
  //       exportRow[formatHeader(key)] = String(row[key] || '');
  //     });
  //     return exportRow;
  //   });

  //   // Create a new workbook
  //   const workbook = XLSX.utils.book_new();
    
  //   // Convert data to worksheet
  //   const worksheet = XLSX.utils.json_to_sheet(exportData);
    
  //   // Set column widths
  //   const maxWidth = 50;
  //   const colWidths = headers.map(() => ({ wch: maxWidth }));
  //   worksheet['!cols'] = colWidths;
    
  //   // Add worksheet to workbook
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
  //   // Generate filename from title
  //   const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
  //   // Write the file
  //   XLSX.writeFile(workbook, filename);
  // };

  return (
    <Card>
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
        <span>{title}</span>
        {/* {filteredData && filteredData.length > 0 && (
          <Button
            variant="success"
            size="sm"
            onClick={handleExportToExcel}
            title="Export to Excel"
          >
            <i className="fas fa-file-excel"></i> Export to Excel
          </Button>
        )} */}
      </Card.Header>
      <Card.Body>
        {/* Column Filters in Accordion */}
        {columnsToFilter.length > 0 && (
          <Accordion defaultActiveKey="" className="mb-3">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Filters</Accordion.Header>
              <Accordion.Body>
                <div className="table-filter-container">
                  <div className="table-filter-row">
                    {columnsToFilter.map((key) => (
                      <div key={key} className="table-filter-group">
                        <label htmlFor={`filter-${key}-${tableId}`}>
                          {formatHeader(key)}
                        </label>
                        <Form.Control
                          id={`filter-${key}-${tableId}`}
                          type="text"
                          placeholder={`Filter ${formatHeader(key)}...`}
                          value={filters[key] || ''}
                          onChange={(e) => handleFilterChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                    {hasActiveFilters && (
                      <div className="table-filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button
                          onClick={clearFilters}
                          className="clear-filters-btn"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Results Count */}
                  <div className="mt-3 text-muted" style={{ fontSize: '0.9rem' }}>
                    {hasActiveFilters 
                      ? `Showing ${filteredData.length} of ${data.length} records`
                      : `Total: ${data.length} records`
                    }
                    {filteredData.length > itemsPerPage && (
                      <span> | Page {currentPage} of {totalPages}</span>
                    )}
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}

        {/* Table Container with Fixed Height and Scroll */}
        <div className="table-wrapper">
          <div className="table-scroll-container">
            <Table responsive striped bordered hover id={tableId}>
              <thead>
                <tr>
                  {headers.map((key) => (
                    <th key={key}>{formatHeader(key)}</th>
                  ))}
                  {renderActions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + (renderActions ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem' }}>
                      {filteredData.length === 0 
                        ? 'No data matches your filters. Try adjusting your search criteria.'
                        : 'No data available to display.'
                      }
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={startIndex + index}>
                      {headers.map((key) => (
                        <td key={`${key}-${startIndex + index}`}>
                          {row[key] !== null && row[key] !== undefined ? String(row[key]) : ''}
                        </td>
                      ))}
                      {renderActions && (
                        <td>
                          {renderActions(row, startIndex + index)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {filteredData.length > itemsPerPage && (
          <div className="table-pagination-container">
            <Pagination className="mb-0 justify-content-center">
              <Pagination.First 
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
              />
              <Pagination.Prev 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
              />
              
              {getPageNumbers().map((page, index) => {
                if (page === 'ellipsis') {
                  return <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />;
                }
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              })}
              
              <Pagination.Next 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
              />
              <Pagination.Last 
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DynamicTable;
