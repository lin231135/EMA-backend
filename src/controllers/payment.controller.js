import db from '../db/connection.js';

// Agregar un nuevo pago (con items)
export const addPayment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { payer_id, payment_method, payment_date, note, items } = req.body;
    
    // Validar datos requeridos
    if (!payer_id || !payment_method || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: payer_id, payment_method, items' 
      });
    }
    
    await client.query('BEGIN');
    
    // Calcular el total
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    
    // Insertar el pago
    const paymentQuery = `
      INSERT INTO Payment (payer_id, payment_method, total, payment_date, state, reference_pic, note)
      VALUES ($1, $2, $3, $4, 'pendiente', $5, $6)
      RETURNING *
    `;
    
    const paymentResult = await client.query(paymentQuery, [
      payer_id,
      payment_method,
      payment_date || new Date(),
      req.body.reference_pic || null,
      note || null
    ]);
    
    const payment = paymentResult.rows[0];
    
    // Insertar los items del pago
    for (const item of items) {
      const itemQuery = `
        INSERT INTO Payment_item (payment_id, booking_id, unit_cost, subtotal)
        VALUES ($1, $2, $3, $4)
      `;
      
      await client.query(itemQuery, [
        payment.id,
        item.booking_id,
        item.unit_cost,
        item.subtotal
      ]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Pago creado exitosamente',
      data: payment
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

// Obtener todos los pagos con filtros opcionales
export const getPayments = async (req, res) => {
  try {
    const { 
      state, 
      payment_method, 
      payer_id, 
      start_date, 
      end_date,
      page = 1,
      limit = 50
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        u.name || ' ' || u.last_name AS payer_name,
        u.email AS payer_email,
        u.phone AS payer_phone,
        COUNT(pi.id) AS items_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', pi.id,
            'booking_id', pi.booking_id,
            'unit_cost', pi.unit_cost,
            'subtotal', pi.subtotal
          )
        ) AS items
      FROM Payment p
      INNER JOIN "User" u ON p.payer_id = u.id
      LEFT JOIN Payment_item pi ON p.id = pi.payment_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (state) {
      query += ` AND p.state = $${paramCount}`;
      params.push(state);
      paramCount++;
    }
    
    if (payment_method) {
      query += ` AND p.payment_method = $${paramCount}`;
      params.push(payment_method);
      paramCount++;
    }
    
    if (payer_id) {
      query += ` AND p.payer_id = $${paramCount}`;
      params.push(payer_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND p.payment_date >= $${paramCount}::date`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND p.payment_date <= $${paramCount}::date`;
      params.push(end_date);
      paramCount++;
    }
    
    query += `
      GROUP BY p.id, u.name, u.last_name, u.email, u.phone
      ORDER BY p.payment_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Contar total de registros
    let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM Payment p WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;
    
    if (state) {
      countQuery += ` AND p.state = $${countParamIndex}`;
      countParams.push(state);
      countParamIndex++;
    }
    
    if (payment_method) {
      countQuery += ` AND p.payment_method = $${countParamIndex}`;
      countParams.push(payment_method);
      countParamIndex++;
    }
    
    if (payer_id) {
      countQuery += ` AND p.payer_id = $${countParamIndex}`;
      countParams.push(payer_id);
      countParamIndex++;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un pago por ID con detalles completos
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        u.name || ' ' || u.last_name AS payer_name,
        u.email AS payer_email,
        u.phone AS payer_phone,
        u.role AS payer_role,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pi.id,
            'booking_id', pi.booking_id,
            'unit_cost', pi.unit_cost,
            'subtotal', pi.subtotal,
            'booking', JSON_BUILD_OBJECT(
              'id', b.id,
              'kid_name', k.name,
              'course_name', c.name,
              'teacher_name', t.name || ' ' || t.last_name,
              'modality', b.modality,
              'status', b.status
            )
          )
        ) AS items
      FROM Payment p
      INNER JOIN "User" u ON p.payer_id = u.id
      LEFT JOIN Payment_item pi ON p.id = pi.payment_id
      LEFT JOIN Booking b ON pi.booking_id = b.id
      LEFT JOIN Kid k ON b.kid_id = k.id
      LEFT JOIN Course c ON b.course_id = c.id
      LEFT JOIN "User" t ON b.teacher_id = t.id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.last_name, u.email, u.phone, u.role
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar estado de un pago (ADMIN - procesar y confirmar pagos)
export const updatePayment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { id } = req.params;
    const { state, note, reference_pic } = req.body;
    
    // Validar que el estado sea válido
    const validStates = ['pendiente', 'solvente', 'cancelado'];
    if (state && !validStates.includes(state)) {
      return res.status(400).json({ 
        error: `Estado inválido. Debe ser: ${validStates.join(', ')}` 
      });
    }
    
    await client.query('BEGIN');
    
    // Actualizar el pago
    const updateQuery = `
      UPDATE Payment
      SET 
        state = COALESCE($2, state),
        note = COALESCE($3, note),
        reference_pic = COALESCE($4, reference_pic)
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      id,
      state,
      note,
      reference_pic
    ]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    const payment = result.rows[0];
    
    // Si el pago se marca como solvente, actualizar is_solvent de los niños
    if (state === 'solvente') {
      const updateKidsQuery = `
        UPDATE Kid
        SET is_solvent = TRUE
        WHERE id IN (
          SELECT DISTINCT b.kid_id
          FROM Payment_item pi
          INNER JOIN Booking b ON pi.booking_id = b.id
          WHERE pi.payment_id = $1
        )
      `;
      
      await client.query(updateKidsQuery, [id]);
    }
    
    // Si el pago se cancela, marcar a los niños como no solventes
    if (state === 'cancelado') {
      const updateKidsQuery = `
        UPDATE Kid
        SET is_solvent = FALSE
        WHERE id IN (
          SELECT DISTINCT b.kid_id
          FROM Payment_item pi
          INNER JOIN Booking b ON pi.booking_id = b.id
          WHERE pi.payment_id = $1
        )
      `;
      
      await client.query(updateKidsQuery, [id]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: payment
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

// Eliminar un pago (soft delete - marcar como cancelado)
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE Payment
      SET state = 'cancelado'
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    res.json({
      success: true,
      message: 'Pago cancelado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};