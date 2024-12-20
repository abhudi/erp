


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { GradeTobin, CustomResponse, Roles } from '../../../types';
import { Panel } from 'primereact/panel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, head, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { EmptyGradeToBin } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { buildQueryParams, getRowLimitWithScreenHeight, validateCountryCode, validateEmail, validateName, validatePhoneNumber, validateSubdomain } from '../../../utils/uitl';
import { COMPANIES_MENU, COMPANY_MENU, CompanyModule, CompanyWrite, DashboardModule } from '../../../config/permissions';
import { InputSwitch } from 'primereact/inputswitch';
import DefaultLogo from '../../../components/DefaultLogo';
import RightSidePanel from '../../../components/RightSidePanel';
import { RadioButton } from 'primereact/radiobutton';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import Sidebar from '../../../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const defaultForm: EmptyGradeToBin = {
    binGradeId: ''
};

const GradeToBinPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<GradeTobin[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<GradeTobin | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyGradeToBin>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [roles, setRoles] = useState<any>([]);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [selectedAutoValue, setSelectedAutoValue] = useState<any[] | null>([]);
    const [autoFilteredValue, setAutoFilteredValue] = useState<any[]>([]);
    const [companyUserId, setCompanyUserId] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any[]>([]);
    const [ingredient, setIngredient] = useState('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const [inputValue, setInputValue] = React.useState<string>('');
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [selectedGradeCode, setSelectedGradeCode] = useState<string>('');
    const [MasterCodeType, setMasterCodeType] = useState<any>([]);
    const toast = useRef<Toast>(null);
    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchMasterCodeType();
        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        const savedCompany = localStorage.getItem('selectedCompany');
        if (savedCompany) {
            setSelectedCompany(JSON.parse(savedCompany));
        }
    }, []);
    useEffect(() => {
        console.log('Current MasterCodeType state:', MasterCodeType);
        if (MasterCodeType) {
            console.warn('MasterCodeType is not an array:', MasterCodeType);
        }
    }, [MasterCodeType]); // Trigger on each update to MasterCodeType
    useEffect(() => {
        console.log(companies, 'abhishek - companies updated');
    }, [companies]);
    useEffect(() => {
        // Trigger API call when both grade and bin are set
        if (selectedOption && inputValue) {
            onNewAdd();
        }
    }, [selectedOption, inputValue]);

    const fetchData = async (params?: any) => {
        const companyId = get(user, 'company.companyId');

        console.log('Incoming params:', params); // Log incoming params

        // Set default values if params are undefined
        const { sortBy = 'binId', sortOrder = 'asc', ...otherParams } = params || {};

        console.log('sortBy:', sortBy, 'sortOrder:', sortOrder); // Log values used for query

        // Ensure sortOrder is valid ('asc' or 'desc')
        const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc';

        // Construct query parameters safely
        const queryParams = {
            sortBy,
            sortOrder: validSortOrder,
            ...otherParams
        };

        console.log('Query Params:', queryParams); // Log the final query params

        const queryString = new URLSearchParams(queryParams).toString();

        console.log('Query String:', queryString); // Log query string

        setLoading(true);

        try {
            const response: CustomResponse = await GetCall(`/company/${companyId}/bin-grades?${queryString}`);
            console.log('Fetched companies:', response.data);

            if (response.code === 'SUCCESS') {
                setCompanies(response.data);
            } else {
                console.warn('Failed to fetch companies:', response);
                setCompanies([]);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };
    const fetchMasterCodeType = async (params?: any) => {
        const companyId = get(user, 'company.companyId');
        const type = params?.type || 'Internal Grade';

        setLoading(true);

        try {
            const response: CustomResponse = await GetCall(`/company/${companyId}/master-codes-by-types/${encodeURIComponent(type)}`);
            console.log('Fetched data mastercode:', response.data);
            if (response.code === 'SUCCESS') {
                // Ensure the response.data is an array
                setMasterCodeType(response.data); // Set to an array from the API response
            } else {
                console.warn('Failed to fetch master code types:', response);
            }
        } catch (error) {
            console.error('Error fetching master code types:', error);
        }
    };

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false);
        setForm(defaultForm);
        setAction(null);
        setSelectedKeys(null);
        setSelectedAutoValue(null);
    };

    const showAddNew = () => {
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm(defaultForm);
    };

    const onSave = () => {
        if (action == ACTIONS.EDIT) {
            const selectedItems = selectedAutoValue;
            const filteredItems = filter(selectedItems, (item) => item.roleId != null);
            const permissionIds = map(filteredItems, 'roleId');
            console.log('form', form);
            // onUpdate(form);
            return;
        }

        if (action == ACTIONS.ADD) {
            const selectedItems = selectedAutoValue;
            const filteredItems = filter(selectedItems, (item) => item.roleId != null);
            return;
        }

        if (action == ACTIONS.DELETE) {
            onDelete();
        }
    };
    console.log(MasterCodeType, 'MasterCodeTypeMasterCodeType');
    const onNewAdd = async () => {
        if (!selectedOption || !inputValue) {
            setAlert('error', 'Please select a grade and enter a bin.'); // Validate inputs
            return;
        }

        const companyForm = {
            gradeId: selectedOption, // Add selected gradeId
            binId: inputValue // Add input value as bin
            // You can add more fields if needed
        };

        const companyId = user?.company?.companyId;
        setIsDetailLoading(true);

        try {
            const response = await PostCall(`/company/${companyId}/bin-grades`, companyForm);

            if (response.code === 'SUCCESS') {
                console.log('New entry added:', response.data);
                setAlert('success', 'Data Added Successfully');
                setSelectedCompany(response.data);
                setIsShowSplit(false);
                dataTableRef.current?.updatePagination(1); // Refresh data table

                setSelectedOption(null); // Clear dropdown selection
                setInputValue(''); // Clear input field
            } else {
                setAlert('error', response.message);
            }
        } catch (error) {
            setAlert('error', 'Failed to add new entry.');
        } finally {
            setIsDetailLoading(false);
        }
    };

    console.log(selectedCompany, 'Selected Company');
    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        const binGradeId = selectedCompany?.binGradeId;
        if (!binGradeId) {
            console.error('No valid binGradeId found for deletion.');
            setAlert('error', 'No item selected for deletion.');
            return;
        }
        console.log(binGradeId, 'bingradeid');
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/bin-grades/${binGradeId}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAlert('success', 'Deleted successfully');
            setAction('');
            setSelectedCompany(null);
        } else {
            setAlert('error', response.message);
        }
    };

    const onGlobalFilterChange = (e: any) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    const onRowSelect = async (company: GradeTobin, action: any) => {
        await setSelectedCompany(company);
        setAction(action);
        setSelectedKeys(null);
        setSelectedAutoValue(null);

        if (action == ACTIONS.DELETE) {
            return;
        }

        setDetails(null);
        setTimeout(() => {
            // fetchDetails(company);
        }, 500);

        if (action == ACTIONS.EDIT) {
            setCompanyUserId(company.binGradeId);
            setForm(company);
        }

        setIsShowSplit(true);
    };

    const onInputChange = (firstName: any, val: any) => {
        const regex = /^[a-zA-Z]*$/;
        // if (['name', 'pocName', 'altPOCName'].includes(name) && !regex.test(val) && val != '') {
        //     return;
        // }

        let _form: any = { ...form };
        _form[`${firstName}`] = val;
        setForm(_form);
    };

    const onValueChange = (e: any) => setConfirmValue(e.target.value);

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {/* {action == ACTIONS.ADD ? 'Add Pallet' : selectedCompany?.user?.displayName}
                        {action == ACTIONS.EDIT ? 'Edit Pallet' : selectedCompany?.user?.displayName} */}
                    </div>
                </div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                {/* {
                    action == ACTIONS.VIEW_PERMISSIONS ? <Button label="Back" severity="secondary" text onClick={() => setAction(ACTIONS.VIEW)} /> : <div></div>
                } */}
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    {[ACTIONS.EDIT, ACTIONS.ADD, ACTIONS.VIEW_PERMISSIONS].includes(action) && <Button label="Save" disabled={isLoading || isDetailLoading} onClick={onSave} />}
                </div>
            </div>
        );
    };

    const onCategoryChange = (e: any) => {
        const gradeId = e.value as number;
        setSelectedOption(gradeId);

        // Find and display the corresponding grade code
        const selectedGrade = companies.find((item) => item.grade.masterCodeId === gradeId);
        setSelectedGradeCode(selectedGrade?.grade?.code || ''); // Set grade code or empty if not found
    };

    const dropdownOptions =
        MasterCodeType?.codes?.map((item: any) => ({
            label: item.value, // Display field from `codes`
            value: item.masterCodeId // Unique key
        })) || [];

    const renderHeader = () => {
        return (
            <div style={{ width: '100%' }}>
                <div className="flex justify-content-between p-4">
                    <span className="p-input-icon-left flex align-items-center">
                        <h4 className="mb-0">Grade To Bin</h4>
                    </span>
                </div>
                <div className="card flex justify-content-between gap-3 mt-3">
                    <div style={{ width: '50%' }}>
                        <label htmlFor="categoryDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Grade
                        </label>
                        <Dropdown value={selectedOption} options={dropdownOptions} onChange={(e) => setSelectedOption(e.value)} placeholder="Select Grade" className="mr-2" style={{ width: '100%' }} />
                    </div>
                    <div style={{ width: '50%' }}>
                        <label htmlFor="inputWithIcon" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Bin
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <InputText
                                id="inputWithIcon"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter Bin"
                                style={{ width: '100%', paddingRight: '2.5rem' }} // Reserve space for the icon
                            />
                            <i
                                className="pi pi-qrcode"
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6c757d'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const header = renderHeader();

    const actionTemplate = (rowData: GradeTobin, options: ColumnBodyOptions) => {
        return (
            <div className="flex">
                <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'view')} />
                <Button
                    type="button"
                    icon={'pi pi-pencil'}
                    className="p-button-sm p-button-text"
                    onClick={() => {
                        onRowSelect(rowData, 'edit');
                    }}
                />
                <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
            </div>
        );
    };

    const nodeTemplate = (node: any) => {
        return (
            <div>
                <p className="m-0 p-0">{node.label}</p>
                {/* {
                    get(node, 'data.desc') && <p style={{ margin: 0, fontSize: 'small', color: 'gray' }}>{node.data.module}: {node.data.desc}</p>
                } */}
            </div>
        );
    };

    const handleChange = (e: any) => {
        const selectedItem = e.value;

        setSelectedAutoValue(e.value);
    };
    // const toast = useRef(null);

    // const onUpload = () => {
    //     toast.current?.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    // };

    const transformedData = companies.map((item: any) => ({
        binGradeId: item.binGradeId,
        sku: item.bin?.sku || 'N/A', // Handle missing bin gracefully
        code: item.grade?.code || 'N/A' // Handle missing grade gracefully
    }));
    console.log(transformedData, 'transformeddata');
    return (
        <>
            <div className="grid" style={{ height: '400px', overflowY: 'auto' }}>
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
                                isDelete={true} // show delete button
                                // always map data into one level data instead of nested keys
                                data={transformedData}
                                // provides columns as PrimeReact DataTable
                                columns={[
                                    {
                                        header: '#',
                                        field: 'binGradeId',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search Id'
                                    },
                                    {
                                        header: 'Grade',
                                        field: 'code',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search PO Number'
                                    },
                                    {
                                        header: 'Bin',
                                        field: 'sku',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search name'
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onEdit={(item: any) => onRowSelect(item, 'edit')}
                                onView={(item: any) => onRowSelect(item, 'view')}
                                onDelete={(item: any) => onRowSelect(item, 'delete')}
                            />
                        </div>
                        <Sidebar
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

                                    {/* Edit Roles */}
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div></div>}
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
                            This will remove <strong></strong>.<br /> Do you still want to remove it? This action cannot be undone.
                        </span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

const findSelectedKeys = (nodes: any[]): any => {
    let selectedKeys: any = {};
    let parents: any = {}; // To keep track of parent nodes

    const traverse = (node: any) => {
        if (node) {
            selectedKeys[node.key] = {
                checked: true
            }; // Mark the current node as selected
        }
        let allChildrenSelected = true;
        let anyChildSelected = false;

        if (node.children) {
            node.children.forEach((child: any) => {
                traverse(child); // Recursively process children

                if (selectedKeys[child.key] && selectedKeys[child.key].checked === true) {
                    anyChildSelected = true; // At least one child is selected
                } else {
                    allChildrenSelected = false; // Not all children are selected
                }
            });

            // Determine the state of the current node based on its children
            if (anyChildSelected) {
                parents[node.key] = {
                    checked: allChildrenSelected,
                    partialChecked: !allChildrenSelected
                };
            }
        }
    };

    nodes.forEach(traverse);

    // Merge parents into selectedKeys
    Object.keys(parents).forEach((key) => {
        selectedKeys[key] = parents[key];
    });

    return selectedKeys;
};

export default GradeToBinPage;
