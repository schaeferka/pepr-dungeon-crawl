const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault(); // Adjust based on your environment

async function createNamespace(name) {
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    const namespaceManifest = {
        metadata: {
            name: name,
        },
    };

    try {
        const response = await k8sApi.createNamespace(namespaceManifest);
        console.log(`Namespace created: ${name}`);
    } catch (err) {
        console.error(`Failed to create namespace ${name}:`, err.body.message);
    }
}

async function main() {
    const namespaces = ['monsties'];
    for (const name of namespaces) {
        await createNamespace(name);
    }
}

main();
