-- Insertar roles
INSERT INTO Role (role) VALUES 
('admin'), ('sup'), ('maestro'), ('padre'), ('estudiante');

-- Insertar cursos
INSERT INTO Course (name, capacity, cost) VALUES 
('Canto', 1, 100.00),
('Piano', 1, 120.00),
('Estimulación Musical 1-2 años', 5, 180.00),
('Estimulación Musical 2-3 años', 5, 180.00),
('Estimulación Musical 4-5 años', 5, 180.00);

-- Insertar usuarios administradores y supervisores
INSERT INTO Users (name, last_name, phone, email, password, role_id) VALUES
('Admin', 'Principal', '+1234567890', 'admin@academia.com', 'admin123', 1),
('Supervisor', 'General', '+1234567891', 'sup@academia.com', 'sup123', 2);

-- Insertar maestros 
INSERT INTO Users (name, last_name, phone, email, password, role_id) VALUES
('Carlos', 'Gómez', '+1234567892', 'carlos@academia.com', 'maestro1', 3),
('Laura', 'Pérez', '+1234567893', 'laura@academia.com', 'maestro2', 3),
('Miguel', 'Rodríguez', '+1234567894', 'miguel@academia.com', 'maestro3', 3),
('Ana', 'Martínez', '+1234567895', 'ana@academia.com', 'maestro4', 3),
('Juan', 'López', '+5234567896', 'juan@academia.com', 'maestro5', 3),
('Sofía', 'Hernández', '+5234567897', 'sofia@academia.com', 'maestro6', 3),
('Pedro', 'García', '+5234567898', 'pedro@academia.com', 'maestro7', 3),
('María', 'Sánchez', '+5234567899', 'maria@academia.com', 'maestro8', 3);

-- Asignar cursos a maestros
INSERT INTO Teacher_course (teacher_id, course_id) VALUES
(3, 1), -- Carlos enseña Canto
(4, 2), -- Laura enseña Piano
(5, 3), -- Miguel enseña Estimulación 1-2
(6, 4), -- Ana enseña Estimulación 2-3
(7, 5), -- Juan enseña Estimulación 4-5
(8, 1), -- Sofía también enseña Canto
(9, 2), -- Pedro también enseña Piano
(10, 3); -- María también enseña Estimulación 1-2

-- Insertar padres y niños (estudiantes menores de 18)
-- Padres primero
INSERT INTO Users (name, last_name, phone, email, password, role_id) VALUES
('Roberto', 'Fernández', '+5234512345', 'roberto@email.com', 'padre1', 4),
('Lucía', 'Díaz', '+5234512346', 'lucia@email.com', 'padre2', 4),
('Jorge', 'Morales', '+5234512347', 'jorge@email.com', 'padre3', 4),
('Patricia', 'Castro', '+5234512348', 'patricia@email.com', 'padre4', 4),
('Fernando', 'Ortiz', '+5234512349', 'fernando@email.com', 'padre5', 4),
('Gabriela', 'Ruiz', '+5234512350', 'gabriela@email.com', 'padre6', 4),
('Ricardo', 'Vargas', '+5234512351', 'ricardo@email.com', 'padre7', 4),
('Alejandra', 'Mendoza', '+5234512352', 'alejandra@email.com', 'padre8', 4),
('Héctor', 'Guerrero', '+5234512353', 'hector@email.com', 'padre9', 4),
('Silvia', 'Ríos', '+5234512354', 'silvia@email.com', 'padre10', 4),
('Arturo', 'Navarro', '+5234512355', 'arturo@email.com', 'padre11', 4),
('Diana', 'Jiménez', '+5234512356', 'diana@email.com', 'padre12', 4),
('Oscar', 'Torres', '+5234512357', 'oscar@email.com', 'padre13', 4),
('Claudia', 'Mejía', '+5234512358', 'claudia@email.com', 'padre14', 4),
('Raúl', 'Cortés', '+5234512359', 'raul@email.com', 'padre15', 4),
('Verónica', 'Ortega', '+5234512360', 'veronica@email.com', 'padre16', 4),
('Francisco', 'Delgado', '+5234512361', 'francisco@email.com', 'padre17', 4),
('Isabel', 'Silva', '+5234512362', 'isabel@email.com', 'padre18', 4),
('Manuel', 'Santos', '+5234512363', 'manuel@email.com', 'padre19', 4),
('Carmen', 'Vega', '+5234512364', 'carmen@email.com', 'padre20', 4);

