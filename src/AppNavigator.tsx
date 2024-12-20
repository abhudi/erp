import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/(full-page)/login/page";
import ProtectedRoute from "./layout/ProtectedRoute";
import Dashboard from "./pages/(main)/page";
import BinPage from "./pages/(main)/bins/page";
import CategoryPage from "./pages/(main)/categories/page";
import ChangePasswordPage from "./pages/(main)/change-password/page";
import CompaniesPage from "./pages/(main)/companies/page";
import Customers from "./pages/(main)/customers/page";
import EstimatesPage from "./pages/(main)/estimates/page";
// import EstimationPage from "./pages/(main)/estimation/page";
import FilesPage from "./pages/(main)/files/page";
import GradePage from "./pages/(main)/grade/page";
import GradeToBinPage from "./pages/(main)/grade-to-bin/page";
import MasterPage from "./pages/(main)/master-codes/page";
import MakePage from "./pages/(main)/master-codes/make/page";
import ObjectInquiryPage from "./pages/(main)/object-inquiry/page";
import PalletReceivingPage from "./pages/(main)/pallet-receiving/page";
import PermissionPage from "./pages/(main)/permissions/page";
import ProductsMappingPage from "./pages/(main)/product-mapping/page";
import ProductsPage from "./pages/(main)/products/page";
import UserProfilePage from "./pages/(main)/profile/page";
import PurchaseOrderPage from "./pages/(main)/purchase-order/page";
import RackPage from "./pages/(main)/racks/page";
import ReceivePurchaseOrderPage from "./pages/(main)/receive-purchase-order/page";
import RolePage from "./pages/(main)/roles/page";
import RoutesPage from "./pages/(main)/routes/page";
import SalesOrderPage from "./pages/(main)/sales-orders/page";
import SKUPage from "./pages/(main)/sku/page";
import SkuListPage from "./pages/(main)/sku-list/page";
import SubLocationPage from "./pages/(main)/sub-location/page";
import UserPage from "./pages/(main)/users/page";
import Vendorss from "./pages/(main)/vendors/page";
import LocationPage from "./pages/(main)/warehouses/page";
import { AppLayout } from "./pages/(main)/layout";
import ErrorPage from "./pages/(full-page)/error/page";
import ForgotPasswordPage from "./pages/(full-page)/forgot-password/page";
import ResetPasswordPage from "./pages/(full-page)/reset-password/page";
import NotFoundPage from "./pages/(full-page)/notfound/page";
import PackagesPage from "./pages/(main)/packages/page";
import ShipmentsPage from "./pages/(main)/shipments/page";
import ReceiveNewPOPage from "./pages/(main)/receive-new-po/page";

const AppNavigator = () => {
    return <Routes>
        {/* Protected Routes */}
        <Route
            path="/"
            element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }
        >
            <Route path="/" element={<Dashboard />} />
            <Route path="/bins" element={<BinPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/change-passowrd" element={<ChangePasswordPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/estimates" element={<EstimatesPage />} />
            {/* <Route path="/estimation" element={<EstimationPage />} /> */}
            <Route path="/files" element={<FilesPage />} />
            <Route path="/grade" element={<GradePage />} />
            <Route path="/grade-to-bin" element={<GradeToBinPage />} />
            <Route path="/master-codes" element={<MasterPage />} />
            <Route path="/master-codes/make" element={<MakePage />} />
            <Route path="/object-inquiry" element={<ObjectInquiryPage />} />
            <Route path="/pallet-receiving" element={<PalletReceivingPage />} />
            <Route path="/permissions" element={<PermissionPage />} />
            <Route path="/product-mapping" element={<ProductsMappingPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/purchase-order" element={<PurchaseOrderPage />} />
            <Route path="/racks" element={<RackPage />} />
            <Route path="/receive-purchase-order" element={<ReceivePurchaseOrderPage />} />
            <Route path="/receive-purchase-order/:poId" element={<ReceiveNewPOPage />} />
            <Route path="/roles" element={<RolePage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/sales-orders" element={<SalesOrderPage />} />
            <Route path="/sku" element={<SKUPage />} />
            <Route path="/sku-list" element={<SkuListPage />} />
            <Route path="/sub-location" element={<SubLocationPage />} />
            <Route path="/users" element={<UserPage />} />
            <Route path="/vendors" element={<Vendorss />} />
            <Route path="/warehouses" element={<LocationPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
        </Route>

        {/* Public Route: Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
};
export default AppNavigator;