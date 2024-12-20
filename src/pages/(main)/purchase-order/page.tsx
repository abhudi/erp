


import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { Category, CompanyProductsMapping, CustomResponse, MasterCode, Product, Item, PurchaseItem, PurchaseOrder, Vendor, Warehouse, Asset } from '../../../types';
import Sidebar from '../../../components/Sidebar';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Panel } from 'primereact/panel';
import CustomPanel from '../../../components/CustomPanel';
import { DeleteCall, GetCall, GetPdfCall, PostCall, PutCall } from '../../../api/ApiKit';
import { filter, find, get, map, set, sumBy } from 'lodash';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
// import { ConnectableObservable } from 'rxjs';
// import { Console } from 'console';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // Or your preferred theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Menu } from 'primereact/menu';
import MemoizedFileItem from '../../../components/MemoizedFileItem';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import FileView from '../../../components/FileView';
import UploadFile from '../../../components/UploadFile';

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
    price: null,
    rowId: `${Date.now()}_${Math.random()}`,
    skuId:null,
    internalGrade:null,
    batteryHealthIds:null,
};
const defaultPurchaseItems: PurchaseOrder = {
    // [x: '']: '',
    poId: null,
    poNumber: null,
    companyId: null,
    warehouseId: null,
    vendorId: null,
    categoryIds: null,
    poDate: null,
    approxDeliveryDate: null,
    trackingTypeId: null,
    trackingId: null,
    statusId: null,
    note: null,
    quantity: 0,
    totalPrice: 0,
    paid: 0,
}