-- Niños (menores de 18)
INSERT INTO Child (name, birth_date) VALUES
('Sofía Fernández', '2020-05-15'),
('Diego Díaz', '2019-08-22'),
('Valentina Morales', '2021-02-10'),
('Mateo Castro', '2018-11-30'),
('Camila Ortiz', '2020-07-05'),
('Sebastián Ruiz', '2019-04-18'),
('Renata Vargas', '2021-01-25'),
('Daniel Mendoza', '2018-09-12'),
('Mariana Guerrero', '2020-03-08'),
('Emilio Ríos', '2019-06-20'),
('Valeria Navarro', '2021-07-14'),
('Javier Jiménez', '2018-12-03'),
('Regina Torres', '2020-09-27'),
('Andrés Mejía', '2019-10-11'),
('Adriana Cortés', '2021-04-05'),
('Leonardo Ortega', '2018-05-19'),
('Paulina Delgado', '2020-11-22'),
('Eduardo Silva', '2019-03-15'),
('Ana Santos', '2021-08-08'),
('David Vega', '2018-07-01'),
('Alejandro Pérez', '2017-06-10'), -- 6 años
('Carolina López', '2016-09-15'), -- 7 años
('Federico García', '2015-12-20'), -- 8 años
('Lucía Martínez', '2014-03-25'), -- 9 años
('Julián Rodríguez', '2013-08-30'), -- 10 años
('María Sánchez', '2012-11-05'), -- 11 años
('Carlos Ramírez', '2011-04-12'), -- 12 años
('Isabel González', '2010-07-18'), -- 13 años
('Pedro Hernández', '2009-10-22'), -- 14 años
('Sara Díaz', '2008-01-28'); -- 15 años

-- Insertar estudiantes adultos (mayores de 18)
-- Primero insertarlos como usuarios con rol estudiante
INSERT INTO Users (name, last_name, phone, email, password, role_id) VALUES
('Andrea', 'Gómez', '+5234523456', 'andrea@email.com', 'estudiante123', 5),
('Luis', 'Moreno', '+5234523457', 'luis@email.com', 'estudiante123', 5),
('Vanessa', 'Pacheco', '+5234523458', 'vanessa@email.com', 'estudiante123', 5),
('Roberto', 'Campos', '+5234523459', 'robertoc@email.com', 'estudiante123', 5),
('Natalia', 'Fuentes', '+5234523460', 'natalia@email.com', 'estudiante123', 5),
('Gerardo', 'Miranda', '+5234523461', 'gerardo@email.com', 'estudiante123', 5),
('Daniela', 'Reyes', '+5234523462', 'daniela@email.com', 'estudiante123', 5),
('José', 'Aguilar', '+5234523463', 'josea@email.com', 'estudiante123', 5),
('Mariana', 'Flores', '+5234523464', 'marianaf@email.com', 'estudiante123', 5),
('Ricardo', 'Benítez', '+5234523465', 'ricardob@email.com', 'estudiante123', 5),
('Patricia', 'Medina', '+5234523466', 'patriciam@email.com', 'estudiante123', 5),
('Fernando', 'Herrera', '+5234523467', 'fernandoh@email.com', 'estudiante123', 5),
('Gabriela', 'Cárdenas', '+5234523468', 'gabrielac@email.com', 'estudiante123', 5),
('Arturo', 'Juárez', '+5234523469', 'arturoj@email.com', 'estudiante123', 5),
('Claudia', 'Núñez', '+5234523470', 'claudian@email.com', 'estudiante123', 5),
('Raúl', 'Espinoza', '+5234523471', 'raule@email.com', 'estudiante123', 5),
('Verónica', 'Molina', '+5234523472', 'veronicam@email.com', 'estudiante123', 5),
('Francisco', 'Salazar', '+5234523473', 'franciscos@email.com', 'estudiante123', 5),
('Isabel', 'Romero', '+5234523474', 'isabelr@email.com', 'estudiante123', 5),
('Manuel', 'Acosta', '+5234523475', 'manuela@email.com', 'estudiante123', 5);

