
import { Ripple } from 'primereact/ripple';
import { Menu } from 'primereact/menu';
import React, { useEffect, useContext, useRef } from 'react';
import { MenuContext } from './context/menucontext';
import { useAppContext } from './AppWrapper';
import { StyleClass } from 'primereact/styleclass';
import { LayoutContext } from './context/layoutcontext';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppMenuItemProps } from '../types';

const AppMenuitem = (props: AppMenuItemProps) => {
    const { user } = useAppContext();
    const menu = useRef<any>(null);
    const { layoutConfig, layoutState, setLayoutState, onMenuToggle } = useContext(LayoutContext);
    const btnRef4 = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { activeMenu, setActiveMenu } = useContext(MenuContext);
    const item = props.item;
    const key = props.parentKey ? props.parentKey + '-' + props.index : String(props.index);
    const isActiveRoute = item!.to && location.pathname === item!.to;
    const active = activeMenu === key || (activeMenu && activeMenu.startsWith(key + '-'));
    const onRouteChange = (url: string) => {
        if (item!.to && item!.to === url) {
            setActiveMenu(key);
        }
    };

    useEffect(() => {
        onRouteChange(location.pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, searchParams]);

    const itemClick = (event: any, subItem?: any) => {
        //avoid processing disabled items
        if (item!.disabled) {
            event.preventDefault();
            return;
        }

        if (item?.command) {
            item?.command({ originalEvent: event, item: item });
        }

        if (subItem?.command) {
            subItem?.command({ originalEvent: event, item: subItem });
        }

        if (!subItem && layoutState.staticMenuDesktopInactive && menu && menu.current) {
            menu?.current?.toggle(event);
        }

        if (!subItem && item && item.items && item!.items?.length > 0) {
            event.preventDefault();
            return;
        }

        // toggle active state
        if (item!.items) setActiveMenu(active ? (props.parentKey as string) : key);
        else setActiveMenu(key);
    };

    if (item?.check && !item.check(user)) {
        return null;
    }

    return (
        <li>
            {item && item.items && item?.items?.length > 0 ? (
                <StyleClass nodeRef={btnRef4} selector="@next" enterClassName="hidden" enterActiveClassName="slidedown" leaveToClassName="hidden" leaveActiveClassName="slideup">
                    <div ref={btnRef4} className="p-ripple p-3 pl-1 flex align-items-center justify-content-between text-white cursor-pointer custom-menu-item" onClick={itemClick}>
                        <div>
                            {item && item.icon != null && <i className={item.icon + ' mr-2 text-lg'}></i>}
                            {(layoutState.isMobile || !layoutState.staticMenuDesktopInactive) && <span className="font-medium text-base">{item?.label}</span>}
                        </div>
                        {(layoutState.isMobile || !layoutState.staticMenuDesktopInactive) && item && item.items && item?.items?.length > 0 && <i className="pi pi-chevron-down"></i>}
                        {!layoutState.isMobile && layoutState.staticMenuDesktopInactive && item && item.items && item?.items?.length > 0 && <div className="pi pi-circle-fill" style={{ fontSize: 3 }}></div>}
                        <Ripple />
                    </div>
                </StyleClass>
            ) : item?.url ? (
                <Link to={item?.url} className="p-ripple p-3 pl-1 flex align-items-center justify-content-between text-white cursor-pointer custom-menu-item">
                    <div>
                        {item && item.icon != null && <i className={item.icon + ' mr-2 text-lg'}></i>}
                        {(layoutState.isMobile || !layoutState.staticMenuDesktopInactive) && <span className="font-medium text-base">{item?.label}</span>}
                    </div>
                    {(layoutState.isMobile || !layoutState.staticMenuDesktopInactive) && item && item.items && item?.items?.length > 0 && <i className="pi pi-chevron-down"></i>}
                    {!layoutState.isMobile && layoutState.staticMenuDesktopInactive && item && item.items && item?.items?.length > 0 && <div className="pi pi-circle-fill" style={{ fontSize: 3 }}></div>}
                    <Ripple />
                </Link>
            ) : (
                <></>
            )}

            {item && item.items && item.items.length > 0 && (
                <ul className="list-none p-0 m-0 hidden overflow-hidden">
                    {item.items.map((child, i) => {
                        if (child.check && !child.check(user)) {
                            return null; // Ensure a value is returned
                        }
                        if (!layoutState.isMobile && layoutState.staticMenuDesktopInactive) {
                            return (
                                <Menu
                                    model={item.items}
                                    popup
                                    ref={menu}
                                    key={`menu-${i}`} // Key added here
                                />
                            );
                        }
                        if (child.url) {
                            return (
                                <li key={`item-${i}`}>
                                    {' '}
                                    {/* Key added here */}
                                    <Link
                                        to={child.url}
                                        className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-white hover:surface-100 hover:text-700 custom-menu-item transition-duration-150 transition-colors w-full pl-30"
                                        onClick={(event) => itemClick(event, child)}
                                    >
                                        {child.icon != null && <i className={`${child.icon} mr-2`}></i>}
                                        {(layoutState.isMobile || !layoutState.staticMenuDesktopInactive) && <span className="font-medium text-base">{child.label}</span>}
                                        <Ripple />
                                    </Link>
                                </li>
                            );
                        }
                        return null; // Return null if no conditions are met
                    })}
                </ul>
            )}
        </li>
    );
};

export default AppMenuitem;