const PurchaseOrderPage = () => {
    const initializedRef = useRef(false);
    const createMenuRef = useRef<Menu>(null);
    const [searchParams] = useSearchParams();
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const navigate = useNavigate();
    const multiSelectRef = useRef<MultiSelect>(null);
    const containerRef = useRef(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [action, setAction] = useState<any>(null);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [pos, setPOs] = useState<PurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder>({ ...defaultPurchaseItems });
    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number[]>([]);
    const [trackings, setTrackings] = useState<MasterCode[]>([]);
    const [selectedTracking, setSelectedTracking] = useState<number | null>(null);
    const [statuses, setStatuses] = useState<MasterCode[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
    const [paid, setPaid] = useState<number>(0);
    const [grades, setGrades] = useState<MasterCode[]>([]);
    const [note, setNote] = useState<string>('');
    const [poDate, setPODate] = useState<any>(null);
    const [adDate, setApproxDate] = useState<any>(null);
    const [trackingId, setTracking] = useState<any>(null);
    const [lineItems, setLineItems] = useState<PurchaseItem[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [viewProducts, setViewProducts] = useState<any[]>([]);
    const [isfilter, setfilter] = useState<boolean>(false);
    const [visible, setVisible] = useState(false);
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<any>(null);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(getRowLimitWithScreenHeight());
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [selectedPOToDelete, setSelectedPOToDelete] = useState<PurchaseOrder | null>(null);
    const [selectedTrackingToDelete, setSelectedTrackingToDelete] = useState<Item | null>(null); // Holds the selected tracking item to delete
    const [dialogvisible, setDialogVisible] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [items, setItems] = useState<string[]>([]);
    const [poId, setPoId] = useState<string | null>(null); // Step 1: Add state for poId
    const [trackingData, setTrackingData] = useState<Item[]>([]);
    const [category, setCategory] = useState<any>(null);
    const [details, setDetails] = useState<any>(null);
    const [docs, setDocs] = useState<any[]>([]);
    const [assetFile, setAssetFile] = useState<Asset | null>(null);
    const [isShowImage, setShowImage] = useState<boolean>(false);
    const [isPackage, setShowPackage] = useState<boolean>(false)
    const [isShipment, setShowShipment] = useState<boolean>(false);
    // const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedTrackingId,setselectedTrackingId]=useState(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const queryPoId = searchParams.get('poId');
    const createMenuItems: any[] = [
        {
            label: 'Package',
            command: () => setShowPackage(true)
        },
        {
            label: 'Shipment',
            command: () => setShowShipment(true)
        },
        {
            label: 'Convert to PO',
            command: () => convertToPO()
        }
    ]
    useEffect(() => {
        setScroll(false);
        fetchData();
        fetchLocations();
        fetchAllVendors();
        fetchCarriers();
        fetchPOStatus();
        fetchGrades();
        fetchProducts();
        return () => {
            setScroll(true);
        };
    }, []);
    useEffect(() => {
        const defaultStatus = statuses.find((status) => status.code === 'Balance To Pay');
        if (defaultStatus?.masterCodeId !== undefined) {
            setSelectedStatus(defaultStatus.masterCodeId);
        }
    }, [statuses])
    useEffect(() => {
        if (selectedWarehouse) {
            fetchVendors();
        } else {
            setVendors([]);
        }
    }, [selectedWarehouse]);

    useEffect(() => {
        if (selectedVendor) {
            fetchCategories();
        } else {
            setCategories([]);
            setProducts([]);
        }
    }, [selectedVendor]);

    useEffect(() => {
        if (selectedCategory && selectedCategory.length > 0) {
            fetchProducts();
        } else {
            setProducts([]);
            // setLineItems([]);
        }
    }, [selectedCategory]);
    useEffect(() => {
        const check = async () => {
            if (!initializedRef.current && queryPoId) {
                initializedRef.current = true;
                let samplePO = { ...defaultPurchaseItems };
                samplePO.poId = +queryPoId;
                setAction(ACTIONS.VIEW);
                handleClick(samplePO);

            }
        };
        check();
    }, [queryPoId]);
    useEffect(() => {
        if (poId) {
            fetchTrackingData(poId); // Call API when poId is set
        }
    }, [poId]);
    const fetchData = async (params?: any) => {
        if (!params) {
            params = { limit: limit, page: page };
        }
        params.include = 'warehouse,vendor,items';
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const queryString = buildQueryParams(params);
        const response: CustomResponse = await GetCall(`/company/${companyId}/purchase-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
            setPOs(response.data);
            if (response.total) {
                setTotalRecords(response?.total);
            }
            if (response.data.length > 0) {
                setPoId(response.data[0].poId);
            }
        } else {
            setPOs([]);
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
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/master-codes?codeType=${constant.SYSTEM_MSTR_CODE.poStatus}`);
        if (response.code == 'SUCCESS') {
            setStatuses(response.data);
        } else {
            setStatuses([]);
        }
        setLoading(false);
    };

    const fetchGrades = async () => {
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

    const fetchLocations = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/warehouses?limit=500`);
        if (response.code == 'SUCCESS') {
            setWarehouses(response.data);
        } else {
            setWarehouses([]);
        }
        setLoading(false);
    };

    const fetchAllVendors = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/vendors?limit=500`);
        if (response.code == 'SUCCESS') {
            setAllVendors(response.data);
        } else {
            setAllVendors([]);
        }
        setLoading(false);
    };

    const fetchVendors = async () => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/vendors?limit=500&filters.warehouseId=${selectedWarehouse}`);
        if (response.code == 'SUCCESS') {
            setVendors(response.data);
        } else {
            setVendors([]);
        }
        setLoading(false);
    };

    const fetchCategories = useCallback(async () => {
        if (!selectedVendor || !user?.company?.companyId) return;
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/vendors/${selectedVendor}?query=vendorCategories`);

        if (response.code === 'SUCCESS') {
            const _categories = response.data.vendorCategories.map((item: any) => item.category);
            setCategory(_categories);

            // If there is at least one category, pass its ID to fetchAllCategories
            if (_categories.length > 0) {
                fetchAllCategories(_categories[0].categoryId); // Assuming you want to fetch for the first category ID
            }
        } else {
            setCategory([]);
        }
        setLoading(false);
    }, [selectedVendor, user?.company?.companyId]);

    const fetchAllCategories = async (categoryId: string) => {
        if (!user?.company?.companyId || !categoryId) return;

        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/categories/${categoryId}`);

        if (response.code === 'SUCCESS') {
            const _categories = response.data.children.map((item: any) => ({
                categoryId: item.categoryId,
                name: item.name,
                parentId: item.parentId,
            }));
            setCategories(_categories);
        } else {
            setCategories([]);
        }
        setLoading(false);
    };

    const fetchProducts = async () => {
        if (!user?.company?.companyId) {
            return;
        }

        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/products?vendorId=${selectedVendor}&categoryId=${map(selectedCategory, 'categoryId')}`);
        if (response.code == 'SUCCESS') {
            setProducts(response.data);
            setViewProducts(response.data)
        } else {
            setProducts([]);
            response.data([])
        }
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
        if (!selectedPOToDelete) return;
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/purchase-orders/${selectedPOToDelete.poId}`);
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

    const closeDeleteDialog = () => {
        setIsDeleteDialogVisible(false);
        setSelectedPOToDelete(null);
    };

    const closeIcon = () => {
        setIsShowSplit(false);
        setApproxDate(null);
        setPODate(null);
        setSelectedPO(null);
        setSelectedWarehouse(null);
        setVendors([]);
        setSelectedVendor(null);
        setCategories([]);
        setSelectedCategory([]);
        setSelectedTracking(null);
        setSelectedStatus(null);
        setPaid(0);
        setNote('');
        setTracking('');
        handleClick();
        setPurchaseOrder({ ...defaultPurchaseItems })
        setselectedTrackingId(null)
        setLineItems([]);
    };
    const openDeleteDialog = (perm: PurchaseOrder) => {
        setSelectedPOToDelete(perm);
        setIsDeleteDialogVisible(true);
    };
    const onRowSelect = async (perm: PurchaseOrder, action = ACTIONS.VIEW) => {
        console.log('493',perm)
        setAction(action);
        // setIsShowSplit(true);
        await setSelectedPO(perm);
        if (action === ACTIONS.DELETE) {
            openDeleteDialog(perm);
        }
        // if (action === ACTIONS.VIEW) {
        //     const companyDetails = {
        //         Name: perm.poNumber, // Replace with the actual key for the company name
        //         Location: perm?.warehouse?.name,
        //         Vendor: perm?.vendor?.name,
        //         status: perm?.status?.code,
        //         TotalPrice: perm?.totalPrice,
        //         poDate:perm?.poDate,
        //         approxDeliveryDate:perm?.approxDeliveryDate,
        //         Paid: perm?.paid,
        //         BalancePrice: perm?.balancePrice,
        //         TrackingId:perm?.trackingId,
        //         trackingType:perm?.trackingType?.code,
        //         items: perm.items || [], // List of Points of Contact (items)
        //         Trackings: perm.trackings || [] // List of trackings
        //     };
        //     setDetails(companyDetails); // Set the details for viewing
        //     setIsShowSplit(true);
        // }
        if (action === ACTIONS.EDIT) {
            // setPurchaseOrder(perm);
            setIsShowSplit(true);
            // fetchPoDetails(perm.poId)
        }

        if (action === ACTIONS.VIEW) {
            setPurchaseOrder(perm);
            setIsShowSplit(true);
            handleClick(perm)
        }
        if (action === ACTIONS.EDIT) {
            const matchingWarehouse = warehouses.find((warehouse) => warehouse.warehouseId === perm.warehouseId);
            setSelectedWarehouse(matchingWarehouse?.warehouseId ?? null);
            fetchVendors();
            const matchingVendor = allVendors.find((vendor) => vendor.vendorId === perm.vendorId);
            setSelectedVendor(matchingVendor?.vendorId ?? null);
            await fetchCategories();
            if (perm.poDate) {
                setPODate(moment(perm.poDate, 'YYYY-MM-DD').toDate());
            } else {
                setPODate(null);
            }
            if (perm.approxDeliveryDate) {
                setApproxDate(moment(perm.approxDeliveryDate, 'YYYY-MM-DD').toDate());
            } else {
                setApproxDate(null);
            }
            const matchingTracking = trackings.find((tracking) => tracking.masterCodeId === perm?.trackingTypeId);
            setSelectedTracking(matchingTracking?.masterCodeId ?? null);
            setTracking(perm.trackingId ?? '');
            const matchingStatus = statuses.find((status) => status.masterCodeId === perm.statusId);
            setPaid(perm.paid ?? 0);
            setNote(perm.note ?? '');
            const updatedLineItems =
                perm.items?.map((item: { poItemId: any; categoryId: any; poId: any; companyId: any; productId: any; gradeId: any; isCrossDock: any; quantity: any; price: any; }, index: any) => ({
                    rowId: item.poItemId || `row-${index}`, // Unique identifier for each row
                    categoryId: item.categoryId,
                    poId: item.poId || null,
                    poItemId: item.poItemId || null,
                    companyId: item.companyId || null,
                    productId: item.productId,
                    gradeId: item.gradeId || null,
                    isCrossDock: item.isCrossDock || false,
                    quantity: item.quantity || 0,
                    price: item.price || 0,
                })) || [];

            setLineItems(updatedLineItems);
            setSelectedStatus(matchingStatus?.masterCodeId ?? null);
            setIsShowSplit(true);
        }
    };
    useEffect(() => {
        if (action === ACTIONS.EDIT && selectedPO?.categoryIds) {
            const permCategoryIds = selectedPO.categoryIds || [];
            const matchingCategories = categories
                .filter((category) => permCategoryIds.includes(category.categoryId || -1))
                .map((category) => category.categoryId || -1)
                .filter((id) => id !== -1);
            setSelectedCategory(matchingCategories as number[]);
        }
    }, [categories, action, selectedPO]);
    const showAddNew = () => {
        setIsShowSplit(true);
        setSubmitted(false);
        setAction(ACTIONS.ADD);
        setSelectedPO(null);
    };

    const onProductSelect = (productId: number, isPreSelected: boolean, rowIndex: number, categoryId: number) => {
        let _items = [...lineItems];
        if (!isPreSelected) {
            _items.push({
                poId: null,
                poItemId: null,
                companyId: null,
                categoryId: categoryId,
                productId: productId,
                gradeId: null,
                isCrossDock: false,
                quantity: 0,
                price: 0,
                skuId:null,
                rowId: `${categoryId}_${Date.now()}_${Math.random()}`, // Unique rowId
                internalGrade:null,
                batteryHealthIds:null,
            });
        } else {
            let itemIndex = _items.findIndex((item) => item.categoryId === categoryId && item.rowId === _items[rowIndex].rowId);
            if (itemIndex !== -1) {
                _items[itemIndex].productId = productId;
            }
        }
        setLineItems(_items);
    };
    

    const removeItem = (productId: number | null) => {
        if (!productId) return;
        let _items = [...lineItems];
        _items = _items.filter((item) => item.productId != productId);
        setLineItems(_items);
    };

    // const inputChange = async (key: any, value: any, index: any) => {
    //     let _items = [...lineItems];
    //     set(_items, `${index}.${key}`, value);
    //     setLineItems(_items);
    // };
    const inputChange = (field: string, value: any, rowId: string) => {
        setLineItems((prevItems) =>
            prevItems.map((item) =>
                item.rowId === rowId ? { ...item, [field]: value } : item
            )
        );
    };
    
    

    const onSave = async () => {
        setSubmitted(true);
        if (!selectedCategory || !selectedWarehouse || !selectedStatus || !selectedVendor || lineItems.length == 0) {
            return;
        }
        const data = {
            warehouseId: selectedWarehouse,
            vendorId: selectedVendor,
            categoryIds: selectedCategory,
            poDate: poDate,
            approxDeliveryDate: adDate,
            trackingTypeId: selectedTracking,
            trackingId: trackingId,
            statusId: selectedStatus,
            paid: paid,
            note: note,
            items: lineItems
        };
        setLoading(true);
       
        if (action == ACTIONS.ADD) {
            console.log('653',data)
            const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/purchase-orders`, data);
            if (response.code == 'SUCCESS') {
                closeIcon();
                fetchData();
                setAlert('success', 'Add Successfully');
            } else {
                setAlert('error', response.message);
            }
        }
        if (action == ACTIONS.EDIT) {
            console.log('667',data)
            const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/purchase-orders/${selectedPO?.poId}`, data);
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
    const togglefilterVisibility = () => {
        setfilter((prev) => !prev);
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between p-4">
                <span className="p-input-icon-left flex align-items-center">
                    <h4 className="mb-0">Purchase Orders</h4>
                </span>
                <span className="flex gap-5">
                    <div className=" ">
                        <Button label="Create PO" size="small" icon="pi pi-plus" className=" mr-2" onClick={showAddNew} />
                    </div>
                </span>
            </div>
        );
    };
    const header = renderHeader();

    const renderProduct = (item: PurchaseItem | null, option: ColumnBodyOptions, categoryId: any) => {
        const optionItems = filter(products, (item) => item.categoryId == categoryId);
        return (
            <Dropdown
                value={item?.productId}
                onChange={(e) => onProductSelect(e.value, item?.productId != null, option.rowIndex, categoryId)}
                valueTemplate={selectedProductTemplate}
                itemTemplate={productOptionTemplate}
                options={optionItems} 
                optionLabel="name"
                optionValue="productId"
                placeholder="Select a Product"
                className="w-full"
            />
        );
    };
    const renderGrades = (item: PurchaseItem) => {
        if (!item?.productId) {
            return <></>;
        }
        return (
            <Dropdown
                value={item?.gradeId}
                onChange={(e) => inputChange('gradeId', e.value, item.rowId)}
                options={grades}
                optionLabel="code"
                optionValue="masterCodeId"
                placeholder="Select a Grade"
                className="w-full"
            />
        );
    };
    
    const renderCrossDock = (item: PurchaseItem) => {
        if (!item?.productId) {
            return <></>;
        }
        return (
            <div className="flex justify-content-center mr-6">
                <Checkbox
                    checked={item.isCrossDock || false}
                    onChange={(e) => inputChange('isCrossDock', e.checked, item.rowId)}
                />
            </div>
        );
    };
    
    const renderQuantity = (item: PurchaseItem) => {
        if (!item?.productId) {
            return <></>;
        }
        return (
            <div>
                <InputNumber
                    value={item.quantity}
                    onValueChange={(e) => inputChange('quantity', e.value, item.rowId)}
                    inputClassName="text-base"
                    inputStyle={{ width: '80px' }}
                />
            </div>
        );
    };
    
    
    const renderRate = (item: PurchaseItem) => {
        if (!item?.productId) {
            return <></>;
        }
        return (
            <InputNumber
                value={item.price}
                onValueChange={(e) => inputChange('price', e.value, item.rowId)}
                mode="currency"
                currency="USD"
                locale="en-US"
                placeholder="Price"
                inputClassName="text-base"
                inputStyle={{ width: '150px' }}
            />
        );
    };
    
    
    const renderTotal = (item: PurchaseItem) => {
        if (!item?.productId) {
            return <></>;
        }
        return <div className="flex align-items-center">{(item.price || 0) * (item.quantity || 0)}</div>;
    };
    

    const renderCross = (item: PurchaseItem) => {
        if (!item?.productId) {
            return <></>;
        }
        return (
            <div className="flex align-items-center">
                <Button
                    icon="pi pi-times"
                    severity="danger"
                    aria-label="Cancel"
                    size="small"
                    onClick={() => removeItem(item.productId)}
                />
            </div>
        );
    };
    

    const selectedProductTemplate = (option: Product, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-start">
                    <div className="text-base">{option.name}</div>
                </div>
            );
        }

        return <span>{props.placeholder}</span>;
    };

    const productOptionTemplate = (option: Product) => {
        return (
            <div className="flex align-items-start flex-column">
                <div className="text-xs text-grey">{option.skuId}</div>
                <div className="text-base">{option.name}</div>
            </div>
        );
    };

    const renderPOTotal = (option: PurchaseOrder) => {
        return <>${option.totalPrice}</>;
    };

    const renderPOBalace = (option: PurchaseOrder) => {
        return <>${option.totalPrice - option.paid}</>;
    };

    const statusess = [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' }
    ];
    const statusEditor = (options: any) => {
        return <Dropdown value={options.value} options={statusess} onChange={(e) => options.editorCallback(e.value)} placeholder="Select Status" />;
    };

    const closeDialog = () => {
        setVisible(false);
    };

    const openDialog = () => {
        setVisible(true);
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
    // const emptyTemplate = () => {
    //     return (
    //         <div className="flex align-items-center flex-column">
    //             <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>
    //             <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
    //                 Drag and Drop Image Here
    //             </span>
    //         </div>
    //     );
    // };
    // // Function to add a new item to the items array
    // Function to add a new item to the list
    // const addDialogItem = () => {
    //     if (newItem) {
    //         setItems((prevItems) => [...prevItems, newItem]); // Add new item to state
    //         setNewItem(''); // Clear input after adding
    //     }
    // };
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
    // Function to remove an item by index
    // const removeDialogItem = (index: any) => {
    //     setItems((prevItems) => prevItems.filter((_, i) => i !== index)); // Remove item from state
    // };

    // const handleDeleteTracking = (poTrackId: number) => {
    //     const selectedTrackingItem = trackingData.find((item) => item.poTrackId === poTrackId);
    //     if (selectedTrackingItem) {
    //         setSelectedTrackingToDelete(selectedTrackingItem); // Set the selected tracking to delete
    //         setIsDeleteDialogVisible(true); // Show the delete confirmation dialog
    //     }
    // };
    const printDoc = async (poId: any) => {
        setLoading(true);
        const response: any = await GetPdfCall(`/company/${user?.company?.companyId}/purchase-orders/${poId}/print`);
        if (response && response.code == 'FAILED') {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const attacheDocs = async () => {
        setVisible(true)
    }

    const uploadDocs = async (assetIds: any) => {
        let poId = purchaseOrder.poId;
        if (!poId && selectedPO) {
            poId = selectedPO.poId;
        }
        setLoading(true);
        const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/purchase-orders/${poId}/docs`, { assetIds });
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Upload Successfully');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const convertToPO = () => {
        confirmDialog({
            className: 'confirm-dialog',
            message: "You’re converting the sales order into a purchase order?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle text-red",
            position: 'top',
            accept: () => {
                console.log('accept')
            },
        });
    }
    const handleClick = (_purchaseOrder?: PurchaseOrder) => {
        if (_purchaseOrder) {
            const newUrl = `/purchase-order?poId=${_purchaseOrder.poId}`;
            navigate(newUrl, { replace: true });
            // fetchPoDetails(_purchaseOrder.poId);
            setIsShowSplit(true);
        }
        else {
            navigate('/purchase-order', { replace: true });
        }
    };
    // const fetchPoDetails = async (poId: any) => {
    //     let params: any = {
    //         filters: {
    //             poId: poId
    //         },
    //         include: 'warehouse,vendor,items,docs,history,pallets,trackings'
    //     };
    //     const companyId = get(user, 'company.companyId');
    //     setLoading(true);
    //     const queryString = buildQueryParams(params);
    //     const response: CustomResponse = await GetCall(`/company/${companyId}/purchase-orders?${queryString}`);
    //     if (response.code == 'SUCCESS') {
    //         setPurchaseOrder(response.data[0]);
    //         getDocs(poId);
    //     } else {
    //         setPurchaseOrder(defaultPurchaseItems);
    //         setAlert('error', response.message);
    //     }
    //     setLoading(false);
    // };
    const renderShipmentStatus = (item: PurchaseOrder, option: ColumnBodyOptions) => {
        if (!item?.skuId) {
            return <div style={{ width: 100 }}></div>;
        }
        return (
            <div style={{ width: 80, textAlign: 'left' }}>
                <p>{item.packed || 0} Packed</p>
                <p>{item.shipped || 0} Shipped</p>
            </div>
        );
    };
    // const updateItem = async (key: string, value: any) => {
    //     const _so = JSON.parse(JSON.stringify(salesOrder));
    //     set(_so, key, value);
    //     setSalesOrder(_so);
    // }
    const viewImage = (file: Asset) => {
        setShowImage(true);
        setAssetFile(file)
    }
    const deleteDoc = async (file: any) => {
        const podIds = map([file], 'id')
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/purchase-orders/${purchaseOrder.poId}/docs`, { podIds: podIds });
        if (response.code == 'SUCCESS') {
            getDocs(purchaseOrder.poId)
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }
    const getDocs = async (poId: any) => {
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${user?.company?.companyId}/purchase-orders/${poId}/docs?include=asset,user`);
        if (response.code == 'SUCCESS') {
            setDocs(response.data)
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    }
    // Function to handle dropdown change
    const handleStatusChange = (masterCodeId: React.SetStateAction<number | null>, rowData: any) => {
        setSelectedStatus(masterCodeId);

        // Clear any existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set a new timeout to call the API after 2 seconds
        const id = setTimeout(() => {
            callStatusUpdateAPI(masterCodeId, rowData);
        }, 2000);

        setTimeoutId(id);
    };

    // Function to call the API with the masterCodeId and row data
    const callStatusUpdateAPI = async (masterCodeId: React.SetStateAction<number | null>, rowData: { poId: any; }) => {
        // try {
        //   // Replace with your API endpoint and logic
        //   const response = await fetch('/api/update-status', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ masterCodeId, poId: rowData.poId }),
        //   });

        //   if (response.ok) {
        //     console.log('Status updated successfully');
        //   } else {
        //     console.error('Error updating status');
        //   }
        // } catch (error) {
        //   console.error('API error:', error);
        // }
        setLoading(true);
        const response: CustomResponse = await PutCall(`/company/${user?.company?.companyId}/purchase-orders/${rowData.poId}/status/${masterCodeId}`);
        if (response.code == 'SUCCESS') {
            fetchData();
            setAlert('success', 'Status Updated');
        } else {
            setAlert('error', response.message);
        }
        setLoading(false);
    };
    // const getDiscountAmount = (_purchaseOrder?: PurchaseOrder) => {
    //     if (!_purchaseOrder) {
    //         _purchaseOrder = purchaseOrder;
    //     }
    //     let sum = sumBy(get(_purchaseOrder, 'items', []), (item) => item.quantity * item.price);
    //     let discountAmount = _purchaseOrder.discountAmount ? get(_salesOrder, 'discountAmount', 0) : 0 || 0;
    //     if (_salesOrder.discountType == 'PERCENTAGE') {
    //         return sum * (discountAmount / 100);
    //     }
    //     return discountAmount;
    // }

    const displaySKU = (item: PurchaseItem | null) => {
        if (item && item.productId) {
            const matchedProduct = viewProducts.find(product => product.productId === item.productId);
            // console.log('1104',viewProducts)
            if (matchedProduct && matchedProduct.sku) {
                return (
                    <div>{matchedProduct.sku}</div>
                );
            }
        }
        return <div>N/A</div>;
    };
    const salesOrderView = (<>
        <ConfirmDialog />
        <div className='flex w-full absolute bg-ligthgrey br-top br-bottom z-2' style={{ top: '4rem', left: 0 }}>
            <div className='page-menu-item p-3 pl-5 br-right cursor-pointer' onClick={() => onRowSelect(purchaseOrder, ACTIONS.EDIT)}><i className="pi pi-pencil"></i> Edit</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={() => printDoc(purchaseOrder.poId)}><i className="pi pi-file-pdf"></i> Pdf/Print</div>
            <div className='page-menu-item p-3 br-right cursor-pointer' onClick={attacheDocs}><i className="pi pi-paperclip"></i> Attach Files</div>
            {/* <div className='page-menu-item p-3 br-right cursor-pointer' onClick={(event) => { if (createMenuRef.current) { createMenuRef.current.toggle(event) } }}>Create <i className="pi pi-chevron-down"></i></div> */}
            <Menu model={createMenuItems} popup ref={createMenuRef} id="popup_menu_left" />
        </div>
        <div className='pt-8 pr-2'>
            <div className='grid justify-content-between p-2'>
                <div>
                    <h4>Purchase Order</h4>
                    <p>Purchase Order# <strong>{purchaseOrder.poNumber}</strong></p>
                    <p>Order Date <strong>{isMoment(moment(purchaseOrder.poDate)) ? moment(purchaseOrder.poDate).format('MM/DD/YYYY') : ''}</strong></p>
                </div>
                <div>
                    <p>Billing Address</p>
                    <p className='text-blue cursor-pointer'><strong>{get(purchaseOrder, 'warehouse.name', '')}</strong></p>
                </div>
            </div>
            <div>
                <p>Status <strong>{get(purchaseOrder, 'status.value')}</strong></p>
            </div>
            <div className="mt-4">
                <h5>Line Items</h5>
                <DataTable
                    scrollable
                    showGridlines
                    value={get(purchaseOrder, 'items', [])}
                    selectionMode="single"
                    dataKey="productId"
                    className='table-line-item'
                    // onSelectionChange={(row: any) => onRowSelect(row.value, 'view')}
                    scrollHeight="70%"
                    style={{ height: '80%' }}
                >
                    <Column field="poDate" header="Product & SKU" style={{ width: 340, textAlign: 'left' }} body={(data, options: ColumnBodyOptions) => displaySKU(data)} ></Column>
                    <Column field="quantity" header="Quantity" style={{ width: 80, textAlign: 'right' }}></Column>
                    {/* <Column field="poDate" header="Status" body={renderShipmentStatus} style={{ width: 80, textAlign: 'right' }}></Column> */}
                    <Column field="price" header="Rate" style={{ width: 150, textAlign: 'right' }}></Column>
                    <Column field="poNumber" header="Total" body={renderTotal} style={{ width: 150, textAlign: 'right' }}></Column>
                </DataTable>
                <div className="grid mt-3">
                    <div className="col-5 col-offset-7">
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Total</p>
                            <p className="font-bold">${purchaseOrder.totalPrice}</p>
                        </div>

                        {/* <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Shipping Charges</p>
                            <p className="font-semibold">{purchaseOrder.shippingPrice}</p>
                        </div> */}

                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-bold">Paid</p>
                            <p className="font-semibold">{purchaseOrder.paid || 0}</p>
                        </div>
                        <hr className="mb-3 mx-3 border-top-1 border-none surface-border" />
                        <div className="flex justify-content-between align-items-baseline">
                            <p className="font-semibold">Balance</p>
                            <p className="font-bold">{purchaseOrder.balancePrice}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-3">
                    <h5>Remarks</h5>
                    <p>{purchaseOrder.note || 'N/A'}</p>
                </div>
                {
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
                }

            </div>
        </div>
    </>)
    const dialogPopup = (
        <Dialog header={<span>{selectedTrackingId} </span>} style={{ width: '30vw' }} visible={dialogvisible} onHide={() => setDialogVisible(false)}>
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

    const renderVendor = (item: any) => get(item, 'vendor.name');
    const renderWarehouse = (item: any) => get(item, 'warehouse.name');
    const renderStatus = (rowData: { statusId: any; }) => {
        return (
            <Dropdown
                value={rowData.statusId || null}
                options={statuses}
                optionLabel="code"
                optionValue="masterCodeId"
                onChange={(e) => handleStatusChange(e.value, rowData)}
                className="dropdown-small w-full" checkmark={true}
            />
        );
    };

    const vendorDropdown = (options: any) => (
        <Dropdown
            filter
            value={options.value || null}
            options={allVendors}
            optionLabel="name"
            optionValue="vendorId"
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Select vendor"
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
    const salesOrderEditor = (
        <>
            <div className="grid" ref={containerRef}>
                <div className="col-4">
                <label className="mb-2 block">
                    Warehouse<span className='text-red'>*</span>
                </label>
                    <Dropdown
                        value={selectedWarehouse}
                        filter
                        onChange={(e) => setSelectedWarehouse(e.value)}
                        options={warehouses}
                        optionLabel="name"
                        optionValue="warehouseId"
                        placeholder="Select a Location"
                        className={`w-full ${isSubmitted && !selectedWarehouse ? 'p-invalid' : ''}`}
                        required={true}
                    />
                </div>
                
                <div className="col-4">
                <label className="mb-2 block">
                    Vendor<span className='text-red'>*</span>
                </label>
                    <Dropdown
                        value={selectedVendor}
                        filter
                        onChange={(e) => setSelectedVendor(e.value)}
                        options={vendors}
                        optionLabel="name"
                        optionValue="vendorId"
                        placeholder="Select a Vendor"
                        className={`w-full ${isSubmitted && !selectedVendor ? 'p-invalid' : ''}`}
                        required={true}
                    />
                </div>
                
                <div className="col-4">
                <label className="mb-2 block">
                    Category<span className='text-red'>*</span>
                </label>
                    <MultiSelect
                        value={selectedCategory}
                        filter
                        onChange={(e) => setSelectedCategory(e.value)}
                        options={categories}
                        optionLabel="name"
                        optionValue="categoryId"
                        display="chip"
                        placeholder="Select Categories"
                        maxSelectedLabels={3}
                        className={`w-full ${isSubmitted && selectedCategory.length == 0 ? 'p-invalid' : ''}`}
                        required={true}
                    />
                </div>

                <div className="col-4">
                <label className="mb-2 block">
                PO Date<span className='text-red'>*</span>
                </label>
                    <Calendar appendTo={'self'} value={poDate} onChange={(e) => setPODate(moment(e.value).toDate())} placeholder="PO Date" className="w-full" showIcon required={true} />
                </div>
                <div className="col-4">
                <label className="mb-2 block">
                Delivery Date
                </label>
                    <Calendar appendTo={'self'} value={adDate} onChange={(e) => setApproxDate(moment(e.value).toDate())} placeholder="PO Delivery Date" className="w-full" showIcon />
                </div>
                <div className="col-4">
                <label className="mb-2 block">
                Shipment carrier
                </label>
                    <Dropdown value={selectedTracking} onChange={(e) => setSelectedTracking(e.value)} options={trackings} optionLabel="code" optionValue="masterCodeId" placeholder="Shipment carrier" className="w-full" />
                </div>
                <div className="col-4">
                <label className="mb-2 block">
                Primary Tracking Number
                </label>
                    <InputText value={trackingId} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking Number" className="w-full" />
                </div>
                {action === ACTIONS.EDIT && ( 
                <div className="col-4">
                    <label className="mb-2 block">
                    Status
                </label>
                    <Dropdown
                        value={selectedStatus}
                        options={statuses}
                        onChange={(e) => setSelectedStatus(e.value)}
                        optionLabel="code"
                        optionValue="masterCodeId"
                        placeholder="Status"
                        className={`w-full ${isSubmitted && !selectedStatus ? 'p-invalid' : ''}`}
                    />
                </div>
            )}
            </div>
            <div className="mt-4">
                <h5>Line Items</h5>
                {selectedCategory.length === 0 && <div className="placeholder h-8rem pointer-none flex align-items-center justify-content-center">Line items will be displayed here</div>}
                {selectedCategory.map((item, index) => {
                    let cat: Category | undefined = find(categories, { categoryId: item });
                    return (
                        <CustomPanel title={cat?.name} key={`${item}_${index}`}>
                            <DataTable
                                key={`${item}_${index}`}
                                scrollable
                                value={[...lineItems.filter((subItem) => subItem.categoryId === item), defaultLineItem]}
                                selectionMode="single"
                                dataKey="productId"
                                scrollHeight="70%"
                                style={{ width: '100%', height: '80%' }}
                            >
                                <Column field="poDate" header="Product & SKU" body={(data, options: ColumnBodyOptions) => renderProduct(data, options, item)} style={{ maxWidth: 100 }} />
                                <Column field="poDate" header="Vendor Grades" body={renderGrades} style={{ maxWidth: 100 }} />
                                <Column field="poDate" header="Cross Dock" body={renderCrossDock} style={{ maxWidth: 70}} />
                                <Column field="poDate" header="Quantity" body={renderQuantity} style={{ maxWidth: 50 }} />
                                <Column field="poNumber" header="Rate" body={renderRate} style={{ maxWidth: 100 }} />
                                <Column field="poNumber" header="Total" body={renderTotal} style={{ maxWidth: 50 }} />
                                <Column style={{ width: 30 }} body={renderCross} />
                            </DataTable>
                        </CustomPanel>
                    );
                })}
                <div className="grid mt-3">
                    <div className="col-9"></div>
                    <div className="col-3">
                        <div className="flex justify-content-between">
                            <p className="font-semibold">Total</p>
                            <p className="font-bold">${sumBy(lineItems, (item) => item.quantity * item.price)}</p>
                        </div>
                        <div className="flex justify-content-between">
                            <p className="font-bold">Paid</p>
                            <InputNumber
                                value={paid}
                                onValueChange={(e) => {
                                    if (e.value) {
                                        setPaid(e.value);
                                    } else {
                                        setPaid(0);
                                    }
                                }}
                                inputClassName="text-base font-bold"
                                inputStyle={{ width: '130px' }}
                            />
                        </div>
                        <hr className="mb-3 mx-3 border-top-1 border-none surface-border" />
                        <div className="flex justify-content-between">
                            <p className="font-semibold">Balance</p>
                            <p className="font-bold">${sumBy(lineItems, (item) => item.quantity * item.price) - paid}</p>
                        </div>
                    </div>
                </div>
                <div className="grid mt-3">
                    <h5>Remarks</h5>
                    <InputTextarea className="w-full" value={note} onChange={(e) => setNote(e.target.value)} rows={5} cols={30} style={{ resize: 'none' }} />
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
                                // isView={true}
                                isEdit={true} // show edit button
                                isDelete={true} // show delete button
                                isView={true}
                                extraButtons={[
                                    {
                                        icon: 'pi pi-cloud-upload',
                                        onClick: (item) => {
                                            setSelectedPO(item)
                                            setVisible(true)
                                        }
                                    },
                                    {
                                        icon: 'pi pi-file-pdf',
                                        onClick: (item) => {
                                            printDoc(item.poId)
                                        }
                                    },
                                    {
                                        icon: 'pi pi-truck',
                                        onClick: async (item) => {
                                            setDialogVisible(true);
                                            setPoId(item.poId); // Set the poId from the clicked item
                                            setselectedTrackingId(item.poNumber)
                                            await fetchTrackingData(item.poId);
                                        }
                                    }
                                ]}
                                data={pos}
                                columns={[
                                    {
                                        header: 'PO Number',
                                        field: 'poNumber',
                                        filter: true,
                                        sortable: true,
                                        bodyStyle: { minWidth: 150, maxWidth: 150 },
                                        filterPlaceholder: 'PO Number'
                                    },
                                    {
                                        header: 'Vendor',
                                        field: 'vendorId',
                                        body: renderVendor,
                                        filter: true,
                                        filterElement: vendorDropdown,
                                        filterPlaceholder: 'Search vendor'
                                    },
                                    {
                                        header: 'PO Date',
                                        field: 'poDate',
                                        sortable: true,
                                        style: { minWidth: 120, maxWidth: 120 }
                                    },
                                    {
                                        header: 'Location',
                                        field: 'warehouseId',
                                        body: renderWarehouse,
                                        filter: true,
                                        filterElement: warehouseDropdown,
                                        filterPlaceholder: 'Search location'
                                    },
                                    {
                                        header: 'Status',
                                        field: 'statusId',
                                        body: renderStatus,
                                        filter: true,
                                        filterElement: statusDropdown,
                                    },
                                    {
                                        header: 'Total',
                                        field: 'total',
                                        body: renderPOTotal
                                    },
                                    {
                                        header: 'Balance',
                                        field: 'balance',
                                        body: renderPOBalace
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
                            width={ACTIONS.VIEW == action ? '60vw' : undefined}
                            title={`${action == ACTIONS.EDIT || action == ACTIONS.VIEW ? selectedPO?.poNumber : 'Create Purchase Order'}`}
                            closeIcon={closeIcon}
                            onSave={onSave}
                            content={[ACTIONS.EDIT, ACTIONS.ADD].includes(action) ? salesOrderEditor : salesOrderView}

                        />
                    </div>
                </div>
            </div>
            {popupmodal}
            {dialogPopup}
            <UploadFile
                isVisible={visible}
                onSelect={(option: any) => {
                    setVisible(false);
                    if (option && option.length > 0) {
                        const assetIds = option.map((item: any) => item.assetId);
                        uploadDocs(assetIds);
                    }
                }}
            />
            <FileView
                isVisible={isShowImage}
                assetFile={assetFile}
                onClose={() => setShowImage(false)}
            />

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
export default PurchaseOrderPage;
