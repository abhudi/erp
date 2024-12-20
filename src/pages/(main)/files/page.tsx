

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Tooltip } from 'primereact/tooltip';
import moment from 'moment-timezone';
import { Dialog } from 'primereact/dialog';
import { get } from 'lodash';
import { Image } from 'primereact/image';
import { classNames } from 'primereact/utils';
import { Divider } from 'primereact/divider';
import { useAppContext } from '../../../layout/AppWrapper';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../../../types';
import { GetCall } from '../../../api/ApiKit';
import { CONFIG } from '../../../config/config';
import DefaultLogo from '../../../components/DefaultLogo';
import { formatBytes, formatString, parseYouTubeID } from '../../../utils/uitl';

const FilesPage = () => {
    const { isLoading, setLoading, setAlert } = useAppContext()
    const navigate = useNavigate();
    const mountRef = useRef(null);

    const [assets, setAssets] = useState<Asset[]>([]);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [page, setpage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [isShowImage, setShowImage] = useState<boolean>(false)

    const [selectedAssets, setSelectedAssets] = useState<Asset[] | null>(null);
    const [assetFile, setAssetFile] = useState<Asset | null>(null);

    useEffect(() => {
        fetchData()
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const response = await GetCall(`/settings/assets?limit=${limit}&page=${page}`);
        console.log('response', response)
        if (response.code == 'SUCCESS') {
            setAssets(response.data);
            setTotalRecords(response.total)
        }
        else {
            setAssets([]);
        }
        setLoading(false)
    }

    const rowClick = (asset: Asset) => {
        setAssetFile(asset)
        setShowImage(true)
    }

    const copyToClipboard = async (link: string) => {
        try {
            await navigator.clipboard.writeText(link);
            setAlert('info', 'Copied!');
        } catch (err) {
        }
    };

    const imageBodyTemplate = (asset: Asset) => {
        if (!asset.isExternal) {
            return <img src={`${CONFIG.ASSET_LINK}${asset.location}`} alt={'thumbnail'} className="w-3rem h-3rem shadow-2 border-round object-fit-contain" onClick={(e) => {
                e.preventDefault();
                rowClick(asset);
            }} />;
        }
        return <div onClick={(e) => {
            e.preventDefault();
            rowClick(asset);
        }}>
            <DefaultLogo />
        </div>
    };

    const linkBodyTemplate = (asset: Asset) => {
        return <div className="button-link flex w-2rem h-2rem shadow-2 border-round align-items-center justify-content-center" onClick={(e) => {
            e.preventDefault();
            copyToClipboard(`${!asset.isExternal ? CONFIG.ASSET_LINK : ''}${asset.location}`)
        }}
            data-pr-tooltip="Copy link"
            data-pr-position="top"
        ><i className='pi pi-link'></i></div>
    };

    const dateTemplate = (asset: Asset) => {
        return asset.createdAt ? moment(asset.createdAt).fromNow() : ''
    };

    const renderMedia = (asset: Asset) => {
        console.log('asset', asset)
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
        return null;
    };

    const bodyAssetType = (asset: Asset) => formatString(asset.assetType)
    const bodySizeType = (asset: Asset) => formatBytes(asset.sizeInBytes)

    return (<>
        <div className="grid">
            <Tooltip target=".button-link" />
            <div className="col-12">
                <h5>Files</h5>

                <DataTable
                    value={assets}
                    selectionMode={'multiple'}
                    selection={selectedAssets!}
                    paginator={true}
                    rows={limit}
                    totalRecords={totalRecords}
                    onSelectionChange={(e: any) => setSelectedAssets(e.value)}
                    dataKey="assetId"
                    className='custom-table'
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                    <Column header="" body={imageBodyTemplate}></Column>
                    <Column field="name" header="Name"></Column>
                    <Column body={bodyAssetType} header="Type"></Column>
                    <Column body={bodySizeType} header="Size"></Column>
                    <Column body={linkBodyTemplate} header="Link"></Column>
                    <Column body={dateTemplate} header="Date added"></Column>
                </DataTable>
            </div>
        </div>
        <Dialog
            header={assetFile?.name}
            visible={isShowImage}
            resizable={false}
            style={{ width: '100vw', height: '100vh', maxHeight: '100vh', backgroundColor: '#121212' }}
            onHide={() => setShowImage(false)}
            className="fullscreen-dialog"
            contentStyle={{ backgroundColor: '#121212' }}
            headerStyle={{ backgroundColor: '#121212', color: '#fff', borderBottom: '1px solid #333' }}
        >
            <div className="grid grid-nogutter" style={{ height: '100%' }}>
                <div className="col-12 md:col-6 lg:col-8" style={{ backgroundColor: '#000', height: '100%' }}>
                    {isShowImage && renderMedia(assetFile!)}
                </div>
                <div className="col-12 md:col-6 lg:col-4" style={{ backgroundColor: '#1f1f1f', color: '#fff', padding: '1rem', boxSizing: 'border-box' }}>
                    <h4 style={{ color: '#fff' }}>Information</h4>
                    <Divider />
                    <p><strong>Name:</strong> {assetFile?.name}</p>
                    <p><strong>Details:</strong> {assetFile?.type.toUpperCase()} • {assetFile?.width} x {assetFile?.height} • {formatBytes(assetFile?.sizeInBytes)}<br />Added on {moment(assetFile?.createdAt).format('lll')}</p>
                    <p><strong>Used in:</strong> {assetFile?.usedIn || 'No referenced found'}</p>
                </div>
            </div>
        </Dialog>

    </>);
};

export default FilesPage;
