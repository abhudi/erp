

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
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
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { InputSwitch } from 'primereact/inputswitch';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
import { EmptyCategory } from '../../../types/forms';
import { useAppContext } from '../../../layout/AppWrapper';
import { Category, CustomResponse } from '../../../types';
import RightSidePanel from '../../../components/RightSidePanel';
import { LayoutContext } from '../../../layout/context/layoutcontext';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete',
    VIEW_PERMISSIONS: 'view_permissions'
};

const defaultForm: EmptyCategory = {
    categoryId: null,
    companyId: null,
    parentId: null,
    name: '',
    label: '',
    isActive: true,
    key: null,
    desc:'',
};

const CategoryPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [companies, setCompanies] = useState<Category[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Category | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [dropdownValue, setDropdownValue] = useState(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyCategory>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');
    const [permissions, setPermissions] = useState<any[]>([]);
    const [groupedData, setGroupData] = useState<any>([]);
    const [companyLocation, setcompanyLocation] = useState<any>(null);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
    const [companyAllLocation, setcomapnyAllLocation] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
    const [categories, setCategories] = useState([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    useEffect(() => {
        setScroll(false);
        fetchData();

        return () => {
            setScroll(true);
        };
    }, []);
    const onToggle = (e: any) => {
        setExpandedKeys(e.value);
    };
    const fetchData = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/categories?format=tree`); // get all the roles
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            setCategories(response.data);
        } else {
            setCompanies([]);
            setCategories([]);
        }
    };

    const [tableHeight, setTableHeight] = useState('30rem');
    const calculateTableHeight = () => {
        const headerHeight = 300;
        const availableHeight = window.innerHeight - headerHeight;
        setTableHeight(`${availableHeight}px`);
    };

    useEffect(() => {
        calculateTableHeight();
        window.addEventListener('resize', calculateTableHeight);
        return () => {
            window.removeEventListener('resize', calculateTableHeight);
        };
    }, []);

    const mapToTreeNode = (category: any): TreeNode => ({
        key: category.categoryId.toString(),
        data: {
            categoryId: category.categoryId,
            name: category.name,
            companyId: category.companyId,
            parentId: category.parentId,
            label: category.label
        },
        children: category.children ? category.children.map(mapToTreeNode) : [] // Recursively map children
    });

    const treeData: TreeNode[] = companies.map(mapToTreeNode);

    const closeIcon = () => {
        handleCategoryChange({ value: null });
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
        const response: CustomResponse = await PostCall(`/company/${companyId}/categories`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(response.data);
            setIsShowSplit(false);
            fetchData();
            setAlert('success', 'Successfully Added');
        } else {
            setAlert('error', response.message);
        }
    };

    const onUpdate = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        const categoryId = companyLocation?.key;
        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/categories/${categoryId}`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setSelectedCompany(selectedCompany);
            setIsShowSplit(false);
            fetchData();
            setAlert('success', 'Successfully Updated');
        } else {
            setAlert('error', response.message);
        }
    };

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        const categoryId = companyLocation?.key;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/categories/${categoryId}`);

        setLoading(false);
        if (response.code == 'SUCCESS') {
            setAlert('success', 'Deleted successfully');
            setAction('');
            setSelectedCompany(null);
            fetchData();
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

            saveAsExcelFile(excelBuffer, 'Category');
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

    const parentCategories = categories.filter((cat: any) => cat.parentId === null);

    const handleCategoryChange = (e: { value: any }) => {
        const selectedCategory = e.value;

        if (!selectedCategory) {
            setSelectedCategory(null);
            setForm({
                ...form,
                parentId: null,
                label: ''
            });
        } else {
            setSelectedCategory(selectedCategory);

            setForm({
                ...form,
                parentId: selectedCategory.categoryId,
                label: selectedCategory.label
            });
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
    const onFilterChange = (e: any, field: string) => {
        const newFilters = { ...filters };
        newFilters[field] = e.target.value;
        setFilters(newFilters);
    };

    const onRowSelect = async (company: Category, action: any) => {
        await setSelectedCompany(company.data);
        setcompanyLocation(company);
        setAction(action);
        setSelectedKeys(null);
        if (action == ACTIONS.DELETE) {
            return;
        }

        setDetails(null);
        if (action == ACTIONS.EDIT) {
            setForm({ ...company.data });

            // If parentId is null, directly set selectedCategory to null
            if (company.data.parentId === null) {
                console.log('No parent category, setting selectedCategory to null');
                setSelectedCategory(null);
            } else {
                // Otherwise, try to find and set the parent category
                const parentCategory = categories.find((cat: Category) => cat.categoryId === company.data.parentId);
                console.log(parentCategory, 'parent category found');
                setSelectedCategory(parentCategory || null);
            }
        }
        setIsShowSplit(true);
    };

    const onInputChange = (key: string, value: string) => {
        setForm({
            ...form,
            [key]: value
        });
    };

    const onValueChange = (e: any) => setConfirmValue(e.target.value);
    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {action == ACTIONS.ADD ? 'Add Category' : selectedCompany?.name}
                    </div>
                </div>
            </div>
        );
    };
    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    {[ACTIONS.EDIT, ACTIONS.ADD, ACTIONS.VIEW_PERMISSIONS].includes(action) && <Button label="Save" disabled={isLoading || isDetailLoading} onClick={onSave} />}
                </div>
            </div>
        );
    };
    const OnGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGlobalFilter(e.target.value);
    };
    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Categories</h4>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <div className=" ">
                        <Button label="Category" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();
    const actionTemplate = (rowData: Category, options: ColumnBodyOptions) => {
        return (
            <div className="flex">
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

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {header}
                            <div className="card erp-table-container">
                            <TreeTable
                                scrollable
                                paginator
                                rows={10}
                                selectionMode="single"
                                value={treeData}
                                expandedKeys={expandedKeys}
                                onToggle={onToggle}
                                totalRecords={companies.length}
                                className="erp-table"
                                scrollHeight={tableHeight}
                                style={{ width: '100%' }}
                                tableStyle={{ minWidth: '50rem' }}
                                globalFilter={globalFilter}
                            >
                                <Column field="name" header="Name" filter expander></Column>
                                <Column field="desc" header="Description" filter></Column>
                                <Column style={{ width: 160 }} body={actionTemplate}></Column>
                            </TreeTable>

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
                                                <label htmlFor="category">Category</label>
                                                <Dropdown
                                                    value={selectedCategory}
                                                    options={parentCategories}
                                                    optionLabel="label" // Display category name in dropdown
                                                    placeholder="Select a Category"
                                                    onChange={handleCategoryChange}
                                                />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="name">
                                                    Name <span className="red">*</span>
                                                </label>
                                                <InputText id="name" value={form.name} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('name', e.target.value)} />
                                            </div>
                                            <div className="field">
                                                <label htmlFor="desc">
                                                Description
                                                </label>
                                                <InputText id="desc" value={form.desc} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('desc', e.target.value)} />
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

export default CategoryPage;
