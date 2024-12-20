


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Pallet, CustomResponse, Roles } from '../../../types';
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
import { EmptyPallet } from '../../../types/forms';
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

const defaultForm: EmptyPallet = {
    palletId: [],
    po: [
        {
            poNumber: ''
        }
    ]
};

const GradePage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<Pallet[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Pallet | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyPallet>(defaultForm);
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
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchRolesData();
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
        console.log(companies, 'abhishek - companies updated');
    }, [companies]);

    const fetchData = async (params?: any) => {
        const companyId = get(user, 'company.companyId');

        console.log('Incoming params:', params); // Log incoming params

        // Set default values if params are undefined
        const { sortBy = 'poId', sortOrder = 'asc', ...otherParams } = params || {};

        console.log('sortBy:', sortBy, 'sortOrder:', sortOrder); // Log values used for query

        // Ensure sortOrder is valid ('asc' or 'desc')
        const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc';

        // Construct query parameters safely
        const queryParams = {
            groupBy: 1,
            sortBy,
            sortOrder: validSortOrder,
            ...otherParams
        };

        console.log('Query Params:', queryParams); // Log the final query params

        const queryString = new URLSearchParams(queryParams).toString();

        console.log('Query String:', queryString); // Log query string

        setLoading(true);

        try {
            const response: CustomResponse = await GetCall(`/company/${companyId}/pallet-receiving?${queryString}`);

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

    const fetchRolesData = async (params?: any) => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/roles`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setRoles(response.data);
        } else {
            setRoles([]);
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
            const permissionIds = map(filteredItems, 'roleId');
            onNewAdd({ ...form, roles: permissionIds });
            return;
        }

        if (action == ACTIONS.DELETE) {
            onDelete();
        }
    };

    const onNewAdd = async (companyForm: any) => {
        console.log('onNewAdd called with:', companyForm); // Log payload

        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);

        try {
            const response: CustomResponse = await PostCall(`/company/${companyId}/pallet-receiving`, companyForm);

            if (response.code === 'SUCCESS') {
                console.log('New entry added:', response.data);
                setSelectedCompany(response.data); // Update state with new company
                setIsShowSplit(false); // Hide modal if used
                dataTableRef.current?.updatePagination(1); // Refresh the data table
            } else {
                setAlert('error', response.message); // Show error message
            }
        } catch (error) {
            console.error('Error in onNewAdd:', error);
            setAlert('error', 'Failed to add new entry.'); // Handle network errors
        } finally {
            setIsDetailLoading(false); // Stop loading indicator
        }
    };

    // const onUpdate = async (companyForm: any) => {
    //     const companyId = get(user, 'company.companyId');
    //     if (!validateName(companyForm.firstName)) {
    //         setAlert('error', 'Please provide valid First name');
    //         return;
    //     }
    //     if (!validateName(companyForm.lastName)) {
    //         setAlert('error', 'Please provide valid Last name');
    //         return;
    //     }
    //     if (!validateCountryCode(companyForm.countryCode)) {
    //         setAlert('error', 'Please provide valid Country Code');
    //         return;
    //     }

    //     if (!validatePhoneNumber(companyForm.phone)) {
    //         setAlert('error', 'Please provid valid phone number');
    //         return;
    //     }

    //     setIsDetailLoading(true);
    //     const response: CustomResponse = await PutCall(`/company/${companyId}/company-users/${selectedCompany?.companyUserId}`, companyForm);
    //     setIsDetailLoading(false);
    //     if (response.code == 'SUCCESS') {
    //         setSelectedCompany(null);
    //         setIsShowSplit(false);
    //         dataTableRef.current?.refreshData();
    //     } else {
    //         setAlert('error', response.message);
    //     }
    // };

    console.log(selectedCompany, 'Selected Company');
    const onDelete = async () => {
        const palletIdString = selectedCompany?.palletIds; // Extract the palletIds string from selectedCompany
        console.log(palletIdString, 'palletIds string');

        if (!palletIdString) {
            setAlert('error', 'No Pallet IDs provided');
            return;
        }

        const palletIdsArray = palletIdString
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id));

        console.log(palletIdsArray, 'palletIds array');
        const companyId = get(user, 'company.companyId'); // Get the companyId from the user object
        setLoading(true);
        setLoading(true);

        try {
            const response: CustomResponse = await PostCall(`/company/${companyId}/pallet-receiving/delete`, {
                palletIds: palletIdsArray // Payload containing palletIds
            });
            console.log(response, 'Delete Response');
            if (response.code === 'SUCCESS') {
                setAlert('success', 'Deleted successfully');
                setAction('');
                setSelectedCompany(null);
            } else {
                setAlert('error', response.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            setAlert('error', 'Failed to delete');
        } finally {
            setLoading(false);
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
    const onRowSelect = async (company: Pallet, action: any) => {
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
                        {action == ACTIONS.ADD ? 'Add Pallet' : ''}
                        {action == ACTIONS.EDIT ? 'Edit Pallet' : ''}
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

    const onCategoryChange = (e: { value: string }) => {
        setSelectedOption(e.value);
        console.log('Selected Category:', e.value); // Optional logging for debugging
    };

    const dropdownOptions = [
        { label: 'Technology', value: 'technology' },
        { label: 'Finance', value: 'finance' },
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Education', value: 'education' }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    const renderHeader = () => {
        return (
            <div style={{ width: '100%' }}>
                <div className="flex justify-content-between p-4">
                    <span className="p-input-icon-left flex align-items-center">
                        <h4 className="mb-0">Grade </h4>
                    </span>
                </div>
                <div className="card flex justify-content-between gap-3 mt-3">
                    <div style={{ width: '50%' }}>
                        <label htmlFor="inputWithIcon" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            REID
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <InputText
                                id="inputWithIcon"
                                onChange={handleInputChange}
                                value={inputValue}
                                placeholder="Enter REID"
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
                    <div style={{ width: '50%' }}>
                        <label htmlFor="inputWithIcon" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Graded Bin
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <InputText
                                id="inputWithIconn"
                                value={inputValue}
                                placeholder="Enter Graded Bin"
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
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            onNewAdd({ inputValue }); // Pass the input value as companyForm
        }
    };
    const palletHeader = () => {
        const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && inputValue.trim()) {
                console.log('Enter key pressed with value:', inputValue);

                // Create the payload to send in the request
                const companyForm = {
                    prDate: new Date().toISOString(),
                    poId: inputValue.trim(),
                    vendorOrderRef: '',
                    note: null
                };

                // Call the API to add the new data
                await onNewAdd(companyForm);

                // Clear the input field after successful addition
                setInputValue('');
            }
        };

        return (
            <div className="flex justify-content-between mx-3">
                <div style={{ position: 'relative' }}>
                    <InputText
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown} // Call API on Enter key press
                        placeholder="Enter PO ID"
                        style={{ paddingRight: '30px' }}
                    />
                    <span
                        className="pi pi-qrcode"
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'blue',
                            fontSize: '1.5rem'
                        }}
                    ></span>
                </div>
            </div>
        );
    };

    const palletheader = palletHeader();
    const actionTemplate = (rowData: Pallet, options: ColumnBodyOptions) => {
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

    // const selectedPermissions = filter(get(details, 'roles', []), (item) => item.role?.name )

    const searchCountry = (event: { query: string }) => {
        const query = event.query.toLowerCase();
        const filteredItems = permissions.filter((item) => item.name.toLowerCase().startsWith(query));
        // const filteredItems1 = filter(get(selectedCompany, 'roles', []), (item) =>  item.role?.roleId)
        const suggestions = [...filteredItems];

        setAutoFilteredValue(suggestions);
    };

    const handleChange = (e: any) => {
        const selectedItem = e.value;

        setSelectedAutoValue(e.value);
    };
    // const toast = useRef(null);

    // const onUpload = () => {
    //     toast.current?.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    // };

    const roleNameFilter = (value: any, filter: any) => {
        console.log('value', value, filter);
        if (!filter || filter.trim() === '') {
            return true;
        }
        return value.role.name.toLowerCase().includes(filter.toLowerCase());
    };

    const statusRowFilterTemplate = (options: any) => {
        return (
            <Dropdown
                filter
                value={options.value}
                options={roles}
                optionLabel="name"
                optionValue="roleId"
                onChange={(e) => options.filterApplyCallback(e.value)}
                placeholder="Select Role"
                className="p-column-filter"
                showClear
                style={{ minWidth: '12rem' }}
            />
        );
    };

    const addPanel = () => {
        return (
            <>
                <CustomDataTable
                    header={palletheader}
                    ref={dataTableRef}
                    filter
                    page={page}
                    limit={limit} // no of items per page
                    totalRecords={totalRecords} // total records from API response
                    isEdit={true} // show edit button
                    isDelete={true} // show delete button
                    // always map data into one level data instead of nested keys
                    data={companies.map((item: any) => ({
                        palletCount: item.palletCount, // Pallet count
                        po: {
                            poNumber: item.po?.poNumber // Extract PO number safely
                        },
                        ...item
                    }))}
                    // provides columns as PrimeReact DataTable
                    columns={[
                        {
                            header: 'PO Number',
                            field: 'po.poNumber',
                            filter: true,
                            sortable: true,
                            filterPlaceholder: 'Search PO Number'
                        },
                        {
                            header: 'Pallet Id',
                            field: 'palletCount',
                            filter: true,
                            sortable: true,
                            filterPlaceholder: 'Search Pallet Counts'
                        }
                    ]}
                    onLoad={(params: any) => fetchData(params)}
                    onEdit={(item: any) => onRowSelect(item, 'edit')}
                    onView={(item: any) => onRowSelect(item, 'view')}
                    onDelete={(item: any) => onRowSelect(item, 'delete')}
                />
            </>
        );
    };

    const gradeData = [
        { id: 1, grade: 'A', reid: '1234567', bin: 'Bin-101' },
        { id: 2, grade: 'B', reid: '3457543', bin: 'Bin-102' },
        { id: 3, grade: 'A+', reid: 'e4567843', bin: 'Bin-103' }
    ];
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
                                // isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                // always map data into one level data instead of nested keys
                                data={gradeData.map((item: any) => ({
                                    id: item.id, // Pallet count
                                    grade: item.grade,
                                    bin: item.bin,
                                    reid: item.reid,
                                    ...item
                                }))}
                                // provides columns as PrimeReact DataTable
                                columns={[
                                    {
                                        header: '#',
                                        field: 'id',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search Id'
                                    },
                                    {
                                        header: 'REID',
                                        field: 'reid',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search PO Number'
                                    },
                                    {
                                        header: 'Graded Bin',
                                        field: 'bin',
                                        filter: true,
                                        sortable: true,
                                        filterPlaceholder: 'Search PO Number'
                                    },
                                    {
                                        header: 'Grade',
                                        field: 'grade',

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
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div>{addPanel()}</div>}
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

export default GradePage;
