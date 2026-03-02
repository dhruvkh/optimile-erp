import React from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { AlertCircle, FileText, CheckCircle, Clock, Truck, User } from 'lucide-react';

export const ComplianceOverview: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
             <div className="p-2 bg-red-100 rounded-full mr-3">
                 <AlertCircle className="h-6 w-6 text-red-600" />
             </div>
             <div>
                 <p className="text-sm font-medium text-red-800">Critical (Expired)</p>
                 <h3 className="text-2xl font-bold text-red-900 mt-1">8</h3>
                 <p className="text-xs text-red-700 mt-1">Immediate action required</p>
             </div>
         </div>
         <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start">
             <div className="p-2 bg-orange-100 rounded-full mr-3">
                 <Clock className="h-6 w-6 text-orange-600" />
             </div>
             <div>
                 <p className="text-sm font-medium text-orange-800">Warning (7 Days)</p>
                 <h3 className="text-2xl font-bold text-orange-900 mt-1">12</h3>
                 <p className="text-xs text-orange-700 mt-1">Renew within this week</p>
             </div>
         </div>
         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
             <div className="p-2 bg-yellow-100 rounded-full mr-3">
                 <FileText className="h-6 w-6 text-yellow-600" />
             </div>
             <div>
                 <p className="text-sm font-medium text-yellow-800">Attention (30 Days)</p>
                 <h3 className="text-2xl font-bold text-yellow-900 mt-1">25</h3>
                 <p className="text-xs text-yellow-700 mt-1">Plan for renewal</p>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Expired List */}
          <Card title="Critical - Expired Documents" className="border-red-100">
              <div className="space-y-3">
                  {[
                      { id: 'MH-01-1234', type: 'Insurance', entity: 'Vehicle', days: 5 },
                      { id: 'Ramesh K', type: 'License', entity: 'Driver', days: 2 },
                      { id: 'KA-03-9988', type: 'Fitness Cert', entity: 'Vehicle', days: 10 },
                      { id: 'DL-02-5566', type: 'Nat. Permit', entity: 'Vehicle', days: 1 },
                  ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg">
                          <div className="flex items-center">
                              <div className={`p-1.5 rounded mr-3 ${item.entity === 'Vehicle' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                  {item.entity === 'Vehicle' ? <Truck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-900">{item.id}</p>
                                  <p className="text-xs text-red-600 font-medium">{item.type} • Expired {item.days} days ago</p>
                              </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs border-red-200 text-red-700 hover:bg-red-50">
                              Renew
                          </Button>
                      </div>
                  ))}
              </div>
          </Card>

          {/* Upcoming Expiry List */}
          <Card title="Upcoming Expiry (Next 7 Days)">
              <div className="space-y-3">
                  {[
                      { id: 'MH-04-2233', type: 'PUC', entity: 'Vehicle', days: 2 },
                      { id: 'Suresh S', type: 'License', entity: 'Driver', days: 3 },
                      { id: 'TN-09-1122', type: 'Insurance', entity: 'Vehicle', days: 5 },
                      { id: 'WB-02-7788', type: 'Fitness', entity: 'Vehicle', days: 6 },
                  ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                              <div className={`p-1.5 rounded mr-3 ${item.entity === 'Vehicle' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                  {item.entity === 'Vehicle' ? <Truck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-gray-900">{item.id}</p>
                                  <p className="text-xs text-orange-600 font-medium">{item.type} • Expires in {item.days} days</p>
                              </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                              Remind
                          </Button>
                      </div>
                  ))}
              </div>
          </Card>
      </div>
    </div>
  );
};
