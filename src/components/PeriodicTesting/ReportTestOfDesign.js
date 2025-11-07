import React from 'react';
import { Table } from 'react-bootstrap';

const ReportTestOfDesign = ({ testExecution, rcmDetails, testAttributes = [], evidenceDocuments = [], testExecutionEvidenceDocuments = [] }) => {
  // Sample data for demonstration - user will add rows
  const testOfDesignInformation = [
    { heading: 'Has Status', details: testExecution?.status || 'N/A' },
    { heading: 'Period Covered Start Date', details: testExecution?.start_date || 'N/A' },
    { heading: 'Period Covered End Date', details: testExecution?.end_date || 'N/A' },
    { heading: 'Sample Size', details: testExecution?.sample_size || 'N/A' },
    { heading: 'Tested By', details: testExecution?.user_name || 'N/A' },
    { heading: 'Testing Start Date', details: testExecution?.testing_start_date || 'N/A' },
    { heading: 'Testing Due Date', details: testExecution?.testing_due_date || 'N/A' },
    { heading: 'Testing Completion Date', details: testExecution?.testing_completion_date || 'N/A' },
  ];

  const populationSample = [
    { heading: 'Population Completeness Procedures', details: '' },
    { heading: 'Sample Selection Methodology', details: '' },
    { heading: 'Sample Special Considerations', details: '' },
  ];
 
  // Map test attributes to testStepsAttributes format
  const testStepsAttributes = testAttributes && testAttributes.length > 0
    ? testAttributes.map((attr, index) => ({
        Order: index + 1,
        testStep: attr.test_steps || '',
        testStepDescription: attr.test_steps || '',
        attributeName: attr.attribute_name || '',
        AttributeDescription: attr.attribute_description || '',
        test: ''
      }))
    : [
        { Order: '', testStep: '', testStepDescription: '', attributeName: '', AttributeDescription: '', test: '' }
      ];

    // Map evidence documents to PBC requests format
  const pbcRequests = evidenceDocuments && evidenceDocuments.length > 0
  ? evidenceDocuments.map((doc, index) => ({
      requestId: doc.document_id || doc.evidence_id || `REQ-${index + 1}`,
      requestType: rcmDetails?.control_id || testExecution?.control_id || '',
      requestDue: testExecution?.quarter && testExecution?.year 
        ? `Q${testExecution.quarter} ${testExecution.year}` 
        : '',
      requestStatus: doc.testing_status || testExecution?.status || 'Pending',
      requestDescription: doc.evidence_name || rcmDetails?.control_description || '',
      requestProvider: testExecution?.client_name || ''
    }))
  : [
      { 
        requestId: '', 
        requestType: '', 
        requestDue: '', 
        requestStatus: '', 
        requestDescription: '', 
        requestProvider: '' 
      }
    ];

  const exposedIssues = [
    { 
      issue: 'Issue 1', 
      summary: 'High', 
      status: 'Open', 
      actionPlanDescription: 'Team A', 
      actionPlanOwner: '2024-02-01'
    }
  ];

  const testOfDesignTools = [
    { tool: '', minimumLength: '', complexityEnabled: '' },
    { tool: '', minimumLength: '', complexityEnabled: '' }
  ];

  const conclusion = [
    { heading: 'Tester Notes', details: '' },
    { heading: 'Exceptions Noted', details: '' },
    { heading: 'Exceptions Are Random', details: '' },
    { heading: 'Conclusion', details: '' },
    { heading: 'Sample Expansion Methodology', details: '' },
    { heading: 'Control Effectiveness Conclusion For Phase', details: '' }
  ];

  const reviewPlan = [
    { order: '', assignee: '', dueDate: '', reviewType: '', reviewStatus: '' },
    { order: '', assignee: '', dueDate: '', reviewType: '', reviewStatus: '' }
  ];

  const reviewLogs = [
    { assignee: '', reviewType: '', dateReceived: '', dateCompleted: '', reviewNotes: '' }
  ];

  return (
    <div>
      {/* Control Information Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Test of Design Testing</h5>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {testOfDesignInformation.map((item, index) => (
              <tr key={index}>
                <td style={{ width: '30%', fontWeight: 'bold', textAlign: 'right' }}>{item.heading}</td>
                <td>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Mitigation Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Population and Sample</h5>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {populationSample.map((item, index) => (
              <tr key={index}>
                <td style={{ width: '30%', fontWeight: 'bold', textAlign: 'right' }}>{item.heading}</td>
                <td>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>




      {/* Test Steps and Attributes Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Test Steps and Attributes</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Order</th>
              <th>Test Step</th>
              <th>Test Step Description</th>
              <th>Attribute Name</th>
              <th>Attribute Description</th>
              <th>Test</th>
            </tr>
          </thead>
          <tbody>
            {testStepsAttributes.map((item, index) => (
              <tr key={index}>
                <td>{item.Order}</td>
                <td>{item.testStep}</td>
                <td>{item.testStepDescription}</td>
                <td>{item.attributeName}</td>
                <td>{item.AttributeDescription}</td>
                <td>{item.test}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    
    {/* PBC Request Section */}
    <div className="mb-4">
        <h5 className="mb-3 text-center">PBC Request</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Request Type</th>
              <th>Request Due</th>
              <th>Request Status</th>
              <th>Request Description</th>
              <th>Request Provider</th>
            </tr>
          </thead>
          <tbody>
            {pbcRequests.map((request, index) => (
              <tr key={index}>
                <td>{request.requestId}</td>
                <td>{request.requestType}</td>
                <td>{request.requestDue}</td>
                <td>{request.requestStatus}</td>
                <td>{request.requestDescription}</td>
                <td>{request.requestProvider}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {/* Attribute Testing Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Attribute Testing</h5>
        <h6 className="mb-3 text-center text-muted">Test of Design</h6>
        <div className="d-flex justify-content-center w-100">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Application</th>
                {testAttributes && testAttributes.length > 0 ? (
                  testAttributes.map((attr, index) => (
                    <th key={index}>{attr.attribute_description || attr.attribute_name || `Attribute ${index + 1}`}</th>
                  ))
                ) : (
                  <th>No Attributes</th>
                )}
              </tr>
            </thead>
            <tbody>
              {testExecutionEvidenceDocuments && testExecutionEvidenceDocuments.length > 0 ? (
                testExecutionEvidenceDocuments.map((record, rowIndex) => {
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
                        // Store the test data - prioritize explanation/reason
                        attributeDataMap[attrResult.attribute_name] = {
                          result: attrResult.result !== undefined ? (attrResult.result ? 'Pass' : 'Fail') : null,
                          explanation: attrResult.explanation || attrResult.reason || '',
                          details: attrResult.details || ''
                        };
                      }
                    });
                  }
                  
                  return (
                    <tr key={rowIndex}>
                      <td>{record.evidence_name || 'N/A'}</td>
                      {testAttributes && testAttributes.length > 0 ? (
                        testAttributes.map((attr, colIndex) => {
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
                          
                          return (
                            <td key={colIndex}>{displayValue}</td>
                          );
                        })
                      ) : (
                        <td>N/A</td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(testAttributes?.length || 0) + 1} className="text-center text-muted">
                    No test execution evidence documents found. Complete testing on evidence documents to see results here.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
      {/* Test of Design Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Test of Design</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Minimum Length</th>
              <th>Complexity Enabled</th>
            </tr>
          </thead>
          <tbody>
            {testOfDesignTools.map((tool, index) => (
              <tr key={index}>
                <td>{tool.tool}</td>
                <td>{tool.minimumLength}</td>
                <td>{tool.complexityEnabled}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {/* Footnotes Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Footnotes</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Order</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>The test of design was conducted using the following tools: Password Complexity and Minimum Password Length.</td>
            </tr>
          </tbody>
        </Table>
      </div>
      {/* Conclusion Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Conclusion</h5>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {conclusion.map((item, index) => (
              <tr key={index}>
                <td style={{ width: '30%', fontWeight: 'bold', textAlign: 'right' }}>{item.heading}</td>
                <td>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {/* Review Plan Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Review Plan</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Order</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Review Type</th>
              <th>Review Status</th>
            </tr>
          </thead>
          <tbody>
            {reviewPlan.map((review, index) => (
              <tr key={index}>
                <td>{review.order}</td>
                <td>{review.assignee}</td>
                <td>{review.dueDate}</td>
                <td>{review.reviewType}</td>
                <td>{review.reviewStatus}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {/* Review Log Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Review Log</h5>
        <h6 className="mb-3 text-center text-muted">Review</h6>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Assigned To</th>
              <th>Review Type</th>
              <th>Date Received</th>
              <th>Date Completed</th>
              <th>Review Notes</th>
            </tr>
          </thead>
          <tbody>
            {reviewLogs.map((review, index) => (
              <tr key={index}>
                <td>{review.assignee}</td>
                <td>{review.reviewType}</td>
                <td>{review.dateReceived}</td>
                <td>{review.dateCompleted}</td>
                <td>{review.reviewNotes}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
    
  );
};

export default ReportTestOfDesign;

