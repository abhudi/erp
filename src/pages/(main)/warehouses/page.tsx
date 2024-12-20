


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { MultiSelect } from 'primereact/multiselect';
import { Warehouse, CustomResponse, Permissions } from '../../../types';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { EmptyWarehouse } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, formatString, getRowLimitWithScreenHeight, validateName, validatePhoneNumber, validateString, validateSubdomain, validateZipNumber } from '../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../config/permissions';
import RightSidePanel from '../../../components/RightSidePanel';
import { TreeNode } from 'primereact/treenode';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { useNavigate } from 'react-router-dom';
import { LayoutContext } from '../../../layout/context/layoutcontext';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const defaultForm: EmptyWarehouse = {
    warehouseId: null,
    companyId: null,
    name: '',
    desc: '',
    location:'',
    phone: '',
    zip: '',
    isActive: true
};

const LocationPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [companies, setCompanies] = useState<Warehouse[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Warehouse | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [dropdownValue, setDropdownValue] = useState(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyWarehouse>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');
    // const [columnFilters, setColumnFilters] = useState({
    //     warehouseId:{ value: null, matchMode: 'contains' },
    //     name: { value: null, matchMode: 'contains' },
    //     location: { value: null, matchMode: 'contains' }
    // })
    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [companyLocation, setcompanyLocation] = useState<any>(null);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null)

    useEffect(() => {
        setScroll(false);
        fetchData();

        return () => {
            setScroll(true);
        };
    }, []);

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page }
        }
        const companyId = get(user, 'company.companyId')
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/warehouses?${queryString}`); // get all the roles
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            if (response.total) {
                setTotalRecords(response?.total)
            }
        } else {
            setCompanies([]);
        }
    };

    // const fetchPermissions = async () => {
    //     const companyId = get(user, 'company.companyId')
    //     setLoading(true);
    //     const response: CustomResponse = await GetCall(`/company/${companyId}/company-permissions`);// get company all roles
    //     if (response.code == 'SUCCESS') {
    //         const filterData = filter(response.data, (item: any) => item.module != 'AdminModule')
    //         setcomapnyAllPermission(filterData);
    //         setPermissions(filterData);
    //         const _treeData = buildTree(filterData);
    //         setGroupData(_treeData)

    //         // const preselectedKeys = findSelectedKeys(_treeData);
    //         // setSelectedKeys(preselectedKeys);
    //     }
    //     else {
    //         setPermissions([]);
    //     }
    //     setLoading(false)
    // }

    // const fetchDetails = async (company: Warehouse) => {
    //     const companyId = get(user, 'company.companyId')
    //     setIsDetailLoading(true);
    //     const response: CustomResponse = await GetCall(`/company/${companyId}/roles/`);
    //     setIsDetailLoading(false)
    //     if (response.code == 'SUCCESS') {
    //         // setsingleRoleId(response.data.roleId);
    //         const filterData = filter(response.data.rolePermissions, (item: any) => item.permission != 'AdminModule')
    //             .map((item: any) => item.permission);
    //         setDetails(filterData);
    //         // setDetails(response.data);

    //         //  const _treeData = buildTree(get(response.data, 'permissions', []));
    //         const _treeData = buildTree(filterData);
    //         setGroupData(_treeData)

    //         const preselectedKeys = findSelectedKeys(_treeData);
    //         setSelectedKeys(preselectedKeys);
    //     }
    //     else {
    //         setDetails(null);
    //         setGroupData({})
    //     }
    // }
    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.warehouseId?.toString(),
        data: {
            warehouseId: company.warehouseId,
            name: company.name,
            location: company.location,
            phone: company.phone,
            zip: company.zip
            // Add other fields here to be displayed in the TreeTable
        }
    }));

    // const buildTree = (permissions: Permissions[]) => {
    //     const groupedByModule = groupBy(permissions, 'module');
    //     return map(groupedByModule, (items: Permissions[], module: string) => ({
    //         label: module,
    //         key: module,
    //         data: {
    //             permission: module,
    //             desc: ''
    //         },
    //         children: items.map(permission => ({
    //             label: permission.permission,
    //             key: permission.permissionId,
    //             desc: permission.desc,
    //             // checked: get(permission, 'companyPermission', false) ? true : false,
    //             data: permission
    //         }))
    //     }));
    // };

    // const showPermissions = () => {
    //     setAction(ACTIONS.VIEW_PERMISSIONS);
    //     fetchPermissions()
    //     const _treeData = buildTree((comapnyAllPermission));
    //     setGroupData(_treeData)
    //     // const preselectedKeys = findSelectedKeys(_treeData);
    //     // setSelectedKeys(preselectedKeys);
    // }

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false);
        setForm(defaultForm);
        setAction(null);
        setSelectedKeys(null);
    };

    const showAddNew = () => {
        // fetchPermissions();
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm(defaultForm);
    };

    const onSave = () => {
        // if (action == ACTIONS.VIEW_PERMISSIONS) {
        //     const selectedItems = findSelectedItems(groupedData, selectedKeys);
        //     const filteredItems = filter(selectedItems, (item) => item.data && item.data.permissionId != null);
        //     const permissionIds = map(filteredItems, 'data.permissionId');
        //     onUpdatePermissions(permissionIds)
        //     return;
        // }

        if (action == ACTIONS.ADD) {
            // const selectedItems = findSelectedItems(groupedData, selectedKeys);
            // const filteredItems = filter(selectedItems, (item) => item.data && item.data.permissionId != null);
            // const permissionIds = map(filteredItems, 'data.permissionId');
            // permissions: permissionIds,
            onNewAdd({ ...form });
            return;
        }

        if (action == ACTIONS.EDIT) {
            onUpdate(form);
        }

        if (action == ACTIONS.DELETE) {
            onDelete();
        }
    };

    const onNewAdd = async (companyForm: any) => {
        console.log('242',companyForm)
        if (!validateString(companyForm.name)) {
            setAlert('error', 'Please provide valid Role name');
            return;
        }
        setIsDetailLoading(true);
        const companyId = get(user, 'company.companyId');
        const response: CustomResponse = await PostCall(`/company/${companyId}/warehouses`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(response.data);
            setIsShowSplit(false);
            setAlert('success', 'Successfully Added');
            dataTableRef.current?.updatePagination(1)
        } else {
            setAlert('error', response.message);
        }
    };

    const onUpdate = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        const warehouseId = companyLocation?.warehouseId;
        if (!validateString(companyForm.name)) {
            setAlert('error', 'Please provide valid Role name');
            return;
        }

        // if (!formatString(companyForm.location)) {
        //     setAlert('error', 'Please provid valid Description');
        //     return;
        // }

        // if (!validatePhoneNumber(companyForm.phone)) {
        //     setAlert('error', 'Please provide valid phone');
        //     return;
        // }
        // if (!validateZipNumber(companyForm.zip)) {
        //     setAlert('error', 'Please provide valid Zip Code');
        //     return;
        // }

        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/warehouses/${warehouseId}`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(selectedCompany);
            setIsShowSplit(false);
            setAlert('success', 'Successfully Updated');
            dataTableRef.current?.refreshData();
        } else {
            setAlert('error', response.message);
        }
    };

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        const warehouseId = companyLocation?.warehouseId;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/warehouses/${warehouseId}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAlert('success', 'Deleted successfully');
            setAction('');
            setSelectedCompany(null);
            dataTableRef.current?.updatePaginationAfterDelete('warehouseId', warehouseId)
            setAlert('success', 'Successfully Deleted');
        } else {
            setAlert('error', response.message);
        }
    };
    const exportExcel = () => {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(companies);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            saveAsExcelFile(excelBuffer, 'Location');
        });
    };
    const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
        import('file-saver').then((module) => {
            if (module && module.default) {
                let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                let EXCEL_EXTENSION = '.xlsx';
                const data = new Blob([buffer], {
                    type: EXCEL_TYPE
                });

                module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
            }
        });
    };
    //     const dropdownValues: InputValue[] = [
    //       { name: "Shegaon", code: "SH" },
    //       { name: "Khamgaon", code: "KH" },
    //       { name: "Akola", code: "AK" },
    //       { name: "Kherda", code: "KH" },
    //       { name: "Paras", code: "Pr" },
    //   ];
    // const onUpdatePermissions = async (perms: any[]) => {
    //     const oldPers = filter((details), (item) => item).map((item) => item.permissionId)

    //     let payload: any[] = [];

    //     let selected: any[] = [];
    //     perms.forEach(element => {
    //         selected.push({
    //             // roleId: singleRoleId,
    //             permissionId: element,
    //             action: 'add',

    //         })
    //     });

    //     oldPers.forEach(element => {
    //         let doc = find(selected, { permissionId: element });
    //         if (!doc) {
    //             payload.push({
    //                 // roleId: singleRoleId,
    //                 permissionId: element,
    //                 action: 'remove',

    //             })
    //         }
    //     });

    //     payload = [...payload, ...selected]

    //     if (payload.length > 0) {
    //         const companyId = get(user, 'company.companyId')
    //         setIsDetailLoading(true);
    //         const response: CustomResponse = await PostCall(`/company/${companyId}/sync-role-permissions`, payload);
    //         setIsDetailLoading(false)
    //         if (response.code == 'SUCCESS') {
    //             setAction(ACTIONS.VIEW)
    //             setAlert('success', 'Permission updated')
    //             if (selectedCompany) {
    //                 // fetchDetails(selectedCompany);
    //             }
    //         }
    //         else {
    //             setAlert('error', response.message)
    //         }
    //     }
    // }

    const onGlobalFilterChange = (e: any) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    const onFilterChange = (e: any, field: string) => {
        const newFilters = { ...filters };
        newFilters[field] = e.target.value;
        setFilters(newFilters);
    };
    const onRowSelect = async (company: Warehouse, action: any) => {
        console.log('426',company)
        await setSelectedCompany(company);
        setcompanyLocation(company);
        setAction(action);
        setSelectedKeys(null);

        if (action == ACTIONS.DELETE) {
            return;
        }

        setDetails(null);
        setTimeout(() => {
            // fetchDetails(company);
        }, 500);

        if (action == ACTIONS.EDIT) {
            setForm({ ...company ,
               desc:company.description
            });
        }

        setIsShowSplit(true);
    };

    const onInputChange = (fieldName: string, value: any) => {
        let _form: any = { ...form };
    
        // Set the field value
        _form[fieldName] = value;
    
        // If updating the name, also update location
        if (fieldName === 'name') {
            _form['location'] = value; // Set location to match name
        }
    
        setForm(_form);
    };
    
    const onValueChange = (e: any) => setConfirmValue(e.target.value);
    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {action == ACTIONS.ADD ? 'Add Location' : selectedCompany?.name}
                    </div>
                </div>
            </div>
        );
    };
    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                {
                    // action == ACTIONS.VIEW_PERMISSIONS ? <Button label="Back" severity="secondary" text onClick={() => setAction(ACTIONS.VIEW)} /> : <div></div>
                }
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    {[ACTIONS.EDIT, ACTIONS.ADD, ACTIONS.VIEW_PERMISSIONS].includes(action) && <Button label="Save" disabled={isLoading || isDetailLoading} onClick={onSave} />}
                </div>
            </div>
        );
    };
    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h3 className='mb-0'>Locations</h3>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <div className=" ">
                        <Button label="Location" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();
    const actionTemplate = (rowData: Warehouse, options: ColumnBodyOptions) => {
        return (
            <div className="flex">
                {/* <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() =>  handleRowClick(rowData)} /> */}
                <Button type="button" icon={'pi pi-pencil'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'edit')} />
                <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
            </div>
        );
    };

    const nodeTemplate = (node: any) => {
        return (
            <div>
                <p className="m-0 p-0">{node.data.permission}</p>
                {get(node, 'data.desc') && (
                    <p style={{ margin: 0, fontSize: 'small', color: 'gray' }}>
                        {node.data.module}: {node.data.desc}
                    </p>
                )}
            </div>
        );
    };

    const selectedPermissions = filter(details, (item) => item.permission != null);

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <CustomDataTable
                                ref={dataTableRef}
                                limit={limit}
                                page={page}
                                filter
                                totalRecords={totalRecords}
                                data={companies}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                columns={[
                                    {
                                        header: '#',
                                        field: 'warehouseId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { width: 100, minWidth: 100, maxWidth: 100 },
                                        filterPlaceholder: 'Search #'
                                    },
                                    {
                                        header: 'Name',
                                        field: 'name',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search name'
                                    },
                                    {
                                        header: 'Description',
                                        field: 'description',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search description'
                                    },
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onEdit={(item: any) => onRowSelect(item, 'edit')}
                                onDelete={(item: any) => onRowSelect(item, 'delete')}
                            />
                            {/* <TreeTable
                                scrollable
                                header={header}
                                value={treeData}
                                // dataKey="companyId"
                                selectionMode="single"
                                rows={10}
                                // globalFilterValue={globalFilterValue}
                                className="custom-table"
                                totalRecords={companies.length}
                                paginator={true}
                                // selection={selectedCompany!}
                                onSelectionChange={(row: any) => setSelectedCompany(row.value)}
                                scrollHeight="82%"
                                style={{ width: '100%' }}
                            >
                                <Column style={{ width: 160 }} body={actionTemplate}></Column>
                                <Column field="warehouseId" header="#" filter filterPlaceholder="Filter by ID"></Column>
                                <Column field="name" header="Name" filter filterPlaceholder="Filter by Name"></Column>
                                <Column field="location" header="Location" filter filterPlaceholder="Filter by Location"></Column>
                            </TreeTable> */}
                        </div>
                        <RightSidePanel
                            isVisible={isShowSplit}
                            headerTemplate={headerTemplate}
                            footerTemplate={panelFooterTemplate}
                            closeIcon={closeIcon}
                            content={
                                <>
                                    {isDetailLoading && (
                                        <div className="center-pos">
                                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                        </div>
                                    )}

                                    {/* {
                                    action == ACTIONS.VIEW && details && rolename && <div className="p-fluid">
                                        <div className="field">
                                            <small>Role</small>
                                            <p className='font-bold'>{rolename?.name}</p>
                                        </div>
 
                                        <div className="field">
                                            <small>Description</small>
                                            <p className='font-bold'>{rolename?.desc}</p>
                                        </div>
                                        <p className='sub-heading'>Permissions {selectedPermissions.length > 0 ? <span className='primary-text-color cursor-pointer' onClick={showPermissions}>{`(${selectedPermissions.length} permissions)`}</span> : ''}</p>
                                        <div className='mt-2'>
                                            {
                                                selectedPermissions.map((item) => (
                                                    <p key={item.rolePermissionId} className='sub-text pl-3'>{item.permission}</p>
                                                ))
                                            }
                                        </div>
                                        {
                                            selectedPermissions.length == 0 &&
                                            <small className='primary-text-color cursor-pointer' onClick={showPermissions}>No permissions provided</small>
                                        }
                                    </div>
                                }
 
                                {
                                    action == ACTIONS.VIEW_PERMISSIONS && <div className="p-fluid">
                                        <p className='sub-heading'>Permissions</p>
                                        <div className="p-grid">
                                            <div className="p-col-12">
                                                <div className="p-d-flex p-flex-column">
                                                    <Tree
                                                        value={groupedData}
                                                        filter
                                                        filterMode="lenient"
                                                        filterPlaceholder="Search..."
                                                        selectionMode="checkbox"
                                                        selectionKeys={selectedKeys}
                                                        nodeTemplate={nodeTemplate}
                                                        onSelectionChange={(e: any) => setSelectedKeys(e.value)}
                                                        className="erp-tree w-full mt-2"
                                                    />
 
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
  */}
                                    {/* Edit Permissions */}
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && (
                                        <div className="p-fluid">
                                            <div className="field">
                                                <label htmlFor="name">
                                                    Name <span className="red">*</span>
                                                </label>
                                                <InputText id="name" value={get(form, 'name')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('name', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="desc">
                                                    {' '}
                                                    Description  <span className="red">*</span>
                                                </label>
                                                <InputText id="desc" value={get(form, 'desc')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('desc', e.target.value)} />
                                            </div>
                                            {/* <div className="field">
                                                <label htmlFor="phone">
                                                    {' '}
                                                    Phone <span className="red">*</span>
                                                </label>
                                                <InputText id="phone" value={get(form, 'phone')} onChange={(e) => onInputChange('phone', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="zip">
                                                    {' '}
                                                    Zip code <span className="red">*</span>
                                                </label>
                                                <InputText id="zip" value={get(form, 'zip')} onChange={(e) => onInputChange('zip', e.target.value)} />
                                            </div> */}

                                            {/* {
                                            action == ACTIONS.ADD && <>
                                                <p className='sub-heading'>Permissions <span className='red'>*</span></p>
                                                <div className="p-grid">
                                                    <div className="p-col-12">
                                                        <div className="p-d-flex p-flex-column">
                                                            <Tree
                                                                value={groupedData}
                                                                filter
                                                                filterMode="lenient"
                                                                filterPlaceholder="Search..."
                                                                selectionMode="checkbox"
                                                                selectionKeys={selectedKeys}
                                                                nodeTemplate={nodeTemplate}
                                                                onSelectionChange={(e: any) => setSelectedKeys(e.value)}
                                                                className="erp-tree w-full mt-2"
                                                            />
 
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        } */}
                                        </div>
                                    )}
                                </>
                            }
                        />
                    </div>
                </div>
            </div>
            <Dialog
                header="Delete confirmation"
                visible={action == 'delete'}
                style={{ width: layoutState.isMobile ? '90vw' : '50vw' }}
                className="delete-dialog"
                headerStyle={{ backgroundColor: '#ffdddb', color: '#8c1d18' }}
                footer={
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                        <Button label="Save" severity="danger" onClick={onSave} />
                    </div>
                }
                onHide={closeIcon}
            >
                {isLoading && (
                    <div className="center-pos">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                )}
                <div className="flex flex-column w-full surface-border p-3">
                    <div className="flex align-items-center">
                        <i className="pi pi-info-circle text-6xl red" style={{ marginRight: 10 }}></i>
                        <span>
                            This will remove <strong>{selectedCompany?.name}</strong>.<br /> Do you still want to remove it? This action cannot be undone.
                        </span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};
// const findSelectedKeys = (nodes: any[]): any => {
//     let selectedKeys: any = {};
//     let parents: any = {}; // To keep track of parent nodes

//     const traverse = (node: any) => {
//         if (node.data) {
//             selectedKeys[node.key] = {
//                 checked: true
//             }; // Mark the current node as selected
//         }
//         let allChildrenSelected = true;
//         let anyChildSelected = false;

//         if (node.children) {
//             node.children.forEach((child: any) => {
//                 traverse(child); // Recursively process children

//                 if (selectedKeys[child.key]) {
//                     anyChildSelected = true; // At least one child is selected
//                 } else {
//                     allChildrenSelected = false; // Not all children are selected
//                 }
//             });

//             // Determine the state of the current node based on its children
//             if (anyChildSelected) {
//                 parents[node.key] = {
//                     checked: allChildrenSelected,
//                     partialChecked: !allChildrenSelected
//                 };
//             }
//         }
//     };

//     nodes.forEach(traverse);

//     // Merge parents into selectedKeys
//     Object.keys(parents).forEach(key => {
//         selectedKeys[key] = parents[key];
//     });

//     return selectedKeys;
// };

// const findSelectedItems = (nodes: any[], selectedKeys: any): any[] => {
//     const selectedItems: any[] = [];

//     if (selectedKeys && Object.keys(selectedKeys).length > 0) {
//         const traverse = (node: any) => {
//             if (selectedKeys[node.key]) {
//                 selectedItems.push(node);
//             }
//             if (node.children) {
//                 node.children.forEach((child: any) => traverse(child));
//             }
//         };

//         nodes.forEach(traverse);
//     }

//     return selectedItems;
// };

export default LocationPage;

// function saveAsExcelFile(excelBuffer: any, arg1: string) {
//     throw new Error('Function not implemented.');
// }
