const http = require('http');

// Notify the Brogue C server that a deployment has been deleted
function notifyCDeploymentDeletion(deploymentName) {
	console.log(`Notifying C server of deployment deletion: ${deploymentName}`);
	console.log('Game notificationClient sending POST request to localhost:8888/deployment-deletion');
	const data = JSON.stringify({
		deploymentName: deploymentName,
		action: 'deleted',
	});

	const options = {
		// Use the DNS name of the Kubernetes service
		hostname: 'localhost',
		port: 8888,
		path: '/deployment-deletion',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': data.length,
		},
	};

	const req = http.request(options, (res) => {
		console.log(`statusCode: ${res.statusCode}`);
		res.on('data', (d) => {
			process.stdout.write(d);
		});
	});

	req.on('error', (error) => {
		console.error(error);
	});

	req.write(data);
	req.end();
}

const deploymentName = process.argv[2]; // Get deployment name from command line argument

if (deploymentName) {
	notifyCDeploymentDeletion(deploymentName);
} else {
	console.log('Usage: node deleteDeployment.js <deploymentName>');
}
