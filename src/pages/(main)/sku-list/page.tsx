


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Category, CompanyUser, CustomResponse, Roles } from '../../../types';
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
import { EmptyUser } from '../../../types/forms';
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
import { useNavigate } from 'react-router-dom';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const defaultForm: EmptyUser = {
    companyUserId: null,
    companyId: null,
    user: {
        companyUserId: null,
        displayName: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: null,
        countryCode: '',
        isActive: true,
        location: '',
        userId: null,
        profile: ''
    }
};

const SkuListPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<CompanyUser[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Category | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyUser>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [viewCategory, setViewCategory] = useState<any>([]);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [selectedAutoValue, setSelectedAutoValue] = useState<any[] | null>([]);
    const [autoFilteredValue, setAutoFilteredValue] = useState<any[]>([]);
    const [companyUserId, setCompanyUserId] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any[]>([]);
    const [ingredient, setIngredient] = useState('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);
    // const [searchText, setSearchText] = useState<any>('');
    const [allCategory, setAllCategory] = useState<any>([]);
    // const [details, setDetails] = useState<any[]>([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);


    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchCategories();
        return () => {
            setScroll(true);
        };
    }, []);
    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'category';
        if (params.filters && params.filters.category) {
            params.filters.categoryId = params.filters.category.categoryId;
            delete params.filters.category;
        }
        const companyId = get(user, 'company.companyId');
        setLoading(true);

        // Build the query string
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/products?${queryString}`);

        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            // fetchPermissions();
            if (response.total) {
                setTotalRecords(response.total);
            }
        } else {
            setCompanies([]);
        }
    };
    const fetchCategories = async () => {

        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/categories?format=tree`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAllCategory(response.data);
            
        } else {
            setAllCategory([]);
        }
    };

    const fetchviewData = async (params?: any) => {
        const companyId = get(user, 'company.companyId');
        const categoryId=params.categoryId
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/products?filters.categoryId=${categoryId}`);
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setViewCategory(response.data);
        } else {
            setViewCategory([]);
        }
    };

    // const fetchPermissions = async () => {
    //     const companyId = get(user, 'company.companyId');
    //     setLoading(true);
    //     const response: CustomResponse = await GetCall(`/company/${companyId}/roles`);
    //     if (response.code == 'SUCCESS') {
    //         const filterData = filter(response.data, (item: any) => item.name != 'AdminModule');

            // set default permissions
            // filterData.forEach(element => {
            //     if ([DashboardModule, CompanyModule].includes(element.module) || [DashboardModule, ...COMPANY_MENU].includes(element.permission)) {
            //         element.companyPermission = true;
            //     }
            // });

    //         setPermissions(filterData);
    //         const _treeData = buildTree(filterData);
    //         setGroupData(_treeData);

    //         const preselectedKeys = findSelectedKeys(_treeData);
    //         setSelectedKeys(preselectedKeys);
    //         // setSelectedAutoValue(preselectedKeys)
    //     } else {
    //         setPermissions([]);
    //     }
    //     setLoading(false);
    // };

    // const fetchDetails = async (company: CompanyUser) => {
    //     const companyId = get(user, 'company.companyId')
    //     setIsDetailLoading(true);
    //     const response: CustomResponse = await GetCall(`/company/${companyId}/company-users/${company?.companyUserId}`);
    //     setIsDetailLoading(false)
    //     if (response.code == 'SUCCESS') {
    //         const filterData = filter(response.data, (item: any) => item.name != 'AdminModule')
    //         setDetails(response.data);

    //         // tree logic
    //         const _treeData = buildTree(filterData);
    //         setGroupData(_treeData)

    //         const preselectedKeys = findSelectedKeys(_treeData);
    //         setSelectedKeys(preselectedKeys);
    //         // setSelectedAutoValue(preselectedKeys);

    //     }
    //     else {
    //         setDetails(null);
    //         setGroupData({})
    //     }
    // }

    const buildTree = (permissions: Roles[]) => {
        // const groupedByModule = groupBy(permissions, 'name');
        return permissions.map((items) => ({
            label: items.name,
            key: items.roleId
            // desc: permission.desc,
            // checked: get(permission, 'companyPermission', false) ? true : false,
            // data: permission
        }));
    };

    // const showPermissions = () => {
    //     setAction(ACTIONS.VIEW_PERMISSIONS);
    //     const _treeData = buildTree(get(details, 'permissions', []));
    //     setGroupData(_treeData)

    //     const preselectedKeys = findSelectedKeys(_treeData);
    //     setSelectedKeys(preselectedKeys);
    //     // setSelectedAutoValue(preselectedKeys);
    // }

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false);
        setForm(defaultForm);
        setAction(null);
        setSelectedKeys(null);
        setSelectedAutoValue(null);
        setIsViewModalOpen(false);
        // setSearchText('')
    };

    const showAddNew = () => {
        // fetchPermissions();
        // setIsShowSplit(true);
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
            onUpdatePermissions(permissionIds);
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
            // onDelete();
        }
    };

    const onNewAdd = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        if (!validateName(companyForm.firstName)) {
            setAlert('error', 'Please provide valid First Name');
            return;
        }

        if (!validateName(companyForm.lastName)) {
            setAlert('error', 'Please provid valid Last Name');
            return;
        }

        if (!validateEmail(companyForm.email)) {
            setAlert('error', 'Please provide valid email');
            return;
        }
        if (!validateCountryCode(companyForm.countryCode)) {
            setAlert('error', 'Please provide valid Country Code');
            return;
        }
        if (!validatePhoneNumber(companyForm.phone)) {
            setAlert('error', 'Please provide valid phone');
            return;
        }

        setIsDetailLoading(true);
        const response: CustomResponse = await PostCall(`/company/${companyId}/company-users`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(response.data);
            setIsShowSplit(false);
            dataTableRef.current?.updatePagination(1);
        } else {
            setAlert('error', response.message);
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

    // const onDelete = async () => {
    //     const companyId = get(user, 'company.companyId');
    //     setLoading(true);
    //     const response: CustomResponse = await DeleteCall(`/company/${companyId}/company-users/${selectedCompany?.companyUserId}`);
    //     setLoading(false);
    //     if (response.code == 'SUCCESS') {
    //         setAlert('success', 'Deleted successfully');
    //         setAction('');
    //         setSelectedCompany(null);
    //         dataTableRef.current?.updatePaginationAfterDelete('companyUserId', selectedCompany?.companyUserId);
    //     } else {
    //         setAlert('error', response.message);
    //     }
    // };

    const onUpdatePermissions = async (perms: any[]) => {
        const oldPers = filter(selectedUser, (item) => item).map((item) => item.role?.roleId);

        let payload: any[] = [];

        let selected: any[] = [];
        perms.forEach((element) => {
            selected.push({
                roleId: element,
                companyUserId: companyUserId,
                action: 'add'
            });
        });

        oldPers.forEach((element) => {
            let doc = find(selected, { roleId: element });
            if (!doc) {
                payload.push({
                    roleId: element,
                    companyUserId: companyUserId,
                    action: 'remove'
                });
            }
        });

        payload = [...payload, ...selected];

        if (payload.length > 0) {
            setIsDetailLoading(true);
            const response: CustomResponse = await PostCall(`/company/${selectedCompany?.companyId}/sync-user-roles`, payload);
            setIsDetailLoading(false);
            setCompanyUserId(null);
            if (response.code == 'SUCCESS') {
                setIsShowSplit(false);
                setAlert('success', 'Permission updated');
            } else {
                setAlert('error', response.message);
            }
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
   const onRowSelect = async (company: Category, action: any) => {
    
        await setSelectedCompany(company);
        setAction(action);
        setSelectedKeys(null);
        setSelectedAutoValue(null);

        if (action == ACTIONS.DELETE) {
            return;
        }
        
        if (action === ACTIONS.VIEW) {
            console.log('413',company)
            // setDetails()
            fetchviewData(company);
            setIsViewModalOpen(true);
            // setIsShowSplit(true);
        }
    
        // setDetails(null);
        // setTimeout(() => {
        //     // fetchDetails(company);
        // }, 500);

        // if (action == ACTIONS.EDIT) {
        //     setCompanyUserId(company.companyUserId);
        //     setForm({ ...company.user });

        //     const filteredItems = filter(get(company, 'roles', []), (item) => item.role);

        //     const userRoles = filteredItems.map((item) => item.role);

        //     setSelectedAutoValue(userRoles);

        //     setSelectedUser(filteredItems);
        // }

        
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

    // const headerTemplate = (options: any) => {
    //     const className = `${options.className} justify-content-space-between`;
    //     return (
    //         <div className={className}>
    //             <div className="flex align-items-center gap-2">
    //                 <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
    //                     {action == ACTIONS.ADD ? 'Add User' : selectedCompany?.user?.displayName}
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // };

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

    const handleNavigation = () => {
        navigate('/sku');
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">SKU</h4>
                </span>
                <Button label="SKU" icon="pi pi-plus" size="small" className=" mr-2" onClick={handleNavigation} />
            </div>
        );
    };
    const header = renderHeader();

    // const actionTemplate = (rowData: CompanyUser, options: ColumnBodyOptions) => {
    //     return (
    //         <div className="flex">
    //             {/* <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'view')} /> */}
    //             <Button
    //                 type="button"
    //                 icon={'pi pi-pencil'}
    //                 className="p-button-sm p-button-text"
    //                 onClick={() => {
    //                     onRowSelect(rowData, 'edit');
    //                 }}
    //             />
    //             <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
    //         </div>
    //     );
    // };

    const roleBodyTemplate = (company: CompanyUser) => {
        const rolesDetails: any = company.roles;
        if (rolesDetails.length != 0) {
            return rolesDetails.map((item: any, index: number) => item.role?.name).join(', ');
        } else {
            return <div>N/A</div>;
        }

        // if (company.roles!=null) {
        //     console.log("line 496",company.roles)
        //     // return <div>{company.roles}</div>
        // }
        // return
    };

    const statusBodyTemplate = (company: CompanyUser) => {
        return <Tag value={company.user?.isActive ? 'Active' : 'Inactive'} severity={company.user?.isActive ? 'success' : 'warning'}></Tag>;
    };
    // const onFilter = (e: any) => {
    //         if (e) {
    //             setSearchText(e.filter)
    //         }
    //     }
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

    // const statusRowFilterTemplate = (options: any) => {
    //     return (
    //         <Dropdown
    //             filter
    //             value={options.value}
    //             options={roles}
    //             optionLabel="name"
    //             optionValue="roleId"
    //             onChange={(e) => options.filterApplyCallback(e.value)}
    //             placeholder="Select Role"
    //             className="p-column-filter"
    //             showClear
    //             style={{ minWidth: '12rem' }}
    //         />
    //     );
    // };
    console.log('586',viewCategory)
    const categoryDropdown = (options: any) => (
        <Dropdown
            filter={true}
            value={options.value || null}
            options={
                allCategory?.flatMap((category: any) =>
                    category.children?.map((child: any) => ({
                        categoryId: child.categoryId,
                        category: child.name,
                    })) || []
                ) || []
            }
            optionLabel="category"
            optionValue="categoryId"
            onChange={(e) => {
                // Apply the filter directly with 'categoryId'
                options.filterApplyCallback({ categoryId: e.value });
            }}
            placeholder="Select category"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );
    
    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <CustomDataTable
                                ref={dataTableRef}
                                filter={true}
                                page={page}
                                limit={limit}
                                totalRecords={totalRecords}
                                isView={true} 
                                data={companies.map((item: any) => ({
                                    productId: item.productId,
                                    category: item.category.name,
                                    sku: item.sku,
                                    categoryId:item.category.categoryId
                                }))}
                                columns={[
                                    {
                                        header: '#',
                                        field: 'productId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { width: 80 },
                                        filterPlaceholder: 'SKU Id'
                                    },
                                    {
                                        header: 'Category',
                                        field: 'category',
                                        filter: true,
                                        filterElement: categoryDropdown,
                                        filterPlaceholder: 'Search Category'
                                    },
                                    {
                                        header: 'SKU',
                                        field: 'sku',
                                        filter: true,
                                        filterPlaceholder: 'Search SKU'
                                    }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                // onEdit={(item: any) => onRowSelect(item, 'edit')}
                                onView={(item: any) => onRowSelect(item, 'view')}
                            />
                        </div>
                        <RightSidePanel
                            isVisible={action === ACTIONS.VIEW}
                            headerTemplate={
                                <h3>
                                    {selectedCompany?.category}
                                </h3>
                            }
                            footerTemplate={panelFooterTemplate}
                            closeIcon={closeIcon}
                            content={
                                <>
                                    {isDetailLoading && (
                                        <div className="center-pos">
                                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                        </div>
                                    )}

                                    {!isDetailLoading && action === ACTIONS.VIEW && (
                                        <div className="font-bold ">
                                            <h5 className="mb-2">SKUs</h5>
                                            {viewCategory.length > 0 ? (
                                                <ul>
                                                    {viewCategory.map((item: any, index: number) => (
                                                        <li key={index}>
                                                            {item.sku}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>No SKUs available</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            }
                        />

                    </div>
                </div>
            </div>
            {/* <Dialog
                header="Delete confirmation"
                visible={action == 'delete'}
                style={{ width: layoutState.isMobile ? '90vw' : '50vw' }}
                className="delete-dialog"
                headerStyle={{ backgroundColor: '#ffdddb', color: '#8c1d18' }}
                footer={
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                        <Button label="Save" severity="danger" disabled={selectedCompany?.user?.displayName != confirmTextValue || confirmTextValue == '' || isLoading} onClick={onSave} />
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
                            This will remove <strong>{selectedCompany?.user?.displayName}</strong>.<br /> Do you still want to remove it? This action cannot be undone.
                        </span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <span>
                            Confirm you want to delete this by typing its name: <strong>{selectedCompany?.user?.displayName}</strong>
                        </span>
                        <br />
                        <InputText placeholder={selectedCompany?.user?.displayName} style={{ marginTop: 10 }} onChange={onValueChange} />
                    </div>
                </div>
            </Dialog> */}
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

// const findSelectedItems = (nodes: any[], selectedKeys: any): any[] => {
//     const selectedItems: any[] = [];

//     if (selectedKeys && Object.keys(selectedKeys).length > 0) {
//         const traverse = (node: any) => {
//             if (selectedKeys[node.key]) {
//                 selectedItems.push(node);
//             }
//             // if (node.children) {
//             //     node.children.forEach((child: any) => traverse(child));
//             // }
//         };

//         nodes.forEach(traverse);
//     }

//     return selectedItems;
// };

export default SkuListPage;
