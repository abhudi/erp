


import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppContext } from '../../../layout/AppWrapper';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { MultiSelect } from 'primereact/multiselect';
import { CompanyProductsMapping, CreateSKU, CustomResponse, Permissions } from '../../../types';
import { filter, find, get, groupBy, keyBy, map, uniq } from 'lodash';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { DeleteCall, GetCall, PostCall, PutCall } from '../../../api/ApiKit';
import { Column, ColumnBodyOptions } from 'primereact/column';
import { EmptyCategoryAttribute, EmptySKU, SelectedValue } from '../../../types/forms';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
 
const ACTIONS = {
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete'
};
 
const defaultForm: EmptySKU = [
    {
      name: '',
      sku: '',
      group: false,
      categoryId: null,
      price: 0,
      compareAtPrice: 0,
      attributes: [
        {
          catAttrId: null,
          attrName: '',
          value: ''
        }
       
      ]
    }
  ]
const SKUPage = () => {
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();
    const { layoutState } = useContext(LayoutContext);
    const multiSelectRef = useRef<MultiSelect>(null);
    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [selectedCompany, setSelectedCompany] = useState<CreateSKU | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [action, setAction] = useState<any>(null);
    const [form, setForm] = useState<EmptySKU>(defaultForm);
    const [getcategoryId, setGetCategoryId] = useState<any>([]);
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [SKUData, setSKUData] = useState<CreateSKU[]>([]); 
    const [rows, setRows] = useState<CreateSKU[]>(SKUData); 
    const [selectedValues, setSelectedValues] = useState<Record<string, SelectedValue>>({});
    const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
    const [dynamicData, setDynamicData] = useState<any[]>([]);
    const [isCreateDisabled, setIsCreateDisabled] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [focusedRow, setFocusedRow] = useState<number | null>(null);
    const navigate = useNavigate();
    useEffect(() => {
        setScroll(true);
        fetchPermissions();
        return () => {
            setScroll(true);
        };
    }, []);  
    useEffect(() => {
        setRows(SKUData);
    }, [SKUData]);
   
    useEffect(() => {
        const allRowsFilled = rows.every(
            (row) => selectedValues[row.catAttrId]?.attribute && selectedValues[row.catAttrId]?.value
        );
        setIsCreateDisabled(!allRowsFilled); 
    }, [selectedValues, rows]); 
    
    useEffect(() => {
        const sortedRows = [...SKUData].sort((a, b) => a.isSKURank - b.isSKURank);
        setRows(sortedRows);
    }, [SKUData]);
   
  const fetchData = async (categoryId: string) => {
    const companyId = get(user, 'company.companyId');
    const response: CustomResponse = await GetCall(`/company/${companyId}/categories/${categoryId}/attributes`);
   
    if (response.code === 'SUCCESS') {
        const attributes = response.data;
        const sortedAttributes = attributes.sort((a: { isSKURank: number; }, b: { isSKURank: number; }) => a.isSKURank - b.isSKURank);
        const preselectedValues: Record<string, SelectedValue> = {};
        sortedAttributes.forEach((attr: { catAttrId: string | number; codeType: { codeType: any; codes: any; }; isSKURank: any; selectionType: any; }) => {
            preselectedValues[attr.catAttrId] = {
                attribute: attr.codeType.codeType,
                valueOptions: attr.codeType.codes || [],
                isSKURank: attr.isSKURank ?? null,
                selectionType: attr.selectionType || '',
                value: '',
            };
        });
        setSKUData(sortedAttributes);  
        setSelectedValues(preselectedValues);  
    } else {
        setSKUData([]);
        setSelectedValues({});
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
    const closeIcon = () => {
        setDynamicData([]);
    };
    const onSave = () => {
        // Process the data for each row in the DataTable
        const processedFormArray = dynamicData.map((row: any) => {
            const attributes = dynamicColumns
                .filter((col) => col.field !== 'SKU')
                .map((col) => {
                   
                    const matchingSKUData = SKUData.find((d) => d.codeType.codeType === col.field);
                   
                    return {
                        catAttrId: matchingSKUData ? matchingSKUData.catAttrId : null,
                        attrName: col.header,
                        value: row[col.field]
                    };
                });
           
            // Create form object for each row
            return {
                name: row.SKU.replace(/-/g, ' '),
                sku: row.SKU,
                group: false,
                categoryId: getcategoryId,
                price: 0,
                compareAtPrice: 0,
                attributes,
            };
        });
        // Now call the API with the processed data
        onNewAdd(processedFormArray);
        setDynamicData([]);
        navigate('/sku-list');
    };
    const onNewAdd = async (companyForm: any) => {
        const companyId = get(user, 'company.companyId');
        setIsDetailLoading(true);
        if (companyForm.length === 0) {
            setAlert('error', 'No Attributes Selected');
        } else {
            const response: CustomResponse = await PostCall(`/company/${companyId}/products`, companyForm);
            setIsDetailLoading(false);
            console.log('response', response);
            if (response.code == 'SUCCESS') {
                setSelectedCompany(response.data);
                setAlert('success ', 'Successfully Added');
            } else {
                setAlert('error', response.message);
            }
        }
    };
    const onInputChange = (key: string, value: any) => {
        setForm((prevForm) => ({
            ...prevForm,
            [key]: value
        }));
    };
    const updateSKU = () => {
        const newSKU = Object.keys(selectedValues)
            .map((key) => selectedValues[key].value)
            .filter(Boolean)
            .join('-');
   
        setDynamicData((prevData) => prevData.map((row) => ({
            ...row,
            SKU: newSKU
        })));
    };
   
   
    const handleAttributeChange = (e: any, id: number) => {
        const selectedAttribute = e.value;
        const selectedAttributeData = SKUData.find((attr) => attr.codeType.codeType === selectedAttribute);
        setSelectedValues((prevValues) => ({
            ...prevValues,
            [id]: {
                ...prevValues[id],
                attribute: selectedAttribute,
                valueOptions: selectedAttributeData?.codeType.codes || [],
                isSKURank: selectedAttributeData?.isSKURank ?? null,
                selectionType: selectedAttributeData?.selectionType || '',
                value: selectedAttributeData?.codeType.codes?.[0]?.value || '' // Preselect the first value
            }
        }));
        updateSKU();
    };
   
    const handleValueChange = (e: any, id: number) => {
        setDynamicData([]);
        setSelectedValues((prevValues) => ({
            ...prevValues,
            [id]: { ...prevValues[id], value: e.value }
        }));
        updateSKU();
    };
const handleReset = () => {
    setSelectedValues({});
    setSKUData([]);
    setDynamicData([]);
    setForm(defaultForm);
    setRows(SKUData);
    setShowDropdown(false);
};
const handleCreate = () => {
    setDynamicData([]);
    const attributes: string[] = [];
    const valuesArrays: string[][] = [];
    const selectedAttributes = Object.keys(selectedValues).map((key) => selectedValues[key].attribute);
    const attributeSet = new Set();
    for (let i = 0; i < selectedAttributes.length; i++) {
        if (attributeSet.has(selectedAttributes[i])) {
            setAlert('error', 'Already selected, please select a new attribute or write a new one');
            return; 
        }
        attributeSet.add(selectedAttributes[i]);
    }
    Object.keys(selectedValues).forEach((key) => {
        const { attribute, value } = selectedValues[key];
 
        let valuesArray: string[];
        if (Array.isArray(value)) {
            valuesArray = value.map((v: any) => v);
        } else {
            valuesArray = [value];
        }
        attributes.push(attribute);
        valuesArrays.push(valuesArray);
    });
 
    const combinations = cartesianProduct(valuesArrays);
 
    const dataRows = combinations.map((combination: string[]) => {
        const row: any = { SKU: combination.join('-') };
        for (let i = 0; i < attributes.length; i++) {
            row[attributes[i]] = combination[i];
        }
        return row;
    });
    const dynamicCols = attributes.map((attr) => ({
        field: attr,
        header: attr,
    }));
    dynamicCols.push({ field: 'SKU', header: 'SKU' });
    const reversedDataRows = dataRows.map((row) => {
        const reversedRow: any = { SKU: row.SKU };
        attributes.forEach((attr, index) => {
            reversedRow[attr] = row[attributes[index]];
        });
        return reversedRow;
    });
 
    // Prepend new rows to existing data
    setDynamicData((prevData) => {
        const newData = [...prevData, ...reversedDataRows];
        return newData.sort((a, b) => a.isSKURank - b.isSKURank);
    });
 
    setDynamicColumns(dynamicCols);
};
function cartesianProduct(arrays: string[][]) {
    return arrays.reduce(
        (acc, curr) =>
            acc.flatMap((a) => curr.map((b) => [...a, b])),
        [[]] as string[][]
    );
}
    const handleDeleteRow = (catAttrId: number) => {
        setRows((prevRows) => prevRows.filter((row) => row.catAttrId !== catAttrId));
        setSelectedValues((prevSelected) => {
            const updatedValues = { ...prevSelected };
            delete updatedValues[catAttrId];
            return updatedValues;
        });
        setDynamicData([]); 
        setForm(defaultForm);
    };
 
    const handleAddRow = () => {
        const lastNegativeId = rows.reduce((minId, row) => (row.catAttrId < minId ? row.catAttrId : minId), 0);
        const newCatAttrId = lastNegativeId - 1;
   
        const newRow: CreateSKU = {
            catAttrId: newCatAttrId,
            categoryId: null,
            codeType: {
                codeType: '',
                codeTypeId: null,
                codes: [
                    {
                        masterCodeId: null,
                        value: ''
                    }
                ]
            },
            isSKURank: 0,
            selectionType: 'single'
        };
   
        setRows((prevRows) => [...prevRows, newRow]);
   
        setSelectedValues((prevValues) => ({
            ...prevValues,
            [newRow.catAttrId]: {
                attribute: '',
                value: '',
                valueOptions: [],
                isSKURank: 100,
                selectionType: 'single'
            }
        }));
   
        setDynamicData([]);
        setForm(defaultForm);
        setShowDropdown(true);
    };
   
 
 
 
const renderRows = () => {
 
 
    const handleFocus = (catAttrId: number ) => {
        setFocusedRow(catAttrId);
    };
 
    const handleBlur = () => {
        setFocusedRow(null);
    };
 
    return rows.map((item, index) => {
        const isPreselected = item.isSKURank !== undefined && Boolean(selectedValues[item.catAttrId]?.attribute);
        const isFocused = focusedRow === item.catAttrId;
 
        return (
            <div key={item.catAttrId} className="flex justify-content-between gap-3 mt-4">
                {/* Attribute Dropdown */}
                <div style={{ width: '50%' }}>
                    <Dropdown
                        value={selectedValues[item.catAttrId]?.attribute || null}
                        options={SKUData.map((attr) => ({
                            label: attr.codeType.codeType,
                            value: attr.codeType.codeType
                        }))}
                        onChange={(e) => handleAttributeChange(e, item.catAttrId)}
                        optionLabel='value'
                        editable
                        placeholder="Select Attribute"
                        className="mr-2"
                        style={{ width: '100%' }}
                        disabled={isPreselected && !isFocused}
                        onFocus={() => handleFocus(item.catAttrId)}
                        onBlur={handleBlur}
                    />
                </div>
                {/* Value Dropdown */}
                <div style={{ width: '45%' }}>
                    {item.selectionType === 'single' ? (
                        <Dropdown
                            value={selectedValues[item.catAttrId]?.value || null}
                            options={
                                selectedValues[item.catAttrId]?.valueOptions.map((val: { value: any }) => ({
                                    label: val.value,
                                    value: val.value
                                })) || []
                            }
                            onChange={(e) => handleValueChange(e, item.catAttrId)}
                            optionLabel='value'
                            editable
                            placeholder="Select Value"
                            className="mr-2"
                            style={{ width: '100%' }}
                        />
                    ) : (
                        <MultiSelect
                            value={selectedValues[item.catAttrId]?.value || []}
                            options={
                                selectedValues[item.catAttrId]?.valueOptions.map((val: { value: any }) => ({
                                    label: val.value,
                                    value: val.value
                                })) || []
                            }
                            onChange={(e) => handleValueChange(e, item.catAttrId)}
                            placeholder="Select Values"
                            display="chip"
                            className="w-full"
                        />
                    )}
                </div>
                {/* Action column */}
                <div style={{ width: '7%', display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        icon={'pi pi-times'}
                        className="p-button-rounded p-button-sm p-button-danger"
                        onClick={() => handleDeleteRow(item.catAttrId)}
                        style={{ backgroundColor: 'red', width: '25px', height: '25px' }}
                    />
                    {index === rows.length - 1 && (
                        <Button
                            icon={'pi pi-plus'}
                            className="p-button-rounded p-button-sm p-button-success"
                            onClick={handleAddRow}
                            style={{ backgroundColor: 'green', width: '25px', height: '25px' }}
                        />
                    )}
                </div>
            </div>
        );
    });
};
 
    const onCategoryChange = async (e: any) => {
        setSelectedOption(e.value);
        const selectedCategoryKey = e.value.key;
        setGetCategoryId(selectedCategoryKey);
        await fetchData(selectedCategoryKey);
    };
    const renderHeader = () => {
        return (
            <div style={{ width: '100%' }}>
                <div className="flex justify-content-between gap-3">
                    <div style={{ width: '50%' }}>
                        <label htmlFor="categoryDropdown" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Category
                        </label>
                        <Dropdown
                            value={selectedOption}
                            options={dropdownOptions}
                            onChange={onCategoryChange}
                            placeholder="Select Category"
                            className="mr-2"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-200 mt-1">
                    <div className="flex-1 bg-gray-200 p-2 rounded-md shadow-md font-bold">
                        <label className="block mb-1">Attributes</label>
                    </div>
                    <div className="flex-1 bg-gray-200 p-2 rounded-md shadow-md font-bold">
                        <label className="block mb-1">Value</label>
                    </div>
                </div>
                {renderRows()}
                <div className="flex justify-content-end gap-3 mt-4 mb-4">
                    <Button label="Reset" onClick={handleReset} className="p-button-secondary" />
                    <Button label="Create" onClick={handleCreate} disabled={isCreateDisabled}  className="p-button-primary" />
                </div>
            </div>
        );
    };
   const panelFooterTemplate = () => {
    return (
        <div className="flex justify-content-end p-2">
            <div>
                <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                <Button label="Save"  onClick={onSave} />
            </div>
        </div>
    );
};
   const renderDataTable = () => {
    return (
        dynamicData.length > 0 && (
            <DataTable value={dynamicData} footer={panelFooterTemplate} >
                {dynamicColumns.map((col, index) => (
                    <Column key={index} field={col.field} header={col.header} />
                ))}
            </DataTable>
        )  
    );
};
    const header = renderHeader();
    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div >
                        <div className="left-panel pt-2">
                            <h3>SKU</h3>
                            {renderHeader()}
                            {renderDataTable()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default SKUPage;
 