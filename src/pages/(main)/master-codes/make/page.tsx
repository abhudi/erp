


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../../layout/AppWrapper';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Make, CustomResponse, Permissions } from '../../../../types';
import { Panel } from 'primereact/panel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { EmptyMake } from '../../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, formatString, getRowLimitWithScreenHeight, validateName, validatePhoneNumber, validateSubdomain, validateZipNumber } from '../../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../../config/permissions';
import { InputSwitch } from 'primereact/inputswitch';
import RightSidePanel from '../../../../components/RightSidePanel';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import CustomDataTable, { CustomDataTableRef } from '../../../../components/CustomDataTable';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const defaultForm: EmptyMake = {
    masterCodeId: null,
    companyId: null,
    codeTypeId: null,
    code: '',
    value: '',
    desc: '',
    codeType: {
        codeType: '',
        codeTypeId: null
    },
    isActive: true
};

const MakePage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert, selectedSubLocation, setSelectedSubLocation } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [companies, setCompanies] = useState<Make[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Make | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [dropdownValue, setDropdownValue] = useState(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyMake>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');
    const [makename, setMakename] = useState<any>(null);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [companyLocation, setcompanyLocation] = useState<any>(null);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [rowData, setRowData] = useState<any>(null);
    const [fetchedCodeTypeId, setFetchedCodeTypeId] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);

    useEffect(() => {
        setScroll(false);
        fetchData();

        // this following code is for storing the value of codetype in localStorage
        const data = localStorage.getItem('selectedRowData');
        // If data exists, set it in state
        if (data) {
            setRowData(JSON.parse(data));
        }
        return () => {
            setScroll(true);
        };
    }, []);

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        setPage(params.page);
        const companyId = get(user, 'company.companyId');
        const currentUrl: string = window.location.href;
        const url = new URL(currentUrl);
        const param = new URLSearchParams(url.search);
        const queryString = buildQueryParams(params);
        const fetchedcodeTypeId = param.get('codeTypeId');

        setFetchedCodeTypeId(fetchedcodeTypeId);
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/master-codes?codeTypeId=${fetchedcodeTypeId}&${queryString}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            if (response.total) {
                setTotalRecords(response?.total);
            }
        } else {
            setCompanies([]);
        }
    };

    const fetchDetails = async (company: Make) => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/master-codes`);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            // setsingleRoleId(response.data.roleId);

            setDetails(response.data);
        } else {
            setDetails(null);
            setGroupData({});
        }
    };
    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.masterCodeId?.toString(),
        data: {
            masterCodeId: company.masterCodeId,
            code: company.code,
            desc: company.desc,
            codeType: company.codeType
            // Add other fields here to be displayed in the TreeTable
        }
    }));

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
        if (action == ACTIONS.ADD) {
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
        setIsDetailLoading(true);
        const companyId = get(user, 'company.companyId');
        const response: CustomResponse = await PostCall(`/company/${companyId}/master-codes`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            // setAction(ACTIONS.VIEW)
            setSelectedCompany(response.data);
            setIsShowSplit(false);
            setAlert('success','Add Successfully')
            // fetchDetails(response.data);
            fetchData();
        } else {
            setAlert('error', response.message);
        }
    };

    const onUpdate = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        const masterCodeId = companyLocation?.masterCodeId;

        if (!formatString(companyForm.desc)) {
            setAlert('error', 'Please provid valid Description');
            return;
        }
        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/master-codes/${masterCodeId}`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            // setAction(ACTIONS.VIEW)
            setSelectedCompany(selectedCompany);
            setIsShowSplit(false);
            setAlert('success','Updated Successfully')
            // fetchDetails(selectedCompany!);
            fetchData();
        } else {
            setAlert('error', response.message);
        }
    };

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        const masterCodeId = companyLocation?.masterCodeId;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/master-codes/${masterCodeId}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAlert('success', 'Deleted successfully');
            setAction('');
            setSelectedCompany(null);
            fetchData();
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

            saveAsExcelFile(excelBuffer, 'MasterCodes');
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

    const onRowSelect = async (company: Make, action: any) => {
        await setSelectedCompany(company);
        setcompanyLocation(company);
        setAction(action);
        setSelectedKeys(null);
        // if (action == ACTIONS.VIEW){
        //     handleRowClick(company)
        //     // setAction(null)
        // }

        if (action == ACTIONS.DELETE) {
            return;
        }

        setDetails(null);
        setTimeout(() => {
            // fetchDetails(company);
        }, 500);

        if (action == ACTIONS.EDIT) {
            console.log('299',action)
            setForm({ ...company });
        }

        setIsShowSplit(true);
    };

    const onInputChange = (name: string | { [key: string]: any }, val?: any) => {
        setForm((Form: any) => {
            let updatedForm = { ...Form };

            if (typeof name === 'string') {
                updatedForm[name] = val;
            } else {
                updatedForm = { ...updatedForm, ...name };
            }

            return updatedForm;
        });
    };
    const onValueChange = (e: any) => setConfirmValue(e.target.value);
    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {action == ACTIONS.ADD ? 'Add Master Code' : selectedCompany?.name}
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
                    <h4 className="mb-0">{selectedSubLocation}</h4>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <div className=" ">
                        <Button label="New" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();
    const actionTemplate = (rowData: Make, options: ColumnBodyOptions) => {
        return (
            <div className="flex">
                {/* <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => handleRowClick(rowData)} /> */}
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
    const handleInputChange = (codeValue: string) => {
        const currentUrl: string = window.location.href;
        const url = new URL(currentUrl);
        const params = new URLSearchParams(url.search);
        const fetchedcodeTypeId = params.get('codeTypeId');

        onInputChange({
            code: codeValue,
            codeTypeId: fetchedCodeTypeId
        });
    };
    // const limit = 10; // Number of rows per page

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <div className="card erp-table-container">
                            {/* <DataTable
                                scrollable
                                value={companies}
                                filterDisplay={'row'}
                                selectionMode="single"
                                rows={10} // Rows per page
                                className="erp-table"
                                paginator={true}
                                onSelectionChange={(row: any) => setSelectedCompany(row.value)}
                                scrollHeight="80%"
                                style={{ width: '100%'}}
                                first={page * limit} // Starting index based on page and limit
                                totalRecords={totalRecords}
                                onPage={(e) => setPage(e.page || 0)} // Handle page changes
                                onLoad={(params: any) => fetchData(params)}
                            >
                                <Column field="masterCodeId" header="#" filter filterPlaceholder="Filter by ID"></Column>
                                <Column field="code" header="Name" filter filterPlaceholder="Filter by Name"></Column>
                                <Column field="value" header="Short Description" filter filterPlaceholder="Filter by Short Description"></Column>
                                <Column field="desc" header="Long Description" filter filterPlaceholder="Filter by Long Description"></Column>
                                <Column style={{ width: 160 }} body={actionTemplate}></Column>
                            </DataTable> */}
                            <CustomDataTable
                                ref={dataTableRef}
                                page={page}
                                limit={limit}
                                data={companies}
                                totalRecords={totalRecords}
                                // isView={true}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                filter
                                columns={[
                                    {
                                        header: '#',
                                        field: 'masterCodeId',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search #',
                                        bodyStyle: { width: 100 }
                                    },
                                    {
                                        header: 'Name',
                                        field: 'code',
                                        filter: true,
                                        filterPlaceholder: 'Search name'
                                    },
                                    {
                                        header: 'Description',
                                        field: 'value'
                                    },
                                    {
                                        header: 'Description',
                                        field: 'desc'
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                // onView={(item: any) => onRowSelect(item, 'view')}
                                onEdit={(item: any) => onRowSelect(item, 'edit')}
                                onDelete={(item: any) => onRowSelect(item, 'delete')}
                            />

                            </div>
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
                                    {/* Edit Permissions */}
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && (
                                        <div className="p-fluid">
                                            <div className="field">
                                                <label htmlFor="code">
                                                    Name <span className="red">*</span>
                                                </label>
                                                <InputText
                                                    id="code"
                                                    value={get(form, 'code')}
                                                    pattern="[a-zA-Z]*"
                                                    onChange={(e) => handleInputChange(e.target.value)} // Call handleInputChange to pass both values
                                                />
                                            </div>

                                            <div className="field">
                                                <label htmlFor="value">
                                                    {' '}
                                                    Short Description <span className="red">*</span>
                                                </label>
                                                <InputText id="value" value={get(form, 'value')} pattern="[a-zA-Z]*" onChange={(e) => onInputChange('value', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="desc">
                                                    {' '}
                                                    Long Description <span className="red">*</span>
                                                </label>
                                                <InputText id="desc" value={get(form, 'desc')} pattern="[a-zA-Z]*" onChange={(e) => onInputChange('desc', e.target.value)} />
                                            </div>
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

export default MakePage;
