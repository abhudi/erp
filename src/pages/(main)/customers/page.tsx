

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Vendor, Address, ContactPerson, CustomResponse, UploadedFile, Permissions, MasterCode } from '../../../types';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Customer } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import Sidebar from '../../../components/Sidebar';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { buildQueryParams, getRowLimitWithScreenHeight, validateCountryCode, validateEmail, validateName, validatePhoneNumber } from '../../../utils/uitl';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { Calendar } from 'primereact/calendar';
import moment from 'moment';
import { constant } from '../../../utils/constant';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // Or your preferred theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete'
};

const defaultForm: Customer = {
    vendorId:'',
    name: '',
    aliasName: '',
    companyName: '',
    phone: '',
    email: '',
    fax: '',
    isSupplier:false,
    isCustomer:true,
    isManufacture:null,
    accPayContact:'',
    estDate:null,
    businessTypeId:null,
    industryTypeId:null,
    taxNumber:null,
    parentOrg:null,
    shipmentPrefId:null,
    shipAccountNumber:null,
    shipCarrierId:null,
    shipCarrierCountryId:null,
    shipCarrierZip:null,
    replaceThreshold:null,
    batteryHealth:null,
    nonOEM:null,
    website: '',
    warehouseIds: [],
    paymentTerms: [],
    categoryIds: [],
    pocs: [],
    addresses: [
        {
            type: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            sAddrId:null
        },
        {
            type: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            sAddrId:null
        },
        {
            type: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            sAddrId:null
        }
    ],
    note: '',
    gradings: []
};

