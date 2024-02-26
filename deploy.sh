#!/bin/bash

# Ensure the script exits if any command fails
set -e

kubectl apply -f pepr-dungeon-master/pepr/dist/pepr-module-3045671d-b4a8-5613-a6ae-9a508a229bdd.yaml
echo "Waiting for the pepr deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s -n pepr-system deployment/pepr-3045671d-b4a8-5613-a6ae-9a508a229bdd

# Apply the namespaces
kubectl apply -f pepr-dungeon-master/manifests/pepr-dungeon-crawl-namespace.yaml
kubectl apply -f pepr-dungeon-master/manifests/monsties-namespace.yaml

# Wait for namespaces to be created
echo "Waiting for namespaces to be created..."
while ! [ "$(kubectl get ns pepr-dungeon-crawl -o jsonpath='{.status.phase}')" == "Active" ]; do echo 'Waiting for namespace pepr-dungeon-crawl to come online. CTRL-C to exit.'; sleep 1; done
while ! [ "$(kubectl get ns monsties -o jsonpath='{.status.phase}')" == "Active" ]; do echo 'Waiting for namespace monsties to come online. CTRL-C to exit.'; sleep 1; done

# Deploy the application service account, cluster role, and cluster role binding
kubectl apply -f pepr-dungeon-master/manifests/monsties-serviceaccount.yaml
kubectl apply -f pepr-dungeon-master/manifests/monsties-clusterrole.yaml
kubectl apply -f pepr-dungeon-master/manifests/monsties-clusterrolebinding.yaml

kubectl apply -f pepr-dungeon-master/manifests/brogue-clusterrole.yaml
kubectl apply -f pepr-dungeon-master/manifests/brogue-clusterrolebinding.yaml
kubectl apply -f pepr-dungeon-master/manifests/brogue-service.yaml

kubectl apply -f pepr-dungeon-master/manifests/notification-service.yaml

# Wait for application service account, cluster role, and cluster role binding to be created
echo "Waiting for application service account, cluster role, and cluster role binding to be created..."

# Deploy the application
kubectl apply -f pepr-dungeon-master/manifests/pepr-dungeon-crawl-deployment.yaml

# Wait for the deployment to be ready
echo "Waiting for the game deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s -n pepr-dungeon-crawl deployment/brogue-game

# Create the VNC service
kubectl apply -f pepr-dungeon-master/manifests/vnc-service.yaml

# Wait for the VNC service endpoint to be ready
echo "Checking for service readiness..."
while ! kubectl get endpoints brogue-vnc -n pepr-dungeon-crawl | grep -q ':5900'; do
  echo "Waiting for the VNC service endpoint to be ready..."
  sleep 10
done

# Forward the VNC port (adjust according to your local setup if necessary)
kubectl port-forward service/brogue-vnc 5900:5900 -n pepr-dungeon-crawl &

echo "All resources have been deployed and are ready."