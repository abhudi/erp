


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { MultiSelect } from 'primereact/multiselect';
import { Vendor, Address, ContactPerson, CustomResponse, UploadedFile, Permissions, Asset } from '../../../types';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { Vendors } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import Sidebar from '../../../components/Sidebar';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { buildQueryParams, getRowLimitWithScreenHeight, validateCountryCode, validateEmail, validateName, validatePhoneNumber } from '../../../utils/uitl';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // Or your preferred theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import UploadFile from '../../../components/UploadFile';
import FileView from '../../../components/FileView';


const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete',
    VIEW: 'view',
};

const defaultForm: Vendors = {
    name: '',
    aliasName: '',
    companyName: '',
    phone: '',
    email: '',
    fax: '',
    website: '',
    isSupplier:true,
    warehouseIds: [],
    paymentTerms: [],
    categoryIds: [],
    pocs: [
        {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            countryCode: '',
            gender: '',
            vendorPOCId: null
        }
    ],
    addresses: [
        {
            type: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            sAddrId: null
        }
    ],
    note: '',
    gradings: [
        {
            grade: '',
            desc: '',
            processId: '',
            isCrossDock: true,
            isScreenDamage: false,
            rmaPercentage: ''
        }
    ]
};

const Vendorss = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<Vendor[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Vendor | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [selectedLocationId, setSelectedLocationId] = useState<any>(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<Vendors>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');
    const [getvendorPOCId, setGetvendorPOCId] = useState<any>([]);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [companyRackId, setcompanyRackId] = useState<any>(null);
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [filteredCities, setFilteredCities] = useState<{ name: string; code: string; codeType: string }[]>([]);
    const [selectedCity, setSelectedCity] = useState<{ name: string; code: string; codeType: string } | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [formArray, setFormArray] = useState<Vendor[]>([]);
    const [totalSize, setTotalSize] = useState(0);
    const [details, setDetails] = useState<any>(null);
    const fileUploadRef = useRef<any>(null);
    const toast = useRef<Toast>(null);
    const [visible, setVisible] = useState(false);
    const [assetFile, setAssetFile] = useState<Asset | null>(null);
    const [isShowImage, setShowImage] = useState<boolean>(false);
    const [addresses, setAddresses] = useState<Address[]>([
        {
            type: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        }
    ]);
    const [nodes, setNodes] = useState<TreeNode[]>([]);
    const [newRow, setNewRow] = useState({
        grade: '',
        description: '',
        process: '',
        crossDock: false,
        crackedScreen: false,
        rmaPercentage: ''
    });
    const resetNewRow = () => {
        setNewRow({
            grade: '',
            description: '',
            process: '',
            crossDock: false,
            crackedScreen: false,
            rmaPercentage: ''
        });
    };

    // const [vendorData, setVendorData] = useState<Vendors | null>(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>([]);
    const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
    const [warehouseData, setWarehouseData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [mastercodeData, setMasterCodeData] = useState<any[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [ismobile, setIsmobile] = useState<string | null>(null);
    const [contacts, setContacts] = useState<ContactPerson[]>([{ name: '', phone: '', email: '', contactPersonEmail: '', contactPersonName: '', contactPersonPhone: '' }]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const companyId = get(user, 'company.companyId');
    const includedEntities = ['pocs', 'vendorCategories', 'vendorWarehouses', 'paymentSetup', 'VendorGrades'];

    const queryString = `query=${encodeURIComponent(includedEntities.join(','))}`;
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
        setScroll(false);
        fetchcategoryData();

        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        setScroll(false);
        fetchwarehouseData();

        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        setScroll(false);
        fetchmastercodeData();

        return () => {
            setScroll(true);
        };
    }, []);

    useEffect(() => {
        setFilteredCities(cities);
    }, [cities]);
    useEffect(() => {
        onInputChange('action', action);
    }, [action]);

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        // setPage(params.page);
        params.include = 'pocs,vendorCategories,vendorWarehouses,paymentSetup,VendorGrades';
        params.filters = { vendorType: 'isSupplier' };
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/vendors?${queryString}`); // get all the Vendors
        setLoading(false);
        if (response.code === 'SUCCESS') {
            setCompanies(response.data); // Store vendors in state
            if (response.total) {
                setTotalRecords(response?.total);
            }
            // Extract the first vendorId
            const vendorId = response.data[0]?.vendorId;

            if (vendorId) {
                setSelectedVendorId(vendorId);
            }
        } else {
            setCompanies([]);
        }
    };
    const fetchcategoryData = async () => {
        const companyId = get(user, 'company.companyId');
        // const warehouseId=selectedSubLocation
        setLoading(true);
        const categoryresponse: CustomResponse = await GetCall(`/company/${companyId}/categories?format=tree`); // get all the roles

        if (categoryresponse.code == 'SUCCESS') {
            const categorryData = categoryresponse.data.map((item: { categoryId: any; name: any }) => ({
                categoryId: item.categoryId,
                name: item.name
            }));
            setCategoryData(categorryData);
        } else {
            setCategoryData([]);
        }
        setLoading(false);
    };
    const fetchwarehouseData = async () => {
        const companyId = get(user, 'company.companyId');
        // const warehouseId=selectedSubLocation
        setLoading(true);
        const warehouseresponse: CustomResponse = await GetCall(`/company/${companyId}/warehouses`); // get all the roles
        if (warehouseresponse.code == 'SUCCESS') {
            const wareehouseData = warehouseresponse.data.map((item: { warehouseId: any; name: any }) => ({
                warehouseId: item.warehouseId,
                name: item.name
            }));

            setWarehouseData(wareehouseData);
        } else {
            setWarehouseData([]);
        }
        setLoading(false);
    };
    const fetchmastercodeData = async () => {
        const companyId = get(user, 'company.companyId'); // Make sure `user` is defined properly
        const type = 'Process'; // Make sure `user` is defined properly

        setLoading(true);

        try {
            // Use the type parameter in the API call
            const response: CustomResponse = await GetCall(`/company/${companyId}/master-codes-by-types/${type}`);
            if (response.code === 'SUCCESS') {
                const masterCodeData = response.data.codes.map((item: any) => ({
                    masterCodeId: item.masterCodeId,
                    code: item.code
                }));
                setMasterCodeData(masterCodeData);
            } else {
                setMasterCodeData([]);
            }
        } catch (error) {
            console.error('Error fetching master code data:', error);
            setMasterCodeData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        const companyId = get(user, 'company.companyId');
        // const type=constant.SYSTEM_MSTR_CODE.rackType
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/categories?format=tree`); // get company all roles
        if (response.code == 'SUCCESS') {
            const processedData = response.data.map((parent: { children: any[]; categoryId: any; name: any }) => {
                if (parent.children && parent.children.length > 0) {
                    return parent.children.map((child: { categoryId: any; name: any }) => {
                        return {
                            key: `${child.categoryId}`,
                            label: `${parent.name} - ${child.name}`
                        };
                    });
                }
                return [];
            });
            const flattenedData = processedData.flat();
            setDropdownOptions(flattenedData);
        } else {
            setDropdownOptions([]);
        }

        setLoading(false);
    };

    const fetchDetails = async () => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/master-code-types`);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            const codeTypes = response.data.map((item: { codeTypeId: any; codeType: any }) => ({
                codeTypeId: item.codeTypeId,
                name: item.codeType
            }));

            setCities(codeTypes);
        } else {
            setCities([]);
        }
    };

    const fetchVendorData = async (company: any, action: any) => {
        try {
            const vendorId = company.vendorId;
            const includedEntities = ['pocs', 'vendorCategories', 'vendorWarehouses', 'paymentSetup', 'VendorGrades', 'address'];
            const queryString = `query=${encodeURIComponent(includedEntities.join(','))}`;
            const response: CustomResponse = await GetCall(`/company/${companyId}/vendors/${vendorId}?${queryString}`);
            if (response.code === 'SUCCESS') {
                setDetails(response.data);
                const vendorData = response.data;
                const warehouseIds = vendorData.vendorWarehouses.map((wh: any) => wh.warehouseId);
                setSelectedWarehouse(warehouseIds);
                const categoryIds = response.data.vendorCategories.map((category: any) => category.categoryId);
                setSelectedCategory(categoryIds);
                const paymentTermsId = response.data.paymentSetup?.paymentTermsId || null;
                setSelectedPaymentTerms(paymentTermsId);

                return vendorData;
            } else {
                console.warn('No data for this vendor.');
                setSelectedWarehouse([]);
                setSelectedCategory([]);
                setSelectedPaymentTerms(null);
                setDetails(null);
            }
        } catch (error) {
            console.error('Error fetching vendor data:', error);
            setCompanies([]);
            setSelectedWarehouse([]);
            setSelectedCategory([]);
            setSelectedPaymentTerms(null);
        }
    };
    const treeData: TreeNode[] = companies.map((company) => ({
        key: company.vendorId?.toString(),
        data: {
            vendorId: company.vendorId,
            name: company.name,
            aliasName: company.aliasName,
            note: company.note,
            email: company.email,
            phone: company.phone,
            warehouseIds: company.warehouseIds,
            pocs: company.pocs
        }
    }));
    const closeIcon = () => { 
        setSelectedCompany(null);
        setSelectedCategory([]);
        setIsShowSplit(false);
        setForm({
            ...defaultForm,
            pocs: [
                {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    countryCode: '',
                    gender: '',
                    vendorPOCId: null
                }
            ],
            addresses: [
                {
                    type: '',
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: '',
                    sAddrId: null
                }
            ]
        });
        setAction(null);
        setSelectedKeys(null);
        setSelectedOption(null);
        setSelectedCity(null);
        setSearchQuery('');
        setFilteredCities(cities);
        setSelectedNames([]);
        setProducts([]);
        setSelectedWarehouse([]);
        setSelectedCategory([]);
        resetNewRow();
        setDetails([]);
    };
    
    const showAddNew = () => {
        fetchPermissions();
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm({
            ...defaultForm,
            pocs: [
                {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    countryCode: '',
                    gender: '',
                    vendorPOCId: null
                }
            ],
            addresses: [
                {
                    type: '',
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: '',
                    sAddrId: null
                }
            ]
        });
        setSearchQuery('');
        setFilteredCities(cities);
        setProducts([]);
        setSelectedNames([]);
        setSelectedWarehouse([]);
        setSelectedCategory([]);
        resetNewRow();
        setDetails([]);
    };
    const onSave = () => {
        if (action == ACTIONS.ADD) {
            onInputChange('action', 'add');
            onNewAdd({ ...form });
            setIsShowSplit(false);
            setSelectedCompany(null);
            setIsShowSplit(false);
            setForm(form);
            setAction(null);
            setSelectedKeys(null);
            setSelectedOption(null);
            setSelectedCity(null);
            setSearchQuery('');
            setFilteredCities(cities);
            setSelectedNames([]);
            setProducts([]);
            return;
        }

        if (action == ACTIONS.EDIT) {
            onInputChange('action', 'update');
            onUpdate(form);
            // onUpdatePOCs(form.pocs)
        }

        if (action == ACTIONS.DELETE) {
            onInputChange('action', 'delete');
            onDelete();
        }
    };

    const onNewAdd = async (companyForm: any) => {
        // if (shouldShowVendorGrades) {
        //     companyForm = {
        //         ...companyForm, 
        //         gradings: [{...newRow}],
        //     };
        // }
        console.log('471', companyForm)
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        if (companyForm.length === 0) {
            setAlert('error', 'No Attributes Selected');
        } else {
            const response: CustomResponse = await PostCall(`/company/${companyId}/vendors`, companyForm);
            setIsDetailLoading(false);
            console.log('response', response);
            if (response.code == 'SUCCESS') {
                setSelectedCompany(response.data);
                setAlert('success ', 'Successfully Added');
                dataTableRef.current?.updatePagination(1);
            } else {
                setAlert('error', response.message);
            }
        }
    };

    const onUpdate = async (companyForm: any) => {
        if (shouldShowVendorGrades) {
            companyForm = {
                ...companyForm,
                gradings: [{ ...newRow, }],
            };
        }
        console.log('541', companyForm)
        const companyId = get(user, 'company.companyId');
        const vendorId = selectedCompany?.vendorId;
        setIsDetailLoading(true);
        const response: CustomResponse = await PutCall(`/company/${companyId}/vendors/${vendorId}`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setIsShowSplit(false);
            setSelectedCompany(selectedCompany);
            setAlert('success ', 'Successfully Updated');
            dataTableRef.current?.refreshData();
        } else {
            setAlert('error ', response.message);
        }
    };
    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        const vendorId = selectedCompany?.vendorId;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/vendors/${vendorId}`);
        setLoading(false);
        console.log('response', response);
        if (response.code == 'SUCCESS') {
            setAction('');
            setSelectedCompany(null);
            setAlert('success ', 'Successfully Deleted ');
            dataTableRef.current?.updatePaginationAfterDelete('vendorId', vendorId);
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

            saveAsExcelFile(excelBuffer, 'Vendors');
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

    const onRowSelect = async (company: Vendor, action: any) => {
        await setSelectedCompany(company);
        setcompanyRackId(company);
        // setSelectedWarehouse(company);
        const vendorData = await fetchVendorData(company, action);
        // console.log('546',vendorData)
        const categoryIds = vendorData.vendorCategories.map((category: any) => category.categoryId);
        const warehouseId = vendorData.vendorWarehouses.map((warehouse: any) => warehouse.warehouseId);
        setAction(action);
        setSelectedKeys(null);

        if (action === ACTIONS.DELETE) {
            setDetails(null)
            return;
        }
        const formWithDefaults = {
            ...company,
            gradings: vendorData.grades || [],
            pocs: vendorData.pocs || [{ firstName: '', lastName: '', email: '', phone: '', countryCode: '', gender: '' }],
            addresses: vendorData.addresses || [{ type: '', address1: '', address2: '', city: '', state: '', zip: '', country: '' }],
            warehouseIds: warehouseId || [],
            categoryIds: categoryIds || []
        };
        if (action === ACTIONS.VIEW) {
            setDetails(formWithDefaults);
            setIsShowSplit(true);
            return;
        }
        setGetvendorPOCId(formWithDefaults.pocs)
        if (action === ACTIONS.EDIT) {
            setForm({ ...formWithDefaults });
            if (formWithDefaults.gradings.length > 0) {
                const grading = formWithDefaults.gradings[0];
                setNewRow({
                    grade: grading.grade || '',
                    description: grading.desc || '',
                    process: grading.processId || '',
                    crossDock: grading.isCrossDock || false,
                    crackedScreen: grading.isScreenDamage || false,
                    rmaPercentage: grading.rmaPercentage || ''
                });
            }
        }
        setIsShowSplit(true);

        setTimeout(() => { }, 500);
    };
    const onInputChange = (name: string | { [key: string]: any }, val?: any) => {
        setForm((prevForm: any) => {
            let updatedForm = { ...prevForm };
            if (typeof name === 'string') {
                if (name.startsWith('addresses.')) {
                    const [_, index, field] = name.split('.');
                    updatedForm.addresses[index][field] = val;
                } else if (name.startsWith('pocs.')) {
                    const [_, index, field] = name.split('.');
                    updatedForm.pocs[index][field] = val;
                } else {
                    updatedForm[name] = val;
                }
            } else {
                updatedForm = { ...updatedForm, ...name };
            }

            return updatedForm;
        });
    };

    const onValueChange = (e: any) => setConfirmValue(e.target.value);

    const getTitle = () => {
        if (action === ACTIONS.ADD) return 'ADD VENDOR';
        if (action === ACTIONS.EDIT) return 'EDIT VENDOR';
        return selectedCompany?.name || '';
    };
    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {getTitle()}
                    </div>
                </div>
            </div>
        );
    };
    const renderHeaderMain = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Vendors</h4>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <div className=" ">
                        <Button label="Vendor" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const headerMain = renderHeaderMain();
    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    {/* {[ACTIONS.EDIT, ACTIONS.ADD].includes(action) && <Button label="Save" disabled={isLoading || isDetailLoading} onClick={onSave} />} */}
                    {/* {[ACTIONS.EDIT, ACTIONS.ADD].includes(action) && <Button label={activeIndex === 1 ? 'Save' : action === ACTIONS.EDIT ? 'Save' : 'Next'} onClick={action === ACTIONS.EDIT ? onSave : handleNext} />} */}
                    {action === ACTIONS.EDIT ? <Button label="Save" onClick={onSave} /> : <Button label={activeIndex === 1 ? 'Save' : 'Next'} onClick={activeIndex === 1 ? onSave : handleNext} />}
                    {/* {[ACTIONS.EDIT, ACTIONS.ADD].includes(action) && (
                        <Button
                            label={activeIndex === 1 ? 'Save' : action === ACTIONS.EDIT ? 'Save' : 'Next'}
                            onClick={activeIndex === 1 ? onSave : handleNext} // Call onSave for Save action; handleNext for Next action
                        />
                    )} */}
                </div>
            </div>
        );
    };

    const onTemplateSelect = (e: any) => {
        let _totalSize = totalSize;
        let files = e.files;

        Object.keys(files).forEach((key) => {
            _totalSize += files[key].size || 0;
        });

        setTotalSize(_totalSize);
    };

    const onTemplateUpload = (e: any) => {
        let _totalSize = 0;

        e.files.forEach((file: any) => {
            _totalSize += file.size || 0;
        });

        setTotalSize(_totalSize);
        toast.current?.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    };

    const onTemplateRemove = (file: any, callback: any) => {
        setTotalSize(totalSize - file.size);
        callback();
    };

    const onTemplateClear = () => {
        setTotalSize(0);
    };

    const uploadheaderTemplate = (options: any) => {
        const { className, chooseButton, uploadButton, cancelButton } = options;
        const value = totalSize / 10000;

        return (
            <div className={className} style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
                {chooseButton}
                {uploadButton}
                {cancelButton}
                <div className="flex align-items-center gap-3 ml-auto">
                    <ProgressBar value={value} showValue={false} style={{ width: '10rem', height: '12px' }}></ProgressBar>
                </div>
            </div>
        );
    };
    const uploaditemTemplate = (file: any, props: any) => {
        return (
            <div className="flex align-items-center flex-wrap">
                <div className="flex align-items-center" style={{ width: '40%' }}>
                    <img alt={file.name} role="presentation" src={file.objectURL} width={100} />
                    <span className="flex flex-column text-left ml-3">
                        {file.name}
                        <small>{new Date().toLocaleDateString()}</small>
                    </span>
                </div>
                <Tag value={props.formatSize} severity="warning" className="px-3 py-2" />
                <Button type="button" icon="pi pi-times" className="p-button-outlined p-button-rounded p-button-danger ml-auto" onClick={() => onTemplateRemove(file, props.onRemove)} />
            </div>
        );
    };

    const emptyTemplate = () => {
        return (
            <div className="flex align-items-center flex-column">
                <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>
                <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
                    Drag and Drop Image Here
                </span>
            </div>
        );
    };

    const chooseOptions = { icon: 'pi pi-fw pi-images', iconOnly: true, className: 'custom-choose-btn p-button-rounded p-button-outlined' };
    const uploadOptions = { icon: 'pi pi-fw pi-cloud-upload', iconOnly: true, className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined' };
    const cancelOptions = { icon: 'pi pi-fw pi-times', iconOnly: true, className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined' };

    const onInputCopChange = (index: number, field: keyof ContactPerson, value: string) => {
        const newContacts = [...contacts];
        newContacts[index][field] = value;
        setContacts(newContacts);
    };

    const onAddContact = () => {
        setContacts([...contacts, { name: '', phone: '', email: '', contactPersonEmail: '', contactPersonName: '', contactPersonPhone: '' }]);
    };

    const onInputAddressChange = (index: number, field: keyof Address, value: string) => {
        const newAddresses = [...addresses];
        newAddresses[index][field] = value;
        setAddresses(newAddresses);
    };

    const onDropdownAddressChange = (index: number, field: keyof Address, value: any) => {
        const newAddresses = [...addresses];
        newAddresses[index][field] = value;
        setAddresses(newAddresses);
    };

    const onAddAddress = () => {
        setForm((prevForm: any) => ({
            ...prevForm,
            addresses: [
                ...prevForm.addresses,
                {
                    type: '',
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: ''
                }
            ]
        }));
    };

    const onDeleteAddress = async (index: number, sAddrId: any) => {
        if (!sAddrId) {
            console.error('sAddrId is required for deletion');
            return;
        }

        const companyId = get(user, 'company.companyId');
        const vendorId = selectedCompany?.vendorId;

        // Call the delete API
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/vendors/${vendorId}/addresses/${sAddrId}`);
        setLoading(false);

        if (response.code === 'SUCCESS') {

            // Update form state to remove the deleted address
            setForm((prevForm: any) => {
                if (prevForm.addresses.length > 1) {
                    const newAddresses = prevForm.addresses.filter((_: any, i: number) => i !== index);
                    return {
                        ...prevForm,
                        addresses: newAddresses,
                    };
                }
                return prevForm;
            });

            setAlert('success', 'Successfully Deleted');
            dataTableRef.current?.updatePaginationAfterDelete('vendorId', vendorId);
        } else {
            // Handle error response
            console.error('Failed to delete address:', response.message);
            setAlert('error', response.message);
        }
    };


    const handleNext = () => {
        setActiveIndex(1);
    
        if (action === ACTIONS.ADD) {
            // Create a new grading entry from the newRow
            const newGrading = {
                grade: newRow.grade || '',
                desc: newRow.description || '',
                processId: newRow.process || '',
                isCrossDock: newRow.crossDock || false,
                isScreenDamage: newRow.crackedScreen || false,
                rmaPercentage: newRow.rmaPercentage || ''
            };
    
            // Only proceed if processId is present
            if (newGrading.processId) {
                // Filter out empty gradings and include only entries with data
                const updatedGradings = [
                    ...(form.gradings || []).filter(
                        (grading) =>
                            grading.grade || grading.desc || grading.processId || grading.rmaPercentage
                    ),
                    newGrading
                ];
    
                // Update gradings in the form state
                onInputChange('gradings', updatedGradings);
            }
        }
    };
    
    

    const handleWarehouseChange = (e: { value: string[] }) => {
        setSelectedWarehouse(e.value); // Always store an array
        onInputChange('warehouseIds', e.value); // Propagate the change;
    };
    const warehouseOptions = warehouseData.map((warehouse) => ({
        label: warehouse.name,
        value: warehouse.warehouseId
    }));

    const handlePaymentTermsChange = (e: { value: string }) => {
        setSelectedPaymentTerms(e.value);
        onInputChange('paymentTerms', e.value);
    };

    const handleCategoryChange = (e: { value: string[] }) => {
        setSelectedCategory(e.value);
        onInputChange('categoryIds', e.value);

        const selectedNames = categoryOptions.filter((option) => e.value.includes(option.value)).map((option) => option.label);

        const hasMobile = selectedNames.includes('mobile');
        onInputChange('hasMobile', hasMobile);

        // this will delete the gradings in
        if (!hasMobile) {
            delete (form as any).gradings;
        }
    };
    const categoryOptions = categoryData.map((category) => ({
        label: category.name,
        value: category.categoryId
    }));
    const processOptions = mastercodeData.map((mastercode) => ({
        label: mastercode.code,
        value: mastercode.masterCodeId
    }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setNewRow((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleDropdownChange = (e: any) => {
        setNewRow((prev) => ({ ...prev, process: e.value }));
    };

    const handleCheckboxChange = (e: CheckboxChangeEvent, field: string) => {
        setNewRow((prev) => ({ ...prev, [field]: e.checked }));
    };

    const handleAddRow = () => {
        const newVendor = {
            key: `${Date.now()}`,
            data: {
                grade: newRow.grade,
                description: newRow.description,
                processId: newRow.process,
                isCrossDock: newRow.crossDock,
                isScreenDamage: newRow.crackedScreen,
                rmaPercentage: newRow.rmaPercentage
            }
        };

        const updatedGradings =
            form.gradings?.filter((grading, index) => {
                return index !== 0 || grading.grade || grading.desc || grading.processId || grading.rmaPercentage;
            }) || [];
        updatedGradings.push({
            grade: newRow.grade,
            desc: newRow.description,
            processId: newRow.process,
            isCrossDock: newRow.crossDock,
            isScreenDamage: newRow.crackedScreen,
            rmaPercentage: newRow.rmaPercentage
        });

        onInputChange('gradings', updatedGradings);

        setNodes((prevNodes) => [...prevNodes, newVendor]);

        toast.current?.show({
            severity: 'success',
            summary: 'Vendor Added',
            detail: 'Vendor row added successfully!'
        });

        setNewRow({
            grade: '',
            description: '',
            process: '',
            crossDock: false,
            crackedScreen: false,
            rmaPercentage: ''
        });
    };

    const handleEditRow = (key: string) => {
        const vendorToEdit = nodes.find((node) => node.key === key);
        if (vendorToEdit) {
            setNewRow({
                grade: vendorToEdit.data.grade,
                description: vendorToEdit.data.description,
                process: vendorToEdit.data.processId,
                crossDock: vendorToEdit.data.isCrossDock,
                crackedScreen: vendorToEdit.data.isScreenDamage,
                rmaPercentage: vendorToEdit.data.rmaPercentage
            });

            setNodes((prevNodes) => prevNodes.filter((node) => node.key !== key));
        }
    };
    const handleDeleteRow = (key: string) => {
        setNodes((prevNodes) => prevNodes.filter((node) => node.key !== key));
        toast.current?.show({
            severity: 'success',
            summary: 'Vendor Deleted',
            detail: 'Vendor row deleted successfully!'
        });
    };

    const actionRowTemplate = (node: TreeNode) => (
        <div>
            <Button icon="pi pi-pencil" className="p-button-text" onClick={() => handleEditRow(node.key as string)} />
            <Button icon="pi pi-pencil" className="p-button-text" onClick={() => handleEditRow(node.key as string)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteRow(node.key as string)} />
        </div>
    );

    const onAddPoc = () => {
        setForm((prevForm: any) => ({
            ...prevForm,
            pocs: [
                ...prevForm.pocs,
                {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    countryCode: '',
                    gender: ''
                }
            ]
        }));
    };
    const onDeletePoc = async (index: number, vendorPOCId: any) => {

        if (!vendorPOCId) {
            return;
        }

        const companyId = get(user, 'company.companyId');
        const vendorId = selectedCompany?.vendorId;

        // Call the delete API
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${companyId}/vendors/${vendorId}/pocs/${vendorPOCId}`);
        setLoading(false);

        if (response.code === 'SUCCESS') {

            // Update form state to remove the deleted POC
            setForm((prevForm: any) => ({
                ...prevForm,
                pocs: prevForm.pocs.filter((_: any, i: number) => i !== index),
            }));
            setAlert('success', 'Successfully Deleted');
            dataTableRef.current?.updatePaginationAfterDelete('vendorId', vendorId);
        } else {
            setAlert('error', response.message);
        }
    };

    const shouldShowVendorGrades = selectedCategory.some((id) => {
        const category = categoryOptions.find((option) => option.value === id);
        return category && category.label.toLowerCase() === 'mobile';
    });

    const isAddButtonDisabled = !newRow.grade || !newRow.description || !newRow.rmaPercentage;
    
    const renderBody = () => {
        return (
            <>
                <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                    <TabPanel header="Company Details" >
                        <div style={{ width: '100%' }}>
                            <Card>
                                <div className="p-fluid">
                                    <div style={{ width: '100%' }}>
                                        <div className="flex justify-content-between gap-3">
                                            {/* <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor="companyName"> Company Name</label>
                                                <InputText id="companyName" value={get(form, 'companyName')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('companyName', e.target.value)} />
                                            </div> */}
                                            <div className="field" style={{ width: '33.99%' }}>
                                            <label htmlFor="vendorName"> Vendor Name</label>
                                            <InputText id="name" value={get(form, 'name')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('name', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                            <label htmlFor="aliasName"> Alias Name</label>
                                            <InputText id="aliasName" value={get(form, 'aliasName')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('aliasName', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                            <label htmlFor="phone"> Phone</label>
                                            <InputText id="phone" value={get(form, 'phone')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('phone', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div className="flex sm:flex-none justify-content-between gap-3">
                                            
                                            <div className="field" style={{ width: '33.99%' }}>
                                            <label htmlFor="email"> Email</label>
                                            <InputText id="email" value={get(form, 'email')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('email', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                                <label htmlFor="fax"> Fax</label>
                                                <InputText id="fax" value={get(form, 'fax')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('fax', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                            <label htmlFor="website"> Website</label>
                                            <InputText id="website" value={get(form, 'website')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('website', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div className="flex justify-content-between gap-3">
                                           
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                            <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                    Warehouse
                                                </label>
                                                <MultiSelect value={selectedWarehouse || []} options={warehouseOptions} onChange={handleWarehouseChange} placeholder="Select location" showSelectAll={true} display="chip" />
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                            <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                    Payment Terms
                                                </label>
                                                <Dropdown
                                                    value={selectedPaymentTerms || ''}
                                                    options={[
                                                        { label: 'Net 30', value: 'Net 30' },
                                                        { label: 'Net 60', value: 'Net 60' }
                                                    ]}
                                                    onChange={handlePaymentTermsChange}
                                                    placeholder="Select Payment Terms"
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                            <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                    Category
                                                </label>
                                                <MultiSelect value={selectedCategory || []} options={categoryOptions} onChange={handleCategoryChange} placeholder="Select Category" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div style={{ width: '100%' }}>
                                        <div className="flex sm:flex-none justify-content-between gap-3">
                                            
                                            <div className="field" style={{ width: '33.99%' }}>
                                              
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                               
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                            </Card>
                            {shouldShowVendorGrades && (
                                <Card title="Vendor Grades" className="mt-5">
                                    <div>
                                        <TreeTable value={[{ key: 'inputs', data: {}, children: [] }]}>
                                            <Column header="Vendor Grade" body={() => <InputText value={newRow.grade} onChange={(e) => handleInputChange(e, 'grade')} placeholder="Vendor Grade" />} />
                                            <Column header="Description" body={() => <InputText value={newRow.description} onChange={(e) => handleInputChange(e, 'description')} placeholder="Description" />} />
                                            <Column header="Process" body={() => <Dropdown value={newRow.process} options={processOptions} onChange={handleDropdownChange} placeholder="Select Process" />} />
                                            <Column header="Cross Dock" body={() => <Checkbox inputId="crossDock" checked={newRow.crossDock} onChange={(e) => handleCheckboxChange(e, 'crossDock')} />} />
                                            <Column header="Cracked Screen" body={() => <Checkbox inputId="crackedScreen" checked={newRow.crackedScreen} onChange={(e) => handleCheckboxChange(e, 'crackedScreen')} />} />
                                            <Column header="RMA Percent" body={() => <InputText value={newRow.rmaPercentage} onChange={(e) => handleInputChange(e, 'rmaPercentage')} placeholder="RMA Percent" />} />
                                            <Column header="Action" body={() => <Button label="Add" onClick={handleAddRow} className="p-button-success" disabled={isAddButtonDisabled} />} />
                                        </TreeTable>

                                        {/* TreeTable for Displaying Added Rows */}
                                        <TreeTable value={nodes}>
                                            <Column field="grade" />
                                            <Column field="description" />
                                            <Column field="processId" />
                                            <Column body={(node) => <Checkbox checked={node.data.isCrossDock} disabled />} />
                                            <Column body={(node) => <Checkbox checked={node.data.isScreenDamage} disabled />} />
                                            <Column field="rmaPercentage" />
                                            <Column body={actionRowTemplate} />
                                        </TreeTable>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </TabPanel>

                    <TabPanel header="Contact Details">
                        <div style={{ width: '100%' }} className="mt-5">
                            <Card title="Point Of Contact">
                                {form.pocs.map((poc, index) => (
                                    <div key={index} style={{ width: '100%', marginBottom: '1rem' }}>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`pocFirstName-${index}`}>Contact Person Name</label>
                                                <InputText
                                                    id={`pocFirstName-${index}`}
                                                    value={form.pocs[index].firstName || ''} // Access directly for preselection
                                                    onChange={(e) => onInputChange(`pocs.${index}.firstName`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`pocPhone-${index}`}>Contact Person Phone</label>
                                                <InputText
                                                    id={`pocPhone-${index}`}
                                                    value={form.pocs[index].phone || ''} // Access directly for preselection
                                                    onChange={(e) => onInputChange(`pocs.${index}.phone`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`pocEmail-${index}`}>Contact Person Email</label>
                                                <InputText
                                                    id={`pocEmail-${index}`}
                                                    value={form.pocs[index].email || ''} // Access directly for preselection
                                                    onChange={(e) => onInputChange(`pocs.${index}.email`, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-content-end p-2">{form.pocs.length > 1 && poc.vendorPOCId !== null && <Button label="Delete" severity="danger" text onClick={() => onDeletePoc(index, poc.vendorPOCId)} style={{ width: '8.99%' }} />}</div>
                                        <Divider type="dashed" />
                                    </div>
                                ))}
                                <div className="flex justify-content-end p-2"> <Button label="Add" severity="success" style={{ width: '8.99%' }} onClick={onAddPoc} /></div>
                            </Card>
                        </div>
                        <div style={{ width: '100%' }} className="mt-5">
                            <Card title="Address">
                                {form.addresses.map((address, index) => (
                                    <div key={index} style={{ width: '100%', marginBottom: '1rem' }}>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`type-${index}`}>Address Type</label>
                                                <InputText id={`type-${index}`} value={address.type || ''} onChange={(e) => onInputChange(`addresses.${index}.type`, e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`address1-${index}`}>Search Address</label>
                                                <InputText id={`address1-${index}`} value={address.address1 || ''} onChange={(e) => onInputChange(`addresses.${index}.address1`, e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`address2-${index}`}>Street Address</label>
                                                <InputText id={`address2-${index}`} value={address.address2 || ''} onChange={(e) => onInputChange(`addresses.${index}.address2`, e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`city-${index}`}>City </label>
                                                <InputText id={`city-${index}`} value={address.city || ''} onChange={(e) => onInputChange(`addresses.${index}.city`, e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`state-${index}`}>State</label>
                                                <InputText id={`state-${index}`} value={address.state || ''} onChange={(e) => onInputChange(`addresses.${index}.state`, e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`zip-${index}`}>Zip Code</label>
                                                <InputText id={`zip-${index}`} value={address.zip || ''} onChange={(e) => onInputChange(`addresses.${index}.zip`, e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex justify-content-end p-2">{form.addresses.length > 1 && address.sAddrId !== null && <Button label="Delete" severity="danger" text onClick={() => onDeleteAddress(index, address.sAddrId!)} style={{ width: '8.99%' }} />}</div>
                                        <Divider type="dashed" />
                                    </div>
                                ))}
                                <div className="flex justify-content-end p-2"> <Button label="Add" severity="success" style={{ width: '8.99%' }} onClick={onAddAddress} /></div>
                            </Card>
                        </div>

                        <div style={{ width: '100%' }} className="mt-5">
                            <Card title="Notes">
                                <div className="flex justify-content-between gap-3" style={{ width: '100%' }}>
                                    <div>
                                        <div className="field">
                                            <InputTextarea rows={5} cols={100} id="note" style={{ width: '100%' }} value={form.note || ''} onChange={(e) => onInputChange('note', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        {/* <div style={{ width: '100%' }} className="mt-5">
                            <Card title="Uploads">
                                <div className="flex justify-content-between gap-3" style={{ width: '100%' }}>
                                    <div style={{ width: '50%' }}>
                                        <div>
                                            <Toast ref={toast}></Toast>

                                            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
                                            <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
                                            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

                                            <FileUpload
                                                ref={fileUploadRef}
                                                name="demo[]"
                                                url="/api/upload"
                                                multiple
                                                accept="image/*"
                                                maxFileSize={1000000}
                                                onUpload={onTemplateUpload}
                                                onSelect={onTemplateSelect}
                                                onError={onTemplateClear}
                                                onClear={onTemplateClear}
                                                headerTemplate={uploadheaderTemplate}
                                                itemTemplate={uploaditemTemplate}
                                                emptyTemplate={emptyTemplate}
                                                chooseOptions={chooseOptions}
                                                uploadOptions={uploadOptions}
                                                cancelOptions={cancelOptions}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div> */}
                    </TabPanel>
                </TabView>
            </>
        );
    };

    const header = renderBody();
    const closeDialog = () => {
        setVisible(false);
    };

    const openDialog = () => {
        setVisible(true);
    };
    const attacheDocs = async () => {
        setVisible(true)
    }

    const uploadDocs = async (assetIds: any) => {
        let vendorId = selectedCompany?.vendorId;
        if (!vendorId && selectedCompany) {
            vendorId = selectedCompany.vendorId;
        }
        console.log('1309',assetIds)
        setLoading(true);
        const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/vendors/${vendorId}/attachments`,  assetIds );
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Upload Successfully');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }
    const popupmodal = (
        <Dialog header="Upload Files" style={{ width: '600px' }} onHide={closeDialog}>
            <Toast ref={toast} />

            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
            <Tooltip>
                <Button
                    label="Upload"
                    icon="pi pi-upload"
                    className="custom-upload-btn"
                    onClick={() => {
                        fileUploadRef.current.upload();
                        closeDialog();
                    }}
                />
            </Tooltip>
            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

            <FileUpload
                ref={fileUploadRef}
                name="demo[]"
                url="/api/upload"
                mode="advanced"
                multiple
                accept="image/*"
                maxFileSize={1000000}
                onUpload={onTemplateUpload}
                onSelect={onTemplateSelect}
                onError={onTemplateClear}
                onClear={onTemplateClear}
                // emptyTemplate={emptyTemplate}
                chooseOptions={{ icon: 'pi pi-fw pi-plus', label: 'Choose' }}
                uploadOptions={{ icon: 'pi pi-fw pi-check', label: 'Upload' }}
                cancelOptions={{ icon: 'pi pi-fw pi-times', label: 'Clear' }}
            />
        </Dialog>
    );

    // const selectedPermissions = filter((details), (item) => item.permission != null)
    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel text-end ">
                            {headerMain}
                            <CustomDataTable
                                ref={dataTableRef}
                                filter
                                page={page}
                                limit={limit}
                                totalRecords={totalRecords}
                                isEdit={true}
                                isView={true}
                                isDelete={true}
                                data={companies}
                                extraButtons={[
                                    {
                                        icon: 'pi pi-cloud-upload',
                                        onClick: (item) => {
                                            setSelectedCompany(item)
                                            setVisible(true)
                                        }
                                    },
                                ]}
                                columns={[
                                    { header: '#', field: 'vendorId', filter: true, sortable: true, bodyStyle: { minWidth: 80, maxWidth: 80 }, filterPlaceholder: 'Search #' },
                                    { header: 'Name', field: 'name', filter: true, filterPlaceholder: 'Search name' },
                                    { header: 'Alias', field: 'aliasName', filter: true, filterPlaceholder: 'Search alias', style: { minWidth: 120, maxWidth: 120 } },
                                    { header: 'Email', field: 'email', filter: true, filterPlaceholder: 'Search Email Id' },
                                    { header: 'Phone', field: 'phone', filter: true, filterPlaceholder: 'Search phone' }
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onEdit={(item: any) => onRowSelect(item, ACTIONS.EDIT)}
                                onView={(item: any) => onRowSelect(item, ACTIONS.VIEW)}
                                onDelete={(item: any) => onRowSelect(item, ACTIONS.DELETE)}
                            />
                        </div>
                        {popupmodal}
                        <UploadFile
                            isVisible={visible}
                            onSelect={(option: any) => {
                                setVisible(false);
                                if (option && option.length > 0) {
                                    let assetIds = option.map((item: any) => ({
                                        assetId: item.assetId
                                    }))
                                    uploadDocs(assetIds);
                                }
                            }}
                        />
                        <FileView
                            isVisible={isShowImage}
                            assetFile={assetFile}
                            onClose={() => setShowImage(false)}
                        />
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

                                    {/* Edit Permissions */}
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div className="p-fluid">{renderBody()}</div>}
                                    {action === ACTIONS.VIEW && details && (
                                        <div className="flex flex-wrap">
                                            <div className="flex-1 p-4">
                                                <h3 className="font-bold mb-2">Company Details</h3>
                                                <div className="mb-4">
                                                    <small>Company Name</small>
                                                    <p className="font-bold">{details?.name}</p>
                                                </div>
                                                <div className="mb-4">
                                                    <small>Alias Name</small>
                                                    <p className="font-bold">{details?.aliasName}</p>
                                                </div>
                                                <div className="mb-4">
                                                    <small>Website</small>
                                                    <p className="font-bold">{details?.website || 'N/A'}</p>
                                                </div>
                                                <div className="mb-4">
                                                    <small>Phone</small>
                                                    <p className="font-bold">{details?.phone || 'N/A'}</p>
                                                </div>
                                                <div className="mb-4">
                                                    <small>Email</small>
                                                    <p className="font-bold">{details?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-4">
                                                <h3 className="font-bold mb-2">POCs</h3>
                                                {details?.pocs && details?.pocs.length > 0 ? (
                                                    details.pocs.map((poc: any, index: number) => (
                                                        <div key={index} className="mb-4">
                                                            <small>POC {index + 1}</small>
                                                            <p className="font-bold">
                                                                {poc.firstName} {poc.lastName} - {poc.email} - {poc.phone}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="font-bold">No POCs available</p>
                                                )}
                                            </div>
                                            <div className="flex-1 p-4">
                                                <h3 className="font-bold mb-2">Addresses</h3>
                                                {details?.addresses && details?.addresses.length > 0 ? (
                                                    details.addresses.map((address: any, index: number) => (
                                                        <div key={index} className="mb-4">
                                                            <small>Address {index + 1}</small>
                                                            <p className="font-bold">
                                                                {address.address1}, {address.address2}, {address.city}, {address.state}, {address.zip}, {address.country}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="font-bold">No addresses available</p>
                                                )}
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

export default Vendorss;
