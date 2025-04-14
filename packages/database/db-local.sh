#!/bin/bash

docker run --name postgres-local -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 --restart always -v postgres-data:/var/lib/postgresql/data supabase/postgres:15.8.1.024


# pgadmin web interface make sure to include the actual database host and port
docker run --name pgadmin-local -p 5050:80 -e PGADMIN_DEFAULT_EMAIL="user@domain.com" -e PGADMIN_DEFAULT_PASSWORD="admin" -v pgadmin-data:/var/lib/pgadmin --restart always -d dpage/pgadmin4:8.14
# cli mode
psql -U postgres
CREATE EXTENSION vector;
CREATE EXTENSION postgis;

