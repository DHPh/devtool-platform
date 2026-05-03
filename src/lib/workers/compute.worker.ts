/// <reference lib="webworker" />

import {
  executeComputeTask,
  type ComputeTaskRequest,
  type ComputeTaskResponse,
} from "./compute-tasks";

export interface WorkerRequestEnvelope {
  id: number;
  task: ComputeTaskRequest;
}

export interface WorkerResponseEnvelope {
  id: number;
  response: ComputeTaskResponse;
}

self.onmessage = async (event: MessageEvent<WorkerRequestEnvelope>) => {
  const { id, task } = event.data;
  const response = await executeComputeTask(task);
  self.postMessage({ id, response } satisfies WorkerResponseEnvelope);
};
