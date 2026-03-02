import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <ShieldAlert className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500 mb-8">
          You do not have permission to view this page. If you believe this is an error, please contact your system administrator.
        </p>
        <Link to="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
