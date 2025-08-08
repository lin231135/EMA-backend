-- 99_data.sql  |  Datos de ejemplo/roles
INSERT INTO "User"(name,last_name,email,phone,password,role,is_active)
VALUES
('Admin','Root','admin@ema.test','+50200000000','$2a$10$hash', 'admin', TRUE)
ON CONFLICT DO NOTHING;
