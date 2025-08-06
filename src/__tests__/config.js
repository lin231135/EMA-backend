// Configuración para las pruebas del backend EMA
// Este archivo puede ser usado para setup global de pruebas

export const testConfig = {
  // Base URL para pruebas de API
  baseURL: "http://localhost:5000",
  
  // Timeout para requests HTTP
  timeout: 5000,
  
  // Usuarios de prueba
  testUsers: {
    admin: {
      email: "admin@academia.com",
      password: "admin123",
      role: "admin"
    },
    teacher: {
      email: "carlos@academia.com", 
      password: "maestro1",
      role: "maestro"
    },
    parent: {
      email: "roberto@email.com",
      password: "padre1", 
      role: "padre"
    }
  },
  
  // Configuración de base de datos para pruebas
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "elliesdb"
  },
  
  // JWT para pruebas
  jwt: {
    secret: process.env.JWT_SECRET || "jwtsecret",
    expiresIn: "4h"
  },
  
  // Configuración de cursos de prueba
  testCourses: [
    { name: "Canto", capacity: 1, cost: 100 },
    { name: "Piano", capacity: 1, cost: 120 },
    { name: "Estimulación Musical 1-2 años", capacity: 5, cost: 180 }
  ],
  
  // Límites para pruebas de performance
  performance: {
    maxLoginTime: 1000, // 1 segundo
    maxQueryTime: 500,  // 500ms
    maxConcurrentRequests: 20
  }
};

export default testConfig;
