import { memo } from "react";
import { CONFIG } from "../config/config";
import { Button } from "primereact/button";
import { confirmPopup, ConfirmPopup } from "primereact/confirmpopup";

interface FileItemProps {
    file: {
        assetType: any;
        isExternal: boolean;
        location: string;
    };
    onView?: (file: any) => void;
    onDelete?: (file: any) => void;
    edit?: boolean;
}

const MemoizedFileItem = memo(({ file, edit = false, onView, onDelete }: FileItemProps) => {
    const confirm2 = (event: any) => {
        confirmPopup({
            target: event.currentTarget,
            message: 'Do you want to delete this doc?',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: () => onDelete && onDelete(file)
        });
    };

    return (<div className='file-view-item' style={{ height: '8rem', width: '8rem' }}>
         <ConfirmPopup />
        {file?.assetType == 'IMAGE' ?
            <img src={file?.isExternal ? file.location : `${CONFIG.ASSET_LINK}${file.location}`} alt={'name'} style={{ height: '8rem', width: '8rem', objectFit: 'contain' }} /> : <i className='pi pi-file' style={{ fontSize: 30 }} />}
        {edit && (
            <div className="hover-buttons">
                <Button
                    className="small-icon-button"
                    icon="pi pi-eye"
                    severity="info"
                    aria-label="View"
                    size="small"
                    onClick={() => onView && onView(file)}
                />
                <Button
                    className="small-icon-button"
                    icon="pi pi-trash"
                    severity="danger"
                    aria-label="Delete"
                    size="small"
                    onClick={confirm2}
                />
            </div>
        )}
    </div>);
});

export default MemoizedFileItem;