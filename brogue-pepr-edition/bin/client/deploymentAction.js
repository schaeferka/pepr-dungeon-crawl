const k8s = require('@kubernetes/client-node');
const process = require('process');

async function createDeployment(monsterId, monsterType, monsterDepth) {
    // Replace spaces with dashes in monsterType
    const formattedMonsterType = monsterType.replace(/ /g, "-");

    const deploymentNamespace = "monsties";

    // Use formattedMonsterType in the deploymentName
    const deploymentName = `${formattedMonsterType}-${monsterId}`;
    // const deploymentName = `${formattedMonsterType}`
    const numReplicas = parseInt(monsterDepth, 10); // The 10 is the radix parameter for base-10 numbers


    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);

    const deploymentManifest = {
      metadata: {
          name: deploymentName,
          labels: {
            app: deploymentName,
            monsterId: monsterId,
            monsterType: formattedMonsterType,
            spawnDepth: monsterDepth,
            deleteType: 'dungeon-master'
          }
      },
      spec: {
          replicas: 30,
          selector: {
              matchLabels: {
                  app: deploymentName // Ensure this matches the label of the pod template
              }
          },
          template: {
              metadata: {
                  labels: {
                      app: deploymentName,
                      monsterId: monsterId,
                      monsterType: formattedMonsterType,
                      spawnDepth: monsterDepth,
                      deleteType: 'admin'
                  }
              },
              spec: {
                  containers: [{
                      name: deploymentName,
                      image: 'nginx',
                      ports: [{ containerPort: 80 }]
                  }],
                  restartPolicy: 'Always'
              }
          }
      }
    };

    //console.log(`Trying to create deployment: ${deploymentManifest.metadata.name} with depth: ${monsterDepth}`);
    try {
      const { body } = await k8sAppsV1Api.createNamespacedDeployment(deploymentNamespace, deploymentManifest);
      // console.log(`Deployment created: ${deploymentManifest.metadata.name}`);
    } catch (error) {
      // console.error('Error creating deployment:', error.body.message);
      process.exit(1); // Exit with error code
    }
  }

  async function deleteDeployment(monsterId, monsterType) {
      const deploymentNamespace = "monsties";

      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);

      // Replace spaces with underscores in monsterType
      const formattedMonsterType = monsterType.replace(/ /g, "-");
      const deploymentName = `${formattedMonsterType}-${monsterId}`;
      //const deploymentName = `${formattedMonsterType}`;
      // console.log(`Deployment deleting: ${deploymentName}`);

      try {
          // First, get the current deployment
          const getResp = await k8sAppsV1Api.readNamespacedDeployment(deploymentName, deploymentNamespace);
          const deployment = getResp.body;

          // Add or update the label
          deployment.metadata.labels = deployment.metadata.labels || {};
          deployment.metadata.labels['deleteType'] = 'killed';

          // Update the deployment with the new label
          await k8sAppsV1Api.replaceNamespacedDeployment(deploymentName, deploymentNamespace, deployment);
          console.log(`Label added - creature killed in combat: ${deploymentName}`);
          console.log(`Deployment deleting... ${deploymentName}`);
          // Proceed to delete the deployment
          const delResp = await k8sAppsV1Api.deleteNamespacedDeployment(deploymentName, deploymentNamespace, undefined, {
              propagationPolicy: 'Foreground', // Ensure that all the Pods managed by the Deployment are also deleted
          });
          // console.log(`Deployment deleted: ${deploymentName}`);
      } catch (error) {
          // console.error('Error:', error.body ? error.body.message : error);
          process.exit(1); // Exit with error code
      }
  }

const [,, monsterId, monsterType, actionType, monsterDepth] = process.argv;

//console.log(`Received pod action request. MonsterId: ${monsterId} MonsterType: ${monsterType.replace(/ /g, "-")} ActionType: ${actionType} MonsterDepth: ${monsterDepth}`);

if (!monsterId || !monsterType || !actionType || !monsterDepth) {
    console.log("Usage: node podAction.js <monsterId> <monsterType> <actionType> <monsterDepth>");
    process.exit(1);
} else {
  switch(actionType) {
    case "create":
      createDeployment(monsterId, monsterType, monsterDepth);
      break;
    case "delete":
      deleteDeployment(monsterId, monsterType);
      break;
    default:
      console.log(`Unknown action type: ${actionType}`);
      process.exit(1);
  }
}
