import { useEffect, useRef, useState } from "react";
import { get } from "lodash";
import { Dialog } from "primereact/dialog"
import moment from 'moment-timezone';
import { Asset } from "../types";
import { CONFIG } from "../config/config";
import { parseYouTubeID } from "../utils/uitl";


const FileView = ({ isVisible, assetFile, onClose = (option: any) => { } }: { isVisible: boolean, assetFile: Asset | null, onClose: any }) => {
    const mountRef = useRef<any>(null);
    const [dialogVisible, setDialogVisible] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setDialogVisible(true)
        }
        else {
            setDialogVisible(false)
        }
    }, [isVisible]);

    const renderMedia = (asset: Asset) => {
        if (asset?.assetType === 'IMAGE') {
            return (
                <img
                    src={`${!assetFile?.isExternal ? CONFIG.ASSET_LINK : ''}${assetFile?.location}`}
                    alt={assetFile?.name}
                    style={{ width: '100%', height: '99%', objectFit: 'contain' }}
                />
            );
        } else if (asset?.assetType === 'VIDEO') {
            return (
                <video
                    src={`${!asset?.isExternal ? CONFIG.ASSET_LINK : ''}${asset?.location}`}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            );
        } else if (asset?.assetType === '3D_MODEL') {
            return <div ref={mountRef} style={{ width: '100%', height: '100%' }}></div>;
        } else if (asset?.assetType === 'EXTERNAL_VIDEO') {
            return (
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${parseYouTubeID(asset?.location)}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ objectFit: 'contain' }}
                ></iframe>
            );
        }
        else if (asset?.assetType === 'OTHER') {
            return (
                <embed className="pdf"
                    src={`${!assetFile?.isExternal ? CONFIG.ASSET_LINK : ''}${assetFile?.location}`}
                    style={{ width: '100%', height: '99%', objectFit: 'contain' }} />
            );
        }
        return null;
    };

    return <Dialog
        header={assetFile?.name}
        visible={dialogVisible}
        resizable={false}
        style={{ width: '100vw', height: '100vh', maxHeight: '100vh', backgroundColor: '#121212' }}
        onHide={() => onClose(false)}
        className="fullscreen-dialog"
        contentStyle={{ backgroundColor: '#121212' }}
        headerStyle={{ backgroundColor: '#121212', color: '#fff', borderBottom: '1px solid #333' }}
    >
        <div className="grid grid-nogutter" style={{ height: '100%' }}>
            <div className="col-12" style={{ backgroundColor: '#000', height: '100%' }}>
                {assetFile && renderMedia(assetFile!)}
            </div>
            {/* <div className="col-12 md:col-6 lg:col-4" style={{ backgroundColor: '#1f1f1f', color: '#fff', padding: '1rem', boxSizing: 'border-box' }}>
                <h4 style={{ color: '#fff' }}>Information</h4>
                <Divider />
                <p><strong>Name:</strong> {assetFile?.name}</p>
                <p><strong>Details:</strong> {get(assetFile, 'type', '').toUpperCase()} â€¢ {assetFile?.width} x {assetFile?.height} â€¢ {formatBytes(assetFile?.sizeInBytes)}<br />Added on {moment(assetFile?.createdAt).format('lll')}</p>
                <p><strong>Used in:</strong> {assetFile?.usedIn || 'No referenced found'}</p>
            </div> */}
        </div>
    </Dialog>
}
export default FileView;