


import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import RightSidePanel from '../../../components/RightSidePanel';
import { capitalize, filter, find, flatMap, flatten, get, map, orderBy, reduce, set, sortBy } from 'lodash';
import { useAppContext } from '../../../layout/AppWrapper';
import { CustomResponse } from '../../../types';
import { GetCall, PostCall } from '../../../api/ApiKit';
import { TreeSelect } from 'primereact/treeselect';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useNavigate } from 'react-router-dom';

const ProductsPage = () => {
    const navigate = useNavigate();
    const { user, isLoading, setLoading, setScroll, setAlert } = useAppContext();

    const [isShowSplit, setIsShowSplit] = useState<boolean>(false);
    const [categories, setCategories] = useState<any>([]);
    const [selectedNodeKey, setSelectedNodeKey] = useState<any>(null);
    const [seletedCat, setSeletedCat] = useState<any>(null);
    const [attributes, setAttributes] = useState<any>([]);
    const [product, setProduct] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedNodeKey) {
            console.log('selectedNodeKey', selectedNodeKey)
            if (selectedNodeKey.indexOf('-') == -1) {
                setSeletedCat(selectedNodeKey);
                fetchCategoryAttributes(selectedNodeKey)
            }
            else {
                let arr = selectedNodeKey.split('-')
                console.log('arr', arr, arr[arr.length - 1])
                setSeletedCat(arr[arr.length - 1])
                fetchCategoryAttributes(arr[arr.length - 1]);
            }
        }
    }, [selectedNodeKey]);

    const fetchData = async () => {
        const companyId = get(user, 'company.companyId')
        setLoading(true);
        const response: CustomResponse = await GetCall(`/company/${companyId}/categories?format=tree`);
        setLoading(false)
        if (response.code == 'SUCCESS') {
            setCategories(response.data);
        }
        else {
            setCategories([]);
        }
    }

    const fetchCategoryAttributes = async (_seletedCat: any) => {
        if (_seletedCat) {
            const companyId = get(user, 'company.companyId')
            setLoading(true);
            const response: CustomResponse = await GetCall(`/company/${companyId}/categories/${_seletedCat}/attributes`);
            setLoading(false)
            if (response.code == 'SUCCESS') {
                setAttributes(response.data);
                console.log('response.data', response.data)
            }
            else {
                setAttributes([]);
            }
        }
    }

    const onValueChanged = (attrId: any, value: any) => {
        let _attr = [...attributes];
        _attr.forEach(element => {
            if (element.attrId == attrId) {
                element.selectedValue = value;
            }
        });
        setAttributes(_attr)
    }

    const onInputChanged = (attrId: any, value: any) => {
        let _product = { ...product };
        set(_product, attrId, value)
        setProduct(_product)
    }

    const generateSKU = () => {
        let _productsAttributes: any[] = [];
        attributes.forEach((element: any) => {
            const values = get(element, 'codeType.codes', [])
            if (typeof element.selectedValue == 'object') {
                let _values: any[] = []
                element.selectedValue.forEach((item: any) => {
                    const val = find(values, { masterCodeId: item })
                    if (val) {
                        _values.push(val.code)
                    }
                });
                _productsAttributes.push({
                    attrId: element.attrId,
                    attrName: get(element, 'codeType.codeType'),
                    value: _values,
                    isSKUEnabled: element.isSKUEnabled,
                    isSKURank: element.isSKURank
                })
            }
            else {
                const val = find(values, { masterCodeId: element.selectedValue })
                if (val) {
                    _productsAttributes.push({
                        attrId: element.attrId,
                        attrName: get(element, 'codeType.codeType'),
                        value: [val.code],
                        isSKUEnabled: element.isSKUEnabled,
                        isSKURank: element.isSKURank
                    })
                }
            }
        });

        // Get product name from attributes where isSKUEnabled is true and value has a single element
        const productNameAttr = filter(_productsAttributes, attr => attr.isSKUEnabled && attr.value.length === 1);

        // Sort attributes by isSKURank
        const sortedProductNameAttr = sortBy(productNameAttr, 'isSKURank');
        const productName = map(sortedProductNameAttr, attr => attr.value[0]).join(' ');

        // Separate product attributes (single value) and variant attributes (multiple values)
        const productAttributes = filter(_productsAttributes, attr => attr.value.length === 1);
        const variantAttributes = filter(_productsAttributes, attr => attr.value.length > 1 && attr.isSKUEnabled);

        // Helper function to generate variant combinations
        const generateVariants = (attributes: any) => {
            const combinations = reduce(attributes, (result, attr) => {
                if (result.length === 0) {
                    return attr.value.map((val: any) => ({ [attr.attrName]: val }));
                }
                return flatMap(result, (variant: any) => attr.value.map((val: any) => ({
                    ...variant,
                    [attr.attrName]: val
                })));
            }, []);

            return combinations;
        };

        // Generate variant combinations
        const variantCombinations = generateVariants(variantAttributes);

        // Sort variant attributes by isSKURank for creating variant names
        const sortedVariantAttributes = sortBy(variantAttributes, 'isSKURank');

        // Create the product object
        const product = {
            name: productName,  // Constructed from attributes where isSKUEnabled is true and value has 1 element
            categoryId: seletedCat,
            attributes: map(productAttributes, attr => ({
                attrId: attr.attrId,
                attrName: attr.attrName,
                value: attr.value[0]
            })),
            variants: map(variantCombinations, combination => {
                const productNameAttr = map(sortedProductNameAttr, attr => attr.value[0]);
                const variantNameAttr = sortedVariantAttributes.map(attr => combination[attr.attrName]);
                const variantName = sortBy([...productNameAttr, ...variantNameAttr], 'isSKURank').join(' ');
                return {
                    name: variantName,
                    price: 0,
                    compareAtPrice: 0,
                    attributes: map(variantAttributes, attr => ({
                        attrId: attr.attrId,
                        attrName: attr.attrName,
                        value: combination[attr.attrName]
                    }))
                };
            })
        };
        // console.log('product', JSON.stringify(product))
        // Output the result
        setProduct(product)
    }

    const onSave = async () => {
        console.log('product', JSON.stringify(product))
        if (!isLoading) {
            const companyId = get(user, 'company.companyId')
            setLoading(true);
            const response: CustomResponse = await PostCall(`/inventory/${companyId}/products`, [product]);
            setLoading(false)
            if (response.code == 'SUCCESS') {
                setAlert('success', 'Product added')
                console.log(response.data);
                setIsShowSplit(false);
                setProduct(null);
            }
            else {
                setAlert('error', response.message)
            }
        }
    }

    const closeIcon = () => {
        setIsShowSplit(false)
    }

    const headerTemplate = (options: any) => {
        const className = `${options.className} justify-content-space-between`;
        return (
            <div className={className}>
                <div className="flex align-items-center gap-2">
                    <div className="ellipsis-container font-bold" style={{ marginLeft: 10, maxWidth: '22vw' }}>Add product</div>
                </div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="flex justify-content-end p-2">
                <div>
                    <Button label="Cancel" severity="secondary" text onClick={closeIcon} />
                    <Button label="Save" onClick={onSave} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5 onClick={() => setIsShowSplit(true)}>InventaryPage</h5>
                        <p>Use this page to start from scratch and place your custom content.</p>
                    </div>
                </div>
            </div>
            <RightSidePanel
                isVisible={isShowSplit}
                headerTemplate={headerTemplate}
                footerTemplate={panelFooterTemplate}
                closeIcon={closeIcon}
                width={'70vw'}
                content={<>
                    <TreeSelect
                        value={selectedNodeKey}
                        onChange={(e) => setSelectedNodeKey(e.value)} options={categories}
                        filter className="md:w-20rem w-full" placeholder="Select Category"></TreeSelect>

                    {
                        attributes.map((item: any, index: any) => (
                            <div key={index + item.attrId} className='col-6'>
                                {
                                    item.selectionType == 'single' && <Dropdown
                                        value={item.selectedValue}
                                        onChange={(e) => onValueChanged(item.attrId, e.value)}
                                        options={get(item, 'codeType.codes')}
                                        optionLabel="value"
                                        optionValue='masterCodeId'
                                        placeholder={`Select a ${get(item, 'codeType.codeType')}`}
                                        className="w-full"
                                    />
                                }
                                {
                                    item.selectionType == 'multiple' && <MultiSelect
                                        display="chip"
                                        value={item.selectedValue}
                                        onChange={(e: any) => onValueChanged(item.attrId, e.value)}
                                        options={get(item, 'codeType.codes')}
                                        optionLabel="value"
                                        optionValue='masterCodeId'
                                        placeholder={`Select a ${get(item, 'codeType.codeType')}`}
                                        className="w-full"
                                    />
                                }
                            </div>
                        ))
                    }
                    <br />
                    <Button className='mt-5' onClick={generateSKU}>Generate</Button>

                    <div className='mt-5'>
                        {
                            product != null && <>
                                <div>Product Name : {product.name}</div>
                                <div className='p-datatable mt-3'>
                                    <div className='p-datatable-wrapper'>
                                        {
                                            get(product, 'variants', []).length > 0 && <table className='p-datatable-table'>
                                                <thead className='p-datatable-thead'>
                                                    {
                                                        Object.keys(product['variants'][0]).map((item: any, index: any) => {
                                                            if (item == 'attributes') {
                                                                return product['variants'][0].attributes.map((attr: any, index2: any) => (
                                                                    <th key={`subItem${index}-${index2}`}>{attr.attrName}</th>
                                                                ))
                                                            }
                                                            else {
                                                                return <th key={item}>{capitalize(item)}</th>
                                                            }
                                                        })
                                                    }
                                                </thead>
                                                <tbody className='p-datatable-tbody'>
                                                    {
                                                        product['variants'].map((item: any, index: any) => <tr key={`productIndex${index}`}>
                                                            <td>{item.name}</td>
                                                            <td><InputNumber placeholder='price' inputStyle={{ width: 80 }} onChange={(e) => onInputChanged(`variants.${index}.price`, e.value)} /></td>
                                                            <td><InputNumber placeholder='Compare Price' inputStyle={{ width: 80 }} onChange={(e) => onInputChanged(`variants.${index}.compareAtPrice`, e.value)} /></td>
                                                            {
                                                                item.attributes.map((attr: any, index2: any) => (
                                                                    <td key={`subItem${index}-${index2}`}>{attr.value}</td>
                                                                ))
                                                            }
                                                            {
                                                                product.attributes.map((attr: any, index2: any) => (
                                                                    <td key={`subItem${index}-${index2}`}>{attr.value}</td>
                                                                ))
                                                            }
                                                        </tr>)
                                                    }
                                                </tbody>
                                            </table>
                                        }
                                    </div>
                                </div>
                            </>
                        }
                    </div>
                </>}
            />
        </>
    );
};

export default ProductsPage;
