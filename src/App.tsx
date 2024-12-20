import React from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { AppWrapper } from './layout/AppWrapper';
import { LayoutProvider } from './layout/context/layoutcontext';
import AppNavigator from './AppNavigator';



function App({ children }: any) {
  return (
    <PrimeReactProvider>
      <AppWrapper>
        <LayoutProvider>
          <AppNavigator />
        </LayoutProvider>
      </AppWrapper>
    </PrimeReactProvider>
  );
}

export default App;
