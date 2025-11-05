-- ============================================================================
-- data.sql | Ellie's Music Academy - Datos de prueba (100 registros por tabla)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ======================== USUARIOS (56 registros) =========================
-- Administradores, maestros, padres y estudiantes adultos
INSERT INTO "User" (name, last_name, email, phone, password, role, description, profile_image, is_active) VALUES

-- Super usuario
('Ellie', 'Delgado', 'sup@elliesmusic.com', '+502-1243-1546', crypt('Password1', gen_salt('bf', 12)), 'admin', null, null, true),

-- Administradores (5)
('María', 'García', 'admin1@elliesmusic.com', '+502-1245-4512', crypt('Password2', gen_salt('bf', 12)), 'admin', null, null, true),
('Carlos', 'López', 'admin2@elliesmusic.com', '+502-8978-4516', crypt('Password3', gen_salt('bf', 12)), 'admin', null, null, true),
('Ana', 'Rodríguez', 'admin3@elliesmusic.com', '+502-1459-2789', crypt('Password4', gen_salt('bf', 12)), 'admin', null, null, true),
('Pedro', 'Martínez', 'admin4@elliesmusic.com', '+502-1625-3978', crypt('Password5', gen_salt('bf', 12)), 'admin', null, null, true),
('Laura', 'Hernández', 'admin5@elliesmusic.com', '+502-1526-4253', crypt('Password6', gen_salt('bf', 12)), 'admin', null, null, true),

-- Maestros (20)
('Miguel', 'Ángel', 'miguel.angel@elliesmusic.com', '+52-55-1234-5683', crypt('Password7', gen_salt('bf', 12)), 'maestro', 'Pianista concertista con 15 años de experiencia', null, true),
('Sofía', 'Castillo', 'sofia.castillo@elliesmusic.com', '+52-55-1234-5684', crypt('Password8', gen_salt('bf', 12)), 'maestro', 'Guitarrista profesional, especialista en flamenco', null, true),
('Ricardo', 'Fernández', 'ricardo.fernandez@elliesmusic.com', '+52-55-1234-5685', crypt('Password9', gen_salt('bf', 12)), 'maestro', 'Violinista de orquesta sinfónica', null, true),
('Elena', 'Morales', 'elena.morales@elliesmusic.com', '+52-55-1234-5686', crypt('Password10', gen_salt('bf', 12)), 'maestro', 'Cantante lírica y profesora de técnica vocal', null, true),
('Javier', 'Ramírez', 'javier.ramirez@elliesmusic.com', '+52-55-1234-5687', crypt('Password11', gen_salt('bf', 12)), 'maestro', 'Baterista de jazz y rock', null, true),
('Carmen', 'Vega', 'carmen.vega@elliesmusic.com', '+52-55-1234-5688', crypt('Password12', gen_salt('bf', 12)), 'maestro', 'Cellista con maestría en música clásica', null, true),
('Diego', 'Santos', 'diego.santos@elliesmusic.com', '+52-55-1234-5689', crypt('Password13', gen_salt('bf', 12)), 'maestro', 'Saxofonista especialista en música contemporánea', null, true),
('Isabel', 'Cruz', 'isabel.cruz@elliesmusic.com', '+52-55-1234-5690', crypt('Password14', gen_salt('bf', 12)), 'maestro', 'Flautista con experiencia en orquestas', null, true),
('Fernando', 'Ortega', 'fernando.ortega@elliesmusic.com', '+52-55-1234-5691', crypt('Password15', gen_salt('bf', 12)), 'maestro', 'Trompetista y arreglista musical', null, true),
('Patricia', 'Reyes', 'patricia.reyes@elliesmusic.com', '+52-55-1234-5692', crypt('Password16', gen_salt('bf', 12)), 'maestro', 'Arpista y compositora', null, true),
('Roberto', 'Mendoza', 'roberto.mendoza@elliesmusic.com', '+52-55-1234-5693', crypt('Password17', gen_salt('bf', 12)), 'maestro', 'Bajista eléctrico especialista en funk', null, true),
('Adriana', 'Guerrero', 'adriana.guerrero@elliesmusic.com', '+52-55-1234-5694', crypt('Password18', gen_salt('bf', 12)), 'maestro', 'Pianista especialista en jazz', null, true),
('Oscar', 'Paredes', 'oscar.paredes@elliesmusic.com', '+52-55-1234-5695', crypt('Password19', gen_salt('bf', 12)), 'maestro', 'Guitarrista clásico', null, true),
('Gabriela', 'Silva', 'gabriela.silva@elliesmusic.com', '+52-55-1234-5696', crypt('Password20', gen_salt('bf', 12)), 'maestro', 'Violinista especialista en música tradicional', null, true),
('Héctor', 'Cervantes', 'hector.cervantes@elliesmusic.com', '+52-55-1234-5697', crypt('Password21', gen_salt('bf', 12)), 'maestro', 'Percusionista latino', null, true),
('Lucía', 'Moreno', 'lucia.moreno@elliesmusic.com', '+52-55-1234-5698', crypt('Password22', gen_salt('bf', 12)), 'maestro', 'Tecladista y productora musical', null, true),
('Raúl', 'Jiménez', 'raul.jimenez@elliesmusic.com', '+52-55-1234-5699', crypt('Password23', gen_salt('bf', 12)), 'maestro', 'Clarinetista de música clásica', null, true),
('Verónica', 'Navarro', 'veronica.navarro@elliesmusic.com', '+52-55-1234-5700', crypt('Password24', gen_salt('bf', 12)), 'maestro', 'Cantante de música popular', null, true),
('Antonio', 'Ríos', 'antonio.rios@elliesmusic.com', '+52-55-1234-5701', crypt('Password25', gen_salt('bf', 12)), 'maestro', 'Guitarrista eléctrico rock/metal', null, true),
('Daniela', 'Acosta', 'daniela.acosta@elliesmusic.com', '+52-55-1234-5702', crypt('Password26', gen_salt('bf', 12)), 'maestro', 'Pianista para niños y principiantes', null, true),

