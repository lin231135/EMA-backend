-- Crear un usuario padre
INSERT INTO "User"(name, last_name, email, phone, password, role, is_active)
VALUES ('David', 'Chet', 'david@ema.com', '555-0000', crypt('test1234', gen_salt('bf', 12)) , 'padre', TRUE);

-- Crea hijos (tabla Kid)
INSERT INTO Kid(name, birth_date, parent_id)
VALUES 
  ('Daniel Chet', '2014-05-10', (SELECT id FROM "User" WHERE email='david@ema.com')),
  ('Sofía Chet', '2011-11-22', (SELECT id FROM "User" WHERE email='david@ema.com'));
