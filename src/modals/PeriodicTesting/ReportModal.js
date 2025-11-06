import React, { useState } from 'react';
import { Modal, Button, Tabs, Tab } from 'react-bootstrap';
import ReportOverview from '../../components/PeriodicTesting/ReportOverview';
import ReportInterimModel from '../../components/PeriodicTesting/ReportInterimModel';
import { exportReportToExcel } from '../../utils/reportExport';

const ReportModal = ({ show, onHide, testExecution, rcmDetails, testAttributes = [], evidenceDocuments = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Function to export data to Excel
  const handleExportToExcel = () => {
    exportReportToExcel(rcmDetails, testExecution, testAttributes, evidenceDocuments);
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
        {/* <Button variant="primary" onClick={handleExportToExcel}>
          Export to Excel
        </Button> */}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;

