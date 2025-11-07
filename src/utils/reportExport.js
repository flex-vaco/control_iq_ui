import * as XLSX from 'xlsx';

/**
 * Prepares Overview data for Excel export with proper structure
 * @param {Object} rcmDetails - RCM details object
 * @param {Object} testExecution - Test execution object
 * @param {Array} testAttributes - Array of test attributes
 * @returns {Array} Two-dimensional array representing the Excel data
 */
export const prepareOverviewData = (rcmDetails, testExecution, testAttributes = []) => {
  const data = [];

  // Control Information Section
  data.push(['', '']); // Empty row for spacing
  data.push(['Control Information', '']); // Section header (will be merged/centered)
  data.push(['Control Details', '']); // Subsection header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Performed In Process', rcmDetails?.sub_process || 'N/A']);
  data.push(['Control ID', rcmDetails?.control_id || testExecution?.control_id || 'N/A']);
  data.push(['Control Summary', rcmDetails?.summary || 'N/A']);
  data.push(['Control Description', rcmDetails?.control_description || 'N/A']);
  data.push(['Control Attribute', 'N/A']);
  data.push(['Frequency', rcmDetails?.frequency || 'N/A']);
  data.push(['Population Size', '']);
  data.push(['', '']);
  data.push(['Control Classification', rcmDetails?.classification || 'N/A']);
  data.push(['Automated Or Manual', rcmDetails?.automated_manual || 'N/A']);
  data.push(['Preventive Or Detective', rcmDetails?.preventive_detective || 'N/A']);
  data.push(['Management Review Control', '']);
  data.push(['', '']);
  data.push(['Relies On IT System', '']);
  data.push(['Uses Document', '']);
  data.push(['', '']); // Empty row for spacing

  // Mitigation Section
  data.push(['Mitigation', '']); // Section header
  data.push(['Mitigates', '']); // Subsection header
  data.push(['Objective', 'Risk']); // Table header
  data.push(['', rcmDetails?.mitigates || 'N/A']);
  data.push(['', '']); // Empty row
  data.push(['Covers Financial Statement Element', '']);
  data.push(['Has Compensating Control', '']);
  data.push(['Compensates For Control', '']);
  data.push(['', '']);
  data.push(['Regulates IT System', '']);
  data.push(['Controls Document', '']);
  data.push(['', '']); // Empty row for spacing

  // Test Information Section
  data.push(['Test Information', '']); // Section header
  data.push(['Test of Control', '']); // Subsection header
  data.push(['Heading', 'Details']); // Table header
  data.push(['For Control', rcmDetails?.control_id || 'N/A']);
  data.push(['Budgeted Hours', '']);
  data.push(['Due Date', '']);
  data.push(['Completion Date', '']);
  data.push(['', '']);
  data.push(['Primary Audit Program', testExecution?.year || 'N/A']);
  data.push(['', '']);
  data.push(['Total Sample Size', '']);
  data.push(['Allowable Exceptions', '']);
  data.push(['Has Testing Nature', '']);
  data.push(['', '']); // Empty row for spacing

  // Conclusion Section
  data.push(['Conclusion', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Control Effectiveness Conclusion', '']);
  data.push(['Conclusion Notes', '']);
  data.push(['', '']); // Empty row for spacing

  // Contains Phase Section
  data.push(['Contains Phase', '']); // Section header
  data.push(['Test Phase', 'Conclusion']); // Table header
  data.push(['Test of Design', 'Effective']);
  data.push(['Interim I', '']);
  data.push(['Roll Forward', '']);
  data.push(['', '']); // Empty row for spacing

  // Time Tracking Section
  data.push(['Time Tracking', '']); // Section header
  data.push(['Time Entry', '']); // Subsection header
  data.push(['Hours', 'Date', 'Person', 'Phase']); // Table header
  data.push(['', '', '', '']);
  data.push(['', '', '', '']);
  data.push(['', '']); // Empty row for spacing

  // Test Steps and Attributes Section
  data.push(['Test Steps and Attributes', '']); // Section header
  data.push(['Order', 'Test Step', 'Test Step Description', 'Attribute Name', 'Attribute Description', 'Test']); // Table header
  if (testAttributes && testAttributes.length > 0) {
    testAttributes.forEach((attr, index) => {
      data.push([
        index + 1,
        attr.test_steps || '',
        attr.test_steps || '',
        attr.attribute_name || '',
        attr.attribute_description || '',
        ''
      ]);
    });
  } else {
    data.push(['', '', '', '', '', '']);
  }
  data.push(['', '']); // Empty row for spacing

  // Deficiencies & Remediation Section
  data.push(['Deficiencies & Remediation', '']); // Section header
  data.push(['Exposed Issues', '']); // Subsection header
  data.push(['Issue', 'Summary', 'Status', 'Action Plan Description', 'Action Plan Owner']); // Table header
  data.push(['Issue 1', 'High', 'Open', 'Team A', '2024-02-01']);

  return data;
};

/**
 * Prepares Interim data for Excel export with proper structure
 * @param {Object} rcmDetails - RCM details object
 * @param {Object} testExecution - Test execution object
 * @param {Array} testAttributes - Array of test attributes
 * @param {Array} evidenceDocuments - Array of evidence documents
 * @returns {Array} Two-dimensional array representing the Excel data
 */
export const prepareInterimData = (rcmDetails, testExecution, testAttributes = [], evidenceDocuments = []) => {
  const data = [];

  // Interim I Testing Section
  data.push(['', '']); // Empty row for spacing
  data.push(['Interim I Testing', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Has Status', 'Follow-Up']);
  data.push(['Period Covered Start Date', '']);
  data.push(['Period Covered End Date', '']);
  data.push(['Sample Size', '']);
  data.push(['', '']);
  data.push(['Tested By', '']);
  data.push(['Testing Start Date', '']);
  data.push(['Testing Due Date', '']);
  data.push(['Testing Completion Date', '']);
  data.push(['', '']); // Empty row for spacing

  // Population Sample Section
  data.push(['Population and Sample', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Population Size', '']);
  data.push(['Sample Size', '']);
  data.push(['Sampling Method', '']);
  data.push(['', '']); // Empty row for spacing

  // Test Steps and Attributes Section
  data.push(['Test Steps and Attributes', '']); // Section header
  data.push(['Order', 'Test Step', 'Test Step Description', 'Attribute Name', 'Attribute Description', 'Test']); // Table header
  if (testAttributes && testAttributes.length > 0) {
    testAttributes.forEach((attr, index) => {
      data.push([
        index + 1,
        attr.test_steps || '',
        attr.test_steps || '',
        attr.attribute_name || '',
        attr.attribute_description || '',
        ''
      ]);
    });
  } else {
    data.push(['', '', '', '', '', '']);
  }
  data.push(['', '']); // Empty row for spacing

  // PBC Request Section
  data.push(['PBC Request', '']); // Section header
  data.push(['Request ID', 'Request Type', 'Request Due', 'Request Status', 'Request Description', 'Request Provider']); // Table header
  if (evidenceDocuments && evidenceDocuments.length > 0) {
    evidenceDocuments.forEach((doc, index) => {
      data.push([
        doc.document_id || doc.evidence_id || `REQ-${index + 1}`,
        rcmDetails?.control_id || testExecution?.control_id || '',
        testExecution?.quarter && testExecution?.year 
          ? `Q${testExecution.quarter} ${testExecution.year}` 
          : '',
        doc.testing_status || testExecution?.status || 'Pending',
        doc.evidence_name || rcmDetails?.control_description || '',
        testExecution?.client_name || ''
      ]);
    });
  } else {
    data.push(['', '', '', '', '', '']);
  }
  data.push(['', '']); // Empty row for spacing

  // Footnotes Section
  data.push(['Attribute Testing', '']); // Section header
  data.push(['Footnotes', '']); // Subsection header
  data.push(['Order', 'Description']); // Table header
  data.push(['', '']);
  data.push(['', '']); // Empty row for spacing

  // Conclusions Section
  data.push(['Conclusions', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Tester Notes', '']);
  data.push(['Exceptions Noted', '']);
  data.push(['Exceptions Are Random', '']);
  data.push(['Conclusion', 'N/A - refer to test of design.']);
  data.push(['Sample Expansion Methodology', '']);
  data.push(['', '']);
  data.push(['Control Effectiveness Conclusion For Phase', '']);
  data.push(['', '']); // Empty row for spacing

  // Review Plan Section
  data.push(['Review Plan', '']); // Section header
  data.push(['Order', 'Assignee', 'Due Date', 'Review Type', 'Review Status']); // Table header
  data.push(['', '', '', '', '']);
  data.push(['', '', '', '', '']);
  data.push(['', '']); // Empty row for spacing

  // Review Log Section
  data.push(['Review Log', '']); // Section header
  data.push(['Review', '']); // Subsection header
  data.push(['Assigned To', 'Review Type', 'Date Received', 'Date Completed', 'Review Notes']); // Table header
  data.push(['', '', '', '', '']);

  return data;
};

/**
 * Applies formatting to worksheet (column widths, merged cells, etc.)
 * @param {Object} ws - XLSX worksheet object
 * @param {Array} data - Two-dimensional array representing the Excel data
 * @returns {Object} Formatted worksheet object
 */
export const applyWorksheetFormatting = (ws, data) => {
  // Set column widths - first column narrower for headings, others wider
  const maxCols = Math.max(...data.map(row => row ? row.length : 0));
  ws['!cols'] = Array(maxCols).fill(null).map((_, i) => ({
    wch: i === 0 ? 35 : (i === 1 && maxCols === 2 ? 50 : 20)
  }));

  // Find and format section headers (rows that have a value in first column and empty second column, or single value rows)
  let rowIndex = 0;
  data.forEach((row, idx) => {
    if (!row || row.length === 0) {
      rowIndex++;
      return;
    }

    // Check if this is a section header (has text in first column, might have empty second)
    const firstCell = row[0];
    
    if (firstCell && typeof firstCell === 'string' && firstCell.trim() !== '') {
      // Check if it's a section header (like "Control Information", "Mitigation", etc.)
      const isSectionHeader = [
        'Control Information', 'Mitigation', 'Test Information', 'Conclusion',
        'Contains Phase', 'Time Tracking', 'Test Steps and Attributes',
        'Deficiencies & Remediation', 'Interim I Testing', 'Population and Sample',
        'PBC Request', 'Attribute Testing', 'Conclusions', 'Review Plan', 'Review Log',
        'Test of Design Testing', 'Test of Design', 'Footnotes'
      ].includes(firstCell);

      // Check if it's a subsection header (like "Control Details", "Mitigates", etc.)
      const isSubsectionHeader = [
        'Control Details', 'Mitigates', 'Test of Control', 'Time Entry',
        'Exposed Issues', 'Footnotes', 'Review'
      ].includes(firstCell);

      if (isSectionHeader || isSubsectionHeader) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: firstCell };
        }
        // Merge cells for section headers if they span multiple columns
        if (maxCols > 1 && isSectionHeader) {
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({
            s: { r: rowIndex, c: 0 },
            e: { r: rowIndex, c: maxCols - 1 }
          });
        }
      }

      // Format table headers (rows that come after section/subsection headers)
      const nextRow = data[idx + 1];
      if (nextRow && Array.isArray(nextRow) && nextRow.length > 0) {
        const isTableHeader = nextRow.some(cell => 
          typeof cell === 'string' && 
          ['Heading', 'Details', 'Order', 'Test Step', 'Objective', 'Risk', 
           'Test Phase', 'Conclusion', 'Hours', 'Date', 'Person', 'Phase',
           'Issue', 'Summary', 'Status', 'Request ID', 'Description', 
           'Assignee', 'Due Date', 'Assigned To'].includes(cell)
        );
        
        if (isTableHeader) {
          nextRow.forEach((cell, colIdx) => {
            if (cell && typeof cell === 'string') {
              const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIdx });
              if (!ws[cellAddress]) {
                ws[cellAddress] = { t: 's', v: cell };
              }
            }
          });
        }
      }
    }
    
    rowIndex++;
  });

  return ws;
};

/**
 * Prepares Test of Design data for Excel export with proper structure
 * @param {Object} rcmDetails - RCM details object
 * @param {Object} testExecution - Test execution object
 * @param {Array} testAttributes - Array of test attributes
 * @param {Array} evidenceDocuments - Array of evidence documents
 * @param {Array} testExecutionEvidenceDocuments - Array of test execution evidence documents
 * @returns {Array} Two-dimensional array representing the Excel data
 */
export const prepareTestOfDesignData = (rcmDetails, testExecution, testAttributes = [], evidenceDocuments = [], testExecutionEvidenceDocuments = []) => {
  const data = [];

  // Test of Design Testing Section
  data.push(['', '']); // Empty row for spacing
  data.push(['Test of Design Testing', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Has Status', testExecution?.status || 'N/A']);
  data.push(['Period Covered Start Date', testExecution?.start_date || 'N/A']);
  data.push(['Period Covered End Date', testExecution?.end_date || 'N/A']);
  data.push(['Sample Size', testExecution?.sample_size || 'N/A']);
  data.push(['Tested By', testExecution?.user_name || 'N/A']);
  data.push(['Testing Start Date', testExecution?.testing_start_date || 'N/A']);
  data.push(['Testing Due Date', testExecution?.testing_due_date || 'N/A']);
  data.push(['Testing Completion Date', testExecution?.testing_completion_date || 'N/A']);
  data.push(['', '']); // Empty row for spacing

  // Population and Sample Section
  data.push(['Population and Sample', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Population Completeness Procedures', '']);
  data.push(['Sample Selection Methodology', '']);
  data.push(['Sample Special Considerations', '']);
  data.push(['', '']); // Empty row for spacing

  // Test Steps and Attributes Section
  data.push(['Test Steps and Attributes', '']); // Section header
  data.push(['Order', 'Test Step', 'Test Step Description', 'Attribute Name', 'Attribute Description', 'Test']); // Table header
  if (testAttributes && testAttributes.length > 0) {
    testAttributes.forEach((attr, index) => {
      data.push([
        index + 1,
        attr.test_steps || '',
        attr.test_steps || '',
        attr.attribute_name || '',
        attr.attribute_description || '',
        ''
      ]);
    });
  } else {
    data.push(['', '', '', '', '', '']);
  }
  data.push(['', '']); // Empty row for spacing

  // PBC Request Section
  data.push(['PBC Request', '']); // Section header
  data.push(['Request ID', 'Request Type', 'Request Due', 'Request Status', 'Request Description', 'Request Provider']); // Table header
  if (evidenceDocuments && evidenceDocuments.length > 0) {
    evidenceDocuments.forEach((doc, index) => {
      data.push([
        doc.document_id || doc.evidence_id || `REQ-${index + 1}`,
        rcmDetails?.control_id || testExecution?.control_id || '',
        testExecution?.quarter && testExecution?.year 
          ? `Q${testExecution.quarter} ${testExecution.year}` 
          : '',
        doc.testing_status || testExecution?.status || 'Pending',
        doc.evidence_name || rcmDetails?.control_description || '',
        testExecution?.client_name || ''
      ]);
    });
  } else {
    data.push(['', '', '', '', '', '']);
  }
  data.push(['', '']); // Empty row for spacing

  // Attribute Testing Section
  data.push(['Attribute Testing', '']); // Section header
  data.push(['Test of Design', '']); // Subsection header
  // Create header row with Application and attribute names
  const attributeHeaders = ['Application'];
  if (testAttributes && testAttributes.length > 0) {
    testAttributes.forEach((attr) => {
      attributeHeaders.push(attr.attribute_description || attr.attribute_name || '');
    });
  } else {
    attributeHeaders.push('No Attributes');
  }
  data.push(attributeHeaders);
  
  // Add rows for each evidence document
  if (testExecutionEvidenceDocuments && testExecutionEvidenceDocuments.length > 0) {
    testExecutionEvidenceDocuments.forEach((record) => {
      const row = [record.evidence_name || 'N/A'];
      
      // Get the parsed results
      let results = null;
      try {
        if (record.result_parsed) {
          results = record.result_parsed;
        } else if (record.result) {
          results = typeof record.result === 'string' ? JSON.parse(record.result) : record.result;
        }
      } catch (error) {
        console.error('Error parsing result for record:', record, error);
        results = null;
      }
      
      const attributesResults = results?.attributes_results || [];
      
      // Create a map of attribute_name to test data for quick lookup
      const attributeDataMap = {};
      if (attributesResults && Array.isArray(attributesResults)) {
        attributesResults.forEach(attrResult => {
          if (attrResult.attribute_name) {
            attributeDataMap[attrResult.attribute_name] = {
              result: attrResult.result !== undefined ? (attrResult.result ? 'Pass' : 'Fail') : null,
              explanation: attrResult.explanation || attrResult.reason || '',
              details: attrResult.details || ''
            };
          }
        });
      }
      
      // Add values for each attribute
      if (testAttributes && testAttributes.length > 0) {
        testAttributes.forEach((attr) => {
          const attrData = attributeDataMap[attr.attribute_name];
          let displayValue = 'N/A';
          if (attrData) {
            if (attrData.explanation) {
              displayValue = attrData.explanation;
            } else if (attrData.details) {
              displayValue = attrData.details;
            } else if (attrData.result !== null) {
              displayValue = attrData.result;
            }
          }
          row.push(displayValue);
        });
      } else {
        row.push('N/A');
      }
      
      data.push(row);
    });
  } else {
    const emptyRow = ['No test execution evidence documents found. Complete testing on evidence documents to see results here.'];
    // Fill remaining columns
    for (let i = 1; i < attributeHeaders.length; i++) {
      emptyRow.push('');
    }
    data.push(emptyRow);
  }
  data.push(['', '']); // Empty row for spacing

  // Test of Design Section
  data.push(['Test of Design', '']); // Section header
  data.push(['Tool', 'Minimum Length', 'Complexity Enabled']); // Table header
  data.push(['', '', '']);
  data.push(['', '', '']);
  data.push(['', '']); // Empty row for spacing

  // Footnotes Section
  data.push(['Footnotes', '']); // Section header
  data.push(['Order', 'Description']); // Table header
  data.push([1, 'The test of design was conducted using the following tools: Password Complexity and Minimum Password Length.']);
  data.push(['', '']); // Empty row for spacing

  // Conclusion Section
  data.push(['Conclusion', '']); // Section header
  data.push(['Heading', 'Details']); // Table header
  data.push(['Tester Notes', '']);
  data.push(['Exceptions Noted', '']);
  data.push(['Exceptions Are Random', '']);
  data.push(['Conclusion', '']);
  data.push(['Sample Expansion Methodology', '']);
  data.push(['Control Effectiveness Conclusion For Phase', '']);
  data.push(['', '']); // Empty row for spacing

  // Review Plan Section
  data.push(['Review Plan', '']); // Section header
  data.push(['Order', 'Assignee', 'Due Date', 'Review Type', 'Review Status']); // Table header
  data.push(['', '', '', '', '']);
  data.push(['', '', '', '', '']);
  data.push(['', '']); // Empty row for spacing

  // Review Log Section
  data.push(['Review Log', '']); // Section header
  data.push(['Review', '']); // Subsection header
  data.push(['Assigned To', 'Review Type', 'Date Received', 'Date Completed', 'Review Notes']); // Table header
  data.push(['', '', '', '', '']);

  return data;
};

/**
 * Exports report data to Excel file with Overview, Test of Design, and Interim sheets
 * @param {Object} rcmDetails - RCM details object
 * @param {Object} testExecution - Test execution object
 * @param {Array} testAttributes - Array of test attributes
 * @param {Array} evidenceDocuments - Array of evidence documents
 * @param {Array} testExecutionEvidenceDocuments - Array of test execution evidence documents
 */
export const exportReportToExcel = (rcmDetails, testExecution, testAttributes = [], evidenceDocuments = [], testExecutionEvidenceDocuments = []) => {
  // Prepare data for all sheets
  const overviewData = prepareOverviewData(rcmDetails, testExecution, testAttributes);
  const testOfDesignData = prepareTestOfDesignData(rcmDetails, testExecution, testAttributes, evidenceDocuments, testExecutionEvidenceDocuments);
  const interimData = prepareInterimData(rcmDetails, testExecution, testAttributes, evidenceDocuments);

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert data arrays to worksheets
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  const testOfDesignSheet = XLSX.utils.aoa_to_sheet(testOfDesignData);
  const interimSheet = XLSX.utils.aoa_to_sheet(interimData);

  // Apply formatting to all sheets
  applyWorksheetFormatting(overviewSheet, overviewData);
  applyWorksheetFormatting(testOfDesignSheet, testOfDesignData);
  applyWorksheetFormatting(interimSheet, interimData);

  // Add worksheets to workbook with sheet names
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
  XLSX.utils.book_append_sheet(workbook, testOfDesignSheet, 'Test of Design');
  XLSX.utils.book_append_sheet(workbook, interimSheet, 'Interim');

  // Generate filename with test execution info if available
  const controlId = rcmDetails?.control_id || testExecution?.control_id || 'Report';
  const year = testExecution?.year || '';
  const quarter = testExecution?.quarter || '';
  const filename = `Test_Execution_Report_${controlId}_${year}${quarter ? `_Q${quarter}` : ''}.xlsx`;

  // Write the file
  XLSX.writeFile(workbook, filename);
};

