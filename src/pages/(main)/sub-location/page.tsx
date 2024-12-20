


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { MultiSelect } from 'primereact/multiselect';
import { CompanySubLocation, CustomResponse, Permissions } from '../../../types';
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
import { EmptySubLocation } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, formatString, getRowLimitWithScreenHeight, validateName, validatePhoneNumber, validateString, validateSubdomain, validateZipNumber } from '../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../config/permissions';
import { InputSwitch } from 'primereact/inputswitch';
import DefaultLogo from '../../../components/DefaultLogo';
import RightSidePanel from '../../../components/RightSidePanel';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
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

const defaultForm: EmptySubLocation = {
    // isActive: true,
    locationId: null,
    // companyId: null,
    warehouseId: null,
    name: '',
    location: '',
    description: '',
    warehouse:{
        name:'',
    }
};

const SubLocationPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<CompanySubLocation[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanySubLocation | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [rolename, setRolename] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [selectedLocationId, setSelectedLocationId] = useState<any>(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptySubLocation>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [companyAllLocation, setcomapnyAllLocation] = useState<any>(null);
    const [addWarehouse, setAddWarehouse] = useState<any>(null);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [companywarehouseId, setcompanywarehouseId] = useState<any>(null);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);

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
        const response: CustomResponse = await GetCall(`/company/${companyId}/sub-locations?${queryString}`); // get all the roles
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            fetchPermissions();
            setSelectedCompany(null);
            if (response.total) {
                setTotalRecords(response?.total);
            }
        } else {
            setCompanies([]);
        }
    };

    const fetchPermissions = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/warehouses?limit=500`); // get company all roles
        if (response.code == 'SUCCESS') {
            setcomapnyAllLocation(response.data);
        } else {
            setcomapnyAllLocation([]);
        }
        setLoading(false);
    };

    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.locationId?.toString(),
        data: {
            warehouseId: company.warehouseId,
            locationId: company.locationId,
            name: company.name,
            location: company.location,
            description: company.description
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
        fetchPermissions();
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
            console.log('form', form);
            onUpdate(form);
        }

        if (action == ACTIONS.DELETE) {
            onDelete();
        }
    };

    const onNewAdd = async (companyForm: any) => {
        if (!validateString(companyForm.name)) {
            setAlert('error', 'Please provide valid name');
            return;
        }

        setIsDetailLoading(true);
        const companyId = get(user, 'company.companyId');
        const response: CustomResponse = await PostCall(`/company/${companyId}/warehouses/${addWarehouse?.warehouseId}/sub-locations`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(response.data);
            setAlert('success', 'Successfully Added');
            dataTableRef.current?.updatePagination(1);
        } else {
            setAlert('error', response.message);
        }
    };

    const onUpdate = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        if (!validateString(companyForm.name)) {
            setAlert('error', 'Please provide valid name');
            return;
        }

        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/warehouses/${companywarehouseId?.warehouseId}/sub-locations/${selectedLocationId?.locationId}`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setIsShowSplit(false);
            setSelectedCompany(selectedCompany);
            fetchData();
            setAlert('success', 'Successfully Updated');
            dataTableRef.current?.refreshData();
        } else {
            setAlert('error ', response.message);
        }
    };

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/warehouses/${companywarehouseId?.warehouseId}/sub-locations/${selectedLocationId?.locationId}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAction('');
            setSelectedCompany(null);
            dataTableRef.current?.updatePaginationAfterDelete('locationId', selectedLocationId?.locationId);
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

            saveAsExcelFile(excelBuffer, 'Sub_Location');
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

    const onRowSelect = async (company: CompanySubLocation, action: any) => {
        console.log('274',company)
        await setSelectedCompany(company);
        setcompanywarehouseId(company);
        setSelectedLocationId(company);
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
            setForm({ ...company });
        }

        setIsShowSplit(true);
    };

    const onInputChange = (name: string | { [key: string]: any }, val?: any) => {
        setForm((prevForm: any) => {
            let updatedForm = { ...prevForm };

            if (typeof name === 'string') {
                // Single field update
                updatedForm[name] = val;
            } else {
                // Multiple fields update (assuming name is an object containing key-value pairs)
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
                        {action == ACTIONS.ADD ? 'Add Sub Location' : selectedCompany?.name}
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
                    <h4 className="mb-0">Sub locations</h4>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <div className=" ">
                        <Button label="Sub Location" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();
    const actionTemplate = (rowData: CompanySubLocation, options: ColumnBodyOptions) => {
        return (
            <div className="flex">
                {/* <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'view')} /> */}
                <Button type="button" icon={'pi pi-pencil'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'edit')} />
                <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
            </div>
        );
    };
    const handleLocationChange = (e: any) => {
        const selectedLocation = e.value;
        setAddWarehouse(e.value);
        onInputChange({
            warehouseId: selectedLocation.warehouseId,
            location: selectedLocation.location
        }); // Store the locationId in the form
    };

    const roleBodyTemplate = (item: any) => item.warehouse.name;

    const statusRowFilterTemplate = (options: any) => {
        return (
            <Dropdown
                filter
                value={options.value}
                options={companyAllLocation}
                optionLabel="name"
                optionValue="warehouseId"
                onChange={(e) => options.filterApplyCallback(e.value)}
                placeholder="Select Location"
                className="p-column-filter"
                showClear
                style={{ minWidth: '12rem' }}
            />
        );
    };
    console.log('401',form)
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
                                limit={limit}
                                page={page}
                                totalRecords={totalRecords}
                                data={companies}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                columns={[
                                    {
                                        header: 'Name',
                                        field: 'name',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search name'
                                    },
                                    {
                                        header: 'Location',
                                        field: 'warehouseId',
                                        body: roleBodyTemplate,
                                        filter: true,
                                        filterElement: statusRowFilterTemplate,
                                        filterPlaceholder: 'Search location'
                                    },
                                    {
                                        header: 'Description',
                                        field: 'description',
                                        // body: descBodyTemplate,
                                        filter: true,
                                        sortable: true,
                                        // filterElement: statusRowFilterTemplate,
                                        filterPlaceholder: 'Search description'
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
                                {(action === ACTIONS.ADD || action === ACTIONS.EDIT) && (
                                    <div className="p-fluid">
                                        <div className="field">
                                            <label htmlFor="name">
                                                Name <span className="red">*</span>
                                            </label>
                                            <InputText
                                                id="name"
                                                value={get(form, 'name')}
                                                validateOnly
                                                pattern="[a-zA-Z]*"
                                                onChange={(e) => onInputChange('name', e.target.value)}
                                            />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="location">
                                                Location <span className="red">*</span>
                                            </label>
                                            <Dropdown
                                                value={companyAllLocation.find((loc: any) => loc.warehouseId === get(form, 'warehouseId')) || null}
                                                onChange={handleLocationChange}
                                                options={companyAllLocation}
                                                optionLabel="name"
                                                placeholder="Select"
                                                disabled={action === ACTIONS.EDIT} // Disable dropdown when action is EDIT
                                            />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="description">
                                                Description <span className="red">*</span>
                                            </label>
                                            <InputText
                                                id="description"
                                                value={get(form, 'description')}
                                                onChange={(e) => onInputChange('description', e.target.value)}
                                                disabled={action === ACTIONS.EDIT}
                                            />
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
                style={{ width: layoutState.isMobile ? '90vw' : '40vw' }}
                className="delete-dialog"
                headerStyle={{ backgroundColor: '#ffdddb', color: '#8c1d18' }}
                footer={
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                        <Button label="Save" severity="danger" disabled={isLoading} onClick={onSave} />
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
                        <span className="line-height-4">
                            This will remove <strong>{selectedLocationId?.name}</strong>.<br /> Do you still want to remove it? This action cannot be undone.
                        </span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};
export default SubLocationPage;
