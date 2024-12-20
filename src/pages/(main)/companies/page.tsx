
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
import { InputSwitch } from 'primereact/inputswitch';
import { useNavigate } from 'react-router-dom';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { useAppContext } from '../../../layout/AppWrapper';
import { Company, CustomResponse, Permissions } from '../../../types';
import { EmptyCompany } from '../../../types/forms';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { buildQueryParams, getCompanyLogo, getRowLimitWithScreenHeight, validateEmail, validateName, validateSubdomain } from '../../../utils/uitl';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { COMPANY_MENU, CompanyModule, DashboardModule } from '../../../config/permissions';
import DefaultLogo from '../../../components/DefaultLogo';
import RightSidePanel from '../../../components/RightSidePanel';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
}

const defaultForm: EmptyCompany = {
    companyId: null,
    name: '',
    email: '',
    subdomain: '',
    pocName: '',
    pocNumber: '',
    altPOCName: '',
    altPOCNumber: '',
    einNumber: '',
    gstNumber: '',
    permissions: [],
    isActive: true
}

const CompaniesPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyCompany>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');

    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
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
        params.include = 'warehouse,vendor';
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company?${queryString}`);
        setLoading(false)
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            if (response.total) {
                setTotalRecords(response?.total)
            }
        }
        else {
            setCompanies([]);
        }
    }

    const fetchPermissions = async () => {
        setLoading(true);
        const response: CustomResponse = await GetCall('/settings/permissions');
        if (response.code == 'SUCCESS') {
            const filterData = filter(response.data, (item: any) => item.module != 'AdminModule')

            // set default permissions
            filterData.forEach(element => {
                if ([DashboardModule, CompanyModule].includes(element.module) || [DashboardModule, ...COMPANY_MENU].includes(element.permission)) {
                    element.companyPermission = true;
                }
            });

            setPermissions(filterData);
            const _treeData = buildTree(filterData);
            setGroupData(_treeData)

            const preselectedKeys = findSelectedKeys(_treeData);
            setSelectedKeys(preselectedKeys);
        }
        else {
            setPermissions([]);
        }
        setLoading(false)
    }

    const fetchDetails = async (company: Company) => {
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/company/${company?.companyId}`);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setDetails(response.data);

            // tree logic
            const _treeData = buildTree(get(response.data, 'permissions', []));
            setGroupData(_treeData)

            const preselectedKeys = findSelectedKeys(_treeData);
            setSelectedKeys(preselectedKeys);

        }
        else {
            setDetails(null);
            setGroupData({})
        }
    }

    const buildTree = (permissions: Permissions[]) => {
        const groupedByModule = groupBy(permissions, 'module');
        return map(groupedByModule, (items: Permissions[], module: string) => ({
            label: module,
            key: module,
            data: {
                permission: module,
                desc: ''
            },
            children: items.map((permission: Permissions) => ({
                label: permission.permission,
                key: permission.permissionId,
                desc: permission.desc,
                checked: get(permission, 'companyPermission', false) ? true : false,
                data: permission
            }))
        }));
    };

    const showPermissions = () => {
        setAction(ACTIONS.VIEW_PERMISSIONS);
        const _treeData = buildTree(get(details, 'permissions', []));
        setGroupData(_treeData)

        const preselectedKeys = findSelectedKeys(_treeData);
        setSelectedKeys(preselectedKeys);
    }

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false)
        setForm(defaultForm)
        setAction(null)
        setSelectedKeys(null)
    }

    const showAddNew = () => {
        fetchPermissions();
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm(defaultForm);
    }

    const onSave = () => {
        if (action == ACTIONS.VIEW_PERMISSIONS) {
            const selectedItems = findSelectedItems(groupedData, selectedKeys);
            const filteredItems = filter(selectedItems, (item) => item.data && item.data.permissionId != null);
            const permissionIds = map(filteredItems, 'data.permissionId');
            onUpdatePermissions(permissionIds)
            return;
        }

        if (action == ACTIONS.ADD) {
            const selectedItems = findSelectedItems(groupedData, selectedKeys);
            const filteredItems = filter(selectedItems, (item) => item.data && item.data.permissionId != null);
            const permissionIds = map(filteredItems, 'data.permissionId');
            onNewAdd({ ...form, permissions: permissionIds })
            return;
        }

        if (action == ACTIONS.EDIT) {
            console.log('form', form);
            onUpdate(form);
        }

        if (action == ACTIONS.DELETE) {
            onDelete();
        }
    }

    const onNewAdd = async (companyForm: any) => {
        if (!validateName(companyForm.name)) {
            setAlert('error', 'Please provide valid company name')
            return;
        }

        if (!validateSubdomain(companyForm.subdomain)) {
            setAlert('error', 'Please provid valid subdomain')
            return;
        }

        if (!validateEmail(companyForm.email)) {
            setAlert('error', 'Please provide valid email')
            return;
        }

        if (companyForm.permissions.length == 0) {
            setAlert('error', 'Please select company permissions')
            return;
        }

        setIsDetailLoading(true);
        const response: CustomResponse = await PostCall('/company', companyForm);
        setIsDetailLoading(false)
        console.log('response', response)
        if (response.code == 'SUCCESS') {
            setAction(ACTIONS.VIEW)
            setSelectedCompany(response.data)
            fetchDetails(response.data);
            fetchData()
        }
        else {
            setAlert('error', response.message)
        }
    }

    const onUpdate = async (companyForm: any) => {
        if (!validateName(companyForm.name)) {
            setAlert('error', 'Please provide valid company name')
            return;
        }

        if (!validateSubdomain(companyForm.subdomain)) {
            setAlert('error', 'Please provid valid subdomain')
            return;
        }

        if (!validateEmail(companyForm.email)) {
            setAlert('error', 'Please provide valid email')
            return;
        }

        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${selectedCompany?.companyId}`, companyForm);
        setIsDetailLoading(false)
        if (response.code == 'SUCCESS') {
            setAction(ACTIONS.VIEW)
            setSelectedCompany(selectedCompany)
            fetchDetails(selectedCompany!);
            fetchData()
        }
        else {
            setAlert('error', response.message)
        }
    }

    const onDelete = async () => {
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${selectedCompany?.companyId}`);
        setLoading(false)
        console.log('response', response)
        if (response.code == 'SUCCESS') {
            setAction('')
            setSelectedCompany(null)
            fetchData()
        }
        else {
            setAlert('error', response.message)
        }
    }

    const onUpdatePermissions = async (perms: any[]) => {
        const oldPers = filter(get(details, 'permissions', []), (item) => item.companyPermission != null).map((item) => item.permissionId)

        let payload: any[] = [];

        let selected: any[] = [];
        perms.forEach(element => {
            selected.push({
                permissionId: element,
                action: 'add'
            })
        });

        oldPers.forEach(element => {
            let doc = find(selected, { permissionId: element });
            if (!doc) {
                payload.push({
                    permissionId: element,
                    action: 'remove'
                })
            }
        });

        payload = [...payload, ...selected]

        if (payload.length > 0) {
            setIsDetailLoading(true);
            const response: CustomResponse = await PostCall(`/company/${selectedCompany?.companyId}/company-permissions`, payload);
            setIsDetailLoading(false)
            if (response.code == 'SUCCESS') {
                setAction(ACTIONS.VIEW)
                setAlert('success', 'Permission updated')
                if (selectedCompany) {
                    fetchDetails(selectedCompany);
                }
            }
            else {
                setAlert('error', response.message)
            }
        }
    }

    const onGlobalFilterChange = (e: any) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const onRowSelect = async (company: Company, action: any) => {
        await setSelectedCompany(company)
        setAction(action);
        setSelectedKeys(null);

        if (action == ACTIONS.DELETE) {
            return;
        }

        setDetails(null)
        setTimeout(() => {
            fetchDetails(company);
        }, 500)

        if (action == ACTIONS.EDIT) {
            setForm({ ...company, email: company.owner?.email || '' });
        }

        setIsShowSplit(true);
    }

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
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>{action == ACTIONS.ADD ? 'Add company' : selectedCompany?.name}</div>
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
                    <h3 className='mb-0'>Companies</h3>
                </span>
                <Button icon="pi pi-plus" size="small" label='Company' aria-label="AddNew" style={{ marginLeft: 10 }} onClick={showAddNew} />
            </div>
        );
    };
    const header = renderHeader();

    const actionTemplate = (rowData: Company, options: ColumnBodyOptions) => {
        return <div className='flex'>
            <Button type="button" icon={'pi pi-eye'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'view')} />
            <Button type="button" icon={'pi pi-pencil'} className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'edit')} />
            <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'delete')} />
        </div>;
    };

    const imageBodyTemplate = (company: Company) => {
        if (!company.logo) {
            return <DefaultLogo size={3} />
        }
        return <img src={getCompanyLogo(company.logo)} alt={company.name} className="w-3rem h-3rem shadow-2 border-round object-fit-contain" />;
    };

    const statusBodyTemplate = (company: Company) => {
        return <Tag value={company.isActive ? 'Active' : 'Inactive'} severity={company.isActive ? 'success' : 'warning'}></Tag>;
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

    const selectedPermissions = filter(get(details, 'permissions', []), (item) => item.companyPermission != null)

    const renderEmail = (item: any) => get(item, 'owner.email');
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
                                isView={true}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                data={companies}
                                columns={[
                                    {
                                        header: '#',
                                        field: 'companyId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { width: 100, minWidth: 100, maxWidth: 100 },
                                        filterPlaceholder: 'Search #'
                                    },
                                    {
                                        header: 'Name',
                                        field: 'name',
                                        filter: true,
                                        filterPlaceholder: 'Search name'
                                    },
                                    {
                                        header: 'Logo',
                                        field: 'logo',
                                        body: imageBodyTemplate
                                    },
                                    {
                                        header: 'Email',
                                        field: 'email',
                                        body: renderEmail,
                                        filter: true,
                                        filterPlaceholder: 'Search email'
                                    },
                                    {
                                        header: 'Subdomain',
                                        field: 'subdomain',
                                        filter: true,
                                        filterPlaceholder: 'Search subdomain'
                                    },
                                    {
                                        header: 'Status',
                                        field: 'status',
                                        body: statusBodyTemplate
                                    },
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => onRowSelect(item, 'view')}
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

                                {
                                    action == ACTIONS.VIEW && details && <div className="p-fluid">
                                        <div className="field">
                                            <small>Company name</small>
                                            <p className='font-bold'>{details?.name}</p>
                                        </div>

                                        <div className="field">
                                            <small>Email</small>
                                            <p className='font-bold'>{details?.owner?.email}</p>
                                        </div>

                                        <div className="field">
                                            <small>POC Name</small>
                                            <p className='font-bold'>{(details?.pocName ? `${details?.pocName} ${details?.pocNumber ? `${details?.pocNumber}` : ''}` : 'N/A')}</p>
                                        </div>

                                        {
                                            details?.altPOCName && <div className="field">
                                                <small>Alternate POC Name</small>
                                                <p className='font-bold'>{details?.altPOCName} ({details?.altPOCNumber})</p>
                                            </div>
                                        }

                                        <div className="field">
                                            <small>EIN Number</small>
                                            <p className='font-bold'>{details?.einNumber || 'N/A'}</p>
                                        </div>

                                        <div className="field">
                                            <small>GST Number</small>
                                            <p className='font-bold'>{details?.gstNumber || 'N/A'}</p>
                                        </div>

                                        <p className='sub-heading'>Permissions {selectedPermissions.length > 0 ? <span className='primary-text-color cursor-pointer' onClick={showPermissions}>{`(${selectedPermissions.length} permissions)`}</span> : ''}</p>
                                        <div className='mt-2'>
                                            {
                                                selectedPermissions.map((item) => (
                                                    <p key={item.permissionId} className='sub-text pl-3'>{item.permission}</p>
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

                                {/* Edit Permissions */}
                                {
                                    (action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div className="p-fluid">
                                        <div className='field'>
                                            <label htmlFor="isActive">Status</label>
                                            <br />
                                            <InputSwitch className='ml-2' id='isActive' checked={get(form, 'isActive') ? true : false} onChange={(e) => onInputChange('isActive', e.value)} />
                                        </div>
                                        <div className="field">
                                            <label htmlFor="name">Company name <span className='red'>*</span></label>
                                            <InputText id='name' value={get(form, 'name')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('name', e.target.value)} />
                                            <small>only alphabets</small>
                                        </div>
                                        <div className="field">
                                            <label htmlFor="email">Email <span className='red'>*</span></label>
                                            <InputText id='email' value={get(form, 'email')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('email', e.target.value)} disabled={(action == 'edit' && validateEmail(get(details, 'owner.email')))} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="permission">Subdomain <span className='red'>*</span></label>
                                            <div className="p-inputgroup flex-1">
                                                <InputText placeholder="Subdomain" value={get(form, 'subdomain')} onChange={(e) => onInputChange('subdomain', e.target.value)} disabled={action == 'edit'} />
                                                <span className="p-inputgroup-addon">erp.com</span>
                                            </div>
                                        </div>

                                        <div className="field">
                                            <label htmlFor="pocName">POC name</label>
                                            <InputText id='pocName' value={get(form, 'pocName')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('pocName', e.target.value)} />
                                            <small>only alphabets</small>
                                        </div>

                                        <div className="field">
                                            <label htmlFor="pocNumber">POC Phone Number</label>
                                            <InputText id='pocNumber' value={get(form, 'pocNumber')} validateOnly onChange={(e) => onInputChange('pocNumber', e.target.value)} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="altPOCName">Alternate POC Name</label>
                                            <InputText id='altPOCName' value={get(form, 'altPOCName')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('altPOCName', e.target.value)} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="altPOCNumber">Alternate POC Phone Number</label>
                                            <InputText id='altPOCNumber' value={get(form, 'altPOCNumber')} validateOnly onChange={(e) => onInputChange('altPOCNumber', e.target.value)} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="einNumber">EIN Number</label>
                                            <InputText id='einNumber' value={get(form, 'einNumber')} validateOnly onChange={(e) => onInputChange('einNumber', e.target.value)} />
                                        </div>

                                        <div className="field">
                                            <label htmlFor="gstNumber">GST Number</label>
                                            <InputText id='gstNumber' value={get(form, 'gstNumber')} validateOnly onChange={(e) => onInputChange('gstNumber', e.target.value)} />
                                        </div>

                                        {
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
                                        }
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
                        <Button label="Save" severity="danger" disabled={(selectedCompany?.name != confirmTextValue || confirmTextValue == '' || isLoading)} onClick={onSave} />
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
                        <span>This will remove <strong>{selectedCompany?.name}</strong>.<br /> Do you still want to remove it? This action cannot be undone.</span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <span>Confirm you want to delete this by typing its name: <strong>{selectedCompany?.name}</strong></span><br />
                        <InputText placeholder={selectedCompany?.name} style={{ marginTop: 10 }} onChange={onValueChange} />
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
        if (node.data && node.data.companyPermission != null) {
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
    Object.keys(parents).forEach(key => {
        selectedKeys[key] = parents[key];
    });

    return selectedKeys;
};

const findSelectedItems = (nodes: any[], selectedKeys: any): any[] => {
    const selectedItems: any[] = [];

    if (selectedKeys && Object.keys(selectedKeys).length > 0) {
        const traverse = (node: any) => {
            if (selectedKeys[node.key]) {
                selectedItems.push(node);
            }
            if (node.children) {
                node.children.forEach((child: any) => traverse(child));
            }
        };

        nodes.forEach(traverse);
    }

    return selectedItems;
};


export default CompaniesPage;
