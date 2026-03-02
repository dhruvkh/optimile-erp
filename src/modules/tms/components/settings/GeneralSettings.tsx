import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
            <h2 className="text-lg font-medium text-gray-900">General Preferences</h2>
            <p className="text-sm text-gray-500">Manage your organization's basic configuration.</p>
        </div>
        
        <Card>
            <div className="space-y-4">
                <Input label="Company Name" defaultValue="Optimile Logistics" />
                <Input label="Support Email" defaultValue="support@optimile.com" />
                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive daily summaries via email</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle" className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="toggle" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                </div>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-4">
                <Button>Save Changes</Button>
            </div>
        </Card>
        
         <Card title="Security">
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">Password</p>
                        <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                    </div>
                    <Button variant="outline" size="sm">Change Password</Button>
                 </div>
                 <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                 </div>
            </div>
         </Card>
    </div>
  );
};
