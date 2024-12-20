import React from "react";
import Layout from "../../layout/layout";
import { Outlet } from "react-router-dom";

export const AppLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    return <Layout>
        <Outlet />
    </Layout>;
}
