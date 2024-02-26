const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault(); // Adjust based on your environment

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteNamespace(name) {
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

    try {
        // Specify deletion options
        const deleteOptions = {
            gracePeriodSeconds: 0, // Optional: Set to 0 for immediate deletion
            propagationPolicy: 'Background', // Ensures all dependents are deleted
        };

        // Start the deletion process
        await k8sApi.deleteNamespace(name, undefined, undefined, undefined, undefined, deleteOptions);
        //console.log(`Deletion of namespace ${name} initiated.`);

        // Poll for namespace status until it is deleted
        let exists = true;
        do {
            try {
                await k8sApi.readNamespace(name);
                //console.log(`Waiting for namespace ${name} to be deleted...`);
                await delay(500); // Wait before checking again
            } catch (err) {
                // If the namespace is not found, it has been deleted
                if (err.response.statusCode === 404) {
                    exists = false;
                    console.log(`Namespace ${name} deleted.`);
                } else {
                    // Handle other errors
                    throw err;
                }
            }
        } while (exists);

    } catch (err) {
        console.error(`Failed to delete namespace ${name}:`, err.body.message);
    }
}

async function main() {
    const namespaces = ['monsties'];
    for (const name of namespaces) {
        await deleteNamespace(name);
    }
}

main();
