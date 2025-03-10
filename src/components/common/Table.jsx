import React from 'react';
import '../../styles/components/Table.css';

/**
 * Table component for displaying data in rows and columns
 * 
 * @param {Object} props - Component props
 * @param {Array<Object>} props.columns - Array of column definitions
 * @param {Array<Object>} props.data - Array of data objects
 * @param {Function} props.keyExtractor - Function to extract keys from data items
 * @param {string} props.emptyMessage - Message to display when there's no data
 * @param {boolean} props.loading - Whether the table is loading
 * @param {string} props.loadingMessage - Message to display when loading
 * @param {string} props.className - Additional CSS class
 */
const Table = ({
  columns = [],
  data = [],
  keyExtractor = (item) => item.id,
  emptyMessage = 'No data available',
  loading = false,
  loadingMessage = 'Loading data...',
  className = '',
  ...rest
}) => {
  const tableClass = `table ${className}`;

  // Render loading state
  if (loading) {
    return (
      <div className="table-loading">
        {loadingMessage}
      </div>
    );
  }

  // Render empty state
  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className={tableClass} {...rest}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.className}
                style={column.width ? { width: column.width } : {}}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item)}-${column.key}`}
                  className={column.cellClassName}
                >
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;