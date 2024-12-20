import React, { useState, useMemo, useRef, useContext, memo, useEffect } from 'react';
import { FileUpload, ItemTemplateOptions } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import moment from 'moment-timezone';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { find, get, sortBy } from 'lodash';
import MemoizedFileItem from './MemoizedFileItem';
import { useAppContext } from '../layout/AppWrapper';
import { LayoutContext } from '../layout/context/layoutcontext';
import { Asset } from '../types';
import { formatBytes, generateRandomId, parseYouTubeID } from '../utils/uitl';
import { CONFIG } from '../config/config';

const MyFileUpload = ({ isVisible, onSelect }: any) => {
    const menuRight = useRef<any>(null);
    const mountRef = useRef<any>(null);
    const { authToken } = useAppContext()
    const { layoutState } = useContext(LayoutContext)
    const fileUploadRef = useRef<FileUpload>(null);
    const fileInputRef = useRef<any>(null);

    const [isFileLoading, setisFileLoading] = useState<boolean>(false);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [filesToUpload, setFilesToUpload] = useState<any[]>([]);
    const [fileList, setFileList] = useState<Asset[]>([]);
    const [assetFile, setAssetFile] = useState<Asset | null>(null);
    const [isShowImage, setShowImage] = useState<boolean>(false)
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setDialogVisible(true)
            setSelectedFiles([]);
            setFilesToUpload([]);
        }
        else {
            setDialogVisible(false)
        }
    }, [isVisible]);


    const addFiles = (newItems: any) => {
        setFilesToUpload(prevItems => [...prevItems, ...newItems]);
    };

    const onFileCheck = (item: Asset) => {
        let _items = [...selectedFiles];
        let findDoc = find(selectedFiles, { assetId: item.assetId })
        if (findDoc) {
            _items = _items.filter((file: any) => file.assetId !== item.assetId);
        } else {
            _items.push(item);
        }
        setSelectedFiles(_items);
    }

    const openDialog = () => {
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        onSelect([])
    };

    const onDone = () => {
        setDialogVisible(false);
        if (onSelect) {
            onSelect(selectedFiles);
        }
    }

    const handleFileSelect = (event: any) => {
        const filesArray = Array.from(event.target.files || []);

        const processedFiles: any[] = filesArray.map((file: any) => {
            const arr = file.type.split('/');
            const assetType = arr[0].toUpperCase();
            return {
                assetId: generateRandomId(),
                assetType: assetType,
                isExternal: true,
                status: 'pending',
                location: URL.createObjectURL(file),
                name: file.name,
                type: arr.length > 1 ? arr[1] : 'N/A',
                size: file.size,
                file
            };
        });
        addFiles(processedFiles)
    };

    useEffect(() => {
        const uploadPendingFiles = async () => {
            if (isUploading) return; // Prevent multiple uploads at the same time

            const nextFileToUpload = filesToUpload.find((file) => file.status === 'pending');

            if (nextFileToUpload) {
                setIsUploading(true);
                const fileObj = nextFileToUpload;

                const updatedQueue = filesToUpload.map((file) => {
                    if (file.assetId === fileObj.assetId) {
                        return Object.assign({}, file, { status: 'uploading' });
                    }
                    return file;
                });
                setFilesToUpload(updatedQueue);

                if (!fileObj) {
                    setIsUploading(false);
                    return;
                }

                const formData = new FormData();
                formData.append('file', fileObj.file);
                formData.append('assetType', ['IMAGE', 'VIDEO', 'IMAGES', 'VIDEOS'].includes(fileObj.assetType) ? fileObj.assetType : 'OTHER');

                try {
                    let data: any = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${CONFIG.BASE_URL}/upload`);

                        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

                        // Track upload progress
                        xhr.upload.onprogress = (event) => {
                            // setUploadProgress((prevProgress: any) => ({
                            //     ...prevProgress,
                            //     [fileObj.name]: (event.loaded / event.total) * 100,
                            // }));
                        };

                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                resolve(xhr.response);
                            } else {
                                reject(new Error(`Failed to upload ${fileObj.name}`));
                            }
                        };

                        xhr.onerror = () => reject(new Error(`Failed to upload ${fileObj.name}`));

                        xhr.send(formData);
                    });


                    let result = JSON.parse(data)
                    // Update file status to 'uploaded'
                    const finalQueue = filesToUpload.map((file) => {
                        if (file.assetId === fileObj.assetId) {
                            // auto select file on upload
                            console.log('fileObj', fileObj, file)
                            onFileCheck(Object.assign({}, file, { assetId: result.assetId, status: 'uploaded' }));
                            // Update status while preserving the rest of the file object
                            return Object.assign({}, file, { assetId: result.assetId, status: 'uploaded' });
                        }
                        return file;
                    });
                    setFilesToUpload(finalQueue);
                } catch (error) {
                    console.error('Error uploading file:', fileObj.name, error);

                    // Update file status to 'failed'
                    const finalQueue = filesToUpload.map((file) => {
                        if (file.assetId === fileObj.assetId) {
                            // Update status while preserving the rest of the file object
                            return Object.assign({}, file, { status: 'failed' });
                        }
                        return file;
                    });
                    setFilesToUpload(finalQueue);
                }

                setIsUploading(false);
            }
        };

        uploadPendingFiles();
    }, [filesToUpload]);


    const cleanup = () => {
        try {
            filesToUpload.forEach((file: any) => URL.revokeObjectURL(file.objectURL));
        } catch (error) {

        }
    };

    const viewImage = (file: Asset) => {
        setShowImage(true);
        setAssetFile(file)
    }

    const dialogFooter = (
        <div className="dialog-footer p-2 flex justify-content-between">
            <div>
                {selectedFiles.length > 0 && <Button className='btn-small' label="Clear selection" text onClick={() => setSelectedFiles([])} />}
            </div>
            <div>
                <Button className='btn-small' label="Cancel" severity="secondary" text onClick={hideDialog} />
                <Button className='btn-small' label="Done" onClick={onDone} />
            </div>
        </div>
    );


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
        return null;
    };


    const emptyTemplate = (<div className="drop-field flex align-items-center flex-column my-0">
        <div className='flex align-items-center'>
            <Button className='btn-small custom-choose-btn mr-2' severity="secondary" text raised onClick={() => {
                fileInputRef.current?.click();
            }}>Add media</Button>
            {/* <Button className='btn-small mr-2' severity="secondary" text>Add from URL</Button> */}
        </div>
        <span style={{ color: 'var(--text-color-secondary)' }} className="my-2">Drag and drop files</span>
    </div>)

    return (
        <>
            <Dialog
                className='file-picker'
                header="Upload"
                visible={dialogVisible}
                style={{ width: layoutState.isMobile ? '90vw' : '60vw', height: '60vh' }}
                headerStyle={{ borderBottom: '1px solid lightgrey', padding: '0.8rem' }}
                contentStyle={{ overflow: 'hidden' }}
                onHide={hideDialog}
                footer={dialogFooter}
            >
                <div className='pt-3'>
                    {
                        (isFileLoading || isUploading) && <div className='center-pos'>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    }
                    <input ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} type="file" id="files" name="files" multiple />
                    <FileUpload
                        ref={fileUploadRef}
                        contentClassName='file-picker-drop mt-2'
                        name="demo[]"
                        multiple
                        headerTemplate={<></>}
                        emptyTemplate={emptyTemplate}
                        chooseOptions={{ className: 'custom-choose-btn' }}
                        onSelect={(event) => handleFileSelect({ event: { target: { files: event.files } } })}
                    />

                    <ScrollPanel className='flex align-items-center' style={{ width: '100%', height: '20rem', marginTop: '1.5rem' }}>
                        <div className='grid p-2'>
                            {filesToUpload.map((file: any) => (<div key={`file_${file.assetId}_${file.name}`} className='col-4 sm:col-3 lg:col-2 file-item'>
                                <div className="flex flex-column p-2 shadow-2 border-round align-items-center text-center border-round-sm" onClick={() => onFileCheck(file)}>
                                    <Checkbox key={`file_check_${file.assetId}_${file.name}`} className='file-checkbox' onChange={() => onFileCheck(file)} checked={find(selectedFiles, { assetId: file.assetId }) ? true : false} style={{ visibility: file.status == 'uploaded' ? 'visible' : 'hidden' }}></Checkbox>
                                    <MemoizedFileItem key={`file_image_${file.assetId}_${file.name}`} file={file} />
                                    <i className='pi pi-eye file-view primary-color cursor-pointer' style={{ visibility: 'hidden' }} onClick={() => viewImage(file)}></i>
                                </div>
                                <div className="file-info flex flex-column align-items-center mb-2">
                                    <p className='m-0 mt-2 sub-desc text-elipsis'>{file.name}</p>
                                    <p className='m-0 sub-desc'>{get(file, 'type', '').toUpperCase()} • {formatBytes(file.size)}</p>
                                </div>
                                {(file.status != 'uploaded') && <ProgressSpinner className='file-loader' style={{ width: '50px', height: '50px', marginTop: '2rem' }} />}
                            </div>))}

                            {
                                fileList.length == 0 && !isFileLoading && <div className='flex align-items-center justify-content-center w-full h-3rem'>
                                    <p>No media found</p>
                                </div>
                            }
                        </div>
                        <div style={{ height: 50 }}></div>
                    </ScrollPanel>

                </div>
            </Dialog>

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
                        <p><strong>Details:</strong> {get(assetFile, 'type', '').toUpperCase()} • {assetFile?.width} x {assetFile?.height} • {formatBytes(assetFile?.sizeInBytes)}<br />Added on {moment(assetFile?.createdAt).format('lll')}</p>
                        <p><strong>Used in:</strong> {assetFile?.usedIn || 'No referenced found'}</p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default MyFileUpload;
