import React from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { FileText, CheckCircle, Upload, Download, Eye, AlertTriangle, FileCheck, Share2, Printer } from 'lucide-react';
// removed useToast

const DOCUMENTS = [
    { name: 'Purchase Order', status: 'uploaded', date: 'Feb 5, 2024', size: '1.2 MB' },
    { name: 'Invoice', status: 'uploaded', date: 'Feb 5, 2024', size: '0.8 MB' },
    { name: 'Packing List', status: 'uploaded', date: 'Feb 5, 2024', size: '2.4 MB' },
    { name: 'E-Way Bill', status: 'pending', date: '-', size: '-' },
    { name: 'Consignment Note', status: 'pending', date: '-', size: '-' },
    { name: 'Insurance Cert', status: 'expired', date: 'Jan 10, 2024', size: '1.1 MB' },
];

export const DocumentationTab: React.FC = () => {

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            <div className="flex flex-col md:flex-row gap-6">

                {/* Left: Document Checklist */}
                <div className="md:w-1/2 space-y-6">
                    <Card title="Booking Documents Checklist" action={<Button size="sm" variant="outline" onClick={() => window.alert('Connecting to storage to zip all files...')}><Download className="h-4 w-4 mr-2" /> Download All</Button>}>
                        <div className="space-y-4">
                            {DOCUMENTS.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${doc.status === 'uploaded' ? 'bg-green-100 text-green-600' :
                                            doc.status === 'expired' ? 'bg-red-100 text-red-600' :
                                                'bg-gray-100 text-gray-400'
                                            }`}>
                                            {doc.status === 'uploaded' ? <CheckCircle className="h-5 w-5" /> :
                                                doc.status === 'expired' ? <AlertTriangle className="h-5 w-5" /> :
                                                    <FileText className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                                            <p className="text-xs text-gray-500">
                                                {doc.status === 'uploaded' ? `Uploaded: ${doc.date} • ${doc.size}` :
                                                    doc.status === 'expired' ? `Expired on ${doc.date}` : 'Required'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {doc.status === 'uploaded' || doc.status === 'expired' ? (
                                            <>
                                                <button className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded" title="View" onClick={() => window.alert(`Loading preview for ${doc.name}`)}>
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded" title="Update" onClick={() => window.alert(`Select replacement file for ${doc.name}`)}>
                                                    <Upload className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.alert(`Select file for ${doc.name}`)}>
                                                <Upload className="h-3 w-3 mr-1.5" /> Upload
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* E-Way Bill Generator */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 mt-1">
                                <FileCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900">E-Way Bill Generation</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Booking details are ready. You can auto-generate the E-Way Bill directly from the GST portal.
                                </p>
                                <div className="mt-4 flex space-x-3">
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 border-transparent" onClick={() => window.alert('Successfully generated from GST portal.')}>
                                        Generate E-Way Bill
                                    </Button>
                                    <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => window.alert('Loading drafted data for E-Way bill.')}>
                                        Preview Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right: Preview & POD */}
                <div className="md:w-1/2 space-y-6">

                    {/* Document Preview Placeholder */}
                    <Card title="Document Viewer" className="min-h-[400px] flex flex-col">
                        <div className="flex-1 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-gray-400">
                            <FileText className="h-16 w-16 mb-4 opacity-50" />
                            <p className="font-medium">Select a document to preview</p>
                            <p className="text-sm mt-2">Supports PDF, JPG, PNG</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                            <div className="text-xs text-gray-500">
                                Purchase_Order_Acme_001.pdf (1.2 MB)
                            </div>
                            <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => window.alert('Connecting to printer')}><Printer className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => window.alert('Generating secure link')}><Share2 className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => window.alert('Starting file download')}><Download className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </Card>

                    {/* Digital POD Section */}
                    <Card title="Proof of Delivery (POD)">
                        <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-3">
                                <Upload className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">Upload POD</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                                Upload signed POD, delivery challan, or receiver's signature photo.
                            </p>
                            <div className="mt-4">
                                <Button size="sm" variant="outline" onClick={() => window.alert('Opening system file picker')}>Select Files</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
