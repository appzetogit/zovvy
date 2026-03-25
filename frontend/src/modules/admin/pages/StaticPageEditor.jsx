import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Globe, Eye } from 'lucide-react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import BlotFormatter from 'quill-blot-formatter';
import toast, { Toaster } from 'react-hot-toast';
import { useWebsiteContent, useUpdateWebsiteContent } from '../../../hooks/useContent';
import { useUploadImage } from '../../../hooks/useProducts';
import { PAGES_CONFIG } from '../../../config/pagesConfig';

const SIZE_WHITELIST = ['12px', '14px', '16px', '18px', '24px', '32px', '42px'];

if (typeof window !== 'undefined' && Quill) {
    const SizeStyle = Quill.import('attributors/style/size');
    SizeStyle.whitelist = SIZE_WHITELIST;
    Quill.register(SizeStyle, true);
    Quill.register('modules/blotFormatter', BlotFormatter);
}

const StaticPageEditor = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const pageConfig = PAGES_CONFIG[pageId];

    const { data: pageData, isLoading: loading } = useWebsiteContent(pageId);
    const updateMutation = useUpdateWebsiteContent(pageId);
    const uploadMutation = useUploadImage();
    const quillRef = useRef(null);
    const isSavingRef = useRef(false);

    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (!pageConfig && !loading) {
            toast.error('Invalid Page ID');
            navigate('/admin/dashboard');
            return;
        }

        if (pageData) {
            let initialContent = pageData.content || '';

            // Migrate structured data if found
            if (pageId === 'about-us' && typeof initialContent === 'object' && initialContent !== null) {
                const d = initialContent;
                initialContent = `
                    <h1>${d.title || ''} <span style="color: #ed7d31;">${d.highlightedTitle || ''}</span></h1>
                    <p><strong>${d.sectionLabel || ''}</strong></p>
                    <img src="${d.image || ''}" alt="About Us" style="max-width: 100%; border-radius: 20px; margin: 20px 0;" />
                    <p>${d.description1 || ''}</p>
                    <p>${d.description2 || ''}</p>
                    <div style="display: flex; gap: 40px; margin-top: 30px; border-top: 1px solid #eee; pt: 20px;">
                        ${(d.stats || []).map(s => `
                            <div>
                                <h2 style="margin: 0;">${s.value}</h2>
                                <p style="font-size: 12px; color: #666; margin: 0;">${s.label}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            setContent(initialContent);
            setTitle(pageData.title || pageConfig?.title || '');
        } else if (pageConfig) {
            setTitle(pageConfig.title);
        }
    }, [pageId, navigate, pageConfig, pageData, loading]);

    const handleSave = async () => {
        if (isSavingRef.current || updateMutation.isPending) {
            toast('Save is already in progress...');
            return;
        }

        console.log('StaticPageEditor: Starting handleSave', { pageId, title, content });
        try {
            isSavingRef.current = true;
            const dataToSave = {
                title: title,
                content: content,
                slug: pageId
            };
            console.log('StaticPageEditor: Sending data to mutation', dataToSave);

            await toast.promise(
                updateMutation.mutateAsync(dataToSave),
                {
                    loading: 'Saving content...',
                    success: 'Content saved successfully!',
                    error: 'Failed to save content'
                },
                { id: `static-page-save-${pageId}` }
            );
            console.log('StaticPageEditor: Save successful');
        } catch (error) {
            console.error('StaticPageEditor: Save failed', error);
        } finally {
            isSavingRef.current = false;
        }
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to clear the content?')) {
            setContent('');
        }
    };

    const handleEditorImageUpload = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                const uploaded = await uploadMutation.mutateAsync(file);
                const editor = quillRef.current?.getEditor();
                if (!editor) return;

                const range = editor.getSelection(true);
                const insertAt = range?.index ?? editor.getLength();
                editor.insertEmbed(insertAt, 'image', uploaded.url, 'user');
                editor.setSelection(insertAt + 1, 0);
            } catch (error) {
                console.error('StaticPageEditor: image upload failed', error);
            }
        };

        input.click();
    };

    // Quill Modules Configuration
    const modules = {
        toolbar: {
            container: [
                [{ header: [1, 2, 3, 4, false] }],
                [{ size: SIZE_WHITELIST }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
                ['link', 'image', 'clean']
            ],
            handlers: {
                image: handleEditorImageUpload
            }
        },
        blotFormatter: {}
    };
    const formats = [
        'header',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'color',
        'background',
        'list',
        'bullet',
        'align',
        'indent',
        'link',
        'image'
    ];

    if (loading || !pageConfig) return <div>Loading...</div>;

    return (
        <div className="space-y-6 font-['Inter'] pb-32">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: { zIndex: 99999 }
                }}
                containerStyle={{ zIndex: 99999 }}
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)} // Go back
                        className="p-3 bg-white text-footerBg rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${pageConfig.category === 'Legal' ? 'bg-red-50 text-red-600 border-red-100' :
                                pageConfig.category === 'Info' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-green-50 text-green-600 border-green-100'
                                }`}>
                                {pageConfig.category}
                            </span>
                        </div>
                        <h1 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tight mt-1">{pageConfig.title}</h1>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">Manage page content</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <a
                        href={`/pages/${pageId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Eye size={16} />
                        View Page
                    </a>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RotateCcw size={16} />
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-gray-200 ${updateMutation.isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                    >
                        {updateMutation.isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Content
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-1">
                <div className="h-[600px] flex flex-col">
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        placeholder={`Start writing content for ${pageConfig.title}...`}
                        className="h-full"
                        modules={modules}
                        formats={formats}
                    />
                </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 text-xs flex items-center gap-2">
                    <Globe size={14} /> SEO Tip
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                    Make sure to use proper headings (H1, H2) within the content for better visibility on search engines.
                    This content will be directly rendered on the website at <b>/pages/{pageId}</b>.
                </p>
            </div>

            <style>{`
                .ql-toolbar {
                    border-top-left-radius: 1.5rem !important;
                    border-top-right-radius: 1.5rem !important;
                    border-color: #e5e7eb !important;
                    padding: 14px 16px !important;
                    background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
                }
                .ql-container {
                    border-bottom-left-radius: 1.5rem !important;
                    border-bottom-right-radius: 1.5rem !important;
                    border-color: #e5e7eb !important;
                    font-size: 1rem;
                }
                .ql-editor {
                    min-height: 520px;
                    padding: 24px;
                    color: #1f2937;
                    line-height: 1.8;
                }
                .ql-editor h1 {
                    font-size: 2.5rem;
                    line-height: 1.1;
                    font-weight: 800;
                }
                .ql-editor h2 {
                    font-size: 2rem;
                    line-height: 1.2;
                    font-weight: 800;
                }
                .ql-editor h3 {
                    font-size: 1.5rem;
                    line-height: 1.3;
                    font-weight: 700;
                }
                .ql-editor h4 {
                    font-size: 1.25rem;
                    line-height: 1.35;
                    font-weight: 700;
                }
                .ql-editor blockquote {
                    border-left: 4px solid #00A952;
                    margin: 1.25rem 0;
                    padding-left: 1rem;
                    color: #4b5563;
                }
                .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
            `}</style>
        </div>
    );
};

export default StaticPageEditor;
