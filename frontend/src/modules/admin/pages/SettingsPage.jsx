import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/apiUrl';
import { useSetting, useUpdateSetting } from '../../../hooks/useSettings';
import { Save, Globe, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = API_BASE_URL;

const SettingsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
    const [checkoutFees, setCheckoutFees] = useState({
        paymentHandlingFee: 0,
        platformFee: 0,
        handlingFee: 0
    });
    const [invoiceSettings, setInvoiceSettings] = useState({
        sellerName: '',
        sellerAddress: '',
        companyOfficeAddress: '',
        gstNumber: '',
        panNumber: '',
        fssai: ''
    });

    const { data: checkoutFeeConfigSetting } = useSetting('checkout_fee_config');
    const { data: invoiceSettingsData } = useSetting('invoice_settings');
    const updateSettingMutation = useUpdateSetting();

    useEffect(() => {
        const tab = searchParams.get('tab');
        const allowedTabs = ['general', 'invoice'];
        const resolvedTab = allowedTabs.includes(tab) ? tab : 'general';

        if (tab !== resolvedTab) {
            setSearchParams({ tab: resolvedTab });
        }

        if (activeTab !== resolvedTab) {
            setActiveTab(resolvedTab);
        }
    }, [searchParams, activeTab, setSearchParams]);

    useEffect(() => {
        const value = checkoutFeeConfigSetting?.value;
        if (!value || typeof value !== 'object' || Array.isArray(value)) return;
        setCheckoutFees({
            paymentHandlingFee: Number(value.paymentHandlingFee || 0),
            platformFee: Number(value.platformFee || 0),
            handlingFee: Number(value.handlingFee || 0)
        });
    }, [checkoutFeeConfigSetting]);

    useEffect(() => {
        const value = invoiceSettingsData?.value;
        if (!value || typeof value !== 'object' || Array.isArray(value)) return;
        setInvoiceSettings({
            sellerName: value.sellerName || '',
            sellerAddress: value.sellerAddress || '',
            companyOfficeAddress: value.companyOfficeAddress || '',
            gstNumber: value.gstNumber || '',
            panNumber: value.panNumber || '',
            fssai: value.fssai || ''
        });
    }, [invoiceSettingsData]);

    const handleSave = async () => {
        try {
            if (activeTab === 'general') {
                await updateSettingMutation.mutateAsync({
                    key: 'checkout_fee_config',
                    value: checkoutFees
                });
                return;
            }
            toast.success('Settings preferences saved! (Simulated)');
        } catch (error) {
            // Error toast already handled in hook
        }
    };

    const handleFeeInputChange = (field, value) => {
        const numeric = Number(value);
        setCheckoutFees((prev) => ({
            ...prev,
            [field]: Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
        }));
    };

    const handleSaveInvoiceSettings = async () => {
        try {
            await updateSettingMutation.mutateAsync({
                key: 'invoice_settings',
                value: invoiceSettings
            });
        } catch (error) {
            // Error toast already handled in hook
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#1a1a1a] uppercase tracking-tight">Settings</h1>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage your dashboard preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateSettingMutation.isPending}
                    className="bg-black text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                >
                    <Save size={16} /> Save Changes
                </button>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[600px] relative overflow-hidden">
                <div className="flex items-center gap-6 border-b border-gray-100 mb-8 pb-4">
                    {[
                        { id: 'general', label: 'Store General', icon: Globe },
                        { id: 'invoice', label: 'Invoice Settings', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchParams({ tab: tab.id });
                            }}
                            className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all pb-4 -mb-4 border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Store General</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Platform Identity & Configuration</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Name</label>
                                <input type="text" defaultValue="Zovvy" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Email</label>
                                <input type="email" placeholder="Enter support email" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Currency</label>
                                <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none">
                                    <option>INR (?)</option>
                                    <option>USD ($)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Timezone</label>
                                <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none">
                                    <option>Asia/Kolkata (GMT +5:30)</option>
                                    <option>UTC</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-8">
                            <div className="mb-4">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Checkout Fees</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Used in checkout price details breakdown</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Handling Fee</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={checkoutFees.paymentHandlingFee}
                                        onChange={(e) => handleFeeInputChange('paymentHandlingFee', e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Platform Fee</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={checkoutFees.platformFee}
                                        onChange={(e) => handleFeeInputChange('platformFee', e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Handling Fee</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={checkoutFees.handlingFee}
                                        onChange={(e) => handleFeeInputChange('handlingFee', e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'invoice' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Invoice Configuration</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Setup your billing & seller details</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seller Name</label>
                                <input
                                    type="text"
                                    value={invoiceSettings.sellerName}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, sellerName: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    placeholder="Zovvy"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GSTIN Number</label>
                                <input
                                    type="text"
                                    value={invoiceSettings.gstNumber}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, gstNumber: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    placeholder="24AAAAA0000A1Z5"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PAN Number</label>
                                <input
                                    type="text"
                                    value={invoiceSettings.panNumber}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, panNumber: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    placeholder="ABCDE1234F"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">FSSAI Number</label>
                                <input
                                    type="text"
                                    value={invoiceSettings.fssai}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, fssai: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    placeholder="12345678901234"
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seller Address (for Label)</label>
                                <textarea
                                    rows="2"
                                    value={invoiceSettings.sellerAddress}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, sellerAddress: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                                    placeholder="123, Green Park, Delhi - 110016"
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Registered/Office Address (for Invoice)</label>
                                <textarea
                                    rows="2"
                                    value={invoiceSettings.companyOfficeAddress}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, companyOfficeAddress: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                                    placeholder="Zovvy PVT LTD, Corporate House, Mumbai - 400001"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleSaveInvoiceSettings}
                                disabled={updateSettingMutation.isPending}
                                className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-60 text-xs flex items-center gap-2"
                            >
                                {updateSettingMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Invoice Settings</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
