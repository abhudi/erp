import { useContext, useEffect, useRef, useState } from "react";
import { useAppContext } from "../../../layout/AppWrapper";
import { LayoutContext } from "../../../layout/context/layoutcontext";
import { Link, useNavigate, useParams } from "react-router-dom";
import { debounce, find, findIndex, get, groupBy, set } from "lodash";
import { buildQueryParams, getRowLimitWithScreenHeight } from "../../../utils/uitl";
import { Category, CustomResponse, Product, ProductItem, ReceiveGroupItems } from "../../../types";
import { DeleteCall, GetCall, PostCall } from "../../../api/ApiKit";
import { receivepurchaseItem } from "../../../types/forms";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import CustomDataTable, { CustomDataTableRef } from "../../../components/CustomDataTable";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ScrollPanel } from "primereact/scrollpanel";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import moment from "moment-timezone";

const ReceiveNewPOPage = () => {
    const { poId } = useParams();
    const navigate = useNavigate();
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
    const dataTableRef = useRef<CustomDataTableRef>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [action, setAction] = useState<any>(null);
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const [items, setItems] = useState<receivepurchaseItem[]>([]);
    const [productIndex, setProductIndex] = useState<number>(0);
    const [poDetails, setPODetails] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [skuList, setSKUList] = useState<any[]>([]);
    const [skuSearch, setSKUSearch] = useState<any>('');
    const [receivedGroupItems, setGroupReceivedItem] = useState<ReceiveGroupItems[]>([]);

    const [selectedCat, setSelectedCat] = useState<Category | null>(null);
    const [selectedSKU, setSelectedSKU] = useState<any>(null);
    const [palletId, setPalletId] = useState('');
    const [binNumber, setBinNumber] = useState('');
    const [REID, setREID] = useState('');
    const [inputREIDValue, setInputREIDValue] = useState('');
    const [binDetails, setBinDetails] = useState<any>(null);
    const [filterItems, setFilterItems] = useState<any[]>([]);

    useEffect(() => {
        fetchPOData(poId)
        fetchCategories();
        fetchReceiveItems(poId);
        setScroll(false);
        return () => {
            setScroll(true);
        };
    }, [])

    useEffect(() => {
        if (!selectedCat) {
            return;
        }

        const timer = setTimeout(() => {
            handleFilter(skuSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [skuSearch]);

    // fetch bin details
    useEffect(() => {
        if (binNumber) {
            fetchBin(binNumber)
        }
        else {
            setBinDetails(null);
        }
    }, [binNumber])

    // auto fetch SKU List when category selected
    useEffect(() => {
        if (selectedCat?.categoryId) {
            fetchSKUList()
        }
    }, [selectedCat])

    // auto receive product item when form is complete
    useEffect(() => {
        addNewItem()
    }, [palletId, selectedCat, selectedSKU, binNumber, REID]);

    // detect receive and ordere SKU
    useEffect(() => {
        let newItems: ReceiveGroupItems[] = [];
        if (poDetails && items && receivedGroupItems.length == 0) {
            get(poDetails, 'items', []).forEach((element: any) => {
                newItems.push({
                    categoryId: element.categoryId,
                    category: get(element, 'category.name'),
                    skuId: element.skuId,
                    sku: get(element, 'product.sku'),
                    ordered: element.quantity,
                    received: element.receivedQuantity
                })
            });
            items.forEach((element: any) => {
                let findDoc = find(newItems, { skuId: element.skuId })
                if (!findDoc) {
                    newItems.push({
                        categoryId: get(element, 'product.categoryId'),
                        category: get(element, 'product.category.name'),
                        skuId: element.skuId,
                        sku: get(element, 'product.sku'),
                        ordered: element.totalOrdered,
                        received: element.totalReceived
                    })
                }
            });
            setGroupReceivedItem(newItems)
        }
    }, [items, poDetails])

    const handleKeyPress = (event: any) => {
        if (event.key === "Enter") {
            setREID(event.target.value)
        }
    };

    const handleFilter = (soSearch: any) => {
        const searchTerm = soSearch.toLowerCase();
        const localMatches = skuList.filter((option: Product) => option?.sku && option?.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        if (localMatches.length > 0) {
            setSKUList(localMatches); // Use local matches if found
        } else {
            fetchSKUList(searchTerm); // Fallback to server if no local match
        }
    };

    const fetchSKUList = async (searchTerm: any = '') => {
        let params = {
            limit: 100,
            filters: {
                sku: searchTerm || '',
                categoryId: selectedCat?.categoryId || ''
            },
        };
        const companyId = get(user, 'company.companyId');
        const queryString = buildQueryParams(params);
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/products?${queryString}`);
        if (response.code == 'SUCCESS') {
            setSKUList(response.data);
        } else {
            setSKUList([]);
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const fetchPOData = async (poId: any) => {
        if (!poId) {
            return;
        }
        let params = {
            filters: {
                poId: +poId
            },
            include: 'warehouse,vendor,items'
        };
        const companyId = get(user, 'company.companyId');
        const queryString = buildQueryParams(params);
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/receive-purchase-orders?${queryString}`);
        if (response.code == 'SUCCESS') {
            setPODetails(response.data[0]);
        } else {
            setPODetails(null);
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const fetchReceiveItems = async (poId: any) => {
        if (!poId) {
            return;
        }
        let params = {
            limit: 1000,
            filters: {
                poId: +poId
            },
        };
        const companyId = get(user, 'company.companyId');
        const queryString = buildQueryParams(params);
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/receive-purchase-orders/${poId}?${queryString}`);
        if (response.code == 'SUCCESS') {
            setItems(response.data);
            if (response.total) {
                setTotalRecords(response.total)
            }
        } else {
            setTotalRecords(0)
            setItems([]);
            setAlert('error', response.message);
        }
        setLoading(false);
    }

    const fetchCategories = async () => {
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/categories?format=tree`); // get company all roles
        if (response.code == 'SUCCESS') {
            const processedData = response.data.map((parent: { children: any[]; categoryId: any; name: any }) => {
                if (parent.children && parent.children.length > 0) {
                    return parent.children.map((child: { categoryId: any; name: any }) => {
                        return child;
                    });
                }
                return [];
            });
            const flattenedData = processedData.flat();
            setCategories(flattenedData);
        } else {
            setCategories([]);
        }
        setLoading(false);
    };

    const confirmDelete = (item?: ProductItem) => {
        confirmDialog({
            className: 'confirm-dialog',
            message: `Do you really want to delete this product : ${item?.product.name} [REID: ${item?.REID}]?`,
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle text-red",
            position: 'top',
            accept: () => {
                if (item) {
                    deleteItem(item)
                }
            },
        });
    }
    const deleteItem = async (item: ProductItem) => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await DeleteCall(`/company/${user?.company?.companyId}/product-items/${item.pItemId}`);
        if (response.code == 'SUCCESS') {
            setAlert('success', 'Item deleted!')
            fetchReceiveItems(poId);
        } else {
            setAlert('error', response.message)
        }
        setLoading(false);
    };

    const addNewItem = () => {
        if (selectedCat && selectedCat.categoryId && selectedSKU && palletId && binNumber && REID) {
            let item = {
                index: items.length,
                categoryId: selectedCat?.categoryId,
                palletId: palletId,
                sku: selectedSKU.sku,
                skuId: selectedSKU.skuId,
                binNumber: binNumber,
                REID: REID,
                category: selectedCat,
                product: {
                    sku: selectedSKU.sku,
                    skuId: selectedSKU.skuId,
                    category: selectedCat
                },
                bin: {
                    binNumber: binNumber,
                }
            };
            uploadItems([item])
        }
        else {
            setREID('')
            setInputREIDValue('')
        }
    }

    const uploadItems = async (receivedItems: receivepurchaseItem[]) => {
        if (!user?.company?.companyId) {
            return;
        }
        setLoading(true);
        const response: CustomResponse = await PostCall(`/company/${user?.company?.companyId}/receive-purchase-orders/${poId}`, receivedItems);
        if (response.code == 'SUCCESS') {
            setAlert('success', 'Item received!')
            let findDoc = find(items, { REID: REID });
            if (!findDoc) {
                let _items = [...items];
                _items.push(receivedItems[0]);
                setItems(_items);

                let findPoItemIndex = findIndex(receivedGroupItems, { skuId: receivedItems[0].skuId });
                if (findPoItemIndex > -1) {
                    let _receivedGroupItems = [...receivedGroupItems];
                    _receivedGroupItems[findPoItemIndex].received = _receivedGroupItems[findPoItemIndex].received + 1;
                    setGroupReceivedItem(_receivedGroupItems);
                }
            }

            if (binDetails) {
                let _binDetails = { ...binDetails };
                set(_binDetails, 'capacityUsed', get(_binDetails, 'capacityUsed', 0) + 1);
                setBinDetails(_binDetails)
            }

        } else {
            setAlert('error', response.message)
        }
        setREID('');
        setInputREIDValue('');
        setLoading(false);
    }

    const fetchBin = debounce(async (barcode) => {
        if (!barcode) return;
        const companyId = get(user, 'company.companyId');
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/barcode/${barcode}`);
        if (response.code == 'SUCCESS') {
            if (get(response, 'data.barcodeType') == "BIN") {
                setBinDetails(response.data)
            }
            else {
                // setAlert('error', 'Please scan valid BIN.')
            }
        } else {
            // setAlert('error', 'Bin not found')
        }
        setLoading(false);
    });

    const toggleFilter = (item: any) => {
        if (filterItems.includes(item.skuId)) {
            setFilterItems([...filterItems].filter((ele) => ele != item.skuId))
        }
        else {
            setFilterItems([...filterItems, item.skuId])
        }
    }

    const refreshItemTable = () => {
        setFilterItems([])
        fetchReceiveItems(poId)
    }

    const summaryData: any[] = [
        { label: 'PO Number', value: poDetails?.poNumber || '' },
        { label: 'Vendor', value: poDetails?.vendor?.name || '' },
        { label: 'PO Date', value: poDetails?.poDate ? moment(poDetails?.poDate).format('MM/DD/YYYY') : '' },
        { label: 'Delivery Date', value: poDetails?.approxDeliveryDate ? moment(poDetails?.approxDeliveryDate).format('MM/DD/YYYY') : '' },
        { label: 'Status', value: poDetails?.status?.code || '' },
        { label: 'Received Pallets', value: poDetails?.totalPallets || 0 },
    ];

    return <>
        <div className="grid">
            <div className="col-12">
                <div className={`panel-container ${isShowSplit ? (layoutState.isMobile ? 'mobile-split' : 'split') : ''}`}>
                    <div className="left-panel">
                        <div className="flex justify-content-between p-4">
                            <span className="p-input-icon-left flex align-items-center">
                                <h4 className="mb-0">Receive Purchase Order</h4>
                            </span>
                        </div>
                        <ScrollPanel className="px-3 scroll" style={{ width: '100%', height: '80vh' }}>
                            <div
                                className="flex flex-col lg:flex-row"
                                style={{
                                }}
                            >
                                {/* Summary Panel */}
                                <div className="col-6">
                                    <Panel header="Summary">
                                        <DataTable value={summaryData} className="p-datatable-sm" header={null}>
                                            <Column field="label" headerStyle={{ display: 'none' }} />
                                            <Column field="value" headerStyle={{ display: 'none' }} body={(item) => item.label === "PO Number" ? <Link to={`/purchase-order?poId=${poId}`} className='text-blue'>{item.value}</Link> : item.value} />
                                        </DataTable>
                                    </Panel>
                                    <div
                                        className="mt-4 overflow-x-auto"
                                    >
                                        <DataTable
                                            value={receivedGroupItems}
                                            className="p-datatable-gridlines"
                                        >
                                            <Column
                                                field="category"
                                                header="Category"
                                                body={(item: any) => get(item, 'category')}
                                            />
                                            <Column
                                                field="sku"
                                                header="SKU"
                                                body={(item: any) => get(item, 'sku')}
                                            />
                                            <Column
                                                field="ordered"
                                                header="Total Ordered"
                                            />
                                            <Column
                                                field="received"
                                                header="Total Received"
                                                body={(item: any) => {
                                                    return <div className="flex justify-content-between">
                                                        <span>{item.received}</span>
                                                        <i className={`cursor-pointer pi ${filterItems.includes(item.skuId) ? 'pi-filter-slash' : 'pi-filter'}`} onClick={() => toggleFilter(item)}></i>
                                                    </div>
                                                }}
                                            />
                                        </DataTable>
                                    </div>

                                </div>

                                {/* Add Items Panel */}
                                <div className="col-6">
                                    <Panel header="Add Items">
                                        <div className="p-fluid space-y-4">
                                            <div className="field">
                                                <label htmlFor="palletId">Pallet Id <span className="text-red-500">*</span></label>
                                                <IconField>
                                                    <InputIcon className="pi pi-qrcode"> </InputIcon>
                                                    <InputText id="palletId" value={palletId} placeholder="Scan or Enter pallet Id" onChange={(e) => setPalletId(e.target.value)} />
                                                </IconField>
                                            </div>

                                            <div className="field">
                                                <label htmlFor="category">Category <span className="text-red-500">*</span></label>
                                                <Dropdown
                                                    id="category"
                                                    filter
                                                    value={selectedCat}
                                                    options={categories}
                                                    onChange={(e) => setSelectedCat(e.value)}
                                                    optionLabel="name"
                                                    placeholder="Select Category"
                                                    className="p-column-filter"
                                                    showClear
                                                    style={{ minWidth: '12rem' }}
                                                />
                                            </div>

                                            <div className="field">
                                                <label htmlFor="sku">
                                                    SKU <span className="text-red-500">*</span>
                                                </label>
                                                <Dropdown
                                                    value={selectedSKU}
                                                    filter
                                                    showClear
                                                    onChange={(e) => setSelectedSKU(e.value)}
                                                    options={skuList}
                                                    optionLabel="sku"
                                                    placeholder="Select a product"
                                                    className={`w-full`}
                                                    required={true}
                                                    filterTemplate={<span className="p-input-icon-right w-full">
                                                        <IconField>
                                                            <InputIcon className={`pi ${isLoading ? 'pi-spin pi-spinner' : 'pi-search'}`}> </InputIcon>
                                                            <InputText value={skuSearch}
                                                                onChange={(e) => setSKUSearch(e.target.value)}
                                                                placeholder="Search SKU"
                                                                style={{ width: "100%" }}
                                                                autoFocus />
                                                        </IconField>
                                                    </span>}
                                                    filterBy='sku'
                                                    itemTemplate={(option) => <>
                                                        <small className='small-desc'>{get(option, 'skuId')}</small>
                                                        <p>{get(option, 'sku')}</p>
                                                    </>}
                                                />
                                            </div>
                                            <div className="field">
                                                <div className="flex justify-content-between mb-2">
                                                    <label htmlFor="reid">Bin <span className="text-red-500">*</span></label>
                                                    {
                                                        get(binDetails, 'binNumber') == binNumber && +get(binDetails, 'binCapacity.value', 0) > -1 && <label>{get(binDetails, 'capacityUsed', 0)}/{get(binDetails, 'binCapacity.value', 0)}</label>
                                                    }
                                                </div>
                                                <IconField>
                                                    <InputIcon className="pi pi-qrcode"> </InputIcon>
                                                    <InputText id="bin" value={binNumber} placeholder="Scan or Enter bin id" onChange={(e) => setBinNumber(e.target.value)} />
                                                </IconField>
                                            </div>

                                            <div className="field">
                                                <label htmlFor="reid">REID <span className="text-red-500">*</span></label>
                                                <IconField>
                                                    <InputIcon className="pi pi-qrcode"> </InputIcon>
                                                    <InputText id="reid" value={inputREIDValue} placeholder="Scan or Enter REID and press Enter" onChange={(e) => setInputREIDValue(e.target.value)} onKeyDown={handleKeyPress} />
                                                </IconField>
                                            </div>
                                        </div>
                                    </Panel>
                                </div>
                            </div>

                            <div className="px-2">
                                <div className="flex justify-content-between py-4">
                                    <span className="p-input-icon-left flex align-items-center">
                                        <h4 className="mb-0">Items Received</h4>
                                    </span>
                                    <span className="flex gap-5">
                                        {
                                            filterItems.length > 0 && <div className=" ">
                                                <Button
                                                    icon="pi pi-refresh"
                                                    onClick={refreshItemTable}
                                                    className="mr-2"
                                                />
                                            </div>
                                        }
                                    </span>
                                </div>

                                <DataTable
                                    totalRecords={filterItems.length > 0 ? items.filter((ele) => filterItems.includes(ele.skuId)).length : items.length}
                                    value={filterItems.length > 0 ? items.filter((ele) => filterItems.includes(ele.skuId)) : items}
                                    className="erp-table"
                                    paginator
                                    rows={10}
                                    removableSort
                                >
                                    <Column header="Cateogry" body={(item: any) => get(item, 'product.category.name')} />
                                    <Column header="SKU" body={(item: any) => get(item, 'product.sku')} />
                                    <Column header="Bin" sortable sortField="bin.binNumber" body={(item: any) => get(item, 'bin.binNumber')} />
                                    <Column header="REID" field="REID" sortable />
                                    <Column header="" body={(item) => <div className='flex'>
                                        <Button type="button" icon={'pi pi-trash'} className="p-button-sm p-button-text" style={{ color: 'red' }} onClick={() => confirmDelete(item)} />
                                    </div>} />
                                </DataTable>
                            </div>
                        </ScrollPanel>
                    </div>
                </div>
            </div>
        </div>
        <ConfirmDialog appendTo={document.body} />
    </>
}

export default ReceiveNewPOPage;