

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Panel } from 'primereact/panel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, filterArray, formatString, getRowLimitWithScreenHeight, validateName, validateNumberOfRacks, validatePhoneNumber, validateSubdomain, validateZipNumber } from '../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../config/permissions';
import { InputSwitch } from 'primereact/inputswitch';
import { TreeTable, TreeTableFilterMeta } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from "primereact/dropdown";
import { constant } from '../../../utils/constant'
import { EmptyBin } from '../../../types/forms';
import { useAppContext } from '../../../layout/AppWrapper';
import { CompanyBin, CustomResponse } from '../../../types';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import DownloadBarcodeButton from '../../../components/DownloadBarcodeButton';
import RightSidePanel from '../../../components/RightSidePanel';
import { LayoutContext } from '../../../layout/context/layoutcontext';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
}

const defaultForm: EmptyBin = {
    rowId: null,
    rackTypeId: null,
    capacityId: null,
    rackId: null,
    noOfBins: null,
    warehouseId: null

}

const BinPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<CompanyBin[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyBin | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<TreeTableFilterMeta>({});
    const [selectedLocationId, setSelectedLocationId] = useState<any>(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyBin>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [companyAllLocation, setcomapnyAllLocation] = useState<any>(null);
    const [companyRackId, setcompanyRackId] = useState<any>(null);
    const [selectedBinTypeId, setSelectedBinTypeId] = useState<any>(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null)

    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchDetails()
        fetchPermissions()

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
        const response: CustomResponse = await GetCall(`/company/${companyId}/bins?${queryString}`);// get all the Racks
        setLoading(false)
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            setSelectedCompany(null)
            if (response.total) {
                setTotalRecords(response?.total)
            }
        }
        else {
            setCompanies([]);
        }
    }

    const fetchPermissions = async () => {
        const companyId = get(user, 'company.companyId')
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/warehouses?limit=500`);// get company all roles
        if (response.code == 'SUCCESS') {
            setcomapnyAllLocation(response.data);
        }
        else {
            setcomapnyAllLocation([]);
        }
        setLoading(false)
    }

    const fetchDetails = async () => {
        const companyId = get(user, 'company.companyId')
        const type = constant.SYSTEM_MSTR_CODE.binCapacity
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/master-codes-by-types/${type}`);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setSelectedBinTypeId(response.data.codes)
        }
    }
    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.binId?.toString(),
        data: {
            binId: company.binId,
            rackId: company.rackId,
            name: company.sku,
            rowId: company.rowId,
            value: company.binCapacity?.value,
            capacityId: company.capacityId,
            location: company.warehouse?.location,
            warehouseId: company.warehouseId,
        }
    }));

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false)
        setForm(defaultForm)
        setAction(null)
    }

    const showAddNew = () => {
        // fetchPermissions();
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm(defaultForm);
    }

    const onSave = () => {
        if (action == ACTIONS.ADD) {
            onNewAdd({ ...form })
            setIsShowSplit(false)
            return;
        }

        if (action == ACTIONS.EDIT) {
            onUpdate(form);
        }

        if (action == ACTIONS.DELETE) {
            onDelete();
        }
    }

    const onNewAdd = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId')
        if (!validateNumberOfRacks(companyForm.noOfBins)) {
            setAlert('error', "The bins can't be more than 50")
            return;
        }
        setIsDetailLoading(true);
        const response: CustomResponse = await PostCall(`/company/${companyId}/bins`, companyForm);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setSelectedCompany(response.data)
            setAlert('success ', 'Successfully Added')
            dataTableRef.current?.updatePagination(1);
        }
        else {
            setAlert('error', response.message)
        }
    }


    const onUpdate = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId')
        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/bins/${companyRackId.binId}`, companyForm);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setIsShowSplit(false)
            setSelectedCompany(selectedCompany)
            setAlert('success', 'Successfully Updated')
            dataTableRef.current?.refreshData()
        }
        else {
            setAlert('error ', response.message)
        }
    }

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId')
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/bins/${companyRackId.binId}`);
        setLoading(false)
        if (response.code == 'SUCCESS') {
            setAction('')
            setSelectedCompany(null)
            setAlert('success ', 'Successfully Deleted')
            dataTableRef.current?.updatePaginationAfterDelete('binId', companyRackId.binId)
        }
        else {
            setAlert('error', response.message)
        }
    }
    const exportExcel = () => {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(companies);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            saveAsExcelFile(excelBuffer, 'Bins');
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
        if (!_filters['global']) {
            _filters['global'] = { value: '', matchMode: FilterMatchMode.CONTAINS }
        }
        _filters['global'].value = value;

        if (`${value}`.trim().length == 0) {
            delete _filters['global']
        }

        setFilters(_filters);
    };

    const onRowSelect = async (company: CompanyBin, action: any) => {
        await setSelectedCompany(company);
        setcompanyRackId(company)
        setSelectedLocationId(company)
        setAction(action);

        if (action == ACTIONS.DELETE) {
            return;
        }

        console.log('company', company)
        if (action == ACTIONS.EDIT) {
            setForm({ ...company });
        }

        setIsShowSplit(true);
    }

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
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>{action == ACTIONS.ADD ? 'Add Bin' : selectedCompany?.sku}</div>
                </div>
            </div>
        );
    };
    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                {
                    action == ACTIONS.VIEW_PERMISSIONS ? <Button label="Back" severity="secondary" text onClick={() => setAction(ACTIONS.VIEW)} /> : <div></div>
                }
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    {[ACTIONS.EDIT, ACTIONS.ADD, ACTIONS.VIEW_PERMISSIONS].includes(action) && <Button label="Save" disabled={(isLoading || isDetailLoading)} onClick={onSave} />}
                </div>
            </div>
        );
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h3 className='mb-0'>Bins</h3>
                </span>
                <span className='flex gap-5'>

                    <Button type="button" icon="pi pi-file-excel" size="small" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <DownloadBarcodeButton url={`/company/${get(user, 'company.companyId')}/download-barcodes`} type={'BIN'} ids={filterArray(companies, filters).length > 0 ? filterArray(companies, filters).map((item: any) => item.binId) : []} />
                    <div className=" ">
                        <Button label="Bin" icon="pi pi-plus" size="small" className=" mr-2" disabled={isButtonDisabled} onClick={showAddNew} />
                    </div>
                </span>


            </div>
        );
    };
    const header = renderHeader();
    const actionTemplate = (rowData: CompanyBin, options: ColumnBodyOptions) => {
        return <div className='flex'>
            {/* <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'view')} /> */}
            <Button type="button" icon={'pi pi-pencil'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'edit')} />
            <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
        </div>;
    };

    const nodeTemplate = (node: any) => {
        return (
            <div>
                <p className='m-0 p-0'>{node.data.permission}</p>
                {
                    get(node, 'data.desc') && <p style={{ margin: 0, fontSize: 'small', color: 'gray' }}>{node.data.module}: {node.data.desc}</p>
                }
            </div>
        );
    };

    const handleLocationChange = (e: any) => {
        const selectedLocation = e.value; // e.value contains the selected location object
        onInputChange({
            warehouseId: selectedLocation.warehouseId,
            location: selectedLocation.location
        }); // Store the locationId in the form
    };
    const handleBinTypeChange = (e: any) => {
        const selectedRackType = selectedBinTypeId.find(
            (rack: any) => rack.masterCodeId === e.value
        );

        if (selectedRackType) {
            onInputChange({
                capacityId: selectedRackType.masterCodeId,
                value: selectedRackType.value
            });
        }
    };

    const handleFilterChange = (e: any) => {
        setFilters(e.filters);
    };

    const renderWarehouse = (item: any) => get(item, 'warehouse.name', '');
    const renderCapacity = (item: any) => get(item, 'binCapacity.code', '');
    const capacityDropdown = (options: any) => <Dropdown filter value={options.value || null} options={selectedBinTypeId} optionLabel='code' optionValue='masterCodeId' onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select capacity" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />;
    const warehouseDropdown = (options: any) => <Dropdown filter value={options.value || null} options={companyAllLocation} optionLabel='name' optionValue='warehouseId' onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select location" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />;

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
                                        field: 'binId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { width: 100 },
                                        filterPlaceholder: 'Bin Id'
                                    },
                                    {
                                        header: 'Name',
                                        field: 'binNumber',
                                        filter: true,
                                        filterPlaceholder: 'Search name'
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
                                        header: 'Capacity',
                                        field: 'capacityId',
                                        body: renderCapacity,
                                        filter: true,
                                        filterElement: capacityDropdown
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
                            content={<>
                                {
                                    isDetailLoading && <div className='center-pos'>
                                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                    </div>
                                }

                                {/* Edit Permissions */}
                                {
                                    (action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div className="p-fluid">
                                        <div className="field">
                                            <label htmlFor="location">
                                                Location <span className="red">*</span>
                                            </label>
                                            <Dropdown
                                                value=
                                                {companyAllLocation.find((loc: any) => loc.warehouseId === get(form, 'warehouseId')) || null}
                                                onChange={handleLocationChange}
                                                options={companyAllLocation}
                                                optionLabel="name" // Display location name in dropdown
                                                placeholder="Select"
                                            />
                                        </div>
                                        <div className="field">
                                            <label htmlFor="location">
                                                Bin Capacity <span className="red">*</span>
                                            </label>
                                            <Dropdown
                                                value={get(form, 'capacityId')}
                                                onChange={handleBinTypeChange}
                                                options={selectedBinTypeId}
                                                optionValue='masterCodeId'
                                                optionLabel="code"
                                                placeholder="Select"
                                            />
                                        </div>
                                        {action === ACTIONS.ADD && (
                                            <div className="field">
                                                <label htmlFor="noOfBins">
                                                    No. of Bins <span className="red">*</span>
                                                </label>
                                                <InputText
                                                    id="noOfBins"
                                                    value={String(get(form, 'noOfBins') ?? '')}
                                                    onChange={(e) => onInputChange('noOfBins', e.target.value)}
                                                />
                                            </div>
                                        )}
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
                        <Button label="Save" severity="danger" disabled={(selectedLocationId?.data?.name != confirmTextValue || confirmTextValue == '' || isLoading)} onClick={onSave} />
                    </div>
                )} onHide={closeIcon}>
                {
                    isLoading && <div className='center-pos'>
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                }
                <div className="flex flex-column w-full surface-border p-3">
                    <div className='flex align-items-center'>
                        <i className="pi pi-info-circle text-6xl red" style={{ marginRight: 10 }}></i>
                        <span>This will remove <strong>{selectedLocationId?.data?.name}</strong>.<br /> Do you still want to remove it? This action cannot be undone.</span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <span>Confirm you want to delete this by typing its name: <strong>{selectedLocationId?.data?.name}</strong></span><br />
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


export default BinPage;