-- Insertar adultos como "niños" (para el modelo de datos)
INSERT INTO Child (name, birth_date) VALUES
('Andrea Gómez', '1995-03-10'),
('Luis Moreno', '1990-07-22'),
('Vanessa Pacheco', '1993-11-15'),
('Roberto Campos', '1988-05-30'),
('Natalia Fuentes', '1992-09-18'),
('Gerardo Miranda', '1985-12-05'),
('Daniela Reyes', '1994-02-28'),
('José Aguilar', '1991-06-12'),
('Mariana Flores', '1989-10-20'),
('Ricardo Benítez', '1996-04-03'),
('Patricia Medina', '1987-08-25'),
('Fernando Herrera', '1993-01-14'),
('Gabriela Cárdenas', '1990-07-07'),
('Arturo Juárez', '1984-11-30'),
('Claudia Núñez', '1995-05-22'),
('Raúl Espinoza', '1992-09-08'),
('Verónica Molina', '1989-03-17'),
('Francisco Salazar', '1991-12-10'),
('Isabel Romero', '1994-06-05'),
('Manuel Acosta', '1986-10-15');

-- Insertar direcciones
INSERT INTO Address (name, unit_number, street_number, address, city, region, zone, aditional_info) VALUES
('Casa Principal', 'A1', '123', 'Calle Primavera', 'Ciudad', 'Centro', 'Norte', 'Casa blanca con portón negro'),
('Departamento', '302', '456', 'Avenida Libertad', 'Ciudad', 'Sur', 'Este', 'Edificio Azul'),
('Casa Familiar', 'B2', '789', 'Calle Roble', 'Ciudad', 'Norte', 'Oeste', 'Esquina con Calle Pino'),
('Casa Abuelos', 'C3', '101', 'Boulevard Central', 'Ciudad', 'Este', 'Sur', 'Frente al parque'),
('Departamento Estudio', '501', '202', 'Calle Luna', 'Ciudad', 'Oeste', 'Centro', 'Departamento 501'),
('Casa Roberto', 'D4', '303', 'Avenida Sol', 'Ciudad', 'Centro', 'Norte', 'Casa de dos pisos'),
('Departamento Lucía', '105', '404', 'Calle Estrella', 'Ciudad', 'Sur', 'Este', 'Segundo piso'),
('Casa Jorge', 'E5', '505', 'Boulevard Norte', 'Ciudad', 'Norte', 'Oeste', 'Jardín grande'),
('Casa Patricia', 'F6', '606', 'Avenida Sur', 'Ciudad', 'Este', 'Sur', 'Cerca del centro comercial'),
('Departamento Fernando', '207', '707', 'Calle Río', 'Ciudad', 'Oeste', 'Centro', 'Vista al río'),
('Casa Gabriela', 'G7', '808', 'Avenida Parque', 'Ciudad', 'Centro', 'Norte', 'Frente al parque central'),
('Departamento Ricardo', '308', '909', 'Calle Montaña', 'Ciudad', 'Sur', 'Este', 'Terraza en azotea'),
('Casa Alejandra', 'H8', '1010', 'Boulevard Este', 'Ciudad', 'Norte', 'Oeste', 'Casa amarilla'),
('Departamento Héctor', '409', '1111', 'Avenida Oeste', 'Ciudad', 'Este', 'Sur', 'Departamento amueblado'),
('Casa Silvia', 'I9', '1212', 'Calle Jardín', 'Ciudad', 'Oeste', 'Centro', 'Con jardín interior'),
('Departamento Arturo', '510', '1313', 'Avenida Central', 'Ciudad', 'Centro', 'Norte', 'Penthouse'),
('Casa Diana', 'J10', '1414', 'Boulevard Sur', 'Ciudad', 'Sur', 'Este', 'Casa moderna'),
('Departamento Oscar', '611', '1515', 'Calle Bosque', 'Ciudad', 'Norte', 'Oeste', 'Cerca del bosque'),
('Casa Claudia', 'K11', '1616', 'Avenida Norte', 'Ciudad', 'Este', 'Sur', 'Casa colonial'),
('Departamento Raúl', '712', '1717', 'Boulevard Oeste', 'Ciudad', 'Oeste', 'Centro', 'Con gimnasio'),
('Casa Verónica', 'L12', '1818', 'Calle Fuente', 'Ciudad', 'Centro', 'Norte', 'Fuente en el jardín'),
('Departamento Francisco', '813', '1919', 'Avenida Jardines', 'Ciudad', 'Sur', 'Este', 'Vista panorámica'),
('Casa Isabel', 'M13', '2020', 'Boulevard Parque', 'Ciudad', 'Norte', 'Oeste', 'Cerca del parque infantil'),
('Departamento Manuel', '914', '2121', 'Calle Arcoíris', 'Ciudad', 'Este', 'Sur', 'Departamento luminoso'),
('Casa Carmen', 'N14', '2222', 'Avenida Flores', 'Ciudad', 'Oeste', 'Centro', 'Jardín con flores'),
('Casa Andrea', 'O15', '2323', 'Boulevard Luna', 'Ciudad', 'Centro', 'Norte', 'Casa minimalista'),
('Departamento Luis', '1015', '2424', 'Calle Sol', 'Ciudad', 'Sur', 'Este', 'Estudio profesional'),
('Casa Vanessa', 'P16', '2525', 'Avenida Estrellas', 'Ciudad', 'Norte', 'Oeste', 'Terraza con vista'),
('Departamento Roberto', '1116', '2626', 'Boulevard Río', 'Ciudad', 'Este', 'Sur', 'Cerca del malecón'),
('Casa Natalia', 'Q17', '2727', 'Calle Montañas', 'Ciudad', 'Oeste', 'Centro', 'Vista a las montañas');

