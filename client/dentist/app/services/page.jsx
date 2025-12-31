"use client"
import { useEffect, useState } from 'react';
import { contentAPI } from '@/app/lib/api';
import Image from 'next/image';

const Services = () => {
    const [block, setBlock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await contentAPI.getAll('services');
                if (data.content_blocks && data.content_blocks.length > 0) {
                    setBlock(data.content_blocks[0]);
                } else {
                    setError("No services content found.");
                }
            } catch (err) {
                setError("Failed to load services content.");
            } finally {
                setLoading(false);
            }
        };
        fetchBlock();
    }, []);

    if (loading) {
        return <div className="text-center py-10">Loading services...</div>;
    }
    if (error) {
        return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    // Expecting block.content to be a JSON string: [{icon, title, description}, ...]
    let services = [];
    try {
        services = JSON.parse(block.content);
    } catch {
        services = [];
    }

    return (
        <div id='services' className='w-full px-[12%] py-10 scroll-mt-20'>
            <h4 className='text-center mb-1 text-xl font-Ovo text-orange-600'>
                {block.title || 'What we offer'}
            </h4>
            <h2 className='text-center sm:text-5xl font-Ovo'>Our Services</h2>
            <p className='text-center max-w-2xl mx-auto mt-5 mb-12 font-Ovo'>
                {block.media_url || 'Offering reliable, comfortable, and on-time transport services between Dubai and Abu Dhabi, both ways.'}
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-10'>
                {services.map(({ icon, title, description }, index) => (
                    <div
                        key={index}
                        className='border border-gray-400 dark:border-gray-600 rounded-2xl p-8 cursor-pointer transition-all duration-500 flex flex-col h-full w-full group hover:bg-lightHover hover:shadow-[4px_4px_0_#000] dark:bg-darkHover dark:hover:bg-darkHover dark:hover:shadow-[4px_4px_0_#fff]'
                    >
                        <div className='transition-transform duration-300 group-hover:scale-110'>
                            {icon && <Image src={icon} alt={title} className='w-10' />}
                        </div>
                        <h3 className='text-lg my-4 font-semibold dark:text-white'>{title}</h3>
                        <p className='text-sm text-gray-700 leading-5 dark:text-white/80'>{description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Services;