-- Padres/Estudiantes adultos (30) - Algunos también son estudiantes
-- ids del 27 al 56
('Juan', 'Pérez', 'juan.perez@gmail.com', '+52-55-2234-1001', crypt('Password27', gen_salt('bf', 12)), 'padre', NULL, null, true),
('María', 'González', 'maria.gonzalez@gmail.com', '+52-55-2234-1002', crypt('Password28', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Carlos', 'Díaz', 'carlos.diaz@gmail.com', '+52-55-2234-1003', crypt('Password29', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Ana', 'Torres', 'ana.torres@gmail.com', '+52-55-2234-1004', crypt('Password30', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Luis', 'Serrano', 'luis.serrano@gmail.com', '+52-55-2234-1005', crypt('Password31', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Elena', 'Romero', 'elena.romero@gmail.com', '+52-55-2234-1006', crypt('Password32', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Jorge', 'Alvarez', 'jorge.alvarez@gmail.com', '+52-55-2234-1007', crypt('Password33', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Sandra', 'Méndez', 'sandra.mendez@gmail.com', '+52-55-2234-1008', crypt('Password34', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Francisco', 'Castro', 'francisco.castro@gmail.com', '+52-55-2234-1009', crypt('Password35', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Gabriela', 'Ortiz', 'gabriela.ortiz@gmail.com', '+52-55-2234-1010', crypt('Password36', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Miguel', 'Ruiz', 'miguel.ruiz@gmail.com', '+52-55-2234-1011', crypt('Password37', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Patricia', 'Herrera', 'patricia.herrera@gmail.com', '+52-55-2234-1012', crypt('Password38', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Roberto', 'Flores', 'roberto.flores@gmail.com', '+52-55-2234-1013', crypt('Password39', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Claudia', 'Vargas', 'claudia.vargas@gmail.com', '+52-55-2234-1014', crypt('Password40', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Andrés', 'Rojas', 'andres.rojas@gmail.com', '+52-55-2234-1015', crypt('Password41', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Laura', 'Medina', 'laura.medina@gmail.com', '+52-55-2234-1016', crypt('Password42', gen_salt('bf', 12)), 'padre', NULL, null, true),
('José', 'Campos', 'jose.campos@gmail.com', '+52-55-2234-1017', crypt('Password43', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Diana', 'Soto', 'diana.soto@gmail.com', '+52-55-2234-1018', crypt('Password44', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Fernando', 'Contreras', 'fernando.contreras@gmail.com', '+52-55-2234-1019', crypt('Password45', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Alejandra', 'Lara', 'alejandra.lara@gmail.com', '+52-55-2234-1020', crypt('Password46', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Ricardo', 'Miranda', 'ricardo.miranda@gmail.com', '+52-55-2234-1021', crypt('Password47', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Silvia', 'Peña', 'silvia.pena@gmail.com', '+52-55-2234-1022', crypt('Password48', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Martín', 'Cortés', 'martin.cortes@gmail.com', '+52-55-2234-1023', crypt('Password49', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Verónica', 'Núñez', 'veronica.nunez@gmail.com', '+52-55-2234-1024', crypt('Password50', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Rodrigo', 'Salazar', 'rodrigo.salazar@gmail.com', '+52-55-2234-1025', crypt('Password51', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Paola', 'Delgado', 'paola.delgado@gmail.com', '+52-55-2234-1026', crypt('Password52', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Sergio', 'Molina', 'sergio.molina@gmail.com', '+52-55-2234-1027', crypt('Password53', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Daniela', 'Carrillo', 'daniela.carrillo@gmail.com', '+52-55-2234-1028', crypt('Password54', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Arturo', 'Rangel', 'arturo.rangel@gmail.com', '+52-55-2234-1029', crypt('Password55', gen_salt('bf', 12)), 'padre', NULL, null, true),
('Marisol', 'Barrera', 'marisol.barrera@gmail.com', '+52-55-2234-1030', crypt('Password56', gen_salt('bf', 12)), 'padre', NULL, null, true);

-- id del 57 al 65 Estudiantes adultos (9)
INSERT INTO "User" (name, last_name, email, phone, password, role, description, profile_image, is_active) VALUES
('Santiago', 'Luna', 'santiago.luna@gmail.com', '+52-55-2234-1031', crypt('Password57', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Valeria', 'Cano', 'valeria.cano@gmail.com', '+52-55-2234-1032', crypt('Password58', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Emiliano', 'Vega', 'emiliano.vega@gmail.com', '+52-55-2234-1033', crypt('Password59', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Camila', 'Rivas', 'camila.rivas@gmail.com', '+52-55-2234-1034', crypt('Password60', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Matías', 'Santos', 'matias.santos@gmail.com', '+52-55-2234-1035', crypt('Password61', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Renata', 'Fuentes', 'renata.fuentes@gmail.com', '+52-55-2234-1036', crypt('Password62', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Thiago', 'Mora', 'thiago.mora@gmail.com', '+52-55-2234-1037', crypt('Password63', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Isabella', 'Cárdenas', 'isabella.cardenas@gmail.com', '+52-55-2234-1038', crypt('Password64', gen_salt('bf', 12)), 'estudiante', NULL, null, true),
('Alejandro', 'Sierra', 'alejandro.sierra@gmail.com', '+52-55-2234-1039', crypt('Password65', gen_salt('bf', 12)), 'estudiante', NULL, null, true);

--NO BORRAR ESTOS INSERTS
-- INSERTS DE ESTUDIANTES ADULTOS QUE ESTUDIAN EN LA ACADEMIA
-- inserts de ellos mismos como hijos (9) -- 
insert into Kid (parent_id, name, birth_date) values
(57, 'Santiago Luna', '1995-05-20'),
(58, 'Valeria Cano', '1992-11-15'),
(59, 'Emiliano Vega', '1988-07-30'),
(60, 'Camila Rivas', '1990-03-25'),
(61, 'Matías Santos', '1993-09-10'),
(62, 'Renata Fuentes', '1994-12-05'),
(63, 'Thiago Mora', '1989-06-18'),
(64, 'Isabella Cárdenas', '1991-08-22'),
(65, 'Alejandro Sierra', '1996-04-14');

-- ======================== DIRECCIONES (100 registros) ======================
INSERT INTO Address (city, apartment, street_avenue, zone, house_number, neighborhood, municipality, is_primary) VALUES
-- Direcciones primarias para usuarios
('Ciudad de Guatemala', 'Apto 101', 'Av. Reforma 123', 'Zona 10', '45A', 'Col. Juárez', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Calle Insurgentes 456', 'Zona 10', '78', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 302', 'Paseo de la Reforma 789', 'Zona 9', '123', 'Col. Cuauhtémoc', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Chapultepec 321', 'Zona 13', '56', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 205', 'Calle Amsterdam 654', 'Zona 14', '89', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Coyoacán 987', 'Zona 15', '234', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 401', 'Calle Durango 147', 'Zona 10', '67', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Insurgentes Sur 258', 'Zona 16', '145', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 103', 'Calle Puebla 369', 'Zona 13', '278', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Oaxaca 741', 'Zona 11', '312', 'Col. Narvarte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 502', 'Calle Tonalá 852', 'Zona 10', '456', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Álvaro Obregón 963', 'Zona 10', '589', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 201', 'Calle Zacatecas 159', 'Zona 13', '623', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Veracruz 753', 'Zona 10', '745', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 304', 'Calle Tabasco 357', 'Zona 11', '867', 'Col. Narvarte', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Yucatán 951', 'Zona 15', '912', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 105', 'Calle Michoacán 258', 'Zona 13', '134', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Guerrero 654', 'Zona 10', '256', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 403', 'Calle Sinaloa 852', 'Zona 14', '378', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Sonora 147', 'Zona 10', '491', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 202', 'Calle Quintana Roo 369', 'Zona 15', '523', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Campeche 741', 'Zona 11', '645', 'Col. Narvarte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 305', 'Calle Morelos 852', 'Zona 13', '767', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Hidalgo 963', 'Zona 10', '889', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 106', 'Calle Durango 159', 'Zona 14', '912', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Insurgentes 753', 'Zona 10', '234', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 404', 'Calle Reforma 357', 'Zona 10', '345', 'Col. Juárez', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Chapultepec 951', 'Zona 13', '456', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 203', 'Calle Amsterdam 258', 'Zona 14', '567', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Coyoacán 654', 'Zona 15', '678', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 306', 'Calle Durango 852', 'Zona 10', '789', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Insurgentes Sur 147', 'Zona 16', '890', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 107', 'Calle Puebla 369', 'Zona 13', '901', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Oaxaca 741', 'Zona 11', '112', 'Col. Narvarte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 405', 'Calle Tonalá 852', 'Zona 10', '223', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Álvaro Obregón 963', 'Zona 10', '334', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 204', 'Calle Zacatecas 159', 'Zona 13', '445', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Veracruz 753', 'Zona 10', '556', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 307', 'Calle Tabasco 357', 'Zona 11', '667', 'Col. Narvarte', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Yucatán 951', 'Zona 15', '778', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 108', 'Calle Michoacán 258', 'Zona 13', '889', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Guerrero 654', 'Zona 10', '990', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 406', 'Calle Sinaloa 852', 'Zona 14', '101', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Sonora 147', 'Zona 10', '212', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 205', 'Calle Quintana Roo 369', 'Zona 15', '323', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Campeche 741', 'Zona 11', '434', 'Col. Narvarte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 308', 'Calle Morelos 852', 'Zona 13', '545', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Hidalgo 963', 'Zona 10', '656', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 109', 'Calle Durango 159', 'Zona 14', '767', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Insurgentes 753', 'Zona 10', '878', 'Col. Roma Norte', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 407', 'Calle Reforma 357', 'Zona 10', '989', 'Col. Juárez', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Chapultepec 951', 'Zona 13', '110', 'Col. Condesa', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 206', 'Calle Amsterdam 258', 'Zona 14', '221', 'Col. Hipódromo', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Coyoacán 654', 'Zona 15', '332', 'Col. Del Valle', 'Guatemala', true),
('Ciudad de Guatemala', 'Apto 309', 'Calle Durango 852', 'Zona 10', '443', 'Col. Roma Sur', 'Guatemala', true),
('Ciudad de Guatemala', NULL, 'Av. Insurgentes Sur 147', 'Zona 16', '554', 'Col. Del Valle', 'Guatemala', true),
-- Direcciones adicionales para completar 100 registros (secundarias)
('Ciudad de Guatemala', 'Apto B', 'Av. Las Américas 123', 'Zona 13', '665', 'Col. Las Américas', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Martí 456', 'Zona 11', '776', 'Col. La Florida', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 201', 'Av. Petapa 789', 'Zona 12', '887', 'Col. Petapa', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Montúfar 321', 'Zona 9', '998', 'Col. La Reformita', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 302', 'Av. San Juan 654', 'Zona 4', '109', 'Col. San Juan', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Real 987', 'Zona 1', '210', 'Col. Centro', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 403', 'Av. Elena 147', 'Zona 7', '321', 'Col. El Carmen', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Los Arcos 258', 'Zona 15', '432', 'Col. Los Arcos', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 104', 'Av. La Paz 369', 'Zona 10', '543', 'Col. La Paz', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Vista Hermosa 741', 'Zona 15', '654', 'Col. Vista Hermosa', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 205', 'Av. Las Flores 852', 'Zona 11', '765', 'Col. Las Flores', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Primavera 963', 'Zona 14', '876', 'Col. Primavera', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 306', 'Av. Los Pinos 159', 'Zona 13', '987', 'Col. Los Pinos', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle San José 753', 'Zona 8', '198', 'Col. San José', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 407', 'Av. Santa Clara 357', 'Zona 12', '297', 'Col. Santa Clara', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle La Aurora 951', 'Zona 13', '396', 'Col. La Aurora', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 108', 'Av. Bolívar 258', 'Zona 1', '495', 'Col. Centro', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Independencia 654', 'Zona 9', '594', 'Col. La Reformita', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 209', 'Av. Reforma 852', 'Zona 10', '693', 'Col. Reforma', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Montserrat 147', 'Zona 14', '792', 'Col. Montserrat', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 310', 'Av. Las Conchas 369', 'Zona 15', '891', 'Col. Las Conchas', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle El Roble 741', 'Zona 11', '990', 'Col. El Roble', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 411', 'Av. Los Álamos 852', 'Zona 13', '189', 'Col. Los Álamos', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle San Carlos 963', 'Zona 7', '288', 'Col. San Carlos', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 112', 'Av. Santa Cecilia 159', 'Zona 12', '387', 'Col. Santa Cecilia', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Los Olivos 753', 'Zona 14', '486', 'Col. Los Olivos', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 213', 'Av. Las Palmas 357', 'Zona 15', '585', 'Col. Las Palmas', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle San Rafael 951', 'Zona 10', '684', 'Col. San Rafael', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 314', 'Av. Los Laureles 258', 'Zona 13', '783', 'Col. Los Laureles', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle El Mirador 654', 'Zona 11', '882', 'Col. El Mirador', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 415', 'Av. Las Lomas 852', 'Zona 14', '981', 'Col. Las Lomas', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle San Francisco 147', 'Zona 9', '180', 'Col. San Francisco', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 116', 'Av. Santa Ana 369', 'Zona 12', '279', 'Col. Santa Ana', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Los Cedros 741', 'Zona 15', '378', 'Col. Los Cedros', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 217', 'Av. Las Acacias 852', 'Zona 10', '477', 'Col. Las Acacias', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle San Pedro 963', 'Zona 13', '576', 'Col. San Pedro', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 318', 'Av. Santa Isabel 159', 'Zona 11', '675', 'Col. Santa Isabel', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Los Sauces 753', 'Zona 14', '774', 'Col. Los Sauces', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 419', 'Av. Las Margaritas 357', 'Zona 15', '873', 'Col. Las Margaritas', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle San Lucas 951', 'Zona 9', '972', 'Col. San Lucas', 'Guatemala', false),
('Ciudad de Guatemala', 'Apto 120', 'Av. Los Claveles 258', 'Zona 12', '171', 'Col. Los Claveles', 'Guatemala', false),
('Ciudad de Guatemala', NULL, 'Calle Santa Rosa 654', 'Zona 10', '270', 'Col. Santa Rosa', 'Guatemala', false);

-- ======================== USER_ADDRESS (56 registros) ======================
INSERT INTO User_Address (user_id, address_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10),
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15), (16, 16), (17, 17), (18, 18), (19, 19), (20, 20),
(21, 21), (22, 22), (23, 23), (24, 24), (25, 25), (26, 26), (27, 27), (28, 28), (29, 29), (30, 30),
(31, 31), (32, 32), (33, 33), (34, 34), (35, 35), (36, 36), (37, 37), (38, 38), (39, 39), (40, 40),
(41, 41), (42, 42), (43, 43), (44, 44), (45, 45), (46, 46), (47, 47), (48, 48), (49, 49), (50, 50),
(51, 51), (52, 52), (53, 53), (54, 54), (55, 55), (56, 56);

-- ======================== NIÑOS (47 registros) ============================
INSERT INTO Kid (parent_id, name, birth_date, is_solvent) VALUES
-- Hijos de los padres (usuarios id 28-41)
(27, 'Santiago', '2020-05-20', true),
(28, 'Valeria', '2015-11-15', true),
(29, 'Emiliano', '2014-07-30', true),
(29, 'Camila', '2013-03-25', true),
(30, 'Matías', '2012-09-10', true),
(30, 'Renata', '2017-12-05', true),
(31, 'Thiago', '2016-06-18', true),
(31, 'Isabella', '2015-08-22', true),
(31, 'Alejandro', '2011-04-14', true),
(32, 'Diana', '2018-05-06', true),
(33, 'Diego', '2015-03-15', true),
(33, 'Valeria', '2018-07-22', true),
(33, 'Santiago', '2016-11-08', true),
(34, 'Renata', '2017-05-30', false),
(34, 'Mateo', '2014-12-14', true),
(35, 'Camila', '2019-09-25', true),
(35, 'Lucas', '2015-06-10', true),
(36, 'Emma', '2018-01-05', true),
(36, 'Martín', '2016-04-18', false),
(37, 'Sofía', '2017-08-29', true),
(37, 'Julián', '2014-10-12', true),
(38, 'Isabela', '2015-02-20', true),
(39, 'Alejandro', '2016-07-07', true),
(39, 'Lucía', '2019-03-03', true),
(39, 'Daniel', '2017-11-11', false),
(40, 'Valentina', '2018-06-22', true);





-- ======================== KID_ADDRESS (56 registros) ======================
INSERT INTO Kid_Address (kid_id, address_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 3),
(6, 3),
(7, 4),
(8, 4),
(9, 4),
(10, 5);

-- ======================== CURSOS (50 registros) ============================
INSERT INTO Course (name, modality, capacity, cost, is_active) VALUES
-- Cursos de piano
('Piano (Principiante)', 'academia', 1, 250.00, true),
('Canto (Principiante)', 'academia', 1, 250.00, true),
('Guitarra (Principiante)', 'academia', 3, 250.00, true),
('Piano (Avanzado)', 'academia', 2, 400.00, true),
('Canto (Avanzado)', 'academia', 2, 400.00, true),
('Guitarra (Avanzado)', 'academia', 5, 400.00, true),
('Estimulación Musical', 'academia', 1, 500.00, true);

-- ======================== CURSOS QUE IMPARTEN LOS MAESTROS (50 registros) ============================
-- id 7 al 26
-- Distribución en cursos 1..5 (coinciden con los usados en Schedule)
INSERT INTO Teacher_course (teacher_id, course_id) VALUES
(7, 1),
(7, 2),
(7, 3),
(7, 4),
(7, 5),
(7, 6),
(7, 7),
(8, 1),
(8, 2),
(8, 3),
(9, 4),
(9, 5),
(9, 6);

-- ======================== HORARIOS (100 registros) =========================
-- Generar horarios para los próximos 3 meses
INSERT INTO Schedule (course_id, teacher_id, schedule_date, start_time, end_time) VALUES
-- Horarios para la semana actual
(1, 7, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00'),
(1, 7, CURRENT_DATE + INTERVAL '1 day', '11:00:00', '12:00:00'),
(1, 7, CURRENT_DATE + INTERVAL '2 days', '16:00:00', '17:00:00'),
(2, 7, CURRENT_DATE + INTERVAL '3 days', '17:00:00', '18:30:00'),
(2, 7, CURRENT_DATE + INTERVAL '4 days', '09:00:00', '10:00:00'),
(2, 7, CURRENT_DATE + INTERVAL '5 days', '15:00:00', '16:00:00'),
-- Horarios para las próximas semanas
(3, 7, CURRENT_DATE + INTERVAL '8 days', '10:00:00', '11:00:00'),
(3, 7, CURRENT_DATE + INTERVAL '8 days', '11:00:00', '12:00:00'),
(3, 7, CURRENT_DATE + INTERVAL '9 days', '16:00:00', '17:00:00'),
(4, 8, CURRENT_DATE + INTERVAL '10 days', '17:00:00', '18:30:00'),
(4, 8, CURRENT_DATE + INTERVAL '11 days', '09:00:00', '10:00:00'),
(4, 8, CURRENT_DATE + INTERVAL '12 days', '15:00:00', '16:00:00'),
-- horarios para las próximas semanas
(5, 9, CURRENT_DATE + INTERVAL '15 days', '10:00:00', '11:00:00'),
(5, 9, CURRENT_DATE + INTERVAL '15 days', '11:00:00', '12:00:00'),
(6, 7, CURRENT_DATE + INTERVAL '16 days', '16:00:00', '17:00:00'),
(6, 7, CURRENT_DATE + INTERVAL '17 days', '17:00:00', '18:30:00'),
(7, 7, CURRENT_DATE + INTERVAL '18 days', '09:00:00', '10:00:00'),
(7, 7, CURRENT_DATE + INTERVAL '19 days', '15:00:00', '16:00:00');

-- ======================== RESERVAS (100 registros) =========================
INSERT INTO Booking (user_id, kid_id, course_id, schedule_id, teacher_id, modality, status, booked_at, note) VALUES
-- Reservas programadas (primeros 30 registros)
(28, 1, 1, 1, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(28, 1, 4, 10, 8, 'academia', 'programada', NOW() - INTERVAL '5 days', NULL),
(28, 2, 1, 2, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(28, 2, 4, 11, 8, 'academia', 'programada', NOW() - INTERVAL '5 days', NULL),
(29, 3, 1, 3, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(29, 3, 4, 12, 8, 'academia', 'programada', NOW() - INTERVAL '5 days', NULL),
(29, 4, 2, 4, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(29, 4, 5, 13, 9, 'academia', 'programada', NOW() - INTERVAL '5 days', NULL),
(30, 5, 2, 5, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(30, 5, 5, 14, 9, 'academia', 'programada', NOW() - INTERVAL '5 days', NULL),
(30, 6, 2, 6, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(30, 6, 6, 15, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', NULL),
(31, 7, 3, 7, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(31, 7, 6, 16, 7, 'academia', 'cancelada', NOW() - INTERVAL '5 days', NULL),
(31, 8, 3, 8, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(31, 8, 7, 17, 7, 'academia', 'cancelada', NOW() - INTERVAL '5 days', NULL),
(31, 9, 3, 9, 7, 'academia', 'programada', NOW() - INTERVAL '5 days', 'Primera clase de prueba'),
(31, 9, 7, 18, 7, 'academia', 'cancelada', NOW() - INTERVAL '5 days', NULL);

-- ======================== FEEDBACK ==========================
INSERT INTO Feedback (booking_id, teacher_id, content, created_at) VALUES
(1, 7, 'Tienes gran interés y aptitud para el piano. Practica las escalas diariamente.', NOW() - INTERVAL '9 days'),
(2, 8, 'Tienes buena voz pero necesitas trabajar en tu respiración.', NOW() - INTERVAL '7 days'),
(3, 7, 'Eres muy aplicada y aprendes rápido :)', NOW() - INTERVAL '5 days'),
(4, 8, 'Tienes buen oído musical. Te sugiero practicar con metrónomo.', NOW() - INTERVAL '3 days'),
(5, 7, 'Eres muy creativa. Te recomiendo empezar a componer pequeñas piezas.', NOW() - INTERVAL '4 days'),
(6, 8, 'Necesitas mejorar coordinación. Ejercicios de ritmo recomendados.', NOW() - INTERVAL '2 days');

-- ======================== PAGOS (100 registros) ============================
INSERT INTO Payment (user_id, payment_method, total, payment_date, state, reference_pic, note) VALUES
(28, 'transferencia', 2000.00, NOW() - INTERVAL '15 days', 'en revision', 'transferencia_001.jpg', 'Pago mensual Diego y Valeria'),
(28, 'efectivo', 450.00, NOW() - INTERVAL '10 days', 'en revision', NULL, 'Clase prueba Santiago'),
(28, 'transferencia', 600.00, NOW() - INTERVAL '5 days', 'en revision', 'transferencia_002.jpg', 'Pago Renata - esperando confirmación'),
(29, 'efectivo', 1200.00, NOW() - INTERVAL '12 days', 'en revision', NULL, 'Pago quincenal Mateo'),
(30, 'transferencia', 850.00, NOW() - INTERVAL '8 days', 'en revision', 'transferencia_003.jpg', 'Pago clases de guitarra'),
(31, 'efectivo', 950.00, NOW() - INTERVAL '20 days', 'en revision', NULL, 'Pago completo mes anterior'),
(32, 'transferencia', 1800.00, NOW() - INTERVAL '3 days', 'en revision', 'transferencia_004.jpg', 'Pago familia Alvarez'),
(33, 'efectivo', 550.00, NOW() - INTERVAL '7 days', 'en revision', NULL, 'Clase individual canto'),
(34, 'transferencia', 2200.00, NOW() - INTERVAL '25 days', 'en revision', 'transferencia_005.jpg', 'Pago trimestral con descuento'),
(35, 'efectivo', 750.00, NOW() - INTERVAL '1 day', 'en revision', NULL, 'Pago última semana'),
(36, 'transferencia', 1300.00, NOW() - INTERVAL '18 days', 'en revision', 'transferencia_006.jpg', 'Pago hermanos Ortiz'),
(37, 'efectivo', 480.00, NOW() - INTERVAL '14 days', 'en revision', NULL, 'Clase muestra batería'),
(38, 'transferencia', 900.00, NOW() - INTERVAL '6 days', 'en revision', 'transferencia_007.jpg', 'Pago clases domicilio'),
(39, 'efectivo', 1600.00, NOW() - INTERVAL '22 days', 'en revision', NULL, 'Pago mensual completo'),
(40, 'transferencia', 680.00, NOW() - INTERVAL '4 days', 'en revision', 'transferencia_008.jpg', 'Pago parcial violín'),
(41, 'efectivo', 1100.00, NOW() - INTERVAL '16 days', 'en revision', NULL, 'Pago dos semanas'),
(42, 'transferencia', 1950.00, NOW() - INTERVAL '30 days', 'en revision', 'transferencia_009.jpg', 'Pago mes completo'),
(43, 'efectivo', 520.00, NOW() - INTERVAL '9 days', 'en revision', NULL, 'Clase piano principiante'),
(44, 'transferencia', 1450.00, NOW() - INTERVAL '11 days', 'en revision', 'transferencia_010.jpg', 'Pago hermanas Herrera'),
(45, 'efectivo', 880.00, NOW() - INTERVAL '13 days', 'en revision', NULL, 'Pago avanzado guitarra'),
(46, 'transferencia', 1250.00, NOW() - INTERVAL '19 days', 'en revision', 'transferencia_011.jpg', 'Pago Flores - 3 clases'),
(47, 'efectivo', 720.00, NOW() - INTERVAL '2 days', 'en revision', NULL, 'Pago Claudia Vargas'),
(48, 'transferencia', 1680.00, NOW() - INTERVAL '24 days', 'en revision', 'transferencia_012.jpg', 'Pago familiar Rojas'),
(49, 'efectivo', 590.00, NOW() - INTERVAL '17 days', 'en revision', NULL, 'Clase vocal individual'),
(50, 'transferencia', 2100.00, NOW() - INTERVAL '28 days', 'en revision', 'transferencia_013.jpg', 'Pago bono trimestre'),
(51, 'efectivo', 820.00, NOW() - INTERVAL '21 days', 'en revision', NULL, 'Pago Medina - 2 clases'),
(52, 'transferencia', 950.00, NOW() - INTERVAL '26 days', 'en revision', 'transferencia_014.jpg', 'Pago Campos niños'),
(53, 'efectivo', 1350.00, NOW() - INTERVAL '23 days', 'en revision', NULL, 'Pago quincenal completo'),
(54, 'transferencia', 770.00, NOW() - INTERVAL '27 days', 'en revision', 'transferencia_015.jpg', 'Pago Soto guitarra'),
(55, 'efectivo', 1550.00, NOW() - INTERVAL '29 days', 'en revision', NULL, 'Pago mes Contreras'),
(56, 'transferencia', 640.00, NOW() - INTERVAL '31 days', 'en revision', 'transferencia_016.jpg', 'Pago Lara percusión'),
(27, 'efectivo', 890.00, NOW() - INTERVAL '32 days', 'en revision', NULL, 'Segundo pago González'),
(28, 'transferencia', 1120.00, NOW() - INTERVAL '33 days', 'en revision', 'transferencia_017.jpg', 'Pago mensual Díaz'),
(29, 'efectivo', 430.00, NOW() - INTERVAL '34 days', 'en revision', NULL, 'Clase prueba Torres'),
(30, 'transferencia', 980.00, NOW() - INTERVAL '35 days', 'en revision', 'transferencia_018.jpg', 'Pago Serrano niños'),
(31, 'efectivo', 1760.00, NOW() - INTERVAL '36 days', 'en revision', NULL, 'Pago Romero completo'),
(32, 'transferencia', 540.00, NOW() - INTERVAL '37 days', 'en revision', 'transferencia_019.jpg', 'Pago Alvarez individual'),
(33, 'efectivo', 1260.00, NOW() - INTERVAL '38 days', 'en revision', NULL, 'Pago Méndez familia'),
(34, 'transferencia', 710.00, NOW() - INTERVAL '39 days', 'en revision', 'transferencia_020.jpg', 'Pago Castro avanzado'),
(35, 'efectivo', 1650.00, NOW() - INTERVAL '40 days', 'en revision', NULL, 'Pago Ortiz mensual'),
(36, 'transferencia', 920.00, NOW() - INTERVAL '41 days', 'en revision', 'transferencia_021.jpg', 'Pago Ruiz hermanos'),
(37, 'efectivo', 580.00, NOW() - INTERVAL '42 days', 'en revision', NULL, 'Clase Herrera prueba'),
(38, 'transferencia', 1340.00, NOW() - INTERVAL '43 days', 'en revision', 'transferencia_022.jpg', 'Pago Flores completo'),
(39, 'efectivo', 790.00, NOW() - INTERVAL '44 days', 'en revision', NULL, 'Pago Vargas parcial'),
(40, 'transferencia', 1480.00, NOW() - INTERVAL '45 days', 'en revision', 'transferencia_023.jpg', 'Pago Rojas trimestral'),
(41, 'efectivo', 670.00, NOW() - INTERVAL '46 days', 'en revision', NULL, 'Pago Medina individual'),
(42, 'transferencia', 1830.00, NOW() - INTERVAL '47 days', 'en revision', 'transferencia_024.jpg', 'Pago Campos familiar'),
(43, 'efectivo', 510.00, NOW() - INTERVAL '48 days', 'en revision', NULL, 'Clase Soto inicio'),
(44, 'transferencia', 1190.00, NOW() - INTERVAL '49 days', 'en revision', 'transferencia_025.jpg', 'Pago Contreras quincena'),
(45, 'efectivo', 840.00, NOW() - INTERVAL '50 days', 'en revision', NULL, 'Pago Lara regular'),
(46, 'transferencia', 1570.00, NOW() - INTERVAL '51 days', 'en revision', 'transferencia_026.jpg', 'Pago Miranda completo'),
(47, 'efectivo', 730.00, NOW() - INTERVAL '52 days', 'en revision', NULL, 'Pago Peña individual'),
(48, 'transferencia', 1020.00, NOW() - INTERVAL '53 days', 'en revision', 'transferencia_027.jpg', 'Pago Cortés niños'),
(49, 'efectivo', 1390.00, NOW() - INTERVAL '54 days', 'en revision', NULL, 'Pago Núñez mensual'),
(50, 'transferencia', 610.00, NOW() - INTERVAL '55 days', 'en revision', 'transferencia_028.jpg', 'Pago Salazar prueba'),
(51, 'efectivo', 1720.00, NOW() - INTERVAL '56 days', 'en revision', NULL, 'Pago Delgado completo'),
(52, 'transferencia', 480.00, NOW() - INTERVAL '57 days', 'en revision', 'transferencia_029.jpg', 'Pago Molina individual'),
(53, 'efectivo', 1280.00, NOW() - INTERVAL '58 days', 'en revision', NULL, 'Pago Carrillo quincena'),
(54, 'transferencia', 910.00, NOW() - INTERVAL '59 days', 'en revision', 'transferencia_030.jpg', 'Pago Rangel avanzado'),
(55, 'efectivo', 1540.00, NOW() - INTERVAL '60 days', 'en revision', NULL, 'Pago Barrera mensual'),
(56, 'transferencia', 690.00, NOW() - INTERVAL '61 days', 'en revision', 'transferencia_031.jpg', 'Pago Gallegos regular'),
(27, 'efectivo', 1420.00, NOW() - INTERVAL '62 days', 'en revision', NULL, 'Pago Velázquez completo'),
(28, 'transferencia', 830.00, NOW() - INTERVAL '63 days', 'en revision', 'transferencia_032.jpg', 'Pago Aguilar en revision'),
(29, 'efectivo', 1050.00, NOW() - INTERVAL '64 days', 'en revision', NULL, 'Pago Mejía quincena'),
(30, 'transferencia', 760.00, NOW() - INTERVAL '65 days', 'en revision', 'transferencia_033.jpg', 'Pago Valdez individual'),
(31, 'efectivo', 1890.00, NOW() - INTERVAL '66 days', 'en revision', NULL, 'Pago Zamora familiar'),
(32, 'transferencia', 570.00, NOW() - INTERVAL '67 days', 'en revision', 'transferencia_034.jpg', 'Pago Rosales prueba'),
(33, 'efectivo', 1210.00, NOW() - INTERVAL '68 days', 'en revision', NULL, 'Pago De la Cruz mensual'),
(34, 'transferencia', 880.00, NOW() - INTERVAL '69 days', 'en revision', 'transferencia_035.jpg', 'Pago Montes regular'),
(35, 'efectivo', 1630.00, NOW() - INTERVAL '70 days', 'en revision', NULL, 'Pago Cervantes completo'),
(36, 'transferencia', 720.00, NOW() - INTERVAL '71 days', 'pendiente', 'transferencia_036.jpg', 'Pago Pacheco pendiente'),
(37, 'efectivo', 990.00, NOW() - INTERVAL '72 days', 'aceptado', NULL, 'Pago Reynoso quincena'),
(38, 'transferencia', 1450.00, NOW() - INTERVAL '73 days', 'aceptado', 'transferencia_037.jpg', 'Pago Quintero mensual'),
(39, 'efectivo', 530.00, NOW() - INTERVAL '74 days', 'aceptado', NULL, 'Clase Téllez individual'),
(40, 'transferencia', 1170.00, NOW() - INTERVAL '75 days', 'aceptado', 'transferencia_038.jpg', 'Pago Castañeda completo'),
(41, 'efectivo', 810.00, NOW() - INTERVAL '76 days', 'aceptado', NULL, 'Pago Galván regular'),
(42, 'transferencia', 1520.00, NOW() - INTERVAL '77 days', 'aceptado', 'transferencia_039.jpg', 'Pago Juárez familiar'),
(43, 'efectivo', 640.00, NOW() - INTERVAL '78 days', 'aceptado', NULL, 'Pago Murillo individual'),
(44, 'transferencia', 1260.00, NOW() - INTERVAL '79 days', 'aceptado', 'transferencia_040.jpg', 'Pago Cárdenas quincena'),
(45, 'efectivo', 940.00, NOW() - INTERVAL '80 days', 'aceptado', NULL, 'Pago Esquivel avanzado'),
(46, 'transferencia', 1780.00, NOW() - INTERVAL '81 days', 'aceptado', 'transferencia_041.jpg', 'Pago Badillo mensual'),
(47, 'efectivo', 590.00, NOW() - INTERVAL '82 days', 'aceptado', NULL, 'Pago Zúñiga prueba'),
(48, 'transferencia', 1320.00, NOW() - INTERVAL '83 days', 'aceptado', 'transferencia_042.jpg', 'Pago Olvera completo'),
(49, 'efectivo', 870.00, NOW() - INTERVAL '84 days', 'aceptado', NULL, 'Pago Ponce regular'),
(50, 'transferencia', 1150.00, NOW() - INTERVAL '85 days', 'pendiente', 'transferencia_043.jpg', 'Pago Cuevas pendiente'),
(51, 'efectivo', 1610.00, NOW() - INTERVAL '86 days', 'aceptado', NULL, 'Pago Zavala mensual'),
(52, 'transferencia', 780.00, NOW() - INTERVAL '87 days', 'pendiente', 'transferencia_044.jpg', 'Pago Lozano individual'),
(53, 'efectivo', 1020.00, NOW() - INTERVAL '88 days', 'aceptado', NULL, 'Pago Valencia quincena'),
(54, 'transferencia', 1390.00, NOW() - INTERVAL '89 days', 'aceptado', 'transferencia_045.jpg', 'Pago Madrigal completo'),
(55, 'efectivo', 680.00, NOW() - INTERVAL '90 days', 'aceptado', NULL, 'Pago Castaño individual'),
(56, 'transferencia', 1240.00, NOW() - INTERVAL '91 days', 'aceptado', 'transferencia_046.jpg', 'Pago Collado mensual'),
(27, 'efectivo', 920.00, NOW() - INTERVAL '92 days', 'cancelado', NULL, 'Pago cancelado - reprogramación'),
(28, 'transferencia', 1560.00, NOW() - INTERVAL '93 days', 'aceptado', 'transferencia_047.jpg', 'Pago Barrios trimestral'),
(29, 'efectivo', 710.00, NOW() - INTERVAL '94 days', 'aceptado', NULL, 'Pago Peralta regular'),
(30, 'transferencia', 1080.00, NOW() - INTERVAL '95 days', 'aceptado', 'transferencia_048.jpg', 'Pago Villa completo'),
(31, 'efectivo', 1490.00, NOW() - INTERVAL '96 days', 'aceptado', NULL, 'Pago Anguiano mensual'),
(32, 'transferencia', 630.00, NOW() - INTERVAL '97 days', 'aceptado', 'transferencia_049.jpg', 'Pago Arredondo individual'),
(33, 'efectivo', 1350.00, NOW() - INTERVAL '98 days', 'aceptado', NULL, 'Pago Briseño quincena'),
(34, 'transferencia', 970.00, NOW() - INTERVAL '99 days', 'aceptado', 'transferencia_050.jpg', 'Pago Cepeda avanzado'),
(35, 'efectivo', 1820.00, NOW() - INTERVAL '100 days', 'aceptado', NULL, 'Pago Fierro familiar');

-- ======================== DETALLES DE PAGO (100 registros) =================
INSERT INTO Payment_item (payment_id, booking_id, book_id, unit_cost, subtotal) VALUES
(1, 1, NULL, 500.00, 500.00),
(1, 2, NULL, 500.00, 500.00),
(1, 4, NULL, 600.00, 600.00),
(1, 5, NULL, 400.00, 400.00),
(2, 3, NULL, 450.00, 450.00),
(3, 6, NULL, 600.00, 600.00),
(4, 7, NULL, 400.00, 400.00),
(4, 8, NULL, 400.00, 400.00),
(4, 9, NULL, 400.00, 400.00),
(5, 10, NULL, 425.00, 425.00),
(5, 11, NULL, 425.00, 425.00),
(6, 12, NULL, 475.00, 475.00),
(6, 13, NULL, 475.00, 475.00),
(7, 14, NULL, 600.00, 600.00),
(7, 15, NULL, 600.00, 600.00),
(7, 16, NULL, 600.00, 600.00),
(8, 17, NULL, 550.00, 550.00),
(9, 18, NULL, 550.00, 550.00);

---------------------------------Notas de estudiantes-------------------
INSERT INTO Notes (kid_id, note) VALUES
(1, 'Repasar escalas antes de la próxima clase'),
(2, 'Practicar respiración diafragmática'),
(3, 'Trabajar en la pieza asignada'),
(4, 'Componer una pequeña melodía'),
(5, 'Ejercicios de coordinación rítmica'),
(6, 'Preparar repertorio para el concierto');


COMMIT;
