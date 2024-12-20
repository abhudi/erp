


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { CompanyProductsMapping, CustomResponse, Permissions } from '../../../types';
import { ProgressSpinner } from 'primereact/progressspinner';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { InputText } from 'primereact/inputtext';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { EmptyCategoryAttribute } from '../../../types/forms';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import Sidebar from '../../../components/Sidebar';
import { TreeTable } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { Dropdown } from 'primereact/dropdown';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'update',
    DELETE: 'delete',
    REMOVE: 'remove'
};

const defaultForm: EmptyCategoryAttribute = {
    catAttrId: undefined,
    codeTypeId: null,
    selectionType: '',
    action: '',
    isSKUEnabled: true,
    isSKURank: 0,
    sampleValue: '',
    codeType: '',
    desc: ''
};

const ObjectInquiryPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [companies, setCompanies] = useState<CompanyProductsMapping[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [selectedLocationId, setSelectedLocationId] = useState<any>(null);
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptyCategoryAttribute>(defaultForm);
    const [confirmTextValue, setConfirmValue] = useState<any>('');
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [getcategoryId, setGetCategoryId] = useState<any>([]);
    const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys | null>({});
    const [catAttrId, setcatAttrId] = useState<any>(null);
    const [dropdownOptions, setDropdownOptions] = useState<any>([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [filteredCities, setFilteredCities] = useState<{ name: string; code: string; codeType: string; selectionType: string; isSKURank: number | null }[]>([]);
    const [selectedCity, setSelectedCity] = useState<{ name: string; code: string; codeType: string; selectionType: string; isSKURank: number } | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [formArray, setFormArray] = useState<EmptyCategoryAttribute[]>([]);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [selectedCompanyForDelete, setSelectedCompanyForDelete] = useState(null);
    const [selectedCheckBox, setSelectedCheckBox] = useState<any>([]);
    const [pendingDropdownEvents, setPendingDropdownEvents] = useState<any[]>([]); // To store pending dropdown events
    const [removedRows, setRemovedRows] = useState<EmptyCategoryAttribute[]>([]);
    const [expandedKeys, setExpandedKeys] = useState({});
    const [showApplications, setShowApplications] = useState(true);

    useEffect(() => {
        setScroll(false);
        fetchData();

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

    const fetchData = async () => {
        const companyId = get(user, 'company.companyId');
        // const warehouseId=selectedSubLocation
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/attributes`);

        console.log(response, 'response');
        setLoading(false);
        if (response.code == 'SUCCESS') {
            setCompanies(response.data);
            processCompanies(response.data);
            fetchPermissions();
            fetchDetails();
            setSelectedCompany(null);
        } else {
            setCompanies([]);
        }
    };

    const [tableHeight, setTableHeight] = useState('30rem');
    const calculateTableHeight = () => {
        const headerHeight = 340;
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

    const onUpdate = async (companyForm: any) => {
        const combinedData = [...companyForm, ...removedRows];
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        const response: CustomResponse = await PostCall(`/company/${companyId}/categories/${getcategoryId}/sync-attributes`, combinedData);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            setIsShowSplit(false);
            // setAction(ACTIONS.VIEW)
            setSelectedCompany(selectedCompany);
            // fetchDetails(selectedCompany!);
            fetchData();
            setAlert('success', 'Successfully Updated');
        } else {
            setAlert('error ', response.message);
        }
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
            // Set only codeTypes to setCities
            setCities(codeTypes);
        } else {
            setCities([]);
        }
    };

    const processCompanies = (companies: CompanyProductsMapping[]) => {
        const groupedData: Record<string, any> = {};

        companies.forEach((company) => {
            const categoryName = company.category?.name;

            if (!categoryName) return;
            if (!groupedData[categoryName]) {
                groupedData[categoryName] = {
                    categoryId: company.category.categoryId,
                    name: categoryName,
                    codeTypes: []
                };
            }
            groupedData[categoryName].codeTypes.push({
                codeTypeId: company.codeType.codeTypeId,
                codeType: company.codeType.codeType,
                catAttrId: company.catAttrId,
                selectionType: company.selectionType,
                isSKURank: company.isSKURank
            });
            groupedData[categoryName].codeTypes.sort((a: any, b: any) => a.isSKURank - b.isSKURank);
        });
        const formattedTreeData: TreeNode[] = Object.keys(groupedData).map((categoryName) => ({
            key: groupedData[categoryName].categoryId.toString(),
            data: {
                name: categoryName,
                codeTypes: groupedData[categoryName].codeTypes
            },
            children: groupedData[categoryName].codeTypes.map((codeType: any) => ({
                key: codeType.codeTypeId.toString(),
                selectionType: codeType.selectionType,
                isSKURank: codeType.isSKURank,
                data: {
                    codeTypeId: codeType.codeTypeId,
                    codeType: codeType.codeType,
                    catAttrId: codeType.catAttrId,
                    isSKURank: codeType.isSKURank
                }
            }))
        }));
        setTreeData(formattedTreeData);
    };

    const closeIcon = () => {
        setSelectedCompany(null);
        setIsShowSplit(false);
        setForm(defaultForm);
        setAction(null);
        setSelectedKeys(null);
        setSelectedOption(null);
        setSelectedCity(null);
        setSearchQuery('');
        setFilteredCities(cities);
        setSelectedNames([]);
        setProducts([]);
        setIsDialogVisible(false);
        setSelectedCompanyForDelete(null);
        setSelectedCheckBox([]);
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
        setSelectedCheckBox([]);
    };

    const createSelectedRowsArray = () => {
        const selectedRowsArray = formArray.map((row) => ({
            ...row
        }));
        return selectedRowsArray;
    };

    const onSave = () => {
        const selectedRowsObject = createSelectedRowsArray();
        if (action == ACTIONS.ADD) {
            onInputChange('action', 'add');
            onNewAdd(selectedRowsObject);
            setIsShowSplit(false);
            setSelectedCompany(null);
            setIsShowSplit(false);
            setForm(defaultForm);
            setAction(null);
            setSelectedKeys(null);
            setSelectedOption(null);
            setSelectedCity(null);
            setSearchQuery('');
            setFilteredCities(cities);
            setSelectedNames([]);
            setProducts([]);
            setSelectedCheckBox([]);
            return;
        }
        if (selectedCompanyForDelete) {
            onDeleteAll(selectedCompanyForDelete);
        }
        setIsDialogVisible(false);
        setSelectedCompanyForDelete(null);

        if (action == ACTIONS.EDIT) {
            // onInputChange('action', 'update');
            onUpdate(selectedRowsObject);
        }

        if (action == ACTIONS.DELETE) {
            onInputChange('action', 'delete');
            onDelete();
        }
    };
    const onMasterCode = async (companyForm: any) => {
        setIsDetailLoading(true);
        const companyId = get(user, 'company.companyId');
        const response: CustomResponse = await PostCall(`/company/${companyId}/master-code-types`, companyForm);
        setIsDetailLoading(false);
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Successfully Added');
        } else {
            setAlert('error', response.message);
        }
    };

    const onNewAdd = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        if (companyForm.length === 0) {
            setAlert('error', 'No Attributes Selected');
        } else {
            const response: CustomResponse = await PostCall(`/company/${companyId}/categories/${getcategoryId}/sync-attributes`, companyForm);
            setIsDetailLoading(false);
            console.log('response', response);
            if (response.code == 'SUCCESS') {
                // setAction(ACTIONS.VIEW)
                setSelectedCompany(response.data);
                // fetchDetails(response.data);
                fetchData();
                setAlert('success ', 'Successfully Added');
            } else {
                setAlert('error', response.message);
            }
        }
    };
    // Function to perform the delete all
    const onDeleteAll = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);

        if (!companyForm.children || companyForm.children.length === 0) {
            setAlert('error', 'No Attributes Selected');
            setIsDetailLoading(false);
            return;
        }

        const payload = companyForm.children.map((child: any) => ({
            catAttrId: child.data.catAttrId,
            codeTypeId: child.data.codeTypeId,
            action: 'remove',
            selectionType: child.selectionType || '',
            isSKUEnabled: child.isSKUEnabled || true,
            isSKURank: child.isSKURank || '',
            sampleValue: child.sampleValue || ''
        }));

        try {
            const response: CustomResponse = await PostCall(`/company/${companyId}/categories/${companyForm.key}/sync-attributes`, payload);
            setIsDetailLoading(false);

            if (response.code === 'SUCCESS') {
                setAction('');
                setSelectedCompany(null);
                fetchData();
                setAlert('success', 'Successfully Deleted');
            } else {
                setAlert('error', response.message);
            }
        } catch (error) {
            setIsDetailLoading(false);
            setAlert('error', 'An error occurred while deleting');
        }
    };

    const onDelete = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);

        const response: CustomResponse = await DeleteCall(`/company/${companyId}/attributes/${catAttrId.data?.catAttrId}`);
        setLoading(false);
        console.log('response', response);
        if (response.code == 'SUCCESS') {
            setAction('');
            setSelectedCompany(null);
            fetchData();
            setAlert('success ', 'Successfully Deleted ');
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

    const onRowSelect = async (company: any, action: any) => {
        await setSelectedCompany(company);
        setcatAttrId(company);
        setSelectedLocationId(company);
        setAction(action);
        setSelectedKeys(null);

        if (action === ACTIONS.DELETE || action === ACTIONS.REMOVE) {
            setSelectedCompanyForDelete(company);
            setIsDialogVisible(true);
            return;
        }

        if (action === ACTIONS.EDIT) {
            const codeTypes = company.children.map((child: any) => child.data);
            const codeTypeNames = codeTypes.map((data: any) => data.codeType);
            setSelectedCheckBox(company);
            const matchingOption = dropdownOptions.find((option: { key: any }) => option.key === company.key);
            if (matchingOption) {
                setSelectedOption(matchingOption);
                setGetCategoryId(matchingOption.key);
            }
            const matchedCities = codeTypeNames.map((codeTypeName: string) => filteredCities.find((city) => city.name === codeTypeName)).filter((city: undefined) => city !== undefined);
            const dropdownEvents = matchedCities.map((matchedCity: any) => ({
                value: matchedCity
            }));
            setPendingDropdownEvents(dropdownEvents);

            setSelectedCity(matchedCities);
        }

        setIsShowSplit(true);
    };
    useEffect(() => {
        if (selectedCheckBox && pendingDropdownEvents.length > 0) {
            pendingDropdownEvents.forEach((event, index) => {
                setTimeout(() => {
                    onDropdownChange(event);
                }, index * 500);
            });
            setPendingDropdownEvents([]);
        }
    }, [selectedCheckBox]);
    const onInputChange = (key: string, value: any) => {
        setForm((prevForm) => ({
            ...prevForm,
            [key]: value
        }));
    };

    const nodes = [
        {
            key: '0',
            data: { name: 'Sub Location : SL-1', size: '200KB', type: 'Folder' },
            children: [
                {
                    key: '0-0',
                    data: { name: 'Self : RK-1', size: '150KB', type: 'Folder' },
                    children: [
                        {
                            key: '0-0-0',
                            data: { name: 'Row: RW-1', size: '100KB', type: 'Folder' },
                            children: [
                                {
                                    key: '0-0-0-0-0',
                                    data: { name: 'Bin : BN-1', size: '75KB', type: 'Folder' },
                                    children: [
                                        {
                                            key: '0-0-0-0',
                                            data: { name: 'Bin : BN-1', size: '75KB', type: 'Folder' },
                                            children: [
                                                { key: '0-0-0-0-0', data: { name: '8564567', size: '25KB', type: 'Document' } },
                                                { key: '0-0-0-0-1', data: { name: '8564567', size: '50KB', type: 'Spreadsheet' } },
                                                { key: '0-0-0-0-2', data: { name: '8564567', size: '50KB', type: 'Spreadsheet' } },
                                                { key: '0-0-0-0-3', data: { name: '8564567', size: '50KB', type: 'Spreadsheet' } }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ];

    const onValueChange = (e: any) => setConfirmValue(e.target.value);
    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>
                        {action == ACTIONS.ADD ? 'Category Attribute Mapping' : selectedCompany?.data?.name}
                    </div>
                </div>
            </div>
        );
    };
    const OnGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGlobalFilter(e.target.value);
    };
    const renderHeaderMain = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Object Inquiry</h4>
                </span>
            </div>
        );
    };
    const headerMain = renderHeaderMain();

    const onInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query) {
            const filtered = cities.filter((city) => city.name.toLowerCase().includes(query));
            if (filtered.length === 0) {
                setFilteredCities([{ name: `${capitalizeFirstLetter(query)}`, code: 'ADD_NEW', codeType: `${capitalizeFirstLetter(query)}`, selectionType: '', isSKURank: null }]);
            } else {
                setFilteredCities(filtered);
            }
        } else {
            setFilteredCities(cities);
        }
    };

    const addNewCity = () => {
        const newCity = { name: capitalizeFirstLetter(searchQuery), code: capitalizeFirstLetter(searchQuery), codeType: `${capitalizeFirstLetter(searchQuery)}` };
        onMasterCode(newCity);
    };

    const capitalizeFirstLetter = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    const itemTemplate = (option: any) => {
        if (option.code === 'ADD_NEW') {
            return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'red' }}>{`"${searchQuery}" is not present`}</span>
                    <button
                        onClick={addNewCity}
                        style={{
                            marginLeft: '10px',
                            padding: '5px 10px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Add New
                    </button>
                </div>
            );
        }
        return <span>{option.name}</span>;
    };
    const onCheckboxChange = (rowData: any, isChecked: boolean) => {
        const updatedProducts = products.map((product) => {
            if (product.name === rowData.name) {
                return { ...product, selected: isChecked };
            }
            return product;
        });
        setProducts(updatedProducts);
        updateSelectedNames(updatedProducts);
        const hasChildren = selectedCheckBox?.children?.length > 0;
        const updatedFormArray = updatedProducts.map((product, index) => {
            let matchedCatAttrId = product.catAttrId;
            let actionType = 'update';
            if (hasChildren) {
                const matchedChild = selectedCheckBox.children.find((child: any) => child.data.codeTypeId === product.codeTypeId);
                if (matchedChild) {
                    matchedCatAttrId = matchedChild.data.catAttrId;
                } else {
                    actionType = 'add';
                }
            } else {
                actionType = 'add';
            }
            return {
                ...defaultForm,
                catAttrId: matchedCatAttrId,
                codeTypeId: product.codeTypeId,
                selectionType: product.selected ? 'multiple' : 'single',
                isSKUEnabled: true,
                isSKURank: index,
                action: actionType
            };
        });
        setFormArray(updatedFormArray);
    };
    const updateSelectedNames = (updatedProducts: any[]) => {
        const selected = updatedProducts.filter((product) => product);
        const names = selected.map((product) => product.name);
        setSelectedNames(names);
    };
    const removeRow = (rowsData: any | any[]) => {
        const rowsArray = Array.isArray(rowsData) ? rowsData : [rowsData];
        const updatedProducts = products.filter((product) => !rowsArray.some((rowData) => rowData.name === product.name));
        setProducts(updatedProducts);

        // Initialize removedItemsFormArray as an empty array to avoid errors
        let removedItemsFormArray: any[] = [];

        if (selectedCheckBox?.children?.length > 0) {
            const updatedCodeTypeIds = updatedProducts.map((product) => product.codeTypeId);

            // Populate removedItemsFormArray only if there are items in selectedCheckBox
            removedItemsFormArray = selectedCheckBox.children
                .filter((child: any) => !updatedCodeTypeIds.includes(child.data?.codeTypeId))
                .map((child: any) => {
                    const { catAttrId, codeTypeId } = child.data;

                    return {
                        ...defaultForm,
                        catAttrId,
                        codeTypeId,
                        selectionType: 'single', // set specific selection type if needed
                        isSKUEnabled: true,
                        isSKURank: updatedProducts.length, // maintain rank or ordering if necessary
                        action: 'remove'
                    };
                });

            // Add removed items to removedRows state to keep track of deletions
            setRemovedRows((prevRemovedRows) => [...prevRemovedRows, ...removedItemsFormArray]);
        }

        // Sync with formArray to ensure it reflects updates for API purposes
        setFormArray((prevFormArray) => [...prevFormArray, ...removedItemsFormArray]);

        // Update selected names by filtering out removed names
        setSelectedNames((prevNames) => prevNames.filter((name) => !rowsArray.some((rowData) => rowData.name === name)));

        // Update the latest codeTypeId
        const updatedCodeTypeId = updatedProducts.length > 0 ? updatedProducts[updatedProducts.length - 1].codeTypeId : null;
        onInputChange('codeTypeId', updatedCodeTypeId);

        // Calculate rank based on updatedProducts' length and set the rank
        const updatedRank = updatedProducts.map((_, index) => index).join('.');
        onInputChange('isSKURank', parseFloat(updatedRank));
    };

    const onRowReorder = (e: any) => {
        const reorderedProducts = e.value;
        setProducts(reorderedProducts);
        const hasChildren = selectedCheckBox?.children?.length > 0;
        const reorderedFormArray = reorderedProducts.map((product: { catAttrId: any; codeTypeId: any; selected: any }, index: any) => {
            let matchedCatAttrId = product.catAttrId;
            let actionType = 'update';
            if (hasChildren) {
                const matchedChild = selectedCheckBox.children.find((child: any) => child.data.codeTypeId === product.codeTypeId);
                if (matchedChild) {
                    matchedCatAttrId = matchedChild.data.catAttrId;
                } else {
                    actionType = 'add';
                }
            } else {
                actionType = 'add';
            }
            return {
                ...defaultForm,
                catAttrId: matchedCatAttrId,
                codeTypeId: product.codeTypeId,
                selectionType: product.selected ? 'multiple' : 'single',
                isSKUEnabled: true,
                isSKURank: index,
                action: actionType
            };
        });

        setFormArray(reorderedFormArray);
        updateSelectedNames(reorderedProducts);
    };

    const onCategoryChange = (e: any) => {
        setSelectedOption(e.value);
        setGetCategoryId(e.value.key);
    };

    const onDropdownChange = (e: any) => {
        const selectedCity = e.value;
        setSelectedCity(selectedCity);
        const selectedCheckBoxData = selectedCheckBox?.children || [];
        const matchedCheckBox = selectedCheckBoxData.find((child: any) => child.data.codeType === selectedCity.name);

        let selectionType = 'single';
        if (matchedCheckBox) {
            selectionType = matchedCheckBox.selectionType;
        }

        const selectedValue = selectionType === 'multiple';
        setTimeout(() => {
            if (!products.some((product) => product.name === selectedCity.name)) {
                const newProduct = { ...selectedCity, selected: selectedValue };
                setProducts((prevProducts) => {
                    const updatedProducts = [...prevProducts, newProduct];

                    setSelectedNames((prevSelectedNames) => {
                        if (!prevSelectedNames.includes(selectedCity.name)) {
                            const newSelectedNames = [...prevSelectedNames, selectedCity.name];
                            return newSelectedNames;
                        }
                        return prevSelectedNames;
                    });
                    const updatedCodeTypeId = newProduct.codeTypeId;
                    onInputChange('codeTypeId', updatedCodeTypeId);
                    const updatedRank = updatedProducts.map((_, index) => index).join('.');
                    onInputChange('isSKURank', updatedRank);

                    return updatedProducts;
                });
            }
        }, 1000);
    };

    const panelFooterTemplate = () => {
        const isSaveDisabled = isLoading || isDetailLoading || !selectedOption || !selectedCity;

        return (
            <div className="flex justify-content-end p-2">
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    {[ACTIONS.EDIT, ACTIONS.ADD].includes(action) && <Button label="Save" disabled={isSaveDisabled} onClick={onSave} />}
                </div>
            </div>
        );
    };
    const palletHeader = () => {
        return (
            <div style={{ width: '100%' }}>
                <div className="card flex justify-content-between gap-3 mt-3">
                    <div style={{ width: '50%' }}>
                        <label htmlFor="inputWithIcon" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Barcode
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <InputText
                                id="inputWithIcon"
                                // value={inputValue}
                                // onChange={(e) => setInputValue(e.target.value)}
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

    const toggleApplications = () => {
        setShowApplications((prev) => !prev);
    };

    const renderHeader = () => {
        return (
            <div style={{ width: '100%' }}>
                <div className="flex justify-content-between gap-3">
                    <div style={{ width: '50%' }}>
                        <label htmlFor="categoryDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Category
                        </label>
                        <Dropdown value={selectedOption} options={dropdownOptions} onChange={onCategoryChange} placeholder="Select Category" className="mr-2" style={{ width: '100%' }} />
                    </div>
                    <div style={{ width: '50%', position: 'relative' }}>
                        <label htmlFor="attributeDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Attributes
                        </label>
                        <Dropdown
                            value={selectedCity}
                            onChange={onDropdownChange}
                            optionLabel="name"
                            placeholder="Select Attributes"
                            filter
                            onInput={onInputSearch}
                            options={filteredCities}
                            style={{ width: '100%' }}
                            itemTemplate={itemTemplate}
                            showClear
                        />
                    </div>
                </div>
                <div
                    className="selected-box"
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        color: 'grey',
                        height: '4rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {selectedNames.join(' - ')}
                </div>
            </div>
        );
    };
    const checkboxTemplate = (rowData: any) => {
        return <Checkbox checked={rowData.selected ?? false} onChange={(e) => onCheckboxChange(rowData, e.target.checked ?? false)} />;
    };
    const crossTemplate = (rowData: any) => {
        return <Button icon="pi pi-times" className="p-button-text p-button-danger" onClick={() => removeRow(rowData)} tooltip="Remove from table" tooltipOptions={{ position: 'top' }} />;
    };

    const header = renderHeader();
    const actionTemplate = (rowData: any, options: any) => {
        if (!rowData.children || rowData.children.length === 0) {
            return (
                <div className="flex">
                    <Button type="button" icon="pi pi-pencil" className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'update')} />
                </div>
            );
        }
        if (rowData.data.codeTypes) {
            // Display both edit and delete buttons for nodes with codeTypes
            return (
                <div className="flex">
                    <Button type="button" icon="pi pi-pencil" className="p-button-sm p-button-text" onClick={() => onRowSelect(rowData, 'update')} />
                    <Button type="button" icon="pi pi-trash" className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => onRowSelect(rowData, 'remove')} />
                </div>
            );
        }
    };

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                        <div className="left-panel">
                            {headerMain}
                            {palletHeader()}
                            <div className="card erp-table-container">
                                <TreeTable
                                    scrollable
                                    value={nodes}
                                    selectionMode="single"
                                    rows={10}
                                    expandedKeys={expandedKeys}
                                    onToggle={(e) => setExpandedKeys(e.value)}
                                    className="erp-table"
                                    totalRecords={companies.length}
                                    paginator={true}
                                    onSelectionChange={(row: any) => setSelectedCompany(row.value)}
                                    scrollHeight={tableHeight}
                                    style={{ width: '100%' }}
                                    globalFilter={globalFilter}
                                >
                                    <Column field="name" header="REID Name" expander style={{ width: 250 }}></Column>
                                    <Column field="codeType" header="IMEI"></Column>
                                    <Column field="codeType" header="SKU"></Column>
                                    <Column field="codeType" header="Grade"></Column>
                                    <Column field="codeType" header="Vendor"></Column>
                                    <Column field="codeType" header="PO Number"></Column>
                                    <Column field="codeType" header="PO Date"></Column>
                                    <Column field="codeType" header="Cost"></Column>
                                    <Column style={{ width: 160 }} body={actionTemplate}></Column>
                                </TreeTable>
                            </div>
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
                                    {(action == ACTIONS.ADD || action == ACTIONS.EDIT) && (
                                        <div className="p-fluid">
                                            <DataTable scrollable reorderableColumns reorderableRows header={renderHeader()} value={products} onRowReorder={onRowReorder} scrollHeight="60%" style={{ width: '100%', height: '75%' }}>
                                                <Column rowReorder style={{ width: '3rem' }} />
                                                <Column field="name" header="Name" />
                                                <Column header="Multiple" body={checkboxTemplate} style={{ width: '5rem' }} />
                                                <Column header="Remove" body={crossTemplate} style={{ width: '5rem' }} />
                                            </DataTable>
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
                visible={isDialogVisible}
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
                            This will remove <strong>{catAttrId?.data.codeType}</strong>.<br />
                            Do you still want to remove it? This action cannot be undone.
                        </span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};
export default ObjectInquiryPage;
