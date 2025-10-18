import { spawn } from 'child_process';
import http from 'http';

const VITE_PORT = 5173;

const isPortOpen = (port) => {
    return new Promise((resolve) => {
        const req = http.request({ host: 'localhost', port, method: 'HEAD' }, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve(true));
        });
        req.on('error', () => {
            resolve(false);
        });
        req.end();
    });
};

const waitForServer = async (port, timeout = 30000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await isPortOpen(port)) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Vite server did not start on port ${port} within ${timeout}ms`);
};

export default async () => {
    console.log('\nStarting Vite server for e2e tests...');
    const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', VITE_PORT], {
        stdio: 'inherit',
        detached: true,
    });

    viteProcess.on('error', (err) => {
        console.error('Failed to start Vite process:', err);
    });

    globalThis.__VITE_PROCESS__ = viteProcess;

    try {
        await waitForServer(VITE_PORT);
        console.log('Vite server started successfully.');
    } catch (error) {
        console.error(error.message);
        // If the server fails to start, kill the process and exit
        process.kill(-viteProcess.pid, 'SIGKILL');
        process.exit(1);
    }
};