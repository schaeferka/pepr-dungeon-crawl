const express = require('express');
const http = require('http'); // Ensure the http module is required at the top
const app = express();
app.use(express.json()); // For parsing application/json

// Function you want to expose
const deleteCreature = (creatureName) => {
    console.log(`+++++++++ GOT ONE +++++++++`);
    console.log(`Deleting creature: ${creatureName}`);

    // Implementation of creature deletion...
    console.log(`Notifying C server of deployment deletion: ${creatureName}`);
    console.log(
        'Game notificationClient sending POST request to localhost:8888/deployment-deletion'
    );
    const data = JSON.stringify({
        deploymentName: creatureName, // Use creatureName instead of deploymentName
        action: 'deleted',
    });

	const options = {
		hostname: 'game-service.pepr-dungeon-crawl.svc.cluster.local', // Updated to use the internal DNS name
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
};

// Expose the deleteCreature function via an HTTP POST request
app.post('/deleteCreature', (req, res) => {
    console.log(`+++++++++ /deleteCreature +++++++++`);
    console.log(`req.body: ${JSON.stringify(req.body)}`); // Corrected to properly log the body object
    const { creatureName } = req.body;
    console.log(`creatureName: ${creatureName}`);
    deleteCreature(creatureName);
    res.json({ message: `Creature ${creatureName} deleted successfully` });
});

const PORT = 8889;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
