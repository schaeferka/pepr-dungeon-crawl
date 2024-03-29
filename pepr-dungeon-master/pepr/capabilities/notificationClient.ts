import axios from "axios";
import { Log } from "pepr";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Notify the Brogue C server that a deployment has been deleted
export async function notifyDeletion(
  deploymentName: string,
  deleteType: string,
): Promise<void> {
  Log.info(
    `********** Notification client is notifying Brogue server of deployment deletion: ${deploymentName} **********`,
  );
  const data = {
    creatureName: deploymentName,
    action: deleteType,
  };

  Log.info(
    `***********Data to send: ${JSON.stringify(data)} *******************`,
  );

  // Updated to use the Kubernetes DNS name of the Traefik service
  const notificationServiceUrl =
    "http://notification-service.pepr-dungeon-crawl.svc.cluster.local:8889/deleteCreature";

  await sleep(5000);

  try {
    Log.info(`Sending notification to: ${notificationServiceUrl}`);
    const response = await axios.post(notificationServiceUrl, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    Log.info(
      `Response data from axios request: ${JSON.stringify(response.data)}`,
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // This means the error is an Axios error
      if (error.response) {
        // The server responded with a status code that falls out of the range of 2xx
        Log.info(
          `Error response from axios request: ${JSON.stringify(
            error.response.data,
          )}`,
        );
        Log.info(`Status code: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        Log.info(`The request was made but no response was received`);
      } else {
        // Something happened in setting up the request that triggered an Error
        Log.info(`Error message: ${error.message}`);
      }
    } else {
      // The error is not an Axios error
      Log.info(`Unexpected error: ${error}`);
    }
  }
}

// Assuming you have a mechanism to call this function with the deploymentName
// For example, using process.argv as in the original script:
export async function cliNotificationClient(): Promise<void> {
  const deploymentName: string = process.argv[2]; // Get deployment name from command line argument
  const deleteType: string = process.argv[3]; // This is the action to send to the Brogue server

  if (deploymentName) {
    await notifyDeletion(deploymentName, deleteType);
  } else {
    Log.info(
      `Usage: ts-node notificationClient.ts <deploymentName> <deleteType>`,
    );
  }
}
