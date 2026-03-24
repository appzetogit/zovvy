import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBlogs } from '../../../hooks/useContent';

const BlogsPage = () => {
    const { data: blogs = [], isLoading } = useBlogs();
    const publishedBlogs = blogs.filter((blog) => blog.status === 'Published');

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <section className="bg-gradient-to-br from-[#f8f5ee] via-white to-[#eef8ef] border-b border-gray-100">
                <div className="container mx-auto px-4 md:px-8 lg:px-16 py-5 md:py-7">
                    <Link
                        to="/"
                        className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Link>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">Zovvy Journal</p>
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 max-w-3xl leading-tight">
                        All blogs in one place.
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm md:text-base text-gray-600 leading-relaxed">
                        Explore every story, guide, and update from the Zovvy blog collection.
                    </p>
                </div>
            </section>

            <section className="container mx-auto px-4 md:px-8 lg:px-16 pt-5 pb-10 md:pt-6 md:pb-14">
                {publishedBlogs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">No blogs available yet</h2>
                        <p className="mt-3 text-gray-600">Published blog posts will show up here once they are added.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {publishedBlogs.map((blog, index) => (
                            <motion.div
                                key={blog._id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: index * 0.06 }}
                                className="group"
                            >
                                <Link
                                    to={`/blog/${blog.slug}`}
                                    className="block h-full overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="h-40 overflow-hidden md:h-56">
                                        <img
                                            src={blog.image}
                                            alt={blog.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>

                                    <div className="p-4 md:p-6">
                                        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-gray-500 md:mb-4">
                                            <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#8a5a00]">
                                                {blog.category}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {blog.date ? new Date(blog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                            </span>
                                        </div>

                                        <h2 className="text-lg md:text-xl font-black text-gray-900 leading-snug line-clamp-2">
                                            {blog.title}
                                        </h2>
                                        <p className="mt-2 text-sm leading-5 text-gray-600 line-clamp-2 md:mt-3 md:leading-6 md:line-clamp-3">
                                            {blog.excerpt}
                                        </p>

                                        <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-primary md:mt-5">
                                            Read article
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default BlogsPage;