-- Asignar direcciones a niños
INSERT INTO Child_address (address_id, child_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5),
(6, 6), (7, 7), (8, 8), (9, 9), (10, 10),
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15),
(16, 16), (17, 17), (18, 18), (19, 19), (20, 20),
(21, 21), (22, 22), (23, 23), (24, 24), (25, 25),
(26, 26), (27, 27), (28, 28), (29, 29), (30, 30),
(26, 31), (27, 32), (28, 33), (29, 34), (30, 35),
(1, 36), (2, 37), (3, 38), (4, 39), (5, 40),
(6, 41), (7, 42), (8, 43), (9, 44), (10, 45),
(11, 46), (12, 47), (13, 48), (14, 49), (15, 50);

-- Insertar estudiantes (menores de 18 con padres)
INSERT INTO Student (child_id, parent_id, register_date, state) VALUES
(1, 11, '2025-01-10', true), -- Sofía Fernández, padre Roberto
(2, 12, '2025-01-15', true), -- Diego Díaz, padre Lucía
(3, 13, '2025-02-05', true), -- Valentina Morales, padre Jorge
(4, 14, '2025-02-10', true), -- Mateo Castro, padre Patricia
(5, 15, '2025-02-15', true), -- Camila Ortiz, padre Fernando
(6, 16, '2025-03-01', true), -- Sebastián Ruiz, padre Gabriela
(7, 17, '2025-03-05', true), -- Renata Vargas, padre Ricardo
(8, 18, '2025-03-10', true), -- Daniel Mendoza, padre Alejandra
(9, 19, '2025-03-15', true), -- Mariana Guerrero, padre Héctor
(10, 20, '2025-04-01', true), -- Emilio Ríos, padre Silvia
(11, 21, '2025-04-05', true), -- Valeria Navarro, padre Arturo
(12, 22, '2025-04-10', true), -- Javier Jiménez, padre Diana
(13, 23, '2025-04-15', true), -- Regina Torres, padre Oscar
(14, 24, '2025-05-01', true), -- Andrés Mejía, padre Claudia
(15, 25, '2025-05-05', true), -- Adriana Cortés, padre Raúl
(16, 26, '2025-05-10', true), -- Leonardo Ortega, padre Verónica
(17, 27, '2025-05-15', true), -- Paulina Delgado, padre Francisco
(18, 28, '2025-06-01', true), -- Eduardo Silva, padre Isabel
(19, 29, '2025-06-05', true), -- Ana Santos, padre Manuel
(20, 30, '2025-06-10', true), -- David Vega, padre Carmen
(21, 11, '2025-06-15', true), -- Alejandro Pérez, padre Roberto (mismo padre que Sofía)
(22, 12, '2025-07-01', true), -- Carolina López, padre Lucía (mismo padre que Diego)
(23, 13, '2025-07-05', true), -- Federico García, padre Jorge (mismo padre que Valentina)
(24, 14, '2025-07-10', true), -- Lucía Martínez, padre Patricia (mismo padre que Mateo)
(25, 15, '2025-07-15', true); -- Julián Rodríguez, padre Fernando (mismo padre que Camila)

