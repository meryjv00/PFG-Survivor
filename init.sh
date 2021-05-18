echo '*********************************************************'
echo '*******************STARTING CONTAINERS*******************'
echo '*********************************************************'
docker-compose down
docker-compose build
docker-compose up -d


echo '**********************************************************'
echo '********************APP READY*****************************'
echo '*******************LOCALHOST:4200*************************'
echo '**********************************************************'

# En caso de error: error checking context: 'can't stat '/home/maria/Escritorio/frontmaria/.config''.
# Ejecutar:
# sudo rm -rf .config
# sudo rm -rf .npm
# sudo rm -rf node_modules
# Volver a lanzar init.sh
