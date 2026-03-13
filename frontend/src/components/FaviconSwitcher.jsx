import { useEffect } from 'react';
import sharedFavicon from '../assets/favicon-white-circle.png';

const FaviconSwitcher = () => {
    useEffect(() => {
        const faviconLink = document.querySelector("link[rel='icon']");
        if (!faviconLink) return;

        faviconLink.href = sharedFavicon;
    }, []);

    return null;
};

export default FaviconSwitcher;
