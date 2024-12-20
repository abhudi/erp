


import React, { useEffect, useRef, useState, useContext } from 'react';
import { Button } from 'primereact/button';
import { CustomResponse, Permissions, Routes } from '../../../types';
import { useAppContext } from '../../../layout/AppWrapper';
import { GetCall, PostCall } from '../../../api/ApiKit';
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
import { find, get, groupBy, map, unionBy, uniq } from 'lodash';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { Dialog } from 'primereact/dialog';
import RightSidePanel from '../../../components/RightSidePanel';
import { useNavigate } from 'react-router-dom';

const RoutesPage = () => {
    const { isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);

    const [routes, setRoutes] = useState<Routes[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [oldPerms, setOldPerms] = useState<any[]>([]);
    const [groupData, setGroupData] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Routes | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [selectedPermissions, setSelectedPermissions] = useState<any[]>([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<any[]>([]);

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
            const groupedPermissions = groupBy(response.data, 'module');
            const transformedData = Object.keys(groupedPermissions).map(module => ({
                label: module,
                items: groupedPermissions[module]
            }));
            setPermissions(response.data);
            setGroupData(transformedData)
        }
        else {
            setPermissions([]);
        }
        setLoading(false)
    }

    const fetchDetails = async (row: Routes) => {
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/settings/routes/${row?.routeId}`);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setDetails(response.data);
            let _perms = get(response.data, 'permissions', []).map((item: any) => item);

            let _oldPerms: any[] = [];
            map(_perms, 'permissionId').forEach(element => {
                _oldPerms.push({
                    permissionId: element,
                    routeId: row?.routeId
                })
            });
            setOldPerms(_oldPerms);
            setSelectedPermissionIds(map(_perms, 'permissionId'));
            syncSelectedPerms(map(_perms, 'permission'), map(_perms, 'permissionId'));
        }
        else {
            setDetails(null);
        }
    }

    const onRowSelect = async (e: any) => {
        await setSelectedProduct(e.value)
        setTimeout(() => {
            fetchDetails(e.value);
        }, 500)
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
        const selectedItems = _perms.filter((item: any) => ids.includes(item.permissionId));
        setSelectedPermissions(selectedItems);
    }

    const closeIcon = () => {
        setSelectedProduct(null);
    }

    const closeMultiSelect = (isOk?: boolean) => {
        if (typeof isOk == 'boolean' && isOk) {
            syncSelectedPerms(permissions, selectedPermissionIds)
        }
        else {
            // reset
            let _perms = get(details, 'permissions', []).map((item: any) => item);
            let _oldPerms: any[] = [];
            map(_perms, 'permissionId').forEach(element => {
                _oldPerms.push({
                    permissionId: element,
                    routeId: selectedProduct?.routeId
                })
            });
            setSelectedPermissionIds(map(_perms, 'permissionId'));
        }
        if (multiSelectRef.current) {
            multiSelectRef.current.hide();
        }
    };

    const updatePermissions = async () => {
        let payload: any[] = [];

        let selected: any[] = [];
        selectedPermissions.forEach(element => {
            selected.push({
                routeId: selectedProduct?.routeId,
                permissionId: element.permissionId
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

    const bodyTemplate = (rowData: Routes) => {
        return <Row>
            <Tag value={rowData.method.toUpperCase()} severity={getOrderSeverity(rowData)}></Tag>
            <span style={{ marginLeft: 10 }}>{rowData.path}</span>
        </Row>;
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-start">
                <span className="p-input-icon-left flex align-items-center">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onChange={onGlobalFilterChange}
                        placeholder="Search..."
                    />
                </span>
            </div>
        );
    };
    const header = renderHeader();

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <Tag value={selectedProduct?.method.toUpperCase()} severity={getOrderSeverity(selectedProduct!)}></Tag>
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>{selectedProduct?.path}</div>
                </div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                <Button label="Save" disabled={(isLoading || isDetailLoading)} onClick={updatePermissions} />
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

    const actionTemplate = (rowData: Routes, options: ColumnBodyOptions) => {
        return <div className='flex'>
            <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect({ value: rowData })} />
        </div>;
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className={`panel-container ${selectedProduct ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                    <div className="left-panel">
                        <div className="flex justify-content-between p-4">
                            <span className="p-input-icon-left flex align-items-center">
                                <h4 className='mb-0'>Routes</h4>
                            </span>
                        </div>
                        <div className='card erp-table-container'>
                            <DataTable
                                scrollable
                                value={routes.map((item: any) => ({
                                    ...item,
                                    routeName: `${item.method} ${item.path}`
                                }))}
                                selectionMode="single"
                                filterDisplay="row"
                                rows={10}
                                totalRecords={routes.length}
                                dataKey="routeId"
                                paginator={true}
                                selection={selectedProduct!}
                                className='erp-table headerless'
                                onSelectionChange={onRowSelect}
                                scrollHeight={tableHeight}
                                style={{ width: '100%', height: '80%' }}>
                                <Column style={{ width: 50 }} body={actionTemplate}></Column>
                                <Column field="routeName" filter body={bodyTemplate} filterPlaceholder='Search' filterHeaderStyle={{ maxWidth: 200 }} filterMatchMode={FilterMatchMode.CONTAINS}></Column>
                            </DataTable>
                        </div>
                    </div>
                    <RightSidePanel
                        isVisible={selectedProduct != null}
                        headerTemplate={headerTemplate}
                        footerTemplate={panelFooterTemplate}
                        closeIcon={closeIcon}
                        content={<>
                            {
                                isDetailLoading && <div className='center-pos'>
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            }
                            <p className='sub-heading'>Permissions</p>
                            <p className='sub-desc'>Restricting where and for which permission modules this API can be used helps prevent unauthorized use</p>
                            <MultiSelect
                                ref={multiSelectRef}
                                value={uniq(selectedPermissionIds)}
                                // onChange={onSelectionChanged}
                                onChange={(e) => setSelectedPermissionIds(e.value)}
                                options={groupData}
                                optionLabel="permission"
                                optionValue="permissionId"
                                optionGroupLabel="label"
                                optionGroupChildren="items"
                                filter
                                placeholder="Select Permissions"
                                maxSelectedLabels={3}
                                panelFooterTemplate={multiSelectFooter}
                                panelStyle={{ maxWidth: '25vw' }}
                                className="w-full" />

                            <p className='sub-heading' style={{ marginTop: 15, marginBottom: 10 }}>Selected Permissions:</p>
                            {
                                selectedPermissions && unionBy(selectedPermissions, 'permissionId').map((item: any) => {
                                    return <p key={item.permission}>{item.permission}</p>
                                })
                            }
                        </>}
                    />
                </div>
            </div>
        </div>
    );
};

const getOrderSeverity = (route: Routes) => {
    if (!route) {
        return null;
    }
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

export default RoutesPage;
