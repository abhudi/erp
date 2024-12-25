import React, { useContext, useRef } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { get, intersection } from 'lodash';
import { useAppContext } from './AppWrapper';
import {
    CAMPANY_SETTING_MENU,
    COMPANIES_MENU,
    COMPANY_MASTER_CODE_MENU,
    COMPANY_MENU,
    COMPANY_ROLE_MENU,
    COMPANY_USER_MENU,
    INVENTORY_BIN_MENU,
    INVENTORY_CATEGORY_MENU,
    INVENTORY_MENU,
    INVENTORY_PRODUCT_MENU,
    INVENTORY_RACK_MENU,
    INVENTORY_WAREHOUSE_MENU,
    PERMISSION_MENU,
    ROUTE_MENU,
    SALES_CUSTOMER_MENU,
    SALES_MENU,
    SALES_ORDER_MENU,
    SUPPLIER_CATELOGUE_MENU,
    SUPPLIER_CREDIT_MENU,
    SUPPLIER_MENU,
    SUPPLIER_PAYMENT_MENU,
    SUPPLIER_SCRORECARD_MENU,
    SUPPLIER_WAREHOUSE_MENU
} from '../config/permissions';
import { classNames } from 'primereact/utils';
import { Link, useNavigate } from 'react-router-dom';
import { AppMenuItem } from '../types';
import { getCompanyLogo } from '../utils/uitl';

const AppMenu = () => {
    const navigate = useNavigate();
    const { user } = useAppContext();
    const { layoutConfig, layoutState, onMenuToggle } = useContext(LayoutContext);

    const handleMenuClick = ({ originalEvent, item }: any) => {
        if (originalEvent) {
            originalEvent.preventDefault();
        }
        navigate(item.url);
    };

    const model: AppMenuItem[] = [
        {
            label: '',
            icon: 'pi pi-fw pi-bookmark',
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-th-large',
                    url: '/',
                    command: handleMenuClick
                },
                {
                    label: 'Guidlines & Glossary',
                    icon: 'pi pi-sliders-v',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANIES_MENU, get(user, 'permissions', []));
                        if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'FAQs',
                            url: '/faq',
                            check: (user: any) => {
                                const checkComm = intersection(ROUTE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Supply Glossary',
                            url: '/supply-glossary',
                            check: (user: any) => {
                                const checkComm = intersection(PERMISSION_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'Suppliers',
                    icon: 'pi pi-truck',
                    check: (user: any) => {
                        const checkComm = intersection([...PERMISSION_MENU, ...ROUTE_MENU], get(user, 'permissions', []));
                        if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Manage Suppliers',
                            url: '/manage-supplier',
                            check: (user: any) => {
                                const checkComm = intersection(ROUTE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Create Supplier',
                            url: '/create-supplier',
                            check: (user: any) => {
                                const checkComm = intersection(PERMISSION_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'Supplier Score',
                    icon: 'pi pi-wifi',
                    check: (user: any) => {
                        const checkComm = intersection(SUPPLIER_MENU, get(user, 'permissions', []));
                        if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Manage Supplier Score',
                            url: '/manage-supplier-score',
                            check: (user: any) => {
                                const checkComm = intersection(SUPPLIER_CATELOGUE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'Rules Manager',
                    icon: 'pi pi-sitemap',
                    check: (user: any) => {
                        const checkComm = intersection(SALES_MENU, get(user, 'permissions', []));
                        if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Manage Rule',
                            url: '/manage-rules',
                            check: (user: any) => {
                                const checkComm = intersection(SALES_CUSTOMER_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Manage CAPA Rule',
                            url: '/manage-capa-rules',
                            check: (user: any) => {
                                const checkComm = intersection(SALES_ORDER_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'Users Manager',
                    icon: 'pi pi-users',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANY_MENU, get(user, 'permissions', []));
                        if (checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Manage Users',
                            url: '/manage-users',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_USER_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Create New Rules',
                            url: '/create-new-rules',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_ROLE_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: "Api's Management",
                    icon: 'pi pi-paperclip',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANY_MENU, get(user, 'permissions', []));
                        if (checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: "Manage Api's",
                            url: '/manage-users',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_USER_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'Request Management',
                    icon: 'pi pi-bolt',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANY_MENU, get(user, 'permissions', []));
                        if (checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Manage Request',
                            url: '/manage-requests',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_USER_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'Supplier Feedback',
                    icon: 'pi pi-gift',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANY_MENU, get(user, 'permissions', []));
                        if (checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Manage Feedback',
                            url: '/manage-feedback',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_USER_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Create New Rules',
                            url: '/add-feedback',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_USER_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
                },
                {
                    label: 'My Permissions',
                    icon: 'pi pi-lock-open',
                    url: '/permissions',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANY_MENU, get(user, 'permissions', []));
                        if (checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    command: handleMenuClick
                }
            ]
        }
    ];

    const menuToggleClass = classNames('menu-toggle-icon', {
        'toogle-overlay': layoutConfig.menuMode === 'overlay',
        'toogle-static': layoutConfig.menuMode === 'static',
        'toogle-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'toogle-overlay-active': layoutState.overlayMenuActive,
        'toogle-mobile-active': layoutState.staticMenuMobileActive
    });

    const iconClass = classNames('pi', {
        'pi-angle-left text-lg text-white p-3': !layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'pi-angle-right text-lg text-white p-3': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static'
    });
    return (
        <MenuProvider>
            {layoutState.isMobile && (
                <Link to="/" className="layout-topbar-logo">
                    {/* <img src={getCompanyLogo(user?.company?.logo)} width="100px" height={'35px'} alt="logo" className={layoutState.isMobile ? 'mobile-sidebar-logo-img' : ''} style={{ marginTop: 15 }} /> */}
                </Link>
            )}

            <div className="min-h-screen flex relative lg:static">
                <div id="app-sidebar-2" className="h-screen block flex-shrink-0 absolute lg:static left-0 top-0 z-1 select-none" style={{ width: !layoutState.isMobile && layoutState.staticMenuDesktopInactive ? 60 : 250 }}>
                    <div className="flex flex-column" style={{ height: '92%' }}>
                        <div
                            className="overflow-y-auto "
                            style={{
                                scrollbarWidth: 'thin' /* Firefox */,
                                scrollbarColor: '#888 #f1f1f1' /* Firefox: thumb and track colors */
                            }}
                        >
                            <ul className="list-none p-3 m-0">
                                {get(model, '0.items', []).map((item, i) => {
                                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={`AppMenuitem${i}${item.label}`} /> : <li key={`AppMenuitem${i}${item.label}`} className="menu-separator"></li>;
                                })}
                            </ul>
                        </div>
                        {/* {!layoutState.isMobile && (
                            <div className="mt-auto">
                                <a
                                    v-ripple="true"
                                    onClick={onMenuToggle}
                                    className="flex mb-1 justify-content-center align-items-center cursor-pointer p-2 text-700 transition-duration-150 transition-colors p-ripple bg-secondary"
                                    style={{ width: layoutState.staticMenuDesktopInactive ? 60 : 250 }}
                                >
                                    <i className={iconClass}></i>
                                </a>
                            </div>
                        )} */}
                    </div>
                </div>
            </div>
        </MenuProvider>
    );
};

export default AppMenu;
