CREATE TABLE Role (
  id serial PRIMARY KEY NOT NULL,
  role varchar(20) UNIQUE NOT NULL
);

CREATE TABLE Users (
  id serial PRIMARY KEY NOT NULL,
  name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  phone varchar(14) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  role_id int 
);

CREATE TABLE Child (
  id serial PRIMARY KEY NOT NULL,
  name varchar(255) NOT NULL,
  birth_date date NOT NULL
);

CREATE TABLE Address (
  id serial PRIMARY KEY NOT NULL,
  name varchar(255) NOT NULL,
  unit_number varchar(10) NOT NULL,
  street_number varchar(10) NOT NULL,
  address varchar(255) NOT NULL,
  city varchar(10) NOT NULL,
  region varchar(10) NOT NULL,
  zone varchar(10) NOT NULL,
  aditional_info varchar(255) NOT NULL
);

CREATE TABLE Child_address (
  address_id int,
  child_id int
);

CREATE TABLE Student (
  id serial PRIMARY KEY NOT NULL,
  child_id int,
  parent_id int,
  register_date date NOT NULL,
  state boolean
);

CREATE TABLE Course (
  id serial PRIMARY KEY NOT NULL,
  name varchar(255) UNIQUE NOT NULL,
  capacity int NOT NULL,
  cost float NOT NULL
);

CREATE TABLE Teacher_course (
  id serial PRIMARY KEY NOT NULL,
  teacher_id int,
  course_id int
);

CREATE TABLE Student_course (
  id serial PRIMARY KEY NOT NULL,
  student_id int,
  course_id int,
  modality varchar(20) NOT NULL,
  language varchar(20) NOT NULL,
  registered_at date DEFAULT (now())
);

ALTER TABLE Users ADD FOREIGN KEY (role_id) REFERENCES Role (id);

ALTER TABLE Users ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE;


ALTER TABLE Child_address ADD FOREIGN KEY (address_id) REFERENCES Address (id);

ALTER TABLE Child_address ADD FOREIGN KEY (child_id) REFERENCES Child (id);

ALTER TABLE Student ADD FOREIGN KEY (child_id) REFERENCES Child (id);

ALTER TABLE Student ADD FOREIGN KEY (parent_id) REFERENCES Users (id);

ALTER TABLE Teacher_course ADD FOREIGN KEY (teacher_id) REFERENCES Users (id);

ALTER TABLE Teacher_course ADD FOREIGN KEY (course_id) REFERENCES Course (id);

ALTER TABLE Student_course ADD FOREIGN KEY (student_id) REFERENCES Student (id);

ALTER TABLE Student_course ADD FOREIGN KEY (course_id) REFERENCES Course (id);
