\getenv orders_runtime_password ORDERS_RUNTIME_PASSWORD
\getenv orders_migrator_password ORDERS_MIGRATOR_PASSWORD

CREATE ROLE orders_runtime LOGIN PASSWORD :'orders_runtime_password';
CREATE ROLE orders_migrator LOGIN PASSWORD :'orders_migrator_password';

GRANT CONNECT ON DATABASE orders TO orders_runtime, orders_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO orders_migrator;
ALTER DEFAULT PRIVILEGES FOR ROLE orders_migrator IN SCHEMA public
    GRANT SELECT, INSERT ON TABLES TO orders_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE orders_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO orders_runtime;

CREATE DATABASE orders_test;
GRANT CONNECT ON DATABASE orders_test TO orders_runtime, orders_migrator;
\connect orders_test
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO orders_migrator;
ALTER DEFAULT PRIVILEGES FOR ROLE orders_migrator IN SCHEMA public
    GRANT SELECT, INSERT ON TABLES TO orders_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE orders_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO orders_runtime;
