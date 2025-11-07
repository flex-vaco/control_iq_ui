import React from 'react';
import { Table } from 'react-bootstrap';

const ReportInterimModel = ({ testExecution, rcmDetails, testAttributes = [], evidenceDocuments = [] }) => {
  // Sample data for demonstration - user will add rows
  const interimTestInformation = [
    { heading: 'Has Status', details: 'Follow-Up' },
    { heading: 'Period Covered Start Date', details: '' },
    { heading: 'Period Covered End Date', details: '' },
    { heading: 'Sample Size', details: '' },
    { heading: '', details: '' },
    { heading: 'Tested By', details: '' },
    { heading: 'Testing Start Date', details: '' },
    { heading: 'Testing Due Date', details: '' },
    { heading: 'Testing Completion Date', details: '' },
  ];

  const populationSample = [
    { heading: 'Population Size', details: '' },
    { heading: 'Sample Size', details: '' },
    { heading: 'Sampling Method', details: '' },
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


  const footnotes = [
    { order: '', description: '' },
  ];

  const conclusions = [
    { heading: 'Tester Notes', details: '' },
    { heading: 'Exceptions Noted', details: '' },
    { heading: 'Exceptions Are Random', details: '' },
    { heading: 'Conclusion', details: 'N/A - refer to test of design.' },
    { heading: 'Sample Expansion Methodology', details: '' },
    { heading: '', details: '' },
    { heading: 'Control Effectiveness Conclusion For Phase', details: '' },
  ];

  const reviewPlan = [
    { order: '', assignee: '', dueDate: '', reviewType: '', reviewStatus: '' },
    { order: '', assignee: '', dueDate: '', reviewType: '', reviewStatus: '' },
  ];

  const reviewLogs = [
    { assignee: '', reviewType: '', dateReceived: '', dateCompleted: '', reviewNotes: '' }
  ];

  return (
    <div>
      {/* Interim I Testing Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Interim I Testing</h5>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {interimTestInformation.map((item, index) => (
              <tr key={index}>
                <td style={{ width: '30%', fontWeight: 'bold', textAlign: 'right' }}>{item.heading}</td>
                <td>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Population Sample Section */}
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
      {/* Footnotes Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Attribute Testing</h5>
        <h6 className="mb-3 text-center text-muted">Footnotes</h6>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Order</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {footnotes.map((footnote, index) => (
              <tr key={index}>
                <td>{footnote.order}</td>
                <td>{footnote.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {/* Conclusions Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Conclusions</h5>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {conclusions.map((item, index) => (
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

export default ReportInterimModel;

