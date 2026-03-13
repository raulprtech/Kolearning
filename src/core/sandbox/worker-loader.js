const { workerData, parentPort } = require('worker_threads');
const path = require('path');

try {
    // Register tsx to handle .ts files
    require('tsx/cjs');
    
    // Load the actual worker script
    const scriptPath = path.resolve(workerData.scriptPath);
    require(scriptPath);
    
    console.log(`[WorkerLoader] Successfully loaded ${scriptPath}`);
} catch (error) {
    console.error('[WorkerLoader] Failed to load worker script:', error);
    process.exit(1);
}
