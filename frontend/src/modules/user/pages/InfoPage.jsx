import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWebsiteContent } from '../../../hooks/useContent';
import { useCreateContactSubmission } from '../../../hooks/useContactSubmissions';

const InfoPage = ({ type }) => {
    const { data: pageData, isLoading } = useWebsiteContent(type);
    const { data: footerData } = useWebsiteContent('footer-config');
    const isStaticContactPage = type === 'contact-us';
    const createContactSubmission = useCreateContactSubmission();
    const [contactForm, setContactForm] = React.useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });

    // Default Fallback Content Config
    const defaultContentMap = {
        'about-us': {
            title: "About FarmLyf",
            subtitle: "Delivering nature's finest to your doorstep",
            content: (
                <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                    <p>At FarmLyf, we believe in the power of pure, unadulterated nature. Our journey began with a simple mission: to bridge the gap between conscientious farmers and mindful consumers.</p>
                    <p>We source premium dry fruits, nuts, seeds, and organic staples directly from growers who practice sustainable farming. Every product is handpicked, quality-checked, and packed with care to ensure you get nothing but the best.</p>
                </div>
            )
        },
        'terms-conditions': {
            title: "Terms and Conditions",
            subtitle: "User Agreement",
            content: (
                <div className="space-y-8 text-gray-600 leading-relaxed">
                    <p>Welcome to FarmLyf. By accessing our website, you agree to be bound by these terms and conditions.</p>
                    <h3 className="text-xl font-bold text-footerBg mb-2">1. Use of Service</h3>
                    <p>You agree to use our service for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.</p>
                </div>
            )
        },
        'privacy-policy': {
            title: "Privacy Policy",
            subtitle: "Your trust is our priority",
            content: (
                <div className="space-y-8 text-gray-600 leading-relaxed">
                    <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>
                    <h3 className="text-xl font-bold text-footerBg mb-2">1. Information Collection</h3>
                    <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or sign up for our newsletter.</p>
                </div>
            )
        },

        'contact-us': {
            title: "Contact Us",
            subtitle: "We're here to help",
            content: (
                <div className="max-w-4xl mx-auto space-y-10">
                    <div className="grid md:grid-cols-2 gap-10 items-start">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-footerBg mb-3">Get in Touch</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Have a question about your order, want to partner with us, or simply want to say hello?
                                    We are always ready to help.
                                </p>
                            </div>
                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-footerBg text-sm">Visit Us</h4>
                                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                            Office No 501, Princess center, 5th Floor,<br />
                                            New Palasia, Indore, Madhya Pradesh 452001
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-footerBg text-sm">Email Us</h4>
                                        <div className="text-gray-500 text-sm mt-1 space-y-0.5">
                                            <p>hello@farmlyf.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-footerBg mb-4">Send a Message</h3>
                            <form className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm" placeholder="Name" />
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm" placeholder="Phone" />
                                </div>
                                <input type="email" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm" placeholder="Email Address" />
                                <textarea rows="3" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none text-sm" placeholder="Your Message"></textarea>
                                <button type="button" className="w-full bg-footerBg hover:bg-primary text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-md hover:shadow-lg">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )
        }
    };

    const config = defaultContentMap[type] || defaultContentMap['about-us'];
    const footerContact = footerData?.content?.contact || {};
    const contactAddress = footerContact.address || 'Office No 501, Princess center, 5th Floor, New Palasia, Indore, Madhya Pradesh 452001';
    const contactPhone = footerContact.phone || '+91 98765 43210';
    const contactEmail = footerContact.email || 'hello@farmlyf.com';

    const handleContactFieldChange = (field) => (event) => {
        const rawValue = event.target.value;

        if (field === 'phone') {
            const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 10);
            setContactForm((prev) => ({ ...prev, [field]: digitsOnly }));
            return;
        }

        setContactForm((prev) => ({ ...prev, [field]: rawValue }));
    };

    const handleContactSubmit = async (event) => {
        event.preventDefault();

        const trimmedName = contactForm.name.trim();
        const trimmedPhone = contactForm.phone.trim();
        const trimmedEmail = contactForm.email.trim();
        const trimmedMessage = contactForm.message.trim();

        if (!trimmedName || !trimmedPhone || !trimmedEmail || !trimmedMessage) {
            toast.error('Please fill in all contact form fields.');
            return;
        }

        if (!/^[A-Za-z][A-Za-z\s.'-]{1,119}$/.test(trimmedName)) {
            toast.error('Please enter a valid name.');
            return;
        }

        if (!/^\d{10}$/.test(trimmedPhone)) {
            toast.error('Please enter a valid 10-digit phone number.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        try {
            await createContactSubmission.mutateAsync({
                name: trimmedName,
                phone: trimmedPhone,
                email: trimmedEmail,
                message: trimmedMessage
            });

            setContactForm({
                name: '',
                phone: '',
                email: '',
                message: ''
            });
        } catch {
            // Toast is handled in the mutation hook.
        }
    };

    if (isLoading && !isStaticContactPage) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    const displayTitle = isStaticContactPage ? config.title : (pageData?.title || config.title);
    const displaySubtitle = isStaticContactPage ? config.subtitle : (pageData?.subtitle || config.subtitle);
    // content can be a string (HTML from Quill) or fallback JSX
    const displayContent = !isStaticContactPage && pageData?.content ? (
        <div
            className="quill-content w-full break-words text-gray-600"
            dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
    ) : config.content;

    return (
        <div className="min-h-screen bg-white py-4 md:py-8 px-4 lg:px-8 overflow-x-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mx-auto"
            >
                <div className="text-center mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl lg:text-5xl font-black text-footerBg uppercase tracking-tighter mb-2">{displayTitle}</h1>
                    {displaySubtitle && <p className="text-primary font-black tracking-[0.2em] uppercase text-[10px] md:text-xs">{displaySubtitle}</p>}
                </div>

                <div className="w-full">
                    {isStaticContactPage ? (
                        <div className="max-w-4xl mx-auto space-y-10">
                            <div className="grid md:grid-cols-2 gap-10 items-start">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-footerBg mb-3">Get in Touch</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            Have a question about your order, want to partner with us, or simply want to say hello?
                                            We are always ready to help.
                                        </p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-footerBg text-sm">Visit Us</h4>
                                                <p className="text-gray-500 text-sm mt-1 leading-relaxed whitespace-pre-line">
                                                    {contactAddress}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-footerBg text-sm">Call Us</h4>
                                                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                                    {contactPhone}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-footerBg text-sm">Email Us</h4>
                                                <div className="text-gray-500 text-sm mt-1 space-y-0.5">
                                                    <p>{contactEmail}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="text-lg font-bold text-footerBg mb-4">Send a Message</h3>
                                    <form className="space-y-3" onSubmit={handleContactSubmit}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                                                placeholder="Name"
                                                value={contactForm.name}
                                                onChange={handleContactFieldChange('name')}
                                                disabled={createContactSubmission.isPending}
                                                required
                                                maxLength={120}
                                                autoComplete="name"
                                                pattern="[A-Za-z][A-Za-z\s.'-]{1,119}"
                                                title="Enter a valid name using letters and spaces only."
                                            />
                                            <input
                                                type="tel"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                                                placeholder="Phone"
                                                value={contactForm.phone}
                                                onChange={handleContactFieldChange('phone')}
                                                disabled={createContactSubmission.isPending}
                                                required
                                                maxLength={10}
                                                autoComplete="tel"
                                                inputMode="tel"
                                                pattern="\d{10}"
                                                title="Enter a 10-digit phone number."
                                            />
                                        </div>
                                        <input
                                            type="email"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                                            placeholder="Email Address"
                                            value={contactForm.email}
                                            onChange={handleContactFieldChange('email')}
                                            disabled={createContactSubmission.isPending}
                                            required
                                            maxLength={160}
                                            autoComplete="email"
                                        />
                                        <textarea
                                            rows="3"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none text-sm"
                                            placeholder="Your Message"
                                            value={contactForm.message}
                                            onChange={handleContactFieldChange('message')}
                                            disabled={createContactSubmission.isPending}
                                            required
                                            minLength={5}
                                            maxLength={5000}
                                        />
                                        <button
                                            type="submit"
                                            className="w-full bg-footerBg hover:bg-primary text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                            disabled={createContactSubmission.isPending}
                                        >
                                            {createContactSubmission.isPending ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : displayContent}
                </div>
            </motion.div>

            <style>{`
                .quill-content {
                    font-size: 1rem;
                    line-height: 1.85;
                }
                .quill-content h1,
                .quill-content h2,
                .quill-content h3,
                .quill-content h4 {
                    color: #0f172a;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    margin: 0 0 1rem;
                }
                .quill-content h1 {
                    font-size: clamp(2.25rem, 5vw, 4rem);
                    line-height: 1.05;
                }
                .quill-content h2 {
                    font-size: clamp(1.75rem, 4vw, 3rem);
                    line-height: 1.12;
                }
                .quill-content h3 {
                    font-size: clamp(1.35rem, 3vw, 2.1rem);
                    line-height: 1.2;
                }
                .quill-content h4 {
                    font-size: clamp(1.1rem, 2vw, 1.5rem);
                    line-height: 1.3;
                }
                .quill-content p,
                .quill-content li,
                .quill-content blockquote {
                    color: #4b5563;
                    margin: 0 0 1rem;
                }
                .quill-content ul,
                .quill-content ol {
                    margin: 0 0 1.25rem;
                    padding-left: 1.75rem;
                }
                .quill-content ol {
                    list-style-type: decimal;
                    list-style-position: outside;
                }
                .quill-content ul {
                    list-style-type: disc;
                    list-style-position: outside;
                }
                .quill-content li {
                    display: list-item;
                    padding-left: 0.25rem;
                }
                .quill-content li + li {
                    margin-top: 0.5rem;
                }
                .quill-content li::marker {
                    color: #0f172a;
                    font-weight: 700;
                }
                .quill-content blockquote {
                    border-left: 4px solid #00A952;
                    padding-left: 1rem;
                    font-style: italic;
                }
                .quill-content a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                .quill-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 1rem;
                    margin: 1.5rem 0;
                }
                .quill-content iframe {
                    max-width: 100%;
                }
                .quill-content .ql-align-center {
                    text-align: center;
                }
                .quill-content .ql-align-right {
                    text-align: right;
                }
                .quill-content .ql-align-justify {
                    text-align: justify;
                }
                .quill-content .ql-indent-1 {
                    padding-left: 3em;
                }
                .quill-content .ql-indent-2 {
                    padding-left: 6em;
                }
                .quill-content .ql-indent-3 {
                    padding-left: 9em;
                }
                .quill-content .ql-indent-4 {
                    padding-left: 12em;
                }
                .quill-content ol .ql-indent-1,
                .quill-content ul .ql-indent-1 {
                    margin-left: 1.5rem;
                }
                .quill-content ol .ql-indent-2,
                .quill-content ul .ql-indent-2 {
                    margin-left: 3rem;
                }
                .quill-content ol .ql-indent-3,
                .quill-content ul .ql-indent-3 {
                    margin-left: 4.5rem;
                }
                .quill-content ol .ql-indent-4,
                .quill-content ul .ql-indent-4 {
                    margin-left: 6rem;
                }
                .quill-content p, .quill-content span, .quill-content div {
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-word;
                }
            `}</style>
        </div >
    );
};
export default InfoPage;
