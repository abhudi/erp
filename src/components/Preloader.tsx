import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

const Preloader = () => {
    return (
        <div style={styles.loaderContainer}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
        </div>
    );
};

const styles = {
    loaderContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',  // Full viewport height
        width: '100vw',   // Full viewport width
    },
};

export default Preloader;
