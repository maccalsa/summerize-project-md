import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { readFileSync } from 'fs';
import { cpus } from 'os';

export class FileWorkerPool {
  constructor(maxWorkers = cpus().length) {
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
  }

  async readFiles(files) {
    if (!isMainThread) {
      throw new Error('FileWorkerPool must be used in the main thread');
    }

    return new Promise((resolve, reject) => {
      const results = new Map();
      let completedFiles = 0;

      // Process files in batches to avoid overwhelming the system
      const BATCH_SIZE = 10;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        this.taskQueue.push(...batch.map(file => ({
          file,
          resolve: (content) => {
            results.set(file.relPath, content);
            completedFiles++;
            if (completedFiles === files.length) {
              resolve(results);
            }
          },
          reject: (error) => {
            reject(error);
          }
        })));
      }

      // Start processing the queue
      this.processQueue();
    });
  }

  processQueue() {
    while (this.activeWorkers < this.maxWorkers && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      this.activeWorkers++;

      const worker = new Worker(new URL(import.meta.url), {
        workerData: { filePath: task.file.fullPath }
      });

      worker.on('message', (content) => {
        task.resolve(content);
        this.activeWorkers--;
        this.processQueue();
      });

      worker.on('error', (error) => {
        task.reject(error);
        this.activeWorkers--;
        this.processQueue();
      });

      this.workers.push(worker);
    }
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
  }
}

// Worker thread code
if (!isMainThread) {
  try {
    const { filePath } = workerData;
    const content = readFileSync(filePath, 'utf-8');
    parentPort.postMessage(content.trim());
  } catch (error) {
    parentPort.postMessage(`_Error reading file: ${error.message}_`);
  }
} 