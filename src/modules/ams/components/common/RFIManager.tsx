import React, { useState, useEffect } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { useNavigate, useParams } from 'react-router-dom';
import { VendorInterest, RFIStatus } from '../../types';
import { FileText, Paperclip, CheckCircle } from 'lucide-react';

export function CreateRFI() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [deadline, setDeadline] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const d = new Date(deadline).getTime();
        
        // Mock file upload by just sending names
        const fileNames = files ? Array.from(files).map(f => f.name) : [];
        
        auctionEngine.createRFI(title, desc, d, 'CLIENT-USER', fileNames);
        navigate('/client');
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded border border-slate-200">
            <h1 className="text-2xl font-bold mb-6">Create RFI</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input className="w-full border p-2 rounded" value={title} onChange={e=>setTitle(e.target.value)} required placeholder="e.g. Pan-India FTL Logistics" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea className="w-full border p-2 rounded h-32" value={desc} onChange={e=>setDesc(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Deadline</label>
                    <input type="date" className="w-full border p-2 rounded" value={deadline} onChange={e=>setDeadline(e.target.value)} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Attach Documents (Shared with Vendors)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded p-6 text-center">
                        <input type="file" multiple onChange={e => setFiles(e.target.files)} className="hidden" id="rfi-files" />
                        <label htmlFor="rfi-files" className="cursor-pointer text-accent hover:underline flex items-center justify-center space-x-2">
                             <Paperclip size={18} />
                             <span>{files ? `${files.length} files selected` : "Click to attach files"}</span>
                        </label>
                    </div>
                    {files && (
                        <ul className="mt-2 text-sm text-slate-600">
                            {Array.from(files).map((f, i) => <li key={i}>• {f.name}</li>)}
                        </ul>
                    )}
                </div>

                <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>Once created, this RFI and its attachments will be visible to the Vendor Portal.</span>
                </div>

                <button className="bg-primary text-white px-6 py-2 rounded font-medium">Create RFI</button>
            </form>
        </div>
    );
}

export function RFIView() {
    const { id } = useParams<{id: string}>();
    const [interests, setInterests] = useState<VendorInterest[]>([]);
    const [rfi, setRfi] = useState(id ? auctionEngine.getRFI(id) : undefined);

    useEffect(() => {
        if(id) {
            setInterests(auctionEngine.getVendorInterests(id));
            const unsub = auctionEngine.subscribe(() => setInterests(auctionEngine.getVendorInterests(id)));
            return unsub;
        }
    }, [id]);

    if(!rfi) return <div>Not Found</div>;

    return (
        <div>
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">{rfi.title}</h1>
                        <p className="text-slate-500">{rfi.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${rfi.status === RFIStatus.OPEN ? 'bg-green-100 text-green-700' : 'bg-slate-200'}`}>
                        {rfi.status === RFIStatus.OPEN ? 'Visible to Vendors' : rfi.status}
                    </span>
                </div>
                
                {rfi.attachments && rfi.attachments.length > 0 && (
                    <div className="mt-4 flex items-center space-x-4">
                        <span className="text-sm font-bold text-slate-700">Attachments:</span>
                        {rfi.attachments.map((f, i) => (
                            <span key={i} className="bg-slate-100 px-2 py-1 rounded text-sm flex items-center text-slate-600 border border-slate-200">
                                <FileText size={14} className="mr-1" /> {f}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded border border-slate-200">
                <h3 className="font-bold mb-4">Vendor Responses</h3>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="py-2">Vendor ID</th>
                            <th className="py-2">Interest</th>
                            <th className="py-2">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interests.map((vi, i) => (
                            <tr key={i} className="border-b border-slate-50">
                                <td className="py-2 font-mono text-slate-600">{vi.vendorId}</td>
                                <td className="py-2 font-bold">{vi.interested ? 'YES' : 'NO'}</td>
                                <td className="py-2 text-slate-500">{vi.notes}</td>
                            </tr>
                        ))}
                        {interests.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">No responses yet</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
