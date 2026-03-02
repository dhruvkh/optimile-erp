
import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, Truck, MapPin, Map, IndianRupee, LayoutGrid, Building2, Package, BoxSelect } from 'lucide-react';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { HubMaster } from '../components/settings/HubMaster';
import { ClientMaster } from '../components/settings/masters/ClientMaster';
import { VendorMaster } from '../components/settings/masters/VendorMaster';
import { RouteMaster } from '../components/settings/masters/RouteMaster';
import { LocationMaster } from '../components/settings/masters/LocationMaster';
import { RateMaster } from '../components/settings/masters/RateMaster';
import { CommodityMaster } from '../components/settings/masters/CommodityMaster';
import { VehicleTypeMaster } from '../components/settings/masters/VehicleTypeMaster';

type SettingsTab = 'general' | 'clients' | 'vendors' | 'routes' | 'locations' | 'rates' | 'hubs' | 'commodities' | 'vehicleTypes';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const NAV_ITEMS: { label: string; id: SettingsTab; icon: any }[] = [
        { label: 'General', id: 'general', icon: SettingsIcon },
        { label: 'Hub Master', id: 'hubs', icon: Building2 },
        { label: 'Customer Master', id: 'clients', icon: Users },
        { label: 'Vendor Master', id: 'vendors', icon: Truck },
        { label: 'Commodity Master', id: 'commodities', icon: Package },
        { label: 'Vehicle Type Master', id: 'vehicleTypes', icon: BoxSelect },
        { label: 'Route Master', id: 'routes', icon: Map },
        { label: 'Location Master', id: 'locations', icon: MapPin },
        { label: 'Rate Templates', id: 'rates', icon: IndianRupee },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettings />;
            case 'hubs': return <HubMaster />;
            case 'clients': return <ClientMaster />;
            case 'vendors': return <VendorMaster />;
            case 'commodities': return <CommodityMaster />;
            case 'vehicleTypes': return <VehicleTypeMaster />;
            case 'routes': return <RouteMaster />;
            case 'locations': return <LocationMaster />;
            case 'rates': return <RateMaster />;
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-0 shadow-sm">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <LayoutGrid className="h-4 w-4 mr-2" /> Settings Menu
                        </h3>
                    </div>
                    <nav className="p-2 space-y-1">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                                ${activeTab === item.id
                                        ? 'bg-primary text-white'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                            >
                                <item.icon className="mr-3 h-4 w-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

