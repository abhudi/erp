
import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { classNames } from 'primereact/utils';

export default function CustomPanel({ title = '', children, key }: any) {
    const ref = useRef<Panel>(null);
    const [collapsed, setCollapsed] = useState(false);

    const togglePanel = () => {
        setCollapsed(!collapsed);
    };

    const headerTemplate = (options: any) => {
        return <div className={classNames([options.className, 'justify-content-start'])} onClick={togglePanel}>
            <div className={classNames([options.iconsClassName, 'mr-2'])}>
                <i className={!options.collapsed ? 'pi pi-angle-up' : 'pi pi-angle-down'}></i>
            </div>
            <p className={options.titleClassName}>{title}</p>
        </div>
    }

    return (
        <Panel key={key} ref={ref} className='mt-2' header={title} headerTemplate={headerTemplate} toggleable collapsed={collapsed} onToggle={(e) => setCollapsed(e.value)}>
            {children}
        </Panel>
    )
}
