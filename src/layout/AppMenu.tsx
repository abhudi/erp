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
                    label: 'Companies',
                    icon: 'pi pi-building',
                    url: '/companies',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANIES_MENU, get(user, 'permissions', []));
                        if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    command: handleMenuClick
                },
                {
                    label: 'Permissions',
                    icon: 'pi pi-lock',
                    check: (user: any) => {
                        const checkComm = intersection([...PERMISSION_MENU, ...ROUTE_MENU], get(user, 'permissions', []));
                        if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Routes',
                            url: '/routes',
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
                            label: 'Permissions',
                            url: '/permissions',
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
                    label: 'Purchase',
                    icon: 'pi pi-shopping-bag',
                    check: (user: any) => {
                        const checkComm = intersection(SUPPLIER_MENU, get(user, 'permissions', []));
                        if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Vendors',
                            url: '/vendors',
                            check: (user: any) => {
                                const checkComm = intersection(SUPPLIER_CATELOGUE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Purchase Order',
                            url: '/purchase-order',
                            check: (user: any) => {
                                const checkComm = intersection(SUPPLIER_WAREHOUSE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Pallet Receiving',
                            url: '/pallet-receiving',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_WAREHOUSE_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Receive Purchase Order',
                            url: '/receive-purchase-order',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_WAREHOUSE_MENU, get(user, 'permissions', []));
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
                    label: 'Sales',
                    icon: 'pi pi-shopping-cart',
                    check: (user: any) => {
                        const checkComm = intersection(SALES_MENU, get(user, 'permissions', []));
                        if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Customers',
                            url: '/customers',
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
                            label: 'Estimates',
                            url: '/estimates',
                            check: (user: any) => {
                                const checkComm = intersection(SALES_ORDER_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Sales Orders',
                            url: '/sales-orders',
                            check: (user: any) => {
                                const checkComm = intersection(SALES_ORDER_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Packages',
                            url: '/packages',
                            check: (user: any) => {
                                const checkComm = intersection(SALES_ORDER_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Shipments',
                            url: '/shipments',
                            check: (user: any) => {
                                const checkComm = intersection(SALES_ORDER_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Object Inquiry',
                            url: '/object-inquiry',
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
                    label: 'Control Tower',
                    icon: 'pi pi-desktop',
                    check: (user: any) => {
                        const checkComm = intersection(COMPANY_MENU, get(user, 'permissions', []));
                        if (checkComm.length > 0) {
                            return true;
                        }
                        return false;
                    },
                    items: [
                        {
                            label: 'Users',
                            url: '/users',
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
                            label: 'Roles',
                            url: '/roles',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_ROLE_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Sub Locations',
                            url: '/sub-location',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_WAREHOUSE_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Location',
                            url: '/warehouses',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_WAREHOUSE_MENU, get(user, 'permissions', []));
                                if (!get(user, 'isSuperAdmin') && checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Master Codes',
                            url: '/master-codes',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_MASTER_CODE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Category',
                            url: '/categories',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_CATEGORY_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Category Mapping',
                            url: '/product-mapping',
                            check: (user: any) => {
                                const checkComm = intersection(COMPANY_MASTER_CODE_MENU, get(user, 'permissions', []));
                                if (get(user, 'isAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Racks',
                            url: '/racks',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_RACK_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        {
                            label: 'Bins',
                            url: '/bins',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_BIN_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        },
                        // {
                        //     label: 'SKU',
                        //     url: '/sku',
                        //     check: (user: any) => {
                        //         const checkComm = intersection(INVENTORY_BIN_MENU, get(user, 'permissions', []));
                        //         if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                        //             return true;
                        //         }
                        //         return false;
                        //     },
                        //     command: handleMenuClick
                        // },
                        {
                            label: 'SKU List',
                            url: '/sku-list',
                            check: (user: any) => {
                                const checkComm = intersection(INVENTORY_BIN_MENU, get(user, 'permissions', []));
                                if (get(user, 'isSuperAdmin') || checkComm.length > 0) {
                                    return true;
                                }
                                return false;
                            },
                            command: handleMenuClick
                        }
                    ]
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
                    <img src={getCompanyLogo(user?.company?.logo)} width="100px" height={'35px'} alt="logo" className={layoutState.isMobile ? 'mobile-sidebar-logo-img' : ''} style={{ marginTop: 15 }} />
                </Link>
            )}

            <div className="min-h-screen flex relative lg:static">
                <div id="app-sidebar-2" className="h-screen block flex-shrink-0 absolute lg:static left-0 top-0 z-1 select-none" style={{ width: !layoutState.isMobile && layoutState.staticMenuDesktopInactive ? 60 : 250 }}>
                    <div className="flex flex-column" style={{ height: '92%' }}>
                        <div className="overflow-y-auto">
                            <ul className="list-none p-3 m-0">
                                {get(model, '0.items', []).map((item, i) => {
                                    if (!item) return null;
                                    if (item?.seperator) {
                                        return (
                                            <li key={`AppMenuitem${i}${item.label}`} className="menu-separator"></li>
                                        );
                                    }

                                    return (
                                        <AppMenuitem
                                            item={item}
                                            root={true}
                                            index={i}
                                            key={`AppMenuitem${i}${item.label}`}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                        {!layoutState.isMobile && (
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
                        )}
                    </div>
                </div>
            </div>
        </MenuProvider>
    );
};

export default AppMenu;
