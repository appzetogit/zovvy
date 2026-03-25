import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, X, FileText, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSetting } from '../../../hooks/useSettings';
import toast from 'react-hot-toast';
import logo from '../../../assets/zovvy-logo.png';

const OrderInvoice = ({ order, isOpen, onClose }) => {
    const componentRef = useRef(null);
    const printInvoice = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice_${order?.id || 'order'}`,
        removeAfterPrint: true,
        onPrintError: () => toast.error('Unable to print invoice. Please try again.')
    });
    const handlePrint = () => {
        if (!componentRef.current) {
            toast.error('Invoice is not ready to print yet. Please try again.');
            return;
        }
        printInvoice();
    };

    const { data: invoiceSettingsSetting } = useSetting('invoice_settings');
    const invoiceSettings = invoiceSettingsSetting?.value || {};
    const { data: checkoutFeeConfigSetting } = useSetting('checkout_fee_config');

    if (!order) return null;

    const computedSubtotal = order.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const subtotal = Number(order.subtotal ?? computedSubtotal);
    const discount = Number(order.discount || 0);
    const additionalFees = order.additionalFees || {};
    const hasSavedFeeBreakup =
        additionalFees.paymentHandlingFee !== undefined
        || additionalFees.platformFee !== undefined
        || additionalFees.handlingFee !== undefined;

    let paymentHandlingFee = Number(additionalFees.paymentHandlingFee || 0);
    let platformFee = Number(additionalFees.platformFee || 0);
    let handlingFee = Number(additionalFees.handlingFee || 0);
    const shipping = Number(order.deliveryCharges || 0);
    const total = Number(order.amount || (subtotal + paymentHandlingFee + platformFee + handlingFee + shipping - discount));

    if (!hasSavedFeeBreakup) {
        const inferredTotalFees = Math.max(0, total - subtotal - shipping + discount);
        const cfg = (checkoutFeeConfigSetting?.value && typeof checkoutFeeConfigSetting.value === 'object')
            ? checkoutFeeConfigSetting.value
            : {};
        const cfgPayment = Number(cfg.paymentHandlingFee || 0);
        const cfgPlatform = Number(cfg.platformFee || 0);
        const cfgHandling = Number(cfg.handlingFee || 0);
        const cfgSum = cfgPayment + cfgPlatform + cfgHandling;

        if (inferredTotalFees > 0 && cfgSum > 0) {
            if (Math.abs(cfgSum - inferredTotalFees) < 0.0001) {
                paymentHandlingFee = cfgPayment;
                platformFee = cfgPlatform;
                handlingFee = cfgHandling;
            } else {
                const ratio = inferredTotalFees / cfgSum;
                paymentHandlingFee = Math.round(cfgPayment * ratio);
                platformFee = Math.round(cfgPlatform * ratio);
                handlingFee = Math.max(0, inferredTotalFees - paymentHandlingFee - platformFee);
            }
        } else if (inferredTotalFees > 0) {
            handlingFee = inferredTotalFees;
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header Actions */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-footerBg tracking-tight uppercase">Tax Invoice</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Hash size={12} className="text-primary font-bold" />
                                        <p className="text-[11px] font-black text-footerBg tracking-widest uppercase">Order {order.id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 transition-colors border border-transparent rounded-xl text-slate-400 hover:text-footerBg hover:bg-gray-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
                            <div ref={componentRef} className="bg-white p-8 md:p-12 text-slate-800 font-sans" style={{ minWidth: '600px' }}>
                                {/* Branding & Official Header */}
                                <div className="flex justify-between items-start mb-12">
                                    <div className="space-y-4">
                                        <img src={logo} alt="Zovvy" className="h-12 w-auto object-contain" />
                                        <div className="space-y-1">
                                            <h1 className="text-2xl font-black text-footerBg uppercase tracking-tighter">{invoiceSettings.sellerName || "Zovvy"}</h1>
                                            <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                                                {invoiceSettings.companyOfficeAddress || "Premium Quality Farm Fresh Products"}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">GSTIN: {invoiceSettings.gstNumber || "19ABCDE1234F1Z5"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-block px-4 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-green-100">
                                            Official Invoice
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Order ID</p>
                                                <p className="text-sm font-black text-footerBg">{order.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Date</p>
                                                <p className="text-sm font-black text-footerBg">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Addresses Grid */}
                                <div className="grid grid-cols-2 gap-12 mb-12 pt-8 border-t border-gray-100">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Billing & Shipping To</h4>
                                        <p className="text-sm font-black text-footerBg mb-1">{order.shippingAddress.fullName}</p>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            {order.shippingAddress.address}<br />
                                            {order.shippingAddress.city}, {order.shippingAddress.pincode}<br />
                                            Phone: {order.shippingAddress.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Payment Info</h4>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-footerBg uppercase tracking-tighter">
                                                Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                            </p>
                                            <p className="text-xs font-bold text-green-600 uppercase tracking-tighter">
                                                Status: {order.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                                            </p>
                                            {order.razorpay_payment_id && (
                                                <p className="text-[10px] text-slate-400 font-mono">TXN: {order.razorpay_payment_id}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-12">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-slate-900">
                                                <th className="text-left py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                                                <th className="text-center py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                                <th className="text-right py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                                <th className="text-right py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {order.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="py-4">
                                                        <p className="text-sm font-black text-footerBg">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Product ID: {item.productId?.slice(-6).toUpperCase() || 'N/A'}</p>
                                                    </td>
                                                    <td className="py-4 text-center text-sm font-bold text-slate-600">{item.qty}</td>
                                                    <td className="py-4 text-right text-sm font-bold text-slate-600">₹{item.price}</td>
                                                    <td className="py-4 text-right text-sm font-black text-footerBg">₹{item.price * item.qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                                                {/* Totals Summary */}
                                <div className="flex justify-end pt-8 border-t border-gray-100">
                                    <div className="w-full max-w-[320px] space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                                            <span className="font-bold text-footerBg">₹{subtotal}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-green-500 uppercase tracking-widest">Discount (Coupon)</span>
                                            <span className="font-bold text-green-500 text-xs">-₹{discount}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Payment Handling Fee</span>
                                            <span className="font-bold text-footerBg">₹{paymentHandlingFee}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Platform Fee</span>
                                            <span className="font-bold text-footerBg">₹{platformFee}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Handling Fee</span>
                                            <span className="font-bold text-footerBg">₹{handlingFee}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Shipping Charges</span>
                                            <span className="font-bold text-footerBg">₹{shipping}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                                            <span className="text-sm font-black text-footerBg uppercase tracking-widest">Final Payable Amount</span>
                                            <span className="text-xl font-black text-footerBg">₹{total}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="mt-20 pt-8 border-t border-gray-100 text-center">
                                    <p className="text-xs font-bold text-footerBg uppercase tracking-widest mb-1 italic">Thank you for shopping with Zovvy!</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-lg mx-auto">
                                        This is a computer-generated document. No signature is required. For any queries regarding this invoice, please contact support@zovvy.com
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default OrderInvoice;

