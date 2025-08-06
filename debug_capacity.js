import db from './src/db/connection.js';

const result = await db.query(`
  SELECT 
    c.name, 
    c.capacity, 
    COUNT(sc.student_id) as current_enrollment 
  FROM Course c 
  LEFT JOIN Student_course sc ON c.id = sc.course_id 
  GROUP BY c.id, c.name, c.capacity 
  ORDER BY current_enrollment DESC
`);

console.log('Cursos con más inscripciones:');
result.rows.forEach(row => {
  console.log(`${row.name}: ${row.current_enrollment}/${row.capacity}`);
  if (parseInt(row.current_enrollment) > parseInt(row.capacity)) {
    console.log(`  ⚠️  PROBLEMA: Excede capacidad por ${parseInt(row.current_enrollment) - parseInt(row.capacity)}`);
  }
});

await db.end();
