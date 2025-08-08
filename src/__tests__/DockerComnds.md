#Cómo correr las pruebas en local (recordatorio)

docker compose -f docker-compose.test.yml down -v --remove-orphans
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
docker compose -f docker-compose.test.yml down -v