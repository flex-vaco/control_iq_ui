import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab } from 'react-bootstrap';
import ReportOverview from '../../components/PeriodicTesting/ReportOverview';
import ReportInterimModel from '../../components/PeriodicTesting/ReportInterimModel';
import ReportTestOfDesign from '../../components/PeriodicTesting/ReportTestOfDesign';
import { exportReportToExcel } from '../../utils/reportExport';
import { getTestExecutionEvidenceDocuments } from '../../services/api';

const ReportModal = ({ show, onHide, testExecution, rcmDetails, testAttributes = [], evidenceDocuments = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [testExecutionEvidenceDocuments, setTestExecutionEvidenceDocuments] = useState([]);

  useEffect(() => {
    const fetchTestExecutionEvidenceDocuments = async () => {
      if (show && testExecution && testExecution.test_execution_id) {
        try {
          const response = await getTestExecutionEvidenceDocuments(testExecution.test_execution_id);
          setTestExecutionEvidenceDocuments(response.data.data || []);
        } catch (error) {
          console.error('Error fetching test execution evidence documents:', error);
          setTestExecutionEvidenceDocuments([]);
        }
      } else {
        setTestExecutionEvidenceDocuments([]);
      }
    };

    fetchTestExecutionEvidenceDocuments();
  }, [show, testExecution]);

  // Function to export data to Excel
  const handleExportToExcel = () => {
    exportReportToExcel(rcmDetails, testExecution, testAttributes, evidenceDocuments, testExecutionEvidenceDocuments);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      dialogClassName="modal-full-width"
    >
      <Modal.Header closeButton>
        <Modal.Title>Test Execution Report</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="overview" title="Overview">
            <ReportOverview
              testExecution={testExecution}
              rcmDetails={rcmDetails}
              testAttributes={testAttributes}
            />
          </Tab>
          <Tab eventKey="testofdesign" title="Test of Design">
            <ReportTestOfDesign
              testExecution={testExecution}
              rcmDetails={rcmDetails}
              testAttributes={testAttributes}  
              evidenceDocuments={evidenceDocuments}
              testExecutionEvidenceDocuments={testExecutionEvidenceDocuments}
            />
          </Tab>
          <Tab eventKey="interim" title="Interim">
            <ReportInterimModel
              testExecution={testExecution}
              rcmDetails={rcmDetails}
              testAttributes={testAttributes}
              evidenceDocuments={evidenceDocuments}
            />
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleExportToExcel}>
          Export to Excel
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;

