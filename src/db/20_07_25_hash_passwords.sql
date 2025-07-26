CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE Users
SET password = crypt(password, gen_salt('bf', 10))
WHERE password !~ '^\\$2[aby]\\$';