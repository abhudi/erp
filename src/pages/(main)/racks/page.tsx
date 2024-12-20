


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { CompanyRack, CustomResponse, Permissions } from '../../../types';
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
import { EmptyRack } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, filterArray, formatString, getRowLimitWithScreenHeight, validateName, validateNumberOfRacks, validatePhoneNumber, validateSubdomain, validateZipNumber } from '../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../config/permissions';
import { InputSwitch } from 'primereact/inputswitch';
import DefaultLogo from '../../../components/DefaultLogo';
import RightSidePanel from '../../../components/RightSidePanel';
import { TreeTable, TreeTableFilterMeta } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
import { constant } from '../../../utils/constant';
import DownloadBarcodeButton from '../../../components/DownloadBarcodeButton';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { useNavigate } from 'react-router-dom';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const defaultForm: EmptyRack = {
    warehouseId: null,
    locationId: null,
    name: '',
    desc: '',
    rackTypeId: null,
    noOfRows: null,
    value: '',
    location: '',
    noOfRacks: null
};

const RackPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<CompanyRack[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyRack | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [rolename, setRolename] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<TreeTableFilterMeta>({});
    const [selectedLocationId, setSelectedLocationId] = useState<any>(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyRack>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [companyAllLocation, setcomapnyAllLocation] = useState<any>(null);
    const [selectedrackTypeId, setSelectedRackTypeId] = useState<any>(null);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [companyRackId, setcompanyRackId] = useState<any>(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [globalFilter, setGlobalFilter] = useState<string>('');

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null)

    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchPermissions();
        fetchDetails();

        return () => {
            setScroll(true);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsButtonDisabled(false);
        }, 3000); // 3 seconds delay
        return () => clearTimeout(timer);
    }, []);

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page }
        }
        const companyId = get(user, 'company.companyId')
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/racks?${queryString}`); // get all the Racks
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            setSelectedCompany(null);
            if (response.total) {
                setTotalRecords(response?.total)
            }
        } else {
            setCompanies([]);
        }
    };

    const fetchPermissions = async () => {
        const companyId = get(user, 'company.companyId');
        const type = constant.SYSTEM_MSTR_CODE.rackType;
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/master-codes-by-types/${type}?limit=500`); // get company all roles
        if (response.code == 'SUCCESS') {
            const codes = get(response.data, 'codes', []);
            setPermissions(codes);
            setSelectedRackTypeId(response.data.codes);
        } else {
            setPermissions([]);
        }
        setLoading(false);
    };

    const fetchDetails = async () => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/warehouses?limit=500`);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setcomapnyAllLocation(response.data);
            setDetails(response.data);
        } else {
            setDetails(null);
            setGroupData({});
        }
    };
    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.rackId?.toString(),
        data: {
            rackId: company.rackId,
            rackTypeId: company.rackTypeId,
            warehouseId: company.warehouseId,
            name: company.sku,
            desc: company.desc,
            value: company.rackType?.value,
            noOfRows: company.rows.length,
            location: company.warehouse?.location,
            code: company.rackType?.code
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
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm(defaultForm);
    };

    const onSave = () => {
        if (action == ACTIONS.ADD) {
            onNewAdd({ ...form });
            setIsShowSplit(false);
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
        const companyId = get(user, 'company.companyId');
        if (!validateNumberOfRacks(companyForm.noOfRacks)) {
            setAlert('error', "The racks can't be more than 50");
            return;
        }

        setIsDetailLoading(true);
        const response: CustomResponse = await PostCall(`/company/${companyId}/racks`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(response.data);
            setAlert('success ', 'Successfully Added');
            dataTableRef.current?.updatePagination(1)
        } else {
            setAlert('error', response.message);
        }
    };

    const onUpdate = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/racks/${companyRackId.rackId}`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setIsShowSplit(false);
            setSelectedCompany(selectedCompany);
            setAlert('success ', 'Successfully Updated');
            dataTableRef.current?.refreshData()
        } else {
            setAlert('error ', response.message);
        }
    };

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/racks/${companyRackId.rackId}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAction('');
            setSelectedCompany(null);
            setAlert('success ', 'Successfully Deleted ');
            dataTableRef.current?.updatePaginationAfterDelete('rackId', companyRackId.rackId)
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

            saveAsExcelFile(excelBuffer, 'Racks');
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

    const onRowSelect = async (company: CompanyRack, action: any) => {
        await setSelectedCompany(company);
        setcompanyRackId(company);
        setSelectedLocationId(company);
        setAction(action);
        setSelectedKeys(null);

        if (action == ACTIONS.DELETE) {
            return;
        }

        setDetails(null);

        if (action == ACTIONS.EDIT) {
            console.log('company', company)
            setForm({ ...company });
        }

        setIsShowSplit(true);
    };

    const onInputChange = (name: string | { [key: string]: any }, val?: any) => {
        setForm((prevForm: any) => {
            let updatedForm = { ...prevForm };

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
                        {action == ACTIONS.ADD ? 'Add Rack' : selectedCompany?.sku}
                    </div>
                </div>
            </div>
        );
    };
    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                {action == ACTIONS.VIEW_PERMISSIONS ? <Button label="Back" severity="secondary" text onClick={() => setAction(ACTIONS.VIEW)} /> : <div></div>}
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
                    <h3 className='mb-0'>Racks</h3>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <DownloadBarcodeButton url={`/company/${get(user, 'company.companyId')}/download-barcodes`} type={'RACK'} ids={filterArray(companies, filters).length > 0 ? filterArray(companies, filters).map((item) => item.rackId) : []} />
                    <div className=" ">
                        <Button label="Rack" size="small" icon="pi pi-plus" className=" mr-2" disabled={isButtonDisabled} onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();

    const handleLocationChange = (e: any) => {
        const selectedLocation = e.value; // e.value contains the selected location object
        onInputChange({
            warehouseId: selectedLocation.warehouseId,
            location: selectedLocation.location
        }); // Store the locationId in the form
    };
    const handleRackTypeChange = (e: any) => {
        const selectedRackType = selectedrackTypeId.find((rack: any) => rack.masterCodeId === e.target.value);
        if (selectedRackType) {
            onInputChange({
                rackTypeId: selectedRackType.masterCodeId,
                value: selectedRackType.value
            });
        }
    };

    const renderRackType = (item: any) => get(item, 'rackType.code');
    const renderWarehouse = (item: any) => get(item, 'warehouse.name');
    const renderRows = (item: any) => get(item, 'rows', []).length;
    const rackTypeDropdown = (options: any) => <Dropdown filter value={options.value || null} options={permissions} optionLabel='code' optionValue='masterCodeId' onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select rack type" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />;
    const warehouseDropdown = (options: any) => <Dropdown filter value={options.value || null} options={details} optionLabel='name' optionValue='warehouseId' onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select location" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />;

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <CustomDataTable
                                ref={dataTableRef}
                                filter
                                page={page}
                                limit={limit} // no of items per page
                                totalRecords={totalRecords} // total records from api response
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                data={companies}
                                columns={[
                                    {
                                        header: '#',
                                        field: 'rackId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { width: 100 },
                                        filterPlaceholder: 'Rack Id'
                                    },
                                    {
                                        header: 'Name',
                                        field: 'sku',
                                        filter: true,
                                        filterPlaceholder: 'Search name'
                                    },
                                    {
                                        header: 'Rack Type',
                                        field: 'rackTypeId',
                                        body: renderRackType,
                                        filter: true,
                                        filterElement: rackTypeDropdown,
                                        filterPlaceholder: 'Search rack type'
                                    },
                                    {
                                        header: 'Warehouse',
                                        field: 'warehouseId',
                                        body: renderWarehouse,
                                        filter: true,
                                        filterElement: warehouseDropdown,
                                        filterPlaceholder: 'Search warehouse'
                                    },
                                    {
                                        header: '# Rows',
                                        field: 'noOfRows',
                                        body: renderRows,
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onEdit={(item: any) => onRowSelect(item, 'edit')}
                                onDelete={(item: any) => onRowSelect(item, 'delete')}
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
                                                <label htmlFor="location">
                                                    Location <span className="red">*</span>
                                                </label>
                                                <Dropdown
                                                    value={companyAllLocation.find((loc: any) => loc.warehouseId === get(form, 'warehouseId')) || null}
                                                    onChange={handleLocationChange}
                                                    options={companyAllLocation}
                                                    optionLabel="name" // Display location name in dropdown
                                                    placeholder="Select"
                                                />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="desc">
                                                    Description <span className="red">*</span>
                                                </label>
                                                <InputText id="desc" value={get(form, 'desc')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('desc', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="value">
                                                    Rack Type <span className="red">*</span>
                                                </label>
                                                <Dropdown
                                                    value={get(form, 'rackTypeId')}
                                                    onChange={(e) => handleRackTypeChange(e)}
                                                    options={selectedrackTypeId}
                                                    optionLabel="code"
                                                    optionValue="masterCodeId"
                                                    placeholder="Select"
                                                    dataKey="value"
                                                />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="noOfRows">
                                                    {' '}
                                                    No.Of Rows <span className="red">*</span>
                                                </label>
                                                <InputText id="noOfRows" value={String(get(form, 'noOfRows') ?? '')} onChange={(e) => onInputChange('noOfRows', e.target.value)} />
                                            </div>
                                            {action === ACTIONS.ADD && (
                                                <div className="field">
                                                    <label htmlFor="noOfRacks">
                                                        No. of Racks <span className="red">*</span>
                                                    </label>
                                                    <InputText id="noOfRacks" value={String(get(form, 'noOfRacks') ?? '')} onChange={(e) => onInputChange('noOfRacks', e.target.value)} />
                                                </div>
                                            )}
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
                        <Button label="Save" severity="danger" disabled={selectedLocationId?.data?.name != confirmTextValue || confirmTextValue == '' || isLoading} onClick={onSave} />
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
                            This will remove <strong>{selectedLocationId?.data?.name}</strong>.<br /> Do you still want to remove it? This action cannot be undone.
                        </span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <span>
                            Confirm you want to delete this by typing its name: <strong>{selectedLocationId?.data?.name}</strong>
                        </span>
                        <br />
                        <InputText placeholder={selectedLocationId?.data?.name} style={{ marginTop: 10 }} onChange={onValueChange} />
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

export default RackPage;
