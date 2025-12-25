import { Queue } from "bullmq";

export type Queues = {
  nodeRunQueue: Queue;
};

export function createQueues(redisUrl: string): Queues {
  const connection = { url: redisUrl };
  return {
    nodeRunQueue: new Queue("node-run", { connection }),
  };
}

