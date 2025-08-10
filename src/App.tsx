import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

import { RefineThemes, useNotificationProvider } from "@refinedev/antd";
import { Authenticated, ErrorComponent, Refine } from "@refinedev/core";
// import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";

import { App as AntdApp, ConfigProvider } from "antd";

import { Layout } from "@/components";
import { resources } from "@/config/resources";
import { authProvider, dataProvider } from "@/providers";

// Import Supabase client for direct usage if needed
import { supabase } from "./providers/supabaseClient";
import {
  CompanyCreatePage,
  CompanyEditPage,
  CompanyListPage,
  DashboardPage,
  LoginPage,
  TasksCreatePage,
  TasksEditPage,
  TasksListPage,
  UsersListPage,
  UserEditPage,
} from "@/routes";
import CreateAdmin from "./pages/CreateAdmin";

import "@refinedev/antd/dist/reset.css";

const App = () => {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Orange}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider()}
            notificationProvider={useNotificationProvider}
            authProvider={{
              ...authProvider,
              // Add any additional auth provider configuration here
            }}
            resources={resources}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              liveMode: "auto",
              useNewQueryKeys: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-layout"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <Layout>
                      <Outlet />
                    </Layout>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />

                <Route
                  path="/tasks"
                  element={
                    <TasksListPage>
                      <Outlet />
                    </TasksListPage>
                  }
                >
                  <Route path="new" element={<TasksCreatePage />} />
                  <Route path="edit/:id" element={<TasksEditPage />} />
                </Route>

                <Route path="/companies">
                  <Route index element={<CompanyListPage />} />
                  <Route path="new" element={<CompanyCreatePage />} />
                  <Route path="edit/:id" element={<CompanyEditPage />} />
                </Route>

                <Route path="/users">
                  <Route index element={<UsersListPage />} />
                  <Route path="edit/:id" element={<UserEditPage />} />
                </Route>

                <Route path="*" element={<ErrorComponent />} />
              </Route>

              <Route
                element={
                  <Authenticated key="authenticated-auth" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
                <Route path="/create-admin" element={<CreateAdmin />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
