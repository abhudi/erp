import React, { useState, useMemo, useRef, useContext, memo, useEffect } from 'react';
import { FileUpload, ItemTemplateOptions } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import DefaultLogo from './DefaultLogo';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import moment from 'moment-timezone';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { find, get, sortBy } from 'lodash';
import { CONFIG } from '../config/config';
import { useAppContext } from '../layout/AppWrapper';
import { LayoutContext } from '../layout/context/layoutcontext';
import { Asset } from '../types';
import { formatBytes, generateRandomId, parseYouTubeID } from '../utils/uitl';
import { GetCall } from '../api/ApiKit';


const MemoizedFileItem = memo(({ file }: any) => {
    // Your file item rendering logic here
    return (<div className='flex object-fit-contain align-items-center justify-content-center' style={{ height: '7rem', width: '8rem', marginTop: '-0.9rem' }}>
        {file?.assetType == 'IMAGE' ?
            <img src={file?.isExternal ? file.location : `${CONFIG.ASSET_LINK}${file.location}`} alt={'name'} style={{ height: '8rem', width: '8rem', objectFit: 'contain' }} /> : <i className='pi pi-image' style={{ fontSize: 30 }} />}
    </div>);
});

const MemoizedItemTemplate = memo(({ file, onFileCheck, selectedFiles, viewImage }: any) => {
    return (
        <div key={`file_${file.assetId}_${file.name}`} className='col-4 sm:col-3 lg:col-2 file-item'>
            <div className="flex flex-column p-2 shadow-2 border-round align-items-center text-center border-round-sm" onClick={() => onFileCheck(file)}>
                <Checkbox
                    key={`file_check_${file.assetId}_${file.name}`}
                    className='file-checkbox'
                    onClick={() => onFileCheck(file)}
                    checked={!!find(selectedFiles, { assetId: file.assetId })}
                />
                <MemoizedFileItem key={`file_image_${file.assetId}_${file.name}`} file={file} />
                <i
                    className='pi pi-eye file-view primary-color cursor-pointer'
                    onClick={() => viewImage(file)}
                />
            </div>
            <div className="file-info flex flex-column align-items-center mb-2">
                <p className='m-0 mt-2 sub-desc text-elipsis'>{file.name}</p>
                <p className='m-0 sub-desc'>
                    {get(file, 'type', '').toUpperCase()} • {formatBytes(file.sizeInBytes)}
                </p>
            </div>
        </div>
    );
});



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
    const [search, setSearch] = useState('');
    const [selectedFilterBy, setFilterBy] = useState<any>('');
    const [sortByKey, setSortByKey] = useState('createdAt');
    const [sortByType, setSortByType] = useState('DESC');

    const sortItems = [
        {
            label: 'Date added (newest first)',
            icon: 'pi pi-sort-numeric-down-alt',
            command: () => onSort({ key: 'createdAt', order: 'DESC' })
        },
        {
            label: 'Date added (oldest first)',
            icon: 'pi pi-sort-numeric-down',
            command: () => onSort({ key: 'createdAt', order: 'ASC' })
        },
        {
            label: 'File name (A-Z)',
            icon: 'pi pi-sort-alpha-down',
            command: () => onSort({ key: 'name', order: 'ASC' })
        },
        {
            label: 'File name (Z-A)',
            icon: 'pi pi-sort-alpha-down-alt',
            command: () => onSort({ key: 'name', order: 'DESC' })
        }
    ];

    const filterItems = [
        { name: 'Images', code: 'IMAGE' },
        { name: 'Videos', code: 'VIDEO' },
        { name: 'External Videos', code: 'EXTERNAL_VIDEO' },
        { name: 'Other', code: 'OTHER' },
    ];

    useEffect(() => {
        if (isVisible) {
            setDialogVisible(true)
            fetchData()
        }
        else {
            setDialogVisible(false)
        }
    }, [isVisible]);

    useEffect(() => {
        fetchData()
    }, [sortByKey, sortByType, selectedFilterBy, search]);

    const fetchData = async () => {
        setisFileLoading(true);
        const response = await GetCall(`/settings/assets?limit=${50}&page=${1}&search=${search}&sortByKey=${sortByKey}&sortBy=${sortByType}&assetType=${selectedFilterBy ? selectedFilterBy.code : ''}`);
        // console.log('response', response)
        if (response.code == 'SUCCESS') {
            setFileList(response.data);
        }
        else {
            setFileList([]);
        }
        setisFileLoading(false)
    }

    const onGlobalFilterChange = (e: any) => {
        setSearch(e.target.value)
    }

    const onSort = ({ key, order }: any) => {
        setSortByKey(key);
        setSortByType(order);
    }

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
    };

    const onDone = () => {
        setDialogVisible(false);
        console.log('selectedFiles', selectedFiles)
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


    const emptyTemplate = (<div className="drop-field flex align-items-center flex-column my-3">
        <div className='flex align-items-center'>
            <Button className='btn-small custom-choose-btn mr-2' severity="secondary" text raised onClick={() => {
                fileInputRef.current?.click();
            }}>Add media</Button>
            <Button className='btn-small mr-2' severity="secondary" text>Add from URL</Button>
        </div>
        <span style={{ color: 'var(--text-color-secondary)' }} className="my-2">Drag and drop images, videos, 3D models, and files</span>
    </div>)

    const itemTemplate = (file: any) => {
        return (<div key={`file_${file.assetId}_${file.name}`} className='col-4 sm:col-3 lg:col-2 file-item'>
            <div className="flex flex-column p-2 shadow-2 border-round align-items-center text-center border-round-sm" onClick={() => onFileCheck(file)}>
                <Checkbox key={`file_check_${file.assetId}_${file.name}`} className='file-checkbox' onClick={() => onFileCheck(file)} checked={find(selectedFiles, { assetId: file.assetId }) ? true : false}></Checkbox>
                <MemoizedFileItem key={`file_image_${file.assetId}_${file.name}`} file={file} />
                <i className='pi pi-eye file-view primary-color cursor-pointer' onClick={() => viewImage(file)}></i>
            </div>
            <div className="file-info flex flex-column align-items-center mb-2">
                <p className='m-0 mt-2 sub-desc text-elipsis'>{file.name}</p>
                <p className='m-0 sub-desc'>{get(file, 'type', '').toUpperCase()} • {formatBytes(file.sizeInBytes)}</p>
            </div>
        </div>);
    };

    return (
        <>
            <Dialog
                className='file-picker'
                header="Select file"
                visible={dialogVisible}
                style={{ width: layoutState.isMobile ? '90vw' : '70vw', height: '90vh' }}
                headerStyle={{ borderBottom: '1px solid lightgrey', padding: '0.8rem' }}
                contentStyle={{ overflow: 'hidden' }}
                onHide={hideDialog}
                footer={dialogFooter}
            >
                <div className='pt-3'>
                    <div className="flex justify-content-between align-items-center">
                        <div className="p-input-icon-left flex align-items-center">
                            <i className="pi pi-search" />
                            <InputText
                                className='input-narrow'
                                type="search"
                                onChange={onGlobalFilterChange}
                                placeholder="Search..."
                            />
                        </div>
                        <div className='justify-content-center'>
                            <Dropdown className='dropdown-small' value={selectedFilterBy} onChange={(e) => setFilterBy(e.value)} options={filterItems} optionLabel="name" placeholder="Filter" />
                            <Menu model={sortItems} popup ref={menuRight} id="popup_menu_right" popupAlignment="right" />
                            <Button label="Sort" icon="pi pi-sort-alt" className="btn-small ml-2" onClick={(event) => menuRight.current.toggle(event)} aria-controls="popup_menu_right" aria-haspopup />
                        </div>
                    </div>

                    <input ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} type="file" id="files" name="files" multiple />
                    <FileUpload
                        ref={fileUploadRef}
                        contentClassName='file-picker-drop mt-3'
                        name="demo[]"
                        multiple
                        headerTemplate={<></>}
                        emptyTemplate={emptyTemplate}
                        chooseOptions={{ className: 'custom-choose-btn' }}
                        onSelect={(event) => handleFileSelect({ event: { target: { files: event.files } } })}
                    />

                    <ScrollPanel className='flex align-items-center' style={{ width: '100%', height: '20rem', marginTop: '1.5rem' }}>
                        {
                            isFileLoading && <div className='center-pos'>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        }
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

                            {fileList.map((file: Asset) => (
                                <MemoizedItemTemplate
                                    key={`file_${file.assetId}_${file.name}`}
                                    file={file}
                                    onFileCheck={onFileCheck}
                                    selectedFiles={selectedFiles}
                                    viewImage={viewImage}
                                />
                            ))}

                            {
                                fileList.length == 0 && !isFileLoading && <div className='flex align-items-center justify-content-center w-full h-3rem'>
                                    <p>No media found</p>
                                </div>
                            }
                        </div>
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
