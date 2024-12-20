


import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { CustomResponse, Permissions, Routes } from '../../../types';
import { useAppContext } from '../../../layout/AppWrapper';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Row } from 'primereact/row';
import { FilterMatchMode } from 'primereact/api';
import { Panel } from 'primereact/panel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { find, get, groupBy, map, uniq, uniqBy } from 'lodash';
import { EmptyPermissions } from '../../../types/forms';
import { InputTextarea } from 'primereact/inputtextarea';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import RightSidePanel from '../../../components/RightSidePanel';
import { useNavigate } from 'react-router-dom';

const defaultForm: EmptyPermissions = {
    permissionId: null,
    module: '',
    permission: '',
    desc: ''
}

const PermissionPage = () => {
    const { isLoading, setLoading, setScroll, setAlert, isScroll } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);

    const [form, setForm] = useState<EmptyPermissions>(defaultForm);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [action, setAction] = useState<string>('');

    const [routes, setRoutes] = useState<Routes[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [oldPerms, setOldPerms] = useState<any[]>([]);
    const [groupData, setGroupData] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [selectedRoutes, setSelectedRoutes] = useState<any[]>([]);
    const [selectedRouteIds, setSelectedRouteIds] = useState<any[]>([]);
    const [confirmTextValue, setConfirmValue] = useState<any>('')

    useEffect(() => {
        fetchData();
        fetchPermissions();
        setScroll(false);

        return () => {
            setScroll(true);
        };
    }, []);

    const [tableHeight, setTableHeight] = useState('30rem');
    const calculateTableHeight = () => {
        const headerHeight = 250;
        const availableHeight = window.innerHeight - headerHeight;
        setTableHeight(`${availableHeight}px`);
    };

    useEffect(() => {
        calculateTableHeight();
        window.addEventListener('resize', calculateTableHeight);
        return () => {
            window.removeEventListener('resize', calculateTableHeight);
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const response: CustomResponse = await GetCall('/settings/routes');
        setLoading(false)
        if (response.code == 'SUCCESS') {
            setRoutes(response.data);
        }
        else {
            setRoutes([]);
        }
    }

    const fetchPermissions = async () => {
        setLoading(true);
        const response: CustomResponse = await GetCall('/settings/permissions');
        if (response.code == 'SUCCESS') {
            setPermissions(response.data);
        }
        else {
            setPermissions([]);
        }
        setLoading(false)
    }

    const fetchDetails = async (row: Permissions) => {
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/settings/permissions/${row?.permissionId}`);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setDetails(response.data);
            setForm(response.data);
            let _perms = get(response.data, 'routes', []).map((item: any) => item);

            let _oldPerms: any[] = [];
            map(_perms, 'routeId').forEach(element => {
                _oldPerms.push({
                    routeId: element,
                    permissionId: row?.permissionId
                })
            });
            setOldPerms(_oldPerms);
            setSelectedRouteIds(map(_perms, 'routeId'));
            syncSelectedPerms(map(_perms, 'route'), map(_perms, 'routeId'));
        }
        else {
            setDetails(null);
        }
    }

    const onRowSelect = async (perm: Permissions, action = 'view') => {
        setAction(action)
        await setSelectedProduct(perm)
        setTimeout(() => {
            fetchDetails(perm);
        }, 50)

        if (action == 'delete') {
            showDeleteConfirmation()
            return;
        }

        setIsShowSplit(true);
        if (action == 'edit') {
            setForm(selectedProduct);
        }
    }

    const onGlobalFilterChange = (e: any) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const syncSelectedPerms = (_perms: any[], ids: any[]) => {
        const selectedItems = _perms.filter((item: any) => item.routeId && ids.includes(item.routeId));
        setSelectedRoutes(selectedItems);
    }

    const closeIcon = () => {
        setSelectedProduct(null);
        setIsShowSplit(false)
        setAction('');
        setForm(defaultForm);
    }

    const closeMultiSelect = (isOk?: boolean) => {
        if (typeof isOk == 'boolean' && isOk) {
            syncSelectedPerms(routes, selectedRouteIds)
        }
        else {
            // reset
            let _perms = get(details, 'routes', []).map((item: any) => item);

            let _oldPerms: any[] = [];
            map(_perms, 'routeId').forEach(element => {
                _oldPerms.push({
                    permissionId: element,
                    routeId: selectedProduct.routeId
                })
            });
            setOldPerms(_oldPerms);
            setSelectedRouteIds(map(_perms, 'routeId'));
            syncSelectedPerms(map(_perms, 'route'), map(_perms, 'routeId'));
        }
        if (multiSelectRef.current) {
            multiSelectRef.current.hide();
        }
    };

    const onSaveAction = async () => {
        if (action == 'view') {
            updatePermissions()
        }
        else if (action == 'edit') {
            onUpdate(form);
        }
        else if (action == 'delete') {
            console.log('delete')
            onDelete()
        }
        else if (action == 'add') {
            onAdd(form);
        }
    }

    const onAdd = async (data: EmptyPermissions) => {
        setIsDetailLoading(true)
        const result: CustomResponse = await PostCall(`/settings/permissions`, data);
        setIsDetailLoading(false)
        if (result.code == 'SUCCESS') {
            fetchPermissions();
            setSelectedProduct(result.data)
            setAction('view');
            fetchDetails(result.data);
            setAlert('success', result.message || 'Permission added!');
        }
        else {
            setAlert('error', result.message);
        }
    }

    const onUpdate = async (data: EmptyPermissions) => {
        setIsDetailLoading(true)
        const result: CustomResponse = await PutCall(`/settings/permissions/${selectedProduct.permissionId}`, data);
        setIsDetailLoading(false)
        if (result.code == 'SUCCESS') {
            fetchPermissions();
            fetchDetails(selectedProduct);
            setAlert('success', result.message || 'Permission updated!');
        }
        else {
            setAlert('error', result.message);
        }
    }

    const onDelete = async () => {
        setIsDetailLoading(true)
        const result: CustomResponse = await DeleteCall(`/settings/permissions/${selectedProduct.permissionId}`);
        setIsDetailLoading(false)
        if (result.code == 'SUCCESS') {
            setDetails(null)
            setSelectedProduct(null)
            fetchPermissions();
            closeIcon();
            setAlert('success', result.message || 'Permission delete!');
        }
        else {
            setAlert('error', result.message);
        }
    }


    const updatePermissions = async () => {
        let payload: any[] = [];

        let selected: any[] = [];
        selectedRoutes.forEach(element => {
            selected.push({
                permissionId: selectedProduct?.permissionId,
                routeId: element.routeId
            })
        });

        oldPerms.forEach(element => {
            let doc = find(selected, element);
            if (!doc) {
                element.action = 'remove';
                payload.push(element)
            }
        });

        payload = [...payload, ...selected.map((item: any) => ({ ...item, action: 'add' }))]

        if (payload.length > 0) {
            setIsDetailLoading(true);
            const response: CustomResponse = await PostCall(`/settings/sync-route-permissions`, payload);
            setIsDetailLoading(false)
            if (response.code == 'SUCCESS') {
                setAlert('success', 'Permission updated')

                if (selectedProduct) {
                    fetchDetails(selectedProduct);
                }
            }
            else {
                setAlert('error', response.message)
            }
        }
    }

    const showAddNew = () => {
        setIsShowSplit(true);
        setAction('add');
        setSelectedProduct(null);
        setForm(defaultForm);
    }

    const onInputChange = (name: string, val: any) => {
        const regex = /^[a-zA-Z]*$/;
        if (['module', 'permission'].includes(name) && !regex.test(val) && val != '') {
            return;
        }

        let _form: any = { ...form };
        _form[`${name}`] = val;
        setForm(_form);
    };

    const showDeleteConfirmation = () => {
        console.log('show delete')
    }

    const bodyTemplate = (rowData: any) => {
        return <Row>
            <span>{rowData.permission}</span>
            <br />
            <span style={{ fontSize: 12 }}>{rowData.desc}</span>
        </Row>;
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className='mb-0'>Permissions</h4>
                </span>
                <Button icon="pi pi-plus" size="small" label='Permission' aria-label="AddNew" style={{ }} onClick={showAddNew} />
            </div>
        );
    };
    const header = renderHeader();

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold">{action == 'add' ? 'Add permission' : selectedProduct?.permission}</div>
                </div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                <Button label="Save" onClick={onSaveAction} />
            </div>
        );
    }

    const multiSelectFooter = () => {
        return (
            <div className="flex justify-content-end p-2 footer-panel">
                <Button label="Cancel" severity="secondary" text onClick={closeMultiSelect.bind(this, false)} />
                <Button label="Ok" text onClick={closeMultiSelect.bind(this, true)} />
            </div>
        );
    }

    const itemTemplate = (item: any) => {
        return (
            <div className="flex align-items-center">
                <Tag value={item?.method.toUpperCase()} severity={getOrderSeverity(item)}></Tag>
                <div style={{ marginLeft: 10 }}>{item.path}</div>
            </div>
        );
    };

    const actionTemplate = (rowData: Permissions, options: ColumnBodyOptions) => {
        return <div className='flex'>
            <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'view')} />
            <Button type="button" icon={'pi pi-pencil'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'edit')} />
            <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
        </div>;
    };

    const onValueChange = (e: any) => setConfirmValue(e.target.value);

    return (
        <>
            <ConfirmDialog />
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <div className='card erp-table-container'>
                                <DataTable
                                    scrollable
                                    value={permissions}
                                    selectionMode="single"
                                    filters={filters}
                                    filterDisplay="row"
                                    rows={10}
                                    totalRecords={permissions.length}
                                    dataKey="permissionId"
                                    paginator={true}
                                    selection={selectedProduct!}
                                    onSelectionChange={(row: any) => onRowSelect(row.value, 'view')}
                                    className='erp-table headerless'
                                    scrollHeight={tableHeight}
                                    style={{ width: '100%', height: '80%' }}>
                                    <Column style={{ width: 100 }} body={actionTemplate}></Column>
                                    <Column field="permission" filter filterPlaceholder='Search permission' body={bodyTemplate} filterMatchMode={FilterMatchMode.CONTAINS}></Column>
                                </DataTable>
                            </div>
                        </div>
                        <RightSidePanel
                            isVisible={isShowSplit}
                            headerTemplate={headerTemplate}
                            footerTemplate={panelFooterTemplate}
                            closeIcon={closeIcon}
                            content={<>
                                {
                                    isDetailLoading && <div className='center-pos'>
                                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                    </div>
                                }

                                {/* View Permissions */}
                                {
                                    action == 'view' && selectedProduct && get(details, 'permissionId') == selectedProduct.permissionId && <>
                                        <p className='sub-heading'><span style={{ fontWeight: 'normal' }}>Module</span>: {selectedProduct.module}</p>
                                        <p className='sub-heading' style={{ marginTop: 10 }}>Permissions</p>
                                        <p className='sub-desc'>Restricting where and for which API can be used helps prevent unauthorized use</p>
                                        <MultiSelect
                                            ref={multiSelectRef}
                                            value={uniq(selectedRouteIds)}
                                            itemTemplate={itemTemplate}
                                            onChange={(e) => setSelectedRouteIds(e.value)}
                                            options={routes}
                                            optionLabel="path"
                                            optionValue="routeId"
                                            filter
                                            placeholder="Select Routes"
                                            maxSelectedLabels={3}
                                            panelFooterTemplate={multiSelectFooter}
                                            className="w-full"
                                            panelStyle={{ maxWidth: '25vw' }}
                                        />

                                        <p className='sub-heading' style={{ marginTop: 15, marginBottom: 10 }}>Selected Routes:</p>
                                        {
                                            selectedRoutes && uniqBy(selectedRoutes, 'routeId').map((item: any) => {
                                                return <div key={item.routeId} style={{ padding: 10 }}>
                                                    <span><Tag value={item?.method.toUpperCase()} severity={getOrderSeverity(item)}></Tag></span>
                                                    <span className="font-bold" style={{ paddingLeft: 10 }}>{item?.path}</span>
                                                </div>
                                            })
                                        }
                                    </>
                                }

                                {/* Edit Permissions */}
                                {
                                    (action == 'edit' || action == 'add') && <div className="p-fluid">
                                        <div className="field">
                                            <label htmlFor="module">Module name <span className='red'>*</span></label>
                                            <InputText id='module' value={get(form, 'module')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('module', e.target.value)} />
                                            <small>only alphabets</small>
                                        </div>
                                        <div className="field">
                                            <label htmlFor="permission">Permission name <span className='red'>*</span></label>
                                            <InputText id='permission' value={get(form, 'permission')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('permission', e.target.value)} />
                                            <small>only alphabets</small>
                                        </div>
                                        <div className="field">
                                            <label htmlFor="desc">Desciption</label>
                                            <InputTextarea id='desc' value={get(form, 'desc')} onChange={(e) => onInputChange('desc', e.target.value)} style={{ resize: 'vertical' }} />
                                        </div>
                                    </div>
                                }
                            </>}
                        />
                    </div>
                </div>
            </div>

            <Dialog header="Delete confirmation"
                visible={action == 'delete'}
                style={{ width: layoutState.isMobile ? '90vw' : '50vw' }}
                className='delete-dialog'
                headerStyle={{ backgroundColor: '#ffdddb', color: '#8c1d18' }}
                footer={(
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                        <Button label="Save" severity="danger" disabled={(selectedProduct?.permission != confirmTextValue || confirmTextValue == '')} onClick={onSaveAction} />
                    </div>
                )} onHide={closeIcon}>
                <div className="flex flex-column w-full surface-border p-3">
                    <div className='flex align-items-center'>
                        <i className="pi pi-info-circle text-6xl red" style={{ marginRight: 10 }}></i>
                        <span>This will remove <strong>{selectedProduct?.permission}</strong> permission for following routes.<br /> Do you still want to remove it? This action cannot be undone.</span>
                    </div>
                    <p className='sub-heading' style={{ marginTop: 15, marginBottom: 10 }}>Routes:</p>
                    <ScrollPanel style={{ height: 150 }}>
                        {(isLoading || isDetailLoading) && (
                            <div className='flex align-items-center justify-content-center w-full h-full'>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        )}
                        {!isLoading && !isDetailLoading && map(map(get(details, 'routes', []), 'route'), (item) => (
                            <div key={'delete-' + item.routeId} style={{ padding: 10 }}>
                                <span><Tag value={item?.method.toUpperCase()} severity={getOrderSeverity(item)} /></span>
                                <span className="font-bold" style={{ paddingLeft: 10 }}>{item?.path}</span>
                            </div>
                        ))}

                        {!isLoading && !isDetailLoading && get(details, 'routes', []).length == 0 &&
                            <div style={{ padding: 10 }}>
                                <span>No assigned routes</span>
                            </div>
                        }
                    </ScrollPanel>
                    <div style={{ marginTop: 10 }}>
                        <span>Confirm you want to delete this by typing its name: <strong>{selectedProduct?.permission}</strong></span><br />
                        <InputText placeholder={selectedProduct?.permission} style={{ marginTop: 10 }} onChange={onValueChange} />
                    </div>
                </div>
            </Dialog>

        </>
    );
};

const getOrderSeverity = (route: Routes) => {
    switch (route.method) {
        case 'POST':
            return 'success';
        case 'DELETE':
            return 'danger';
        case 'PUT':
            return 'warning';
        case 'GET':
            return 'info';
        default:
            return null;
    }
};

export default PermissionPage;
