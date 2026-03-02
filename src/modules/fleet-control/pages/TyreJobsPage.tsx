import React from 'react';
import { TyreAppProvider, useTyreApp } from '../tyre-intelligence/App';
import { JobCardBoard } from '../tyre-intelligence/components/JobCardBoard';

const TyreJobsContent: React.FC = () => {
  const { jobCards, currentUser } = useTyreApp();

  const handleIssueStock = (jobCardId: string) => {
    console.log('Issue stock for job:', jobCardId);
  };

  const handleCompleteJob = (jobCardId: string) => {
    console.log('Complete job:', jobCardId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <JobCardBoard
        jobCards={jobCards}
        onIssueStock={handleIssueStock}
        onCompleteJob={handleCompleteJob}
        userRole={currentUser.role}
      />
    </div>
  );
};

export const TyreJobsPage: React.FC = () => {
  return (
    <TyreAppProvider>
      <TyreJobsContent />
    </TyreAppProvider>
  );
};
