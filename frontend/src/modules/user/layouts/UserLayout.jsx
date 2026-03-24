
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import CategoryNav from '../components/CategoryNav';
import OfferStrip from '../components/OfferStrip';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import BottomNavbar from '../components/BottomNavbar';
import { useNotifications } from '../../../hooks/useNotifications.jsx';

const UserLayout = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const headerRef = React.useRef(null);
    const [headerHeight, setHeaderHeight] = React.useState(0);
    
    // Initialize notification listeners and token registration
    useNotifications();

    React.useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        updateHeaderHeight();

        const resizeObserver = new ResizeObserver(() => {
            updateHeaderHeight();
        });

        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        window.addEventListener('resize', updateHeaderHeight);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateHeaderHeight);
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen font-sans bg-background overflow-x-hidden">
            <header ref={headerRef} className="fixed top-0 inset-x-0 shadow-md flex flex-col shrink-0 bg-white" style={{ zIndex: 100 }}>
                <div className="hidden md:block">
                    <TopBar />
                </div>
                <Navbar />
                <div className="hidden md:block">
                    <CategoryNav />
                </div>
                <OfferStrip />
            </header>
            <main className="flex-grow pb-16 md:pb-0" style={{ paddingTop: `${headerHeight}px` }}>
                <Outlet />
            </main>
            <Footer />
            <FloatingContact />
            <BottomNavbar />
        </div>
    );
};

export default UserLayout;
