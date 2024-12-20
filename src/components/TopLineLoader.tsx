
import React from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { useAppContext } from '../layout/AppWrapper';

export default function TopLinerLoader() {
    const { isLoading } = useAppContext();
    if (!isLoading) {
        return <div></div>
    }
    return <ProgressBar mode="indeterminate" className='w-full' color={'#0068e3'} style={{ height: '3px', position: 'fixed', top: 0, zIndex: 1111111 }}></ProgressBar>;
}