-- Insertar estudiantes adultos (mayores de 18, se asignan a sí mismos como padres)
INSERT INTO Student (child_id, parent_id, register_date, state) VALUES
(31, 31, '2025-01-05', true), -- Andrea Gómez
(32, 32, '2025-01-08', true), -- Luis Moreno
(33, 33, '2025-01-12', true), -- Vanessa Pacheco
(34, 34, '2025-01-18', true), -- Roberto Campos
(35, 35, '2025-01-22', true), -- Natalia Fuentes
(36, 36, '2025-01-25', true), -- Gerardo Miranda
(37, 37, '2025-01-28', true), -- Daniela Reyes
(38, 38, '2025-02-02', true), -- José Aguilar
(39, 39, '2025-02-08', true), -- Mariana Flores
(40, 40, '2025-02-12', true), -- Ricardo Benítez
(41, 41, '2025-02-18', true), -- Patricia Medina
(42, 42, '2025-02-22', true), -- Fernando Herrera
(43, 43, '2025-02-25', true), -- Gabriela Cárdenas
(44, 44, '2025-03-02', true), -- Arturo Juárez
(45, 45, '2025-03-08', true), -- Claudia Núñez
(46, 46, '2025-03-12', true), -- Raúl Espinoza
(47, 47, '2025-03-18', true), -- Verónica Molina
(48, 48, '2025-03-22', true), -- Francisco Salazar
(49, 49, '2025-03-25', true), -- Isabel Romero
(50, 50, '2025-03-28', true); -- Manuel Acosta

-- Asignar padre como estudiante de la academia
INSERT INTO Child (name, birth_date) VALUES
('Roberto Fernández', '1980-02-03');

INSERT INTO Student (child_id, parent_id, register_date, state) VALUES
(51, 11, '2025-03-18', true); -- Roberto Fernández (padre de Sofía)

INSERT INTO Student_course (student_id, course_id, modality, language, registered_at) VALUES
(46, 1, 'Presencial', 'Ingles', '2025-07-18'); -- Roberto Fernández inscrito en Canto


