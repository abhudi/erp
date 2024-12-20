import React, { useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { LayoutContext } from '../layout/context/layoutcontext';

interface RightSidePanel {
    isVisible: boolean,
    headerTemplate: any,
    footerTemplate: any,
    closeIcon: any,
    content: any,
    width?: string
}

const RightSidePanel = ({ isVisible, headerTemplate, footerTemplate, closeIcon, content, width = '40vw' }: RightSidePanel) => {
    const { layoutState } = useContext(LayoutContext)
    return (
        <>
            <Dialog
                visible={isVisible}
                modal={false}
                header={headerTemplate}
                footer={footerTemplate}
                resizable={false}
                draggable={false}
                position={'right'}
                style={{ width: layoutState.isMobile ? '100vw' : width, height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0 }}
                headerStyle={{ borderBottom: '1px solid lightgrey' }}
                onHide={closeIcon}
                className='crud-panel'
            >
                <div className="m-0">
                    {
                        content
                    }
                </div>
            </Dialog>
        </>
    );
};

export default RightSidePanel;
