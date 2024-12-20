


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { MasterCode, CustomResponse, Permissions } from '../../../types';
import { Panel } from 'primereact/panel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { EmptyWarehouse } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, formatString, getRowLimitWithScreenHeight, validateName, validatePhoneNumber, validateSubdomain, validateZipNumber } from '../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../config/permissions';
import { InputSwitch } from 'primereact/inputswitch';
import DefaultLogo from '../../../components/DefaultLogo';
import RightSidePanel from '../../../components/RightSidePanel';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
import CustomDataTable from '../../../components/CustomDataTable';
import { useNavigate } from 'react-router-dom';

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
    location: '',
    phone: '',
    zip: '',
    isActive: true
};

const MasterPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert, setSelectedSubLocation } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [companies, setCompanies] = useState<MasterCode[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<MasterCode | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyWarehouse>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);

    useEffect(() => {
        setScroll(false);
        fetchData();

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
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/master-code-types?${queryString}`); // get all the roles
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

    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.codeTypeId?.toString(),
        data: {
            codeTypeId: company.codeTypeId,
            codeType: company.codeType
            // Add other fields here to be displayed in the TreeTable
        }
    }));

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false);
        setForm(defaultForm);
        setAction(null);
    };

    const onSave = () => {};

    const exportExcel = () => {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(companies);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            saveAsExcelFile(excelBuffer, 'MasterCode');
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

    const handleRowClick = (company: MasterCode) => {
        setSelectedSubLocation(company.codeType); // Store the selected company in context
        const codeTypeId = company.codeTypeId;
        if (codeTypeId) {
            navigate(`/master-codes/make?codeTypeId=${codeTypeId}`);
        } else {
            console.error('codeTypeId is undefined');
        }
    };

    const onInputChange = (name: string, val: any) => {
        const regex = /^[a-zA-Z]*$/;
        // if (['name', 'pocName', 'altPOCName'].includes(name) && !regex.test(val) && val != '') {
        //     return;
        // }
        let _form: any = { ...form };
        _form[`${name}`] = val;
        setForm(_form);
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
                    <h4 className="mb-0">Master Codes</h4>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                </span>
            </div>
        );
    };
    const header = renderHeader();
    const actionTemplate = (rowData: MasterCode, options: ColumnBodyOptions) => {
        return (
            <div className="flex">
                <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => handleRowClick(rowData)} />
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
                                page={page}
                                limit={limit}
                                data={companies}
                                totalRecords={totalRecords}
                                isView={true}
                                filter
                                columns={[
                                    {
                                        header: '#',
                                        field: 'codeTypeId',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search #',
                                        bodyStyle: { width: 100 }
                                    },
                                    {
                                        header: 'Name',
                                        field: 'codeType',
                                        filter: true,
                                        filterPlaceholder: 'Search name'
                                    },
                                    {
                                        header: 'Description',
                                        field: 'desc'
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => handleRowClick(item)}
                            />
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
                                                <label htmlFor="name">
                                                    Name <span className="red">*</span>
                                                </label>
                                                <InputText id="name" value={get(form, 'name')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('name', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="location">
                                                    {' '}
                                                    Location <span className="red">*</span>
                                                </label>
                                                <InputText id="location" value={get(form, 'location')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('location', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="phone">
                                                    {' '}
                                                    phone <span className="red">*</span>
                                                </label>
                                                <InputText id="phone" value={get(form, 'phone')} onChange={(e) => onInputChange('phone', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="zip">
                                                    {' '}
                                                    Zip code <span className="red">*</span>
                                                </label>
                                                <InputText id="zip" value={get(form, 'zip')} onChange={(e) => onInputChange('zip', e.target.value)} />
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
                        <Button label="Save" severity="danger" disabled={selectedCompany?.name != confirmTextValue || confirmTextValue == '' || isLoading} onClick={onSave} />
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
                    <div style={{ marginTop: 10 }}>
                        <span>
                            Confirm you want to delete this by typing its name: <strong>{selectedCompany?.name}</strong>
                        </span>
                        <br />
                        <InputText placeholder={selectedCompany?.name} style={{ marginTop: 10 }} onChange={onValueChange} />
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

export default MasterPage;

// function saveAsExcelFile(excelBuffer: any, arg1: string) {
//     throw new Error('Function not implemented.');
// }
