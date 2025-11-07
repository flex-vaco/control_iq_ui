import React from 'react';
import { Table } from 'react-bootstrap';

const ReportOverview = ({ testExecution, rcmDetails, testAttributes = [] }) => {
  // Sample data for demonstration - user will add rows
  const controlInformation = [
    { heading: 'Performed In Process', details: rcmDetails?.sub_process || 'N/A' },
    { heading: 'Control ID', details: rcmDetails?.control_id || testExecution?.control_id || 'N/A' },
    { heading: 'Control Summary', details: rcmDetails?.summary || 'N/A' },
    { heading: 'Control Description', details: rcmDetails?.control_description || 'N/A' },
    { heading: 'Control Attribute', details: 'N/A' },
    { heading: 'Frequency', details: rcmDetails?.frequency || 'N/A' },
    { heading: 'Population Size', details: '' },
    { heading: '', details: '' },
    { heading: 'Control Classification', details: rcmDetails?.classification || 'N/A' },
    { heading: 'Automated Or Manual', details: rcmDetails?.automated_manual || 'N/A' },
    { heading: 'Preventive Or Detective', details: rcmDetails?.preventive_detective || 'N/A' },
    { heading: 'Management Review Control', details: '' },
    { heading: '', details: '' },
    { heading: 'Relies On IT System', details: '' },
    { heading: 'Uses Document', details: '' }
  ];

  const mitigationTable = [
    { objective: '', risk: rcmDetails?.mitigates || 'N/A' }
  ];

  const mitigationDetails = [
    { heading: 'Covers Financial Statement Element', details: '' },
    { heading: 'Has Compensating Control', details: '' },
    { heading: 'Compensates For Control', details: '' },
    { heading: '', details: '' },
    { heading: 'Regulates IT System', details: '' },
    { heading: 'Controls Document', details: '' },
  ];

  const testInformation = [
    { heading: 'For Control', details: rcmDetails?.control_id || 'N/A' },
    { heading: 'Budgeted Hours', details: '' },
    { heading: 'Due Date', details: '' },
    { heading: 'Completion Date', details: '' },
    { heading: '', details: '' },
    { heading: 'Primary Audit Program', details: testExecution?.year || 'N/A' },
    { heading: '', details: '' },
    { heading: 'Total Sample Size', details: '' },
    { heading: 'Allowable Exceptions', details: '' },
    { heading: 'Has Testing Nature', details: '' },
  ];

  const conclusion = [
    { heading: 'Control Effectiveness Conclusion', details: '' },
    { heading: 'Conclusion Notes', details: '' }
  ];

  const containsPhase = [
    { testPhase: 'Test of Design', conclusion: 'Effective' },
    { testPhase: 'Interim I', conclusion: '' },
    { testPhase: 'Roll Forward', conclusion: '' }
  ];

  const timeEntries = [
    { hours: '', date: '', person: '', phase: '' },
    { hours: '', date: '', person: '', phase: '' }
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

  const exposedIssues = [
    { 
      issue: 'Issue 1', 
      summary: 'High', 
      status: 'Open', 
      actionPlanDescription: 'Team A', 
      actionPlanOwner: '2024-02-01'
    }
  ];

  return (
    <div>
      {/* Control Information Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Control Information</h5>
        <h6 className="mb-3 text-center text-muted">Control Details</h6>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {controlInformation.map((item, index) => (
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
        <h5 className="mb-3 text-center">Mitigation</h5>
        <h6 className="mb-3 text-center text-muted">Mitigates</h6>
        <div className="d-flex justify-content-center w-100">
          <Table striped bordered hover className="table-40-width">
            <thead>
              <tr>
                <th>Objective</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {mitigationTable.map((item, index) => (
                <tr key={index}>
                  <td>{item.objective}</td>
                  <td>{item.risk}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
          <Table striped hover responsive className="mt-3 table-borderless">
            <tbody>
              {mitigationDetails.map((item, index) => (
                <tr key={index}>
                  <td style={{ width: '30%', fontWeight: 'bold', textAlign: 'right' }}>{item.heading}</td>
                  <td>{item.details}</td>
                </tr>
              ))}
            </tbody>
          </Table>
      </div>

      {/* Test Information Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Test Information</h5>
        <h6 className="mb-3 text-center text-muted">Test of Control</h6>
        <Table striped hover responsive className="table-borderless">
          <tbody>
            {testInformation.map((item, index) => (
              <tr key={index}>
                <td style={{ width: '30%', fontWeight: 'bold', textAlign: 'right' }}>{item.heading}</td>
                <td>{item.details}</td>
              </tr>
            ))}
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

      {/* Contains Phase Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Contains Phase</h5>
        <div className="d-flex justify-content-center w-100">
          <Table striped bordered hover className="table-40-width">
            <thead>
              <tr>
                <th>Test Phase</th>
                <th>Conclusion</th>
              </tr>
            </thead>
            <tbody>
              {containsPhase.map((item, index) => (
                <tr key={index}>
                  <td>{item.testPhase}</td>
                  <td>{item.conclusion}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Time Tracking Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Time Tracking</h5>
        <h6 className="mb-3 text-center text-muted">Time Entry</h6>
        <div className="d-flex justify-content-center w-100">
          <Table striped bordered hover className="table-60-width">
            <thead>
              <tr>
                <th>Hours</th>
                <th>Date</th>
                <th>Person</th>
                <th>Phase</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.hours}</td>
                  <td>{entry.date}</td>
                  <td>{entry.person}</td>
                  <td>{entry.phase}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        
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

      {/* Deficiencies & Remediation Section */}
      <div className="mb-4">
        <h5 className="mb-3 text-center">Deficiencies & Remediation</h5>
        <h6 className="mb-3 text-center text-muted">Exposed Issues</h6>
        <div className="d-flex justify-content-center w-100">
          <Table striped bordered hover className="table-60-width">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Summary</th>
                <th>Status</th>
                <th>Action Plan Description</th>
                <th>Action Plan Owner</th>
              </tr>
            </thead>
            <tbody>
              {exposedIssues.map((issue, index) => (
                <tr key={index}>
                  <td>{issue.issue}</td>
                  <td>{issue.summary}</td>
                  <td>{issue.status}</td>
                  <td>{issue.actionPlanDescription}</td>
                  <td>{issue.actionPlanOwner}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ReportOverview;

