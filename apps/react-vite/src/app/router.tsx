import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from 'react-router-dom';

import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/app/root';

import { paths } from '@/config/paths';
import { ProtectedRoute } from '@/lib/auth';

// ★ convert 関数はそのまま利用
const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

// ★ lazyImport ヘルパー: ルート側で簡単に書けるようにする
function lazyImport(queryClient: QueryClient, path: string) {
  return () => import(path).then(convert(queryClient));
}

// React Router のルートを生成
export const createAppRouter = (queryClient: QueryClient) => {
  // createRoutesFromElements で <Route> ツリーを定義
  const routes = createRoutesFromElements(
    <>
      {/* ホーム */}
      <Route
        path={paths.home.path}
        lazy={lazyImport(queryClient, './routes/landing')}
      />

      {/* 認証系 */}
      <Route
        path={paths.auth.register.path}
        lazy={lazyImport(queryClient, './routes/auth/register')}
      />
      <Route
        path={paths.auth.login.path}
        lazy={lazyImport(queryClient, './routes/auth/login')}
      />

      {/* アプリ内 (Protected) */}
      <Route
        path={paths.app.root.path}
        element={
          <ProtectedRoute>
            <AppRoot />
          </ProtectedRoute>
        }
        errorElement={<AppRootErrorBoundary />}
      >
        <Route
          path={paths.app.discussions.path}
          lazy={lazyImport(queryClient, './routes/app/discussions/discussions')}
        />
        <Route
          path={paths.app.discussion.path}
          lazy={lazyImport(queryClient, './routes/app/discussions/discussion')}
        />
        <Route
          path={paths.app.users.path}
          lazy={lazyImport(queryClient, './routes/app/users')}
        />
        <Route
          path={paths.app.profile.path}
          lazy={lazyImport(queryClient, './routes/app/profile')}
        />
        <Route
          path={paths.app.dashboard.path}
          lazy={lazyImport(queryClient, './routes/app/dashboard')}
        />
      </Route>

      {/* Not Found */}
      <Route path="*" lazy={lazyImport(queryClient, './routes/not-found')} />
    </>,
  );

  // 生成した配列を createBrowserRouter に渡す
  return createBrowserRouter(routes);
};

// 実際に <RouterProvider> でアプリにルーターを組み込むコンポーネント
export const AppRouter = () => {
  const queryClient = useQueryClient();

  // queryClient が変わるまでルーターを再生成しないように useMemo
  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
