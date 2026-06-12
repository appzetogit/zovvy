import { useEffect } from 'react';

export const useSEO = ({ title, description, keywords, ogImage, ogUrl }) => {
    useEffect(() => {
        // 1. Update Document Title
        if (title) {
            if (title.toLowerCase().includes('zovvy')) {
                document.title = title;
            } else {
                document.title = `${title} | Zovvy Foods`;
            }
        } else {
            document.title = 'Zovvy Foods | Premium Dry Fruits & Healthy Snacks';
        }

        // 2. Update Description Meta Tag
        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);
        }

        // 3. Update Keywords Meta Tag (if provided)
        if (keywords) {
            let metaKey = document.querySelector('meta[name="keywords"]');
            if (!metaKey) {
                metaKey = document.createElement('meta');
                metaKey.setAttribute('name', 'keywords');
                document.head.appendChild(metaKey);
            }
            metaKey.setAttribute('content', Array.isArray(keywords) ? keywords.join(', ') : keywords);
        }

        // 4. Update Open Graph Tags (Facebook, WhatsApp, Slack previews)
        const ogTags = {
            'og:title': title || 'Zovvy Foods',
            'og:description': description || 'Buy premium quality dry fruits, nuts, seeds and healthy snacks online from Zovvy Foods.',
            'og:image': ogImage || 'https://zovvyfoods.com/logo.png',
            'og:url': ogUrl || window.location.href,
            'og:type': 'website'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            if (content) {
                let metaTag = document.querySelector(`meta[property="${property}"]`);
                if (!metaTag) {
                    metaTag = document.createElement('meta');
                    metaTag.setAttribute('property', property);
                    document.head.appendChild(metaTag);
                }
                metaTag.setAttribute('content', content);
            }
        });

        // 5. Update Twitter Card Tags
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:title': title || 'Zovvy Foods',
            'twitter:description': description || 'Buy premium quality dry fruits, nuts, seeds and healthy snacks online from Zovvy Foods.',
            'twitter:image': ogImage || 'https://zovvyfoods.com/logo.png'
        };

        Object.entries(twitterTags).forEach(([name, content]) => {
            if (content) {
                let metaTag = document.querySelector(`meta[name="${name}"]`);
                if (!metaTag) {
                    metaTag = document.createElement('meta');
                    metaTag.setAttribute('name', name);
                    document.head.appendChild(metaTag);
                }
                metaTag.setAttribute('content', content);
            }
        });

        // 6. Update Canonical Link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', ogUrl || window.location.href);
    }, [title, description, keywords, ogImage, ogUrl]);
};
