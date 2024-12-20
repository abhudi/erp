import React from 'react';

const DefaultLogo = ({ size = 3 }: any) => {
    return (
        <div className={`w-${size}rem h-${size}rem shadow-2 border-round flex justify-content-center align-items-center object-fit-contain`}>
            <i className='pi pi-image' />
        </div>
    );
};

export default DefaultLogo;
