echo '*********************************************************'
echo '********************BUILDING IMAGE***********************'
echo '*********************************************************'
docker build -t meryjv00/angular_alpine:0.0.1 .

echo '*********************************************************'
echo '*******************STARTING CONTAINER********************'
echo '*********************************************************'
docker run -d --name PFG-Survivor -p 4200:4200 meryjv00/angular_alpine:0.0.1
# DESARROLLO
# -v $(pwd):/PFG-Survivor

echo '**********************************************************'
echo '********************APP READY*****************************'
echo '******************LOCALHOST:4200**************************'
echo '**********************************************************'

# Volver a reejecutar docker aparece este error: 'can't stat '/home/maria/Escritorio/PFG-Survivor/.config''
# Ejecutar:
# sudo rm -rf .config
# sudo rm -rf .npm
# sudo rm -rf node_modules
# Volver a lanzar init.sh