const Customers = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);

    const [companies, setCompanies] = useState<Customer[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Customer | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<Customer>(defaultForm);
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
    const [trackings, setTrackings] = useState<MasterCode[]>([]);
    const [carrierCountry, setCarrierCountry] = useState<MasterCode[]>([]);
    const [carrier, setCarrier] = useState<MasterCode[]>([]);
    const [sameAsRegistered, setSameAsRegistered] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>([]);
    const[businessmasterCode,setbusinessmasterCode]=useState<any>([])
    const[industrymasterCode,setIndustrymasterCode]=useState<any>([])
    const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
    const [businessTypeData, setbusinessTypeData] = useState<any[]>([]);
    const [industryTypeData, setIndustryTypeData] = useState<any[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
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
        fetchShipmentCarriers();
        fetchCountryCarriers();
        fetchAllCarriers();

        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        setScroll(false);
        fetchIndustryType();

        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        setScroll(false);
        fetchBusinessType();

        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        setScroll(false);
        // fetchmastercodeData();

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
        setPage(params.page);
        params.include = 'pocs,vendorCategories,vendorWarehouses,paymentSetup,VendorGrades';
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/vendors?filters.vendorType=isCustomer`); 
        setLoading(false);
        if (response.code === 'SUCCESS') {
            if (response.total) {
                setTotalRecords(response?.total);
            }
            setCompanies(response.data); // Store vendors in state

            // Extract the first vendorId
            const vendorId = response.data[0]?.vendorId;

            if (vendorId) {
                setSelectedVendorId(vendorId);
            }
        } else {
            setCompanies([]);
        }
    };
    const getBusinessTypeName = (businessTypeId: string) => {
        const matchingType = businessTypeData.find(
            (type) => type.masterCodeId === businessTypeId
        );
        return matchingType ? matchingType.code : '';
    };
    const fetchShipmentCarriers = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.shippingCarrier}`);
        if (response.code == 'SUCCESS') {
            setTrackings(response.data);
        } else {
            setTrackings([]);
        }
        setLoading(false);
    };
    const fetchCountryCarriers = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.CarrierCountry}`);
        if (response.code == 'SUCCESS') {
            setCarrierCountry(response.data);
        } else {
            setCarrierCountry([]);
        }
        setLoading(false);
    };

    const fetchAllCarriers = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.Carrier}`);
        if (response.code == 'SUCCESS') {
            setCarrier(response.data);
        } else {
            setCarrier([]);
        }
        setLoading(false);
    };
    const fetchBusinessType = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.businessType}`);
        if (response.code == 'SUCCESS') {
            setbusinessTypeData(response.data);
        } else {
            setbusinessTypeData([]);
        }
        setLoading(false);
    };
    const fetchIndustryType = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.industryType}`);
        if (response.code == 'SUCCESS') {
            setIndustryTypeData(response.data);
        } else {
            setIndustryTypeData([]);
        }
        setLoading(false);
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
            const includedEntities = ['pocs', 'vendorCategories', 'vendorWarehouses', 'paymentSetup', 'VendorGrades','address'];
            const queryString = `query=${encodeURIComponent(includedEntities.join(','))}`;
            const response: CustomResponse = await GetCall(`/company/${companyId}/vendors/${vendorId}?${queryString}`);
            if (response.code === 'SUCCESS') {
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
        setForm(form);
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
        setSameAsRegistered(false)
        setbusinessmasterCode([]);
        setIndustrymasterCode([]);


    };
    const showAddNew = () => {
        fetchPermissions();
        setIsShowSplit(true);
        setAction('add');
        setSelectedCompany(null);
        setForm(defaultForm);
        setSearchQuery('');
        setFilteredCities(cities);
        setProducts([]);
        setSelectedNames([]);
        setSelectedWarehouse([]);
        setSelectedCategory([]);
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
        // const warehouseId=selectedSubLocation
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

            saveAsExcelFile(excelBuffer, 'Customers');
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
    const areAddressesSame = (address1: any, address2: any): boolean => {
        const fieldsToCompare = ['type', 'address1', 'address2', 'city', 'state', 'zip', 'country'];
    
        return fieldsToCompare.every(field => address1[field] === address2[field]);
    };
    

    const onRowSelect = async (company: Customer, action: any) => {
        await setSelectedCompany(company);
        setcompanyRackId(company);
        // setSelectedWarehouse(company);
        const vendorData = await fetchVendorData(company, action);
        const categoryIds = vendorData.vendorCategories.map((category: any) => category.categoryId);
        const warehouseId = vendorData.vendorWarehouses.map((warehouse: any) => warehouse.warehouseId);
        setAction(action);
        setSelectedKeys(null);
        

        if (action === ACTIONS.DELETE) {
            return;
        }
        const formWithDefaults = {
            ...company,
            gradings: vendorData.grades || [],
            pocs: company.pocs || [],
            addresses: vendorData.addresses || [{ type: '', address1: '', address2: '', city: '', state: '', zip: '', country: '' }],
            warehouseIds: warehouseId || [],
            categoryIds: categoryIds || [],
            businessTypeId: company.businessTypeId || null, 
            industryTypeId: company.industryTypeId || null, 
            estDate: vendorData.estDate ? new Date(vendorData.estDate) : null,
        };
        if (action === ACTIONS.EDIT) {
            setForm({ ...formWithDefaults });
            if (vendorData.addresses && vendorData.addresses.length > 1) {
                const isSame = areAddressesSame(vendorData.addresses[0], vendorData.addresses[1]);
                setSameAsRegistered(isSame);
            }
        }
        setIsShowSplit(true);

        setTimeout(() => {}, 500);
    };
    const onInputChange = (name: string | { [key: string]: any }, val?: any) => {
        setForm((prevForm: any) => {
            let updatedForm = { ...prevForm };
            if (typeof name === 'string') {
                if (name.startsWith('addresses.')) {
                    const [_, index, field] = name.split('.');
                    updatedForm.addresses[index][field] = val;
                } else {
                    updatedForm[name] = val;
                }
            } else {
                updatedForm = { ...updatedForm, ...name };
            }
    
            return updatedForm;
        });
    };

    const getTitle = () => {
        if (action === ACTIONS.ADD) return 'ADD CUSTOMER';
        if (action === ACTIONS.EDIT) return 'EDIT CUSTOMER';
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
                    <h4 className="mb-0">Customers</h4>
                </span>
                <span className="flex gap-5">
                    <Button type="button" size="small" icon="pi pi-file-excel" onClick={exportExcel} data-pr-tooltip="XLS" />
                    <div className=" ">
                        <Button label="Customer" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const headerMain = renderHeaderMain();
    const panelFooterTemplate = () => {
        return (
            <div className="flex flex-column justify-content-end p-2">
                {action === ACTIONS.ADD && activeIndex === 0 && (
                    <div className="flex justify-content-end mb-2">
                        <Button label="Next" outlined onClick={handleNext} />
                    </div>
                )}
                <div className="flex justify-content-end">
                    <Button label="Cancel" severity="secondary" outlined text onClick={closeIcon} />
                    <Button label="Save" onClick={onSave} />
                </div>
            </div>
        );
    };

    const handleNext = () => {
        setActiveIndex(1); 
    };

    const handleBusinessTypeChange = (e: { value: number }) => {
        setbusinessmasterCode(e.value); 
        onInputChange('businessTypeId', e.value); 
    };
    const businessTypeOptions = businessTypeData.map((businessType) => ({
        label: businessType.code,
        value: businessType.masterCodeId
    }));
    const handleIndustryType = (e: { value: number }) => {
        setIndustrymasterCode(e.value); 
        onInputChange('industryTypeId', e.value); 
    };
    const industryTypeOptions = industryTypeData.map((industryType) => ({
        label: industryType.code,
        value: industryType.masterCodeId
    }));

    const handlePreferredShipmentMode = (e: { value: number }) => {
        onInputChange('shipmentPrefId', e.value); 
    };
    const handleCarrierCountry = (e: { value: number }) => {
        onInputChange('shipCarrierCountryId', e.value);
    };
    const handleCarrier = (e: { value: number }) => {
        onInputChange('shipCarrierId', e.value); 
    };


    const handleCheckboxChange = (checked: boolean) => {
        setSameAsRegistered(checked);
    
        const updatedForm = { ...form };
        if (checked) {
            // Copy Registered Address (index 0) to Billing Address (index 1)
            updatedForm.addresses[1] = { ...updatedForm.addresses[0] };
        } else {
            // Clear Billing Address
            updatedForm.addresses[1] = {
                type: '',
                address1: '',
                address2: '',
                city: '',
                state: '',
                zip: '',
                country: '',
                sAddrId: null
            };
        }
        setForm(updatedForm);
    };
    
    const cityOptions = [
        { label: 'New York', value: 'New York' },
        { label: 'Los Angeles', value: 'Los Angeles' },
        { label: 'Chicago', value: 'Chicago' },
    ];
    const stateOptions = [
        { label: 'New York', value: 'New York' },
        { label: 'California', value: 'California' },
        { label: 'Illinois', value: 'Illinois' },
    ];
    const renderBody = () => {
        return (
            <>
                <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                    <TabPanel header="Company Details">
                        <div style={{ width: '100%' }}>
                            <Card>
                                <div className="p-fluid">
                                    <div style={{ width: '100%' }}>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor="vendorName"> Company Legal Name</label>
                                                <InputText id="name" value={get(form, 'name')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('name', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor="accPayContact"> Account Payable Contact</label>
                                                <InputText id="accPayContact" value={get(form, 'accPayContact')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('accPayContact', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor="phone"> Phone Number</label>
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
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor="estDate"> Establishment Date</label>
                                                <Calendar appendTo={'self'} value={get(form, 'estDate') || null}  onChange={(e) => onInputChange('estDate', moment(e.value).toDate())} className="w-full" showIcon required={true}/>
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                                <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                    Business Type
                                                </label>
                                                    <Dropdown 
                                                 value={get(form, 'businessTypeId') || ''} 
                                                options={businessTypeOptions} 
                                                onChange={handleBusinessTypeChange} 
                                                placeholder="Select Business Type" 
                                            />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                                <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                    Industry Type
                                                </label>
                                                <Dropdown 
                                                value={get(form,'industryTypeId')|| ''} 
                                                options={industryTypeOptions} 
                                                onChange={handleIndustryType} 
                                                placeholder="Select Industry Type" 
                                            />
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                            <label htmlFor="taxNumber"> Federal Tax ID</label>
                                            <InputText id="taxNumber" value={get(form, 'taxNumber')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('taxNumber', e.target.value)} />
                                            </div>
                                            <div className="field" style={{ width: '33.99%', position: 'relative' }}>
                                                <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                    Company Website
                                                </label>
                                                <InputText id="website" value={get(form, 'website')} validateOnly pattern="[a-zA-Z]*" onChange={(e) => onInputChange('website', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <div style={{ width: '100%' }} className="mt-5">
                                <Card title="Registered Company Address">
                                {form.addresses.map((address, index) => index === 0 && ( // Render only Registered Address fields
                    <div key={index} style={{ width: '100%', marginBottom: '1rem' }}>
                        <div className="flex justify-content-between gap-3">
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`type-${index}`}>Search Address</label>
                                <InputText
                                    id={`type-${index}`}
                                    value={address.type || ''}
                                    placeholder="Google Address Search"
                                    onChange={(e) => onInputChange(`addresses.${index}.type`, e.target.value)}
                                />
                            </div>
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`address1-${index}`}>Address Line 1</label>
                                <InputText
                                    id={`address1-${index}`}
                                    value={address.address1 || ''}
                                    onChange={(e) => onInputChange(`addresses.${index}.address1`, e.target.value)}
                                />
                            </div>
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`address2-${index}`}>Address Line 2</label>
                                <InputText
                                    id={`address2-${index}`}
                                    value={address.address2 || ''}
                                    onChange={(e) => onInputChange(`addresses.${index}.address2`, e.target.value)}
                                />
                            </div>
                            
                        </div>
                        <div className="flex justify-content-between gap-3">
                                                <div className="field" style={{ width: '33.99%' }}>
                                                        <label htmlFor={`city-${index}`}>City </label>
                                                        <Dropdown
                                value={form.addresses[0].city}
                                options={cityOptions}
                                onChange={(e) =>
                                    onInputChange('addresses.0.city', e.value)
                                }
                                placeholder="Select City"
                            />
                                                </div>
                                                    <div className="field" style={{ width: '33.99%' }}>
                                                        <label htmlFor={`state-${index}`}>State</label>
                                                        <Dropdown
                                value={form.addresses[0].state}
                                options={stateOptions}
                                onChange={(e) =>
                                    onInputChange('addresses.0.state', e.value)
                                }
                                placeholder="Select State"
                            />
                                                </div>
                                                    <div className="field" style={{ width: '33.99%' }}>
                                                        <label htmlFor={`zip-${index}`}>Zip Code</label>
                                                        <InputText id={`zip-${index}`} value={address.zip || ''} onChange={(e) => onInputChange(`addresses.${index}.zip`, e.target.value)} />
                                                    </div>
                                            </div>
                    </div>
                ))}
                                </Card>
                            </div>

                            <div style={{ width: '100%' }} className="mt-5">
            <Card title="Billing Address">
                <div className="flex justify-content-between gap-3">
                    <div className="field" style={{ width: '33.99%' }}>
                        <Checkbox
                            inputId="sameAsRegistered"
                            checked={sameAsRegistered}
                            onChange={(e) => handleCheckboxChange(e.checked ?? false)}
                        />
                        <label htmlFor="sameAsRegistered" className="ml-2">
                            Same as Registered Address
                        </label>
                    </div>
                </div>
                {form.addresses.map((address, index) => index === 1 && ( // Render only Billing Address fields
                    <div key={index} style={{ width: '100%', marginBottom: '1rem' }}>
                        <div className="flex justify-content-between gap-3">
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`type-${index}`}>Search Address</label>
                                <InputText
                                    id={`type-${index}`}
                                    value={address.type || ''}
                                    placeholder="Google Address Search"
                                    onChange={(e) => onInputChange(`addresses.${index}.type`, e.target.value)}
                                    disabled={sameAsRegistered} // Disable input if "Same as Registered" is checked
                                />
                            </div>
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`address1-${index}`}>Address Line 1</label>
                                <InputText
                                    id={`address1-${index}`}
                                    value={address.address1 || ''}
                                    onChange={(e) => onInputChange(`addresses.${index}.address1`, e.target.value)}
                                    disabled={sameAsRegistered}
                                />
                            </div>
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`address2-${index}`}>Address Line 2</label>
                                <InputText
                                    id={`address2-${index}`}
                                    value={address.address2 || ''}
                                    onChange={(e) => onInputChange(`addresses.${index}.address2`, e.target.value)}
                                    disabled={sameAsRegistered}
                                />
                            </div>
                        </div>
                        <div className="flex justify-content-between gap-3">
                        <div className="field" style={{ width: '33.99%' }}>
                            <label htmlFor={`city-${index}`}>City </label>
                                <Dropdown
                                value={form.addresses[1].city}
                                options={cityOptions}
                                onChange={(e) =>
                                    onInputChange('addresses.1.city', e.value)
                                }
                                placeholder="Select City"
                                disabled={sameAsRegistered}
                            />
                        </div>
                            <div className="field" style={{ width: '33.99%' }}>
                                <label htmlFor={`state-${index}`}>State</label>
                                <Dropdown
                                value={form.addresses[1].state}
                                options={stateOptions}
                                onChange={(e) =>
                                    onInputChange('addresses.1.state', e.value)
                                }
                                placeholder="Select State"
                                disabled={sameAsRegistered}
                            />
                        </div>
                        <div className="field" style={{ width: '33.99%' }}>
                            <label htmlFor={`zip-${index}`}>Zip Code</label>
                                <InputText id={`zip-${index}`} value={address.zip || ''} onChange={(e) => onInputChange(`addresses.${index}.zip`, e.target.value)}  disabled={sameAsRegistered}/>
                            </div>
                        </div>
                    </div>
                ))}
            </Card>
        </div>

        <div style={{ width: '100%' }} className="mt-5">
                            <Card title="Parent Company Information">
                                <div style={{ width: '100%', marginBottom: '1rem' }}>
                                    <div className="flex justify-content-between gap-3">
                                        <div className="field" style={{ width: '33.99%' }}>
                                            <label htmlFor="parentOrg">Parent Company Name</label>
                                            <InputText
                                                id="parentOrg"
                                                value={form.parentOrg || ''}
                                                onChange={(e) => onInputChange('parentOrg', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {form.addresses.map((address, index) => index === 2 && (
                                    <div key={index} style={{ width: '100%', marginBottom: '1rem' }}>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`type-${index}`}>Search Address</label>
                                                <InputText
                                                    id={`type-${index}`}
                                                    value={address.type || ''}
                                                    placeholder="Google Address Search"
                                                    onChange={(e) => onInputChange(`addresses.${index}.type`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`address1-${index}`}>Address Line 1</label>
                                                <InputText
                                                    id={`address1-${index}`}
                                                    value={address.address1 || ''}
                                                    onChange={(e) => onInputChange(`addresses.${index}.address1`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`address2-${index}`}>Address Line 2</label>
                                                <InputText
                                                    id={`address2-${index}`}
                                                    value={address.address2 || ''}
                                                    onChange={(e) => onInputChange(`addresses.${index}.address2`, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`city-${index}`}>City </label>
                                                <Dropdown
                                                    value={form.addresses[2].city}
                                                    options={cityOptions}
                                                    onChange={(e) => onInputChange(`addresses.${index}.city`, e.value)}
                                                    placeholder="Select City"
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`state-${index}`}>State</label>
                                                <Dropdown
                                                    value={form.addresses[2].state}
                                                    options={stateOptions}
                                                    onChange={(e) => onInputChange(`addresses.${index}.state`, e.value)}
                                                    placeholder="Select State"
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor={`zip-${index}`}>Zip Code</label>
                                                <InputText
                                                    id={`zip-${index}`}
                                                    value={address.zip || ''}
                                                    onChange={(e) => onInputChange(`addresses.${index}.zip`, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>


                        </div>
                    </TabPanel>

                    <TabPanel header="Requirements">
                        <div style={{ width: '100%' }} className="mt-5">
                            <Card>
                                
                                    <div style={{ width: '100%', marginBottom: '1rem' }}>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='shipmentPrefId'>Preferred Shipment Mode</label>
                                                <Dropdown value={get(form, 'shipmentPrefId') || ''}  onChange={ handlePreferredShipmentMode} options={trackings} optionLabel="code" optionValue="masterCodeId" placeholder="Shipment carrier" className="w-full" />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='shipAccountNumber'>Shipping Account Number</label>
                                                <InputText
                                                    id='shipAccountNumber'
                                                    value={get(form, 'shipAccountNumber')} 
                                                    onChange={(e) => onInputChange('shipAccountNumber', e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='shipCarrierId'>Carrier</label>
                                                <Dropdown value={get(form, 'shipCarrierId') || ''} onChange={handleCarrier} options={carrier} optionLabel="code" optionValue="masterCodeId" placeholder="Carrier" className="w-full" />
                                            </div>
                                        </div>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='shipCarrierZip'>Carrier Zip Code</label>
                                                <InputText
                                                    id='shipCarrierZip'
                                                    value={get(form, 'shipCarrierZip')} 
                                                    onChange={(e) => onInputChange(`shipCarrierZip`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='shipCarrierCountryId'>Carrier Country</label>
                                            <Dropdown value={get(form, 'shipCarrierCountryId')}  onChange={handleCarrierCountry} options={carrierCountry} optionLabel="code" optionValue="masterCodeId" placeholder="Carrier Country" className="w-full" />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='replaceThreshold'>Replaced Screen ThreShold</label>
                                                <InputText
                                                    id='replaceThreshold'
                                                    value={get(form, 'replaceThreshold')} 
                                                    onChange={(e) => onInputChange(`replaceThreshold`, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-content-between gap-3">
                                            <div className="field" style={{ width: '33.99%' }}>
                                                <label htmlFor='batteryHealth'>Battery Health</label>
                                                <InputText
                                                    id='batteryHealth'
                                                    value={get(form, 'batteryHealth')}  
                                                    onChange={(e) => onInputChange(`batteryHealth`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%'}}>
                                                <label htmlFor='nonOEM'>Non OEM Screen</label>
                                                <InputText
                                                    id='nonOEM'
                                                    value={get(form, 'nonOEM')} // Access directly for preselection
                                                    onChange={(e) => onInputChange(`nonOEM`, e.target.value)}
                                                />
                                            </div>
                                            <div className="field" style={{ width: '33.99%' }}>
                                                {/* Empty placeholder to align with other rows */}
                                            </div>
                                            
                                        </div>            
                                    </div>
                            </Card>
                        </div>
                    </TabPanel>
                </TabView>
            </>
        );
    };

    const header = renderBody();

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
                                isDelete={true}
                                data={companies}
                                columns={[
                                    { header: '#', field: 'vendorId', filter: true, sortable: true, bodyStyle: { minWidth: 80, maxWidth: 80 }, filterPlaceholder: 'Search #' },
                                    { header: 'Company Name', field: 'name', filter: true, filterPlaceholder: 'Search name' },
                                    { header: 'Email Id', field: 'email', filter: true, filterPlaceholder: 'Search email' },
                                    { header: 'Contact Number', field: 'phone', filter: true, filterPlaceholder: 'Search phone' },
                                    { 
                                        header: 'Business Type', 
                                        field: 'businessTypeId', 
                                        filter: true, 
                                        filterPlaceholder: 'Search Business Type', 
                                        style: { minWidth: 120, maxWidth: 120 },
                                        body: (rowData: any) => getBusinessTypeName(rowData.businessTypeId), // Custom renderer
                                    },
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onEdit={(item: any) => onRowSelect(item, ACTIONS.EDIT)}
                                onDelete={(item: any) => onRowSelect(item, ACTIONS.DELETE)}
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

                                    {/* Edit Permissions */}
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && <div className="p-fluid">{renderBody()}</div>}
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

export default Customers;
