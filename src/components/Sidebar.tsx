import React, { useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { LayoutContext } from '../layout/context/layoutcontext';
import { Button } from 'primereact/button';
interface RightSidePanel {
    isVisible: boolean,
    title?: any,
    headerTemplate?: any,
    footerTemplate?: any,
    isLoading?: boolean
    action?: any,
    closeIcon: any,
    content: any,
    width?: string,
    onSave?: any
}

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete'
};


const Sidebar = ({ title = '', isVisible, action = ACTIONS.VIEW, isLoading = false, headerTemplate, footerTemplate, closeIcon, content, width = '100vw', onSave = () => { } }: RightSidePanel) => {
    const { layoutState } = useContext(LayoutContext)

    const defaultHeaderTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {title}
                    </div>
                </div>
            </div>
        );
    };

    const defaultPanelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                <div>
                    <Button label="Cancel" size="small" severity="secondary" text onClick={closeIcon} />
                    {[ACTIONS.EDIT, ACTIONS.ADD].includes(action) && <Button label="Save" size="small" disabled={isLoading} onClick={onSave} />}
                </div>
            </div>
        );
    };

    return (
        <>
            <Dialog
                visible={isVisible}
                modal={false}
                header={headerTemplate ? headerTemplate : defaultHeaderTemplate}
                footer={footerTemplate ? footerTemplate : defaultPanelFooterTemplate}
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

export default Sidebar;
