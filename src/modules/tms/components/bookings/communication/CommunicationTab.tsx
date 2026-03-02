import React from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Mail, MessageSquare, Phone, Send, Clock, Paperclip, MoreVertical, CheckCheck } from 'lucide-react';
// removed useToast

const MESSAGES = [
    {
        id: 1,
        type: 'email',
        direction: 'out',
        sender: 'System',
        recipient: 'client@acmecorp.com',
        subject: 'Booking Confirmation - BK-2024-1001',
        preview: 'Dear Customer, Your booking has been confirmed successfully...',
        time: 'Feb 5, 10:30 AM',
        status: 'Sent'
    },
    {
        id: 2,
        type: 'sms',
        direction: 'out',
        sender: 'System',
        recipient: '+91 98765 43210',
        subject: '',
        preview: 'Optimile: Your vehicle MH-01-1234 has been assigned. Driver: Ramesh.',
        time: 'Feb 5, 11:00 AM',
        status: 'Delivered'
    },
    {
        id: 3,
        type: 'whatsapp',
        direction: 'out',
        sender: 'Ops Manager',
        recipient: 'Driver (Ramesh)',
        subject: '',
        preview: 'Please ensure you reach the pickup point by 9 AM sharply.',
        time: 'Feb 5, 11:15 AM',
        status: 'Read'
    },
    {
        id: 4,
        type: 'email',
        direction: 'in',
        sender: 'client@acmecorp.com',
        recipient: 'Support',
        subject: 'Re: Booking Confirmation',
        preview: 'Thanks. Can we add one more package to this shipment?',
        time: 'Feb 5, 11:45 AM',
        status: 'Received'
    }
];

export const CommunicationTab: React.FC = () => {

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Message Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Communication Timeline" action={<Button size="sm" variant="outline" onClick={() => window.alert('Message filtering is pending backend integration.')}>Filter</Button>}>
                        <div className="relative pl-4 border-l border-gray-200 space-y-8 py-2">
                            {MESSAGES.map((msg) => (
                                <div key={msg.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[21px] top-1 p-1 rounded-full border-2 border-white shadow-sm ${msg.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                        msg.type === 'sms' ? 'bg-green-100 text-green-600' :
                                            'bg-green-500 text-white'
                                        }`}>
                                        {msg.type === 'email' ? <Mail className="h-3 w-3" /> :
                                            msg.type === 'sms' ? <MessageSquare className="h-3 w-3" /> :
                                                <Phone className="h-3 w-3" />}
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-gray-900 text-sm">
                                                    {msg.direction === 'out' ? `To: ${msg.recipient}` : `From: ${msg.sender}`}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase font-medium">
                                                    {msg.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Clock className="h-3 w-3 mr-1" /> {msg.time}
                                            </div>
                                        </div>

                                        {msg.subject && <p className="text-sm font-medium text-gray-800 mb-1">{msg.subject}</p>}
                                        <p className="text-sm text-gray-600 mb-2">{msg.preview}</p>

                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                            <div className="flex items-center text-xs text-gray-500">
                                                Status: <span className="font-medium ml-1 flex items-center">
                                                    {msg.status}
                                                    {msg.status === 'Read' && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                                                </span>
                                            </div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-xs text-primary hover:underline" onClick={() => window.alert('Drafting reply to this message thread.')}>Reply</button>
                                                <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => window.alert('Opening full message transcript and headers.')}>Details</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right: Compose & Tools */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Compose Box */}
                    <Card title="Send Message">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Template</label>
                                <select className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-1.5 border">
                                    <option>Manual Message</option>
                                    <option>Booking Confirmation</option>
                                    <option>Vehicle Assignment</option>
                                    <option>Delay Notification</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center text-sm">
                                        <input type="radio" name="channel" className="mr-2 text-primary focus:ring-primary" defaultChecked /> Email
                                    </label>
                                    <label className="flex items-center text-sm">
                                        <input type="radio" name="channel" className="mr-2 text-primary focus:ring-primary" /> SMS
                                    </label>
                                    <label className="flex items-center text-sm">
                                        <input type="radio" name="channel" className="mr-2 text-primary focus:ring-primary" /> WhatsApp
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border focus:ring-primary focus:border-primary"
                                    rows={5}
                                    placeholder="Type your message here..."
                                ></textarea>
                            </div>

                            <div className="flex justify-between items-center">
                                <button className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100" onClick={() => window.alert('Opening document picker.')}>
                                    <Paperclip className="h-4 w-4" />
                                </button>
                                <Button className="flex items-center" onClick={() => window.alert('Notification has been pushed.')}>
                                    <Send className="h-4 w-4 mr-2" /> Send
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Tracking Link Generator */}
                    <Card className="bg-blue-50 border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-2">Tracking Link</h3>
                        <p className="text-xs text-blue-700 mb-3">Share this link with customer for real-time tracking.</p>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                readOnly
                                value="optimile.com/track/BK-2024-1001"
                                className="flex-1 text-xs border-blue-200 rounded bg-white px-2 py-1.5 text-gray-600"
                            />
                            <Button size="sm" variant="secondary" className="text-xs" onClick={() => window.alert('Tracking URL copied to clipboard.')}>Copy</Button>
                        </div>
                    </Card>

                    {/* Auto Notifications Settings */}
                    <Card title="Auto-Notifications">
                        <div className="space-y-2">
                            {[
                                'Booking Confirmation',
                                'Vehicle Assignment',
                                'Pickup Reminder (24h)',
                                'Delivery Update',
                                'POD Available'
                            ].map((setting, i) => (
                                <label key={i} className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-600">{setting}</span>
                                    <input type="checkbox" className="rounded text-primary focus:ring-primary h-4 w-4" defaultChecked />
                                </label>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
