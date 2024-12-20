


import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Category, CompanyProductsMapping, CustomResponse, MasterCode, Product, Item, PurchaseItem, PurchaseOrder, Vendor, Warehouse, SalesOrderItem, Estimates, EstimatesItem } from '../../../types';
import Sidebar from '../../../components/Sidebar';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Panel } from 'primereact/panel';
import { DeleteCall, GetCall, GetPdfCall, PostCall, PutCall } from '../../../api/ApiKit';
import { filter, find, get, includes, map, set, sumBy } from 'lodash';
import { constant } from '../../../utils/constant';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import moment, { isMoment } from 'moment-timezone';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { TreeNode } from 'primereact/treenode';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { buildQueryParams, formatBytes, getRowLimitWithScreenHeight } from '../../../utils/uitl';
import CustomDataTable, { CustomDataTableRef } from '../../../components/CustomDataTable';
import { ProgressSpinner } from 'primereact/progressspinner';
import { SelectButton } from 'primereact/selectbutton';
import { useNavigate } from 'react-router-dom';
// import { ConnectableObservable } from 'rxjs';
// import { Console } from 'console';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // Or your preferred theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Menu } from 'primereact/menu';
import MemoizedFileItem from '../../../components/MemoizedFileItem';

const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view',
    DELETE: 'delete'
};

const defaultLineItem: PurchaseItem = {
    poId: null,
    poItemId: null,
    companyId: null,
    categoryId: null,
    productId: null,
    gradeId: null,
    isCrossDock: false,
    quantity: 0,
    price: 0,
    rowId:null,
    skuId:null,
    internalGrade:[],
    batteryHealthIds:[],
};

const salesOrderDefault: Estimates = {
    customer:'',
    soId:null,
    soNumber: null,
    vendorId: null,
    companyId: null,
    approxDeliveryDate: null,
    batteryHealthIds: [],
    trackingTypeId: null,
    trackingNumber: null,
    paymentTermsId: null,
    shippingPrice: null,
    discountType: "PERCENTAGE",
    discountAmount: null,
    isCrossDock:false,
    vat: 0,
    paid: 0,
    note: '',
    price: 0,
    items: [],
    internalGrade:[],
    estimateId: null,
    quoteAmount: null,
    shippingTypeId: null,
    shippingCost: null,
    estimateDate: null,
    totalMargin: undefined,
    soDate: undefined,
    totalAmount:null,
    skuId:null,
    totalPrice:0,
    isConvertedToSales:false,
}

const EstimatesPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const containerRef = useRef(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [action, setAction] = useState<any>(null);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [pos, setPOs] = useState<Estimates[]>([]);
    const [selectedSO, setSelectedSO] = useState<Estimates | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
    const [salesOrder, setSalesOrder] = useState<Estimates>({ ...salesOrderDefault });
    const [trackings, setTrackings] = useState<MasterCode[]>([]);
    const [statuses, setStatuses] = useState<MasterCode[]>([]);
    const [paid, setPaid] = useState<number>(0);
    const [grades, setGrades] = useState<MasterCode[]>([]);
    const [avgAge, setAvgAge] = useState<MasterCode[]>([]);
    const [allbatteryHealth, setAllBatteryHealth] = useState<MasterCode[]>([]);
    const [lineItems, setLineItems] = useState<EstimatesItem[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isProducLoading, setProductLoading] = useState<boolean>(false);
    const [searchText, setSearchText] = useState<any>('');
    const [visible, setVisible] = useState(false);
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<any>(null);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [selectedSOToDelete, setSelectedSOToDelete] = useState<Estimates | null>(null);
    const [dialogvisible, setDialogVisible] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [poId, setPoId] = useState<string | null>(null); // Step 1: Add state for poId
    const [trackingData, setTrackingData] = useState<Item[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    // const [internalGradeValues, setInternalGradeValues] = useState<string[]>([]);
    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchAllVendors();
        fetchCarriers();
        fetchPOStatus();
        fetchPaymentTerms();
        fetchAverageAge();
        fetchBatteryHealth();
        return () => {
            setScroll(true);
        };
    }, []);

   

    useEffect(() => {
        if (salesOrder.items?.length && !isInitialized) {
            console.log('158',salesOrder)
            const skuId = salesOrder.items.map((item) => item.skuId); // Extract SKU IDs
            const internalGrade = salesOrder.items.map((item) => item.internalGrade); // Extract Internal Grade
            const batteryHealthIds = salesOrder.items.map((item) => item.batteryHealth); // Extract Battery Health
            const isCrossDock = salesOrder.items[0]?.isCrossDock || false; // Extract isCrossDock from the first item (assumes all items have the same value)
            console.log('148',internalGrade)
            // Update the salesOrder state with preloaded data
            setSalesOrder((prev) => ({
                ...prev,
                skuId,
                internalGrade,
                batteryHealthIds,
                isCrossDock, // Preload isCrossDock value
            }));
            setIsInitialized(true); // Set the flag to true after initialization
        }
    }, [salesOrder.items, isInitialized]);
    

    
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchProducts(searchText);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const updateItem = async (key: string, value: any) => {
        console.log('key', key, value)
        const _so = JSON.parse(JSON.stringify(salesOrder));
        set(_so, key, value);
        setSalesOrder(_so);
    }

    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'customer,status,shippingType,items';
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/estimates?${queryString}`);
        if (response.code == 'SUCCESS') {
            setPOs(response.data);
            if (response.total) {
                setTotalRecords(response?.total);
            }
        } else {
            setPOs([]);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchSoDetails = async (estimateId: any) => {
        let params: any = {
            filters: {
                estimateId: estimateId
            },
            include: 'customer,status,items'
        };
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/estimates?${queryString}`);
        if (response.code == 'SUCCESS') {
            setSalesOrder(response.data[0]);
        } else {
            setSalesOrder(salesOrderDefault);
            setAlert('error', response.message);
        }
        setLoading(false);
    };

    const fetchCarriers = async () => {
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

    const fetchPOStatus = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.soStatus}`);
        if (response.code == 'SUCCESS') {
            setStatuses(response.data);
        } else {
            setStatuses([]);
        }
        setLoading(false);
    };

    const fetchPaymentTerms = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.grades}`);
        if (response.code == 'SUCCESS') {
            setGrades(response.data);
        } else {
            setGrades([]);
        }
        setLoading(false);
    };
    const fetchAverageAge = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.AvgAge}`);
        if (response.code == 'SUCCESS') {
            setAvgAge(response.data);
        } else {
            setAvgAge([]);
        }
        setLoading(false);
    };
    const fetchBatteryHealth = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.BatteryHealth}`);
        if (response.code == 'SUCCESS') {
            setAllBatteryHealth(response.data);
        } else {
            setAllBatteryHealth([]);
        }
        setLoading(false);
    };

    const fetchAllVendors = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/vendors?filters.vendorType=isCustomer&limit=500`);
        if (response.code == 'SUCCESS') {
            setAllVendors(response.data);
        } else {
            setAllVendors([]);
        }
        setLoading(false);
    };

    const fetchProducts = async (search = '') => {
        let params: any = {
            include: 'attributes,items,location,category,vendor'
        };
        // const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        if (!user?.company?.companyId) {
            return;
        }

        setLoading(true);
        setProductLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/products?include=attributes%2Citems%2Clocation%2Ccategory%2Cvendor`);
        if (response.code == 'SUCCESS') {
            setProducts(response.data);
            console.log('286',response.data)
        } else {
            setProducts([]);
        }
        setProductLoading(false);
        setLoading(false);
    };

    // Function to fetch tracking data based on poId
    const fetchTrackingData = async (poId: any) => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);

        try {
            const response = await GetCall(`/company/${companyId}/purchase-orders/${poId}/trackings`);

            if (response.code === 'SUCCESS' && Array.isArray(response.data)) {
                setTrackingData(response.data); // Update tracking data state
            } else {
                setAlert('error', response.message || 'Unexpected response format.');
            }
        } catch (error) {
            setAlert('error', 'Failed to fetch tracking data.');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedSOToDelete) return;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/estimates/${selectedSOToDelete.estimateId}`);
        setLoading(false);
        if (response.code === 'SUCCESS') {
            setIsDeleteDialogVisible(false);
            fetchData();
            setAlert('success', 'Successfully Deleted');
        } else {
            setAlert('error', response.message);
        }
    };

    const deleteTrackingData = async (poId: string, poTrackId: number): Promise<void> => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);

        try {
            const response = await DeleteCall(`/company/${companyId}/purchase-orders/${poId}/trackings/${poTrackId}`);

            if (response.code === 'SUCCESS') {
                // Filter out the deleted tracking item from the trackingData array
                setTrackingData((prevData: Item[]) => prevData.filter((item) => item.poTrackId !== poTrackId));
                setAlert('success', 'Tracking entry deleted successfully.');
            } else {
                setAlert('error', response.message);
            }
        } catch (error) {
            setAlert('error', 'Failed to delete tracking entry.');
        } finally {
            setLoading(false);
        }
    };

    const postTrackingData = async (poId: string, newTrackingData: { trackingNumber: string }): Promise<boolean> => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);

        try {
            if (!newTrackingData.trackingNumber) {
                setAlert('error', 'Tracking number is required.');
                return false;
            }

            // Wrap the single payload in an array as required by the API
            const payload = [{ trackingNumber: newTrackingData.trackingNumber }];

            const response = await PostCall(`/company/${companyId}/purchase-orders/${poId}/trackings`, payload);

            if (response && response.code === 'SUCCESS') {
                // Call fetchTrackingData to refresh the tracking data state
                await fetchTrackingData(poId);
                setAlert('success', 'Tracking entry added successfully.');
                return true; // Indicate success
            } else {
                setAlert('error', 'Unexpected response format.');
                return false; // Indicate failure
            }
        } catch (error) {
            setAlert('error', 'Failed to add tracking entry.');
            return false; // Indicate failure
        } finally {
            setLoading(false);
        }
    };
    console.log('558',salesOrder)
     const handleClick = (_salesOrder?: Estimates) => {
            if (_salesOrder) {
                const newUrl = `/estimates?estimateId=${_salesOrder.estimateId}`;
                navigate(newUrl, { replace: true });
                fetchSoDetails(_salesOrder.estimateId);
                setIsShowSplit(true);
            }
            else {
                navigate('/estimates', { replace: true });
            }
        };

    const closeDeleteDialog = () => {
        setIsDeleteDialogVisible(false);
        setSelectedSOToDelete(null);
    };

    const closeIcon = () => {
        setSubmitted(false);
        setIsShowSplit(false);
        setSelectedSO(null);
        setSearchText('')
        setSalesOrder({ ...salesOrderDefault })
        setIsInitialized(false)
        handleClick();
    };
    const openDeleteDialog = (perm: Estimates) => {
        setSelectedSOToDelete(perm);
        setIsDeleteDialogVisible(true);
    };
    const onRowSelect = async (perm: Estimates, action = ACTIONS.VIEW) => {
        console.log('404',perm)
        setAction(action);
        await setSelectedSO(perm);
        if (action === ACTIONS.DELETE) {
            openDeleteDialog(perm);
        }
        if (action === ACTIONS.VIEW) {
            setSalesOrder(perm);
            setIsShowSplit(true);
            handleClick(perm)
        }
        if (action === ACTIONS.EDIT) {
            setIsShowSplit(true);
            fetchSoDetails(perm.estimateId)
        }
    };

    const showAddNew = () => {
        setIsShowSplit(true);
        setSubmitted(false);
        setAction(ACTIONS.ADD);
        setSelectedSO(null);
        fetchProducts();
    };

    // const onProductSelect = (skuId: number, isPreSelected: boolean, rowIndex: any) => {
    //     let product = find(products, { skuId: skuId });
    //     let _items = [...salesOrder.items];
    //     if (!isPreSelected) {
    //         _items.push({
    //             soId: null,
    //             companyId: null,
    //             quantity: 1,
    //             price: product.price || 0,
    //             skuId: skuId,
    //             product: product,
    //             eItemId: null,
    //             isCrossDock: false,
    //             batteryHealth: undefined,
    //             internalGrade: undefined
    //         });
    //     } else {
    //         _items[rowIndex].skuId = skuId;
    //         _items[rowIndex].price = product.price || 0;
    //         _items[rowIndex].product = product;
    //     }
    //     updateItem('items', _items);
    // };

    const removeItem = (skuId: any) => {
        if (!skuId) return;
        let _items = [...lineItems];
        _items = _items.filter((item) => item.skuId != skuId);
        updateItem('items', _items);
    };

    // const inputChange = async (key: any, value: any, index: any) => {
    //     let _items = [...lineItems];
    //     set(_items, `${index}.${key}`, value);
    //     updateItem('items', _items);
    // };

    const onSave = async () => {
        setSubmitted(true);
        // if (!salesOrder.vendorId || !salesOrder.soDate || salesOrder.items.length == 0) {
        //     return;
        // }
        console.log('salesOrder', salesOrder)
        setLoading(true);
        if (action == ACTIONS.ADD) {
            const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/estimates`, salesOrder);
            if (response.code == 'SUCCESS') {
                closeIcon();
                fetchData();
                setAlert('success', 'Add Successfully');
            } else {
                setAlert('error', response.message);
            }
        }
        console.log('505',selectedSO?.estimateId)
        if (action == ACTIONS.EDIT) {
            const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/estimates/${selectedSO?.estimateId}`, salesOrder);
            if (response.code == 'SUCCESS') {
                closeIcon();
                fetchData();
                setAlert('success', 'Updated Successfully');
            } else {
                setAlert('error', response.message);
            }
        }
        setLoading(false);
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Estimates</h4>
                </span>
                <span className="flex gap-5">
                    <div className=" ">
                        <Button label="Create Estimates" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();

    const onFilter = (e: any) => {
        if (e) {
            setSearchText(e.filter)
        }
    }

    const renderProduct = () => {
        const skuId = salesOrder.skuId || []; // Selected SKUs
        const batteryHealthIds = salesOrder.batteryHealthIds || []; // Selected Battery Health IDs
        const internalGradeIds = salesOrder.internalGrade || []; // Selected Internal Grade IDs
        const isCrossDock = salesOrder.isCrossDock || false; // Is CrossDock flag
    
        const updatedItems = Array.isArray(skuId)
            ? skuId.map((skuId: any, index: number) => {
                  const product = products.find((item) => item.skuId === skuId); // Find product details by skuId
                  return {
                      skuId: product?.skuId,
                      product: product,
                      price: product?.averageCost || 0, // Average cost or a default value
                      margin: 0, // Default margin value
                      unitPrice: product?.averageCost || 0, // From vendorProducts
                      quantity: 1, // Default quantity
                      batteryHealth: batteryHealthIds[index] || null,
                      internalGrade: internalGradeIds[index] || null,
                      isCrossDock: isCrossDock, // Is CrossDock value
                      itemCounts:product?.itemCounts || 0
                  };
              })
            : [];
            console.log('596',updatedItems)
        // Update salesOrder.items
        updateItem('items', updatedItems);

    };
    

    const renderSKU = (item: EstimatesItem) => {
        return (
            <div>
                <label className="text-900">{item.product?.sku}</label>
            </div>
        );
    };
    
    const renderAverageCost = (item: EstimatesItem) => {
        return (
            <label className="text-900">{item.price}</label>
        );
    };
    const renderitemCounts = (item: EstimatesItem) => {
        console.log('589',item)
        return (
            <label className="text-900">{item.itemCounts}</label>
        );
    };

    const renderMargin = (item: EstimatesItem, option: ColumnBodyOptions) => {
        return (
            <InputNumber
                value={item.margin}
                onValueChange={(e) => updateItem(`items.${option.rowIndex}.margin`, e.value)}
                placeholder="Enter Margin"
                inputStyle={{ width: '80px', textAlign: 'right' }}
            />
        );
    };
    const renderViewMargin = (item: EstimatesItem, option: ColumnBodyOptions) => {
        return (
            <label className="text-900">{item.margin}</label>
        );
    };
    
    const renderUnitPrice = (item: EstimatesItem) => {
        // Convert price to a number safely, defaulting to 0 if conversion fails
        const unitPrice = parseFloat(item.price) || 0;
        const margin = item.margin ?? 0;
    
        // Add unitPrice and margin
        const totalPrice = unitPrice + margin;
    
        return (
            <label className="text-900">{totalPrice.toFixed(2)}</label>
        );
    };
    
    

    
    const renderQuantity = (item: EstimatesItem, option: ColumnBodyOptions) => {
        if (!item?.skuId) {
            return <div style={{ width: 80 }}></div>;
        }
        return (
            <div>
                <InputNumber value={item.quantity} onValueChange={(e) => updateItem(`items.${option.rowIndex}.quantity`, e.value)} inputClassName="text-base w-full" inputStyle={{ width: '80px', textAlign: 'right' }} />
            </div>
        );
    };
    const renderViewQuantity = (item: EstimatesItem, option: ColumnBodyOptions) => {
        if (!item?.skuId) {
            return <div style={{ width: 80 }}></div>;
        }
        return (
            <label className="text-900">{item.quantity}</label>
        );
    };
    // const renderRate = (item: EstimatesItem, option: ColumnBodyOptions) => {
    //     if (!item?.skuId) {
    //         return <div style={{ width: 150 }}></div>;
    //     }
    //     return (
    //         <>
    //             <InputNumber value={item.price} onValueChange={(e) => updateItem(`items.${option.rowIndex}.price`, e.value)} mode="currency" currency="USD" locale="en-US" placeholder="Price" inputClassName="text-base" inputStyle={{ width: '150px', textAlign: 'right' }} />
    //         </>
    //     );
    // };
    // const renderaverageCost = (item: PurchaseItem) => {
    //         if (!item?.price) {
    //             return <></>;
    //         }
    //         return <div className="flex align-items-center">{(item.price || 0) * (item.quantity || 0)}</div>;
    //     };
    const renderTotal = (item: EstimatesItem) => {
        const unitPrice = parseFloat(item.price) || 0;
        const margin = item.margin ?? 0;
    
        // Add unitPrice and margin
        const totalPrice = unitPrice + margin;
        if (!item?.skuId) {
            return <></>;
        }
        return <div>{(totalPrice * item.quantity).toFixed(2)}</div>;
    };

    const renderCross = (item: EstimatesItem) => {
        if (!item?.skuId) {
            return <div style={{ width: 50 }}></div>;
        }
        return (
            <div className="flex align-items-center">
                <Button icon="pi pi-times" severity="danger" aria-label="Cancel" size="small" onClick={() => removeItem(get(item, 'skuId', null))} />
            </div>
        );
    };

    // const selectedProductTemplate = (option: Product, props: any) => {
    //     if (option) {
    //         return (
    //             <div className="flex align-items-start">
    //                 <div className="text-base">{option.name}</div>
    //             </div>
    //         );
    //     }

    //     return <span>{props.placeholder}</span>;
    // };

    // const productOptionTemplate = (option: Product) => {
    //     return (
    //         <div className="flex align-items-start flex-column">
    //             <div className="text-xs text-grey">{option.skuId}</div>
    //             <div className="text-base">{option.name}</div>
    //         </div>
    //     );
    // };

    // const renderPOTotal = (option: Estimates) => {
    //     return <>${calculateTotalPrice(option)}</>;
    // };

    // const renderPOBalace = (option: Estimates) => {
    //     return <>${calculateBalance(option)}</>;
    // };

    const closeDialog = () => {
        setVisible(false);
    };

    const openDialog = () => {
        setVisible(true);
    };
    const convertToSales = async (estimateId: string) => {
        console.log('736',estimateId)
        setLoading(true);
            const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/estimate-to-sales-orders/${estimateId}`);
            if (response.code === 'SUCCESS') {
                closeIcon();
                fetchData();
                setAlert('success', 'Converted to Sales Successfully');
            } else {
                setAlert('error', response.message);
            }
    };
    

    const onTemplateUpload = (event: any) => {
        if (toast.current) {
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Files uploaded successfully!' });
        }
    };

    const onTemplateSelect = (event: any) => { };

    const onTemplateClear = () => {
        if (toast.current) {
            toast.current?.show({ severity: 'info', summary: 'Info', detail: 'Upload cleared' });
        }
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

    const addDialogItem = async () => {
        if (!newItem.trim()) {
            setAlert('error', 'Please enter a valid tracking number.');
            return;
        }

        if (!poId) {
            setAlert('error', 'Invalid purchase order ID.');
            return;
        }

        const newTrackingData = { trackingNumber: newItem.trim() };

        // Await postTrackingData and check the returned boolean
        const success = await postTrackingData(poId, newTrackingData);

        // Only clear input if the tracking data was successfully added
        if (success) {
            setNewItem(''); // Clear the input only after successful addition
        }
    };

    const DeletePOTrack = (poTrackId: number) => {
        if (poId) {
            // Check if poId is not null
            deleteTrackingData(poId, poTrackId); // Call delete function with valid poId and poTrackId
        }
    };

    const dialogPopup = (
        <Dialog header={<span>PO# {poId}</span>} visible={dialogvisible} style={{ width: '30vw' }} onHide={() => setDialogVisible(false)}>
            <div className="p-3">
                <div className="p-inputgroup mb-3">
                    <span className="p-input-icon-left" style={{ width: '100%' }}>
                        <i className="pi pi-search" />
                        <InputText placeholder="Search" className="" style={{ width: '100%' }} />
                    </span>
                </div>

                <div className="p-inputgroup mb-3">
                    <InputText value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Enter tracking number" />
                    <Button icon="pi pi-plus" onClick={addDialogItem} />
                </div>

                {isLoading ? (
                    <div className="p-d-flex p-ai-center p-jc-center" style={{ height: '100%' }}>
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2em' }}></i>
                        <span className="ml-2">Loading tracking items...</span>
                    </div>
                ) : trackingData.length > 0 ? (
                    trackingData.map((item: Item, index: number) => (
                        <div key={item.poTrackId || index} className="p-inputgroup mb-2">
                            <InputText value={item.trackingNumber} readOnly style={{ width: '100%' }} />
                            <Button icon="pi pi-trash" className="p-button-danger" onClick={() => DeletePOTrack(item.poTrackId)} />
                        </div>
                    ))
                ) : (
                    <p>No tracking items added.</p>
                )}
            </div>
        </Dialog>
    );

    const popupmodal = (
        <Dialog header="Upload Files" visible={visible} style={{ width: '600px' }} onHide={closeDialog}>
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

    const printDoc = async (estimateId: any) => {
        setLoading(true);
        const response: any = await GetPdfCall(`/company/${user?.company?.companyId}/estimates/${estimateId}/print`);
        if (response && response.code == 'FAILED') {
            setAlert('error', response.message);
        }
        setLoading(false);
    }
    const renderVendor = (item: any) => get(item, 'customer.name');
    const renderTotalItems = (item: any) => {
        const itemsArray = get(item, 'items', []);
        if (Array.isArray(itemsArray)) {
            const totalQuantity = itemsArray.reduce((sum: number, currentItem: any) => {
                return sum + (currentItem.quantity || 0); 
            }, 0);
            return totalQuantity;
        }
        return 0;
    };
    const renderEstimateDate = (rowData: any) => {
        const rawDate = rowData.estimateDate; 
        if (rawDate) {
            const date = new Date(rawDate); 
            return date.toISOString().split('T')[0]; 
        }
        return ''; 
    };
    
    
    const vendorDropdown = (options: any) => (
        <Dropdown
            filter
            value={options.value || null}
            options={allVendors}
            optionLabel="name"
            optionValue="vendorId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select customer"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );
    const warehouseDropdown = (options: any) => (
        <Dropdown
            filter
            value={options.value || null}
            options={warehouses}
            optionLabel="name"
            optionValue="warehouseId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select location"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );
    const statusDropdown = (options: any) => (
        <Dropdown
            filter
            value={options.value || null}
            options={statuses}
            optionLabel="code"
            optionValue="masterCodeId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select status"
            className="p-column-filter"
            showClear
            style={{ minWidth: '12rem' }}
        />
    );

    const getDiscountAmount = (_salesItem?: Estimates) => {
        if (!_salesItem) {
            _salesItem = salesOrder;
        }
        let sum = sumBy(_salesItem.items, (item) => item.quantity * item.price);
        let discountNumber = _salesItem.discountAmount ? get(_salesItem, 'discountAmount', 0) : 0 || 0;
        if (_salesItem.discountType == 'PERCENTAGE') {
            return sum * (discountNumber / 100);
        }
        return discountNumber;
    }

    const calculateTotalPrice = (_salesItem?: Estimates) => {
        if (!_salesItem) {
            _salesItem = salesOrder;
        }
        let sum = sumBy(_salesItem.items, (item) => item.quantity * item.price);
        return sum + (sum * (get(_salesItem, 'vat', 0) / 100)) - getDiscountAmount() + get(_salesItem, 'shippingPrice', 0);
    }

    const calculateBalance = (_salesItem?: Estimates) => {
        if (!_salesItem) {
            _salesItem = salesOrder;
        }
    
        // Calculate sum based on (margin + unitPrice) * quantity
        let sum = sumBy(_salesItem.items, (item) => {
            const margin = item.margin || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const quantity = item.quantity || 0;
            return (margin + unitPrice) * quantity;
        });
    
        // Calculate the final balance including VAT, discount, shipping price, and paid amount
        let finalAmount =
            sum +
            (sum * (get(_salesItem, 'vat', 0) / 100)) -
            getDiscountAmount() +
            get(_salesItem, 'shippingPrice', 0) -
            get(_salesItem, 'paid', 0);
    
        // Ensure the final amount has only 2 decimal places
        return finalAmount.toFixed(2);
    };
    
    
    const handlePreferredShipmentMode = (e: { value: number }) => {
        updateItem('shippingTypeId', e.value); 
    };
    console.log('761',selectedSO)

    const estimatesEditor=(
        <>
                                    <div className="grid" ref={containerRef}>
                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full ">
                                                Customer<span className='text-red'>*</span>
                                            </label>
                                            <div className="w-full">
                                                <Dropdown
                                                    value={salesOrder.vendorId}
                                                    filter
                                                    onChange={(e) => updateItem('vendorId', e.value)}
                                                    options={allVendors}
                                                    optionLabel="name"
                                                    optionValue="vendorId"
                                                    placeholder="Select a Customer"
                                                    className={`w-full ${isSubmitted && !salesOrder.vendorId ? 'p-invalid' : ''}`}
                                                    required={true}
                                                />
                                            </div>
                                        </div>

                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full ">
                                                Estimation Expiry Date<span className='text-red'>*</span>
                                            </label>
                                            <div className="w-full">
                                                <Calendar appendTo={'self'} value={salesOrder?.estimateDate ? moment(salesOrder?.estimateDate).toDate() : null} onChange={(e) => updateItem('estimateDate', e.value)} placeholder="MM/DD/YYYY" className={`w-full ${isSubmitted && !salesOrder.soDate ? 'p-invalid' : ''}`} showIcon required={true} />
                                            </div>
                                        </div>

                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full">
                                                Shipment Mode
                                            </label>
                                            <div className="w-full">
                                            <Dropdown value={salesOrder.shippingTypeId}  onChange={ handlePreferredShipmentMode} options={trackings} optionLabel="code" optionValue="masterCodeId" placeholder="Shipment Mode" className="w-full" />
                                            </div>
                                        </div>

                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full">
                                                SKU<span className='text-red'>*</span>
                                            </label>
                                            <div className="w-full">
                                                <MultiSelect
                                                    value={salesOrder.skuId}
                                                    // options={products.filter((item) => !map(salesOrder.items, 'skuId').includes(item.skuId))}
                                                    options={products}
                                                    onChange={(e) => updateItem('skuId', e.value)}
                                                    optionLabel="name"
                                                    optionValue="skuId"
                                                    placeholder="SKU Name"
                                                    className={`w-full`}
                                                />
                                            </div>
                                        </div>

                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full">
                                                Internal Grade
                                            </label>
                                            <div className="w-full">
                                                <MultiSelect value={salesOrder.internalGrade} onChange={(e) => updateItem('internalGrade', e.value)} options={grades} optionLabel="code" optionValue="masterCodeId" placeholder="Shipment carrier" className="w-full" />
                                            </div>
                                        </div>

                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full">
                                                Average Age
                                            </label>
                                            <div className="w-full">
                                            <MultiSelect value={salesOrder.trackingTypeId} onChange={(e) => updateItem('trackingTypeId', e.value)} options={avgAge} optionLabel="code" optionValue="masterCodeId" placeholder="Average Age" className="w-full" />
                                            </div>
                                        </div>

                                        <div className="field col-4">
                                            <label htmlFor="name3" className="w-full  ">
                                                Battery Health
                                            </label>
                                            <div className="w-full">
                                            <MultiSelect value={salesOrder.batteryHealthIds || []} onChange={(e) => updateItem('batteryHealthIds', e.value)} options={allbatteryHealth} optionLabel="code" optionValue="masterCodeId" placeholder="Battery Health" className="w-full" />
                                            </div>
                                        </div>

                                        <div className="field col-4 mt-5">
                                            <label htmlFor="isCrossDock" className="w-full">
                                                <Checkbox 
                                                    inputId="isCrossDock" 
                                                    checked={salesOrder.isCrossDock} 
                                                    onChange={(e) => updateItem('isCrossDock', e.checked)} 
                                                    className="mr-2" 
                                                />
                                                Is CrossDock
                                            </label>
                                        </div>
                                        <div className="field col-5 flex justify-end">
                                        <Button label="Load"  className=" mr-4" onClick={renderProduct} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                    <div className="flex flex-column mb-3">
                                            <p className="font-semibold mb-2">Margin</p>
                                            <div className="flex align-items-center gap-3">
                                            <div className='ml-2'>
                                                <SelectButton
                                                    className="p-discount"
                                                    options={['$', '%']}
                                                />
                                                </div>
                                                <InputNumber
                                                    onValueChange={(e) => {
                                                        const newValue = e.value ?? 0;
                                                        const updatedItems = salesOrder.items.map((item) => ({
                                                            ...item,
                                                            margin: newValue,
                                                        }));
                                                        setSalesOrder({ ...salesOrder, items: updatedItems });
                                                    }}
                                                    inputClassName="text-base font-bold"
                                                    inputStyle={{ width: '100px', textAlign: 'end' }}
                                                    // placeholder="Enter Margin"
                                                />
                                            </div>
                                        </div>
                                        <DataTable
                                            scrollable
                                            showGridlines
                                            value={salesOrder.items}
                                            dataKey="productId"
                                            scrollHeight="70%"
                                            style={{ height: '80%' }}
                                            className="table-line-item"
                                        >
                                            <Column field="skuId" header="SKU" body={renderSKU}></Column>
                                            <Column field="averageCost" header="Average Cost" body={renderAverageCost}></Column>
                                            <Column field="margin" header="Margin" body={renderMargin}></Column>
                                            <Column field="unitPrice" header="Unit Price" body={renderUnitPrice}></Column>
                                            <Column field="itemCounts" header="Available Quantity" body={renderitemCounts}></Column>
                                            <Column field="quantity" header="Quantity" body={renderQuantity}></Column>
                                            <Column field="total" header="Total" body={renderTotal}></Column>
                                            <Column body={renderCross}></Column>
                                        </DataTable>

                                        <div className="grid mt-3">
                                            <div className="col-4 col-offset-8">
                                                <div className="flex justify-content-between align-items-baseline">
                                                    <p className="font-semibold">Total</p>
                                                    <p className="font-bold">
                                                        ${sumBy(salesOrder.items, (item) => {
                                                            const averageCost = parseFloat(item.price) || 0; 
                                                            const margin = item.margin ?? 0;                 
                                                            const quantity = item.quantity ?? 1;             
                                                            return (averageCost + margin) * quantity;        
                                                        }).toFixed(2)}
                                                    </p>

                                                </div>
                                                
                                                <div className="flex justify-content-between align-items-baseline">
                                                    <p className="font-semibold">Shipping Cost</p>
                                                    <InputNumber
                                                        value={salesOrder.shippingCost}
                                                        onValueChange={(e) => {
                                                            if (e.value) {
                                                                updateItem('shippingCost', e.value);
                                                            } else {
                                                                updateItem('shippingCost', 0);
                                                            }
                                                        }}
                                                        inputClassName="text-base font-bold"
                                                        inputStyle={{ width: '130px', textAlign: 'end' }}
                                                    />
                                                </div>
                                                <div className="flex justify-content-between align-items-baseline">
                                                    <p className="font-semibold">Shipping Price</p>
                                                    <InputNumber
                                                        value={salesOrder.shippingPrice}
                                                        onValueChange={(e) => {
                                                            if (e.value) {
                                                                updateItem('shippingPrice', e.value);
                                                            } else {
                                                                updateItem('shippingPrice', 0);
                                                            }
                                                        }}
                                                        inputClassName="text-base font-bold"
                                                        inputStyle={{ width: '130px', textAlign: 'end' }}
                                                    />
                                                </div>
                                                <div className="flex justify-content-between align-items-baseline">
                                                    <p className="font-semibold">VAT %</p>
                                                    <InputNumber
                                                        value={salesOrder.vat}
                                                        onValueChange={(e) => {
                                                            if (e.value) {
                                                                updateItem('vat', e.value);
                                                            } else {
                                                                updateItem('vat', 0);
                                                            }
                                                        }}
                                                        inputClassName="text-base font-bold"
                                                        inputStyle={{ width: '130px', textAlign: 'end' }}
                                                    />
                                                </div>
                                                <div className="flex justify-content-between align-items-center">
                                                    <div className='grid align-items-baseline ml-0'>
                                                        <p className="font-semibold">Discount</p>
                                                        <div className='ml-2'>
                                                            <SelectButton className='p-discount' value={salesOrder.discountType == 'FIXED' ? '$' : '%'} onChange={(e) => updateItem('discountType', e.value == '$' ? 'FIXED' : 'PERCENTAGE')} options={['$', '%']} />
                                                        </div>
                                                    </div>
                                                    <InputNumber
                                                        value={salesOrder.discountAmount}
                                                        onValueChange={(e) => {
                                                            if (e.value) {
                                                                updateItem('discountAmount', e.value);
                                                            } else {
                                                                updateItem('discountAmount', 0);
                                                            }
                                                        }}
                                                        inputClassName="text-base font-bold"
                                                        inputStyle={{ width: '130px', marginBottom: 5, textAlign: 'end' }}
                                                    />
                                                </div>
                                                {/* <div className="flex justify-content-between align-items-baseline">
                                                    <p className="font-bold">Paid</p>
                                                    <InputNumber
                                                        value={(salesOrder?.quoteAmount ?? 0) - (salesOrder?.totalAmount ?? 0)}
                                                        onValueChange={(e) => {
                                                            if (e.value) {
                                                                updateItem('paid', e.value);
                                                            } else {
                                                                updateItem('paid', 0);
                                                            }
                                                        }}
                                                        inputClassName="text-base font-bold"
                                                        inputStyle={{ width: '130px', textAlign: 'end' }}
                                                    />
                                                </div> */}
                                                <hr className="mb-3 mx-3 border-top-1 border-none surface-border" />
                                                <div className="flex justify-content-between align-items-baseline">
                                                    <p className="font-semibold">Balance</p>
                                                    <p className="font-bold">${calculateBalance()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid mt-3">
                                            <h5>Remarks</h5>
                                            <InputTextarea className="w-full" value={salesOrder.note || ''} onChange={(e) => updateItem('note', e.target.value)} rows={5} cols={30} style={{ resize: 'none' }} />
                                        </div>
                                    </div>
                                </>)
    const displaySKU = (item: PurchaseItem | null) => {
            if (item && item.skuId) {
                const matchedProduct = products.find(product => product.skuId === item.skuId);
                // console.log('1104',viewProducts)
                if (matchedProduct && matchedProduct.sku) {
                    return (
                        <div>{matchedProduct.sku}</div>
                    );
                }
            }
            return <div>N/A</div>;
        };
        const displayShipping = () => {
            if (salesOrder && salesOrder.shippingTypeId) {
              const matchedProduct = trackings.find(
                product => product.masterCodeId === salesOrder.shippingTypeId
              );
              return <span>{matchedProduct?.value}</span>;
            }
            return <span>N/A</span>;
          };
          
    const estimatesView=(<>
        <ConfirmDialog />
        <div className='flex w-full absolute bg-ligthgrey br-top br-bottom z-2' style={{ top: '4rem', left: 0 }}>
            <div className='page-menu-item p-3 pl-5 br-right cursor-pointer' onClick={() => onRowSelect(salesOrder, ACTIONS.EDIT)}><i className="pi pi-pencil"></i> Edit</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={() => printDoc(salesOrder.estimateId)}><i className="pi pi-file-pdf"></i> Pdf/Print</div>
            {/* <div className='page-menu-item p-3 br-right cursor-pointer' onClick={attacheDocs}><i className="pi pi-paperclip"></i> Attach Files</div> */}
            {/* <div className='page-menu-item p-3 br-right cursor-pointer' onClick={(event) => { if (createMenuRef.current) { createMenuRef.current.toggle(event) } }}><i className="pi pi-ellipsis-v"></i></div> */}
            {/* <Menu model={createMenuItems} popup ref={createMenuRef} id="popup_menu_left" /> */}
        </div>
        <div className='pt-8 pr-2'>
            <div className='grid justify-content-between p-2'>
                <div>
                    <h4>Estimate</h4>
                    {/* <p>Estimate <strong>{salesOrder.soNumber}</strong></p> */}
                    <p>Estimate Expiry Date <strong>{isMoment(moment(salesOrder.estimateDate)) ? moment(salesOrder.soDate).format('MM/DD/YYYY') : ''}</strong></p>
                </div>
                <div>
                    <p>Billing Address</p>
                    <p className='text-blue cursor-pointer'><strong>{get(salesOrder, 'customer.name', '')}</strong></p>
                </div>
            </div>
            <div>
            <p>
                Shipping: <strong >{displayShipping()}</strong>
                </p>
            </div>
            <div className="mt-4">
                <h5>Line Items</h5>
                <DataTable
                    scrollable
                    showGridlines
                    value={get(salesOrder, 'items', [])}
                    selectionMode="single"
                    dataKey="productId"
                    className='table-line-item'
                    // onSelectionChange={(row: any) => onRowSelect(row.value, 'view')}
                    scrollHeight="70%"
                    style={{ height: '80%' }}
                >
                    <Column field="soDate" header="Product & SKU" body={(data, options: ColumnBodyOptions) => displaySKU(data)} ></Column>
                    <Column field="items.price" header="Average Cost"  body={renderAverageCost} style={{ width: 80, textAlign: 'right' }}></Column>
                    <Column field="margin" header="Margin" body={renderViewMargin} style={{ width: 80, textAlign: 'right' }}></Column>
                    <Column field="unitPrice" header="Unit Price" body={renderUnitPrice} style={{ width: 150, textAlign: 'right' }}></Column>
                    <Column field="itemCounts" header="Available Quantity" body={renderitemCounts} style={{ width: 150, textAlign: 'right' }}></Column>
                    <Column field="quantity" header="Quantity" body={renderViewQuantity} style={{ width: 150, textAlign: 'right' }}></Column>
                    <Column field="total" header="Total" body={renderTotal} style={{ width: 150, textAlign: 'right' }}></Column>
                    {/* <Column field="price" header="Rate" style={{ width: 150, textAlign: 'right' }}></Column>
                    <Column field="poNumber" header="Total" body={renderTotal} style={{ width: 150, textAlign: 'right' }}></Column> */}
                </DataTable>
                <div className="grid mt-3">
                    <div className="col-5 col-offset-7">
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Total</p>
                            <p className="font-bold">${salesOrder.quoteAmount}</p>
                        </div>

                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Shipping Charges</p>
                            <p className="font-semibold">{salesOrder.shippingCost}</p>
                        </div>

                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Shipping Price</p>
                            <p className="font-semibold">{salesOrder.shippingPrice}</p>
                        </div>

                        {
                            get(salesOrder, 'vat', 0) > 0 && <div className="flex justify-content-between align-items-baseline">
                                <p className="font-semibold">VAT {get(salesOrder, 'vat', 0)}%</p>
                                <p className="font-bold">${sumBy(get(salesOrder, 'items', []), (item) => item.quantity * item.price) * (get(salesOrder, 'vat', 0) / 100)}</p>
                            </div>
                        } 
                        <div className="flex justify-content-between align-items-center">
                            <p className="font-semibold">Discount {salesOrder.discountAmount} {salesOrder.discountType == 'FIXED' ? ' Flat' : '%'}</p>
                            <p className="font-semibold">-{getDiscountAmount(salesOrder)}</p>
                        </div>

                        <hr className=" mx-3 border-top-1 border-none surface-border" />
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Total</p>
                            {/* <p className="font-bold">${salesOrder.totalPrice || 0}</p> */}
                        </div>
                        {/* {
                            salesOrder.paid > 0 && <div className="flex justify-content-between align-items-baseline">
                                <p className="font-semibold">Paid</p>
                                <p className="font-semibold">-${salesOrder.totalPrice}</p>
                            </div>
                        } */}
                        <hr className="mb-3 mx-3 border-top-1 border-none surface-border" />
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Balance</p>
                            <p className="font-bold">${salesOrder.totalPrice}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-3">
                    <h5>Remarks</h5>
                    <p>{salesOrder.note || 'N/A'}</p>
                </div>
                {/* {
                    docs != undefined && docs.length > 0 && <div className="mt-3">
                        <h5>Attachments</h5>
                        <div className='grid mt-2'>
                            {
                                docs.map((file: any) => (
                                    <div key={`file_${file.id}_${get(file, 'asset.name')}`} className='col-4 sm:col-3 lg:col-2 file-item'>
                                        <div className="flex gap-3 flex-column p-2 shadow-2 border-round align-items-center text-center border-round-sm">
                                            <MemoizedFileItem edit={true} key={`file_image_${get(file, 'asset.assetId')}_${get(file, 'asset.name')}`} file={file.asset} onView={() => viewImage(file.asset)} onDelete={() => deleteDoc(file)} />
                                        </div>
                                        <div className="file-info flex flex-column  mb-2">
                                            <p className='m-0 mt-2 sub-desc'>{get(file, 'asset.type', '').toUpperCase()} • {formatBytes(get(file, 'asset.sizeInBytes'))}</p>
                                            <p className='m-0  sub-desc text-overflow-ellipsis' style={{ overflow: 'hidden', width: 110 }}>{get(file, 'asset.name')}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                } */}

            </div>
            </div>
            </>)
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
    //                             extraButtons={pos.map(item => ({
    //     icon: item.isConvertedToSales ? null : 'pi pi-clipboard', // Show icon only when isConvertedToSales is false
    //     onClick: (item) => convertToSales(item.estimateId)
    // }))}
                                data={pos}
                                columns={[
                                    {
                                        header: 'Estimate #',
                                        field: 'estimateId',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 50, maxWidth: 100 },
                                        filterPlaceholder: 'Estimate Number'
                                    },
                                    {
                                        header: 'Customer',
                                        field: 'vendorId',
                                        body: renderVendor,
                                        filter: true,
                                        filterElement: vendorDropdown,
                                        filterPlaceholder: 'Search customer'
                                    },
                                    {
                                        header: 'Estimate Date',
                                        field: 'estimateDate',
                                        sortable: true,
                                        style: { minWidth: 120, maxWidth: 120 },
                                        body: renderEstimateDate 
                                    },                                    
                                    {
                                        header: 'Total Items',
                                        // field: 'statusId',
                                        body: renderTotalItems,
                                        // style: { minWidth: 120, maxWidth: 120 },
                                        filter: true,
                                        filterPlaceholder: 'Search Total Items'
                                    },
                                    {
                                        // header: 'Actions',
                                        body: (rowData: any) => {
                                            // Conditionally render the button if isConvertedToSales is false
                                            return rowData.isConvertedToSales ? null : (
                                                <button
                                                    className="p-0 bg-transparent border-none text-blue-500 hover:text-blue-700"
                                                    onClick={() => {
                                                        const estimateId = rowData.estimateId;
                                                        // Check if estimateId is a valid string, otherwise don't call the function
                                                        if (estimateId && typeof estimateId === 'number') {
                                                            convertToSales(String(estimateId)); // Convert to string
                                                        }
                                                    }}
                                                >
                                                    <i className="pi pi-clipboard"></i>
                                                </button>
                                            );
                                        }
                                    }
                                    
                                ]}
                                onLoad={(params: any) => fetchData(params)}
                                onView={(item: any) => onRowSelect(item, 'view')}
                                onEdit={(item: any) => onRowSelect(item, 'edit')}
                                onDelete={(item: any) => onRowSelect(item, 'delete')}
                            />
                        </div>
                        <Sidebar
                            isVisible={isShowSplit}
                            action={action}
                            title={`${(action == ACTIONS.EDIT || action == ACTIONS.VIEW) ? selectedSO?.customer?.name : 'New Estimate'}`}
                            closeIcon={closeIcon}
                            onSave={onSave}
                            content={[ACTIONS.EDIT, ACTIONS.ADD].includes(action) ? estimatesEditor : estimatesView}
                        />
                    </div>
                </div>
            </div>
            {popupmodal}
            {dialogPopup}
            <Dialog
                header="Delete confirmation"
                visible={isDeleteDialogVisible}
                style={{ width: layoutState.isMobile ? '90vw' : '50vw' }}
                className="delete-dialog"
                headerStyle={{ backgroundColor: '#ffdddb', color: '#8c1d18' }}
                footer={
                    <div className="flex justify-content-end p-2">
                        <Button label="Cancel" severity="secondary" text onClick={closeDeleteDialog} />
                        <Button label="Delete" severity="danger" onClick={confirmDelete} />
                    </div>
                }
                onHide={closeDeleteDialog}
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
                            This will permanently delete the selected purchase order.
                            <br />
                            Do you still want to delete it? This action cannot be undone.
                        </span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default EstimatesPage;