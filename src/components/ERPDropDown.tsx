
import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { classNames } from 'primereact/utils';
import { InputText } from 'primereact/inputtext';

interface ERPDropDownOption {
    key?: string
    title?: string,
    required?: boolean,
    valueTemplate?: any,
    value?: any
}

export default function ERPDropDown(options: ERPDropDownOption) {
    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState<any>('');

    const togglePanel = () => {
        setCollapsed(!collapsed);
    };

    const headerTemplate = (<div className='dropdown'>
        <InputText value={search} placeholder={options.title || 'Type or click to select an item.'} onChange={(e) => setSearch(e.target.value)} />
    </div>)

    const inputHeaderTemplate = (<div>
        <InputText className='w-full' value={search} placeholder={options.title || 'Type or click to select an item.'} onChange={(e) => setSearch(e.target.value)} />
    </div>)

    return (<>
        <div key={'DropDown' + options.key || Math.random()} className='erp-dropdown mb-2'>
            {options.valueTemplate ? options.valueTemplate : (options.value ? headerTemplate : inputHeaderTemplate)}
        </div>
    </>)
}