-- Inscribir estudiantes en cursos
-- Niños en estimulación musical según edad
INSERT INTO Student_course (student_id, course_id, modality, language, registered_at) VALUES
-- Estimulación 1-2 años (niños nacidos en 2021-2022)
(3, 3, 'Presencial', 'Español', '2025-02-05'), -- Valentina (2021)
(7, 3, 'Presencial', 'Español', '2025-03-05'), -- Renata (2021)
(11, 3, 'Presencial', 'Español', '2025-04-05'), -- Valeria (2021)
(15, 3, 'Presencial', 'Español', '2025-05-05'), -- Adriana (2021)
(19, 3, 'Presencial', 'Español', '2025-06-05'), -- Ana (2021)

-- Estimulación 2-3 años (niños nacidos en 2020)
(1, 4, 'Presencial', 'Español', '2025-01-10'), -- Sofía (2020)
(5, 4, 'Presencial', 'Español', '2025-02-15'), -- Camila (2020)
(9, 4, 'Presencial', 'Español', '2025-03-15'), -- Mariana (2020)
(13, 4, 'Presencial', 'Español', '2025-04-15'), -- Regina (2020)
(17, 4, 'Presencial', 'Español', '2025-05-15'), -- Paulina (2020)

-- Estimulación 4-5 años (niños nacidos en 2018-2019)
(4, 5, 'Presencial', 'Español', '2025-02-10'), -- Mateo (2018)
(8, 5, 'Presencial', 'Español', '2025-03-10'), -- Daniel (2018)
(12, 5, 'Presencial', 'Español', '2025-04-10'), -- Javier (2018)
(16, 5, 'Presencial', 'Español', '2025-05-10'), -- Leonardo (2018)
(20, 5, 'Presencial', 'Español', '2025-06-10'), -- David (2018)

-- Niños mayores en piano o canto
(21, 2, 'Presencial', 'Español', '2025-06-15'), -- Alejandro (6) Piano
(22, 1, 'Presencial', 'Español', '2025-07-01'), -- Carolina (7) Canto
(23, 2, 'Presencial', 'Español', '2025-07-05'), -- Federico (8) Piano
(24, 1, 'Presencial', 'Español', '2025-07-10'), -- Lucía (9) Canto
(25, 2, 'Presencial', 'Español', '2025-07-15'), -- Julián (10) Piano

-- Adultos en canto o piano
(26, 1, 'Presencial', 'Español', '2025-01-05'), -- Andrea Canto
(27, 2, 'Presencial', 'Español', '2025-01-08'), -- Luis Piano
(28, 1, 'Presencial', 'Inglés', '2025-01-12'), -- Vanessa Canto inglés
(29, 2, 'Presencial', 'Español', '2025-01-18'), -- Roberto Piano
(30, 1, 'Presencial', 'Inglés', '2025-01-22'), -- Natalia Canto inglés
(31, 2, 'Presencial', 'Español', '2025-01-25'), -- Gerardo Piano
(32, 1, 'Presencial', 'Español', '2025-01-28'), -- Daniela Canto
(33, 2, 'Presencial', 'Inglés', '2025-02-02'), -- José Piano inglés
(34, 1, 'Presencial', 'Español', '2025-02-08'), -- Mariana Canto
(35, 2, 'Presencial', 'Español', '2025-02-12'), -- Ricardo Piano
(36, 1, 'Presencial', 'Inglés', '2025-02-18'), -- Patricia Canto inglés
(37, 2, 'Presencial', 'Español', '2025-02-22'), -- Fernando Piano
(38, 1, 'Presencial', 'Español', '2025-02-25'), -- Gabriela Canto
(39, 2, 'Presencial', 'Inglés', '2025-03-02'), -- Arturo Piano inglés
(40, 1, 'Presencial', 'Español', '2025-03-08'), -- Claudia Canto
(41, 2, 'Presencial', 'Español', '2025-03-12'), -- Raúl Piano
(42, 1, 'Presencial', 'Inglés', '2025-03-18'), -- Verónica Canto inglés
(43, 2, 'Presencial', 'Español', '2025-03-22'), -- Francisco Piano
(44, 1, 'Presencial', 'Español', '2025-03-25'), -- Isabel Canto
(45, 2, 'Presencial', 'Inglés', '2025-03-28'); -- Manuel Piano inglés