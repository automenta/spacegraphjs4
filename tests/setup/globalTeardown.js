export default async () => {
    if (globalThis.__VITE_PROCESS__) {
        console.log('\nStopping Vite server...');
        // Use the detached option to kill the process and all its children
        process.kill(-globalThis.__VITE_PROCESS__.pid, 'SIGKILL');
        console.log('Vite server stopped.');
    }
};