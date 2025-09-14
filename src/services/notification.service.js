import db from '../db/connection.js';
import cron from 'node-cron';

/**
 * Servicio central de notificaciones para EMA
 * Maneja la creación, envío y programación de notificaciones
 */
class NotificationService {
  constructor() {
    this.emailProvider = null; // Se puede configurar con SendGrid, Nodemailer, etc.
    this.smsProvider = null;   // Se puede configurar con Twilio, etc.
    this.isRunning = false;
  }

  /**
   * Inicializa el servicio de notificaciones y programa las tareas
   */
  async init() {
    console.log('🔔 Inicializando servicio de notificaciones...');
    
    // Programar recordatorios de clases (cada 10 minutos)
    cron.schedule('*/10 * * * *', () => {
      this.scheduleClassReminders();
    });

    // Procesar notificaciones pendientes (cada 5 minutos)
    cron.schedule('*/5 * * * *', () => {
      this.processPendingNotifications();
    });

    // Limpiar notificaciones antiguas (diariamente a las 2 AM)
    cron.schedule('0 2 * * *', () => {
      this.cleanupOldNotifications();
    });

    this.isRunning = true;
    console.log('✅ Servicio de notificaciones iniciado');
  }

  /**
   * Programa recordatorios para las clases próximas
   */
  async scheduleClassReminders() {
    try {
      console.log('📅 Verificando clases para programar recordatorios...');
      
      const query = `
        SELECT DISTINCT
          b.id as booking_id,
          b.kid_id,
          s.id as schedule_id,
          s.schedule_date,
          s.start_time,
          s.end_time,
          c.name as course_name,
          c.modality,
          k.name as student_name,
          k.parent_id,
          u_parent.name as parent_name,
          u_parent.email as parent_email,
          u_parent.phone as parent_phone,
          u_teacher.name as teacher_name,
          np.reminder_time,
          np.email_enabled,
          np.sms_enabled
        FROM Booking b
        JOIN Schedule s ON b.schedule_id = s.id
        JOIN Course c ON b.course_id = c.id
        JOIN Kid k ON b.kid_id = k.id
        JOIN "User" u_parent ON k.parent_id = u_parent.id
        JOIN "User" u_teacher ON s.teacher_id = u_teacher.id
        LEFT JOIN notification_preferences np ON u_parent.id = np.user_id
        WHERE b.status = 'programada'
          AND s.schedule_date >= CURRENT_DATE
          AND (s.schedule_date + s.start_time) > NOW()
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.booking_id = b.id 
              AND n.type = 'class_reminder' 
              AND n.status IN ('pending', 'sent')
          )
      `;

      const result = await db.query(query);
      
      for (const booking of result.rows) {
        await this.createClassReminder(booking);
      }

      console.log(`✅ Programados ${result.rows.length} recordatorios de clase`);
    } catch (error) {
      console.error('❌ Error al programar recordatorios de clase:', error);
    }
  }

  /**
   * Crea recordatorios para una clase específica
   */
  async createClassReminder(booking) {
    const {
      booking_id,
      schedule_id,
      schedule_date,
      start_time,
      parent_id,
      parent_name,
      parent_email,
      parent_phone,
      student_name,
      course_name,
      teacher_name,
      modality,
      reminder_time = 60,
      email_enabled = true,
      sms_enabled = false
    } = booking;

    // Calcular cuándo enviar el recordatorio
    const classDateTime = new Date(`${schedule_date}T${start_time}`);
    const reminderDateTime = new Date(classDateTime.getTime() - (reminder_time * 60 * 1000));
    
    // Solo programar si el recordatorio es en el futuro
    if (reminderDateTime <= new Date()) {
      return;
    }

    const templateVars = {
      parent_name,
      student_name,
      course_name,
      teacher_name,
      class_date: this.formatDate(schedule_date),
      class_time: this.formatTime(start_time),
      modality: modality === 'academia' ? 'En academia' : 'A domicilio'
    };

    try {
      // Crear notificación por email
      if (email_enabled && parent_email) {
        await this.createNotification({
          user_id: parent_id,
          booking_id,
          schedule_id,
          type: 'class_reminder',
          channel: 'email',
          recipient: parent_email,
          scheduled_for: reminderDateTime,
          template_vars: templateVars
        });
      }

      // Crear notificación por SMS
      if (sms_enabled && parent_phone) {
        await this.createNotification({
          user_id: parent_id,
          booking_id,
          schedule_id,
          type: 'class_reminder',
          channel: 'sms',
          recipient: parent_phone,
          scheduled_for: reminderDateTime,
          template_vars: templateVars
        });
      }

    } catch (error) {
      console.error(`❌ Error al crear recordatorio para booking ${booking_id}:`, error);
    }
  }

  /**
   * Crea una notificación en la base de datos
   */
  async createNotification({
    user_id,
    booking_id = null,
    schedule_id = null,
    type,
    channel,
    recipient,
    scheduled_for,
    template_vars = {},
    custom_title = null,
    custom_message = null
  }) {
    try {
      // Obtener plantilla si no se proporciona mensaje personalizado
      let title, message;
      
      if (custom_title && custom_message) {
        title = custom_title;
        message = custom_message;
      } else {
        const templateResult = await db.query(
          'SELECT title, template FROM notification_templates WHERE type = $1 AND channel = $2 AND is_active = true',
          [type, channel]
        );

        if (templateResult.rows.length === 0) {
          throw new Error(`No se encontró plantilla para ${type} - ${channel}`);
        }

        const template = templateResult.rows[0];
        title = this.replaceTemplateVars(template.title, template_vars);
        message = this.replaceTemplateVars(template.template, template_vars);
      }

      // Insertar notificación
      const result = await db.query(
        `INSERT INTO notifications (
          user_id, booking_id, schedule_id, type, channel, title, message, 
          scheduled_for, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          user_id, booking_id, schedule_id, type, channel, title, message,
          scheduled_for, JSON.stringify({ recipient, template_vars })
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Error al crear notificación:', error);
      throw error;
    }
  }

  /**
   * Procesa notificaciones pendientes que están listas para enviar
   */
  async processPendingNotifications() {
    try {
      const result = await db.query(
        `SELECT * FROM notifications 
         WHERE status = 'pending' AND scheduled_for <= NOW()
         ORDER BY scheduled_for ASC
         LIMIT 50`
      );

      for (const notification of result.rows) {
        await this.sendNotification(notification);
      }

      if (result.rows.length > 0) {
        console.log(`📤 Procesadas ${result.rows.length} notificaciones`);
      }
    } catch (error) {
      console.error('❌ Error al procesar notificaciones pendientes:', error);
    }
  }

  /**
   * Envía una notificación específica
   */
  async sendNotification(notification) {
    const { id, channel, title, message, metadata } = notification;
    
    try {
      const { recipient } = JSON.parse(metadata);
      let success = false;

      switch (channel) {
        case 'email':
          success = await this.sendEmail(recipient, title, message);
          break;
        case 'sms':
          success = await this.sendSMS(recipient, message);
          break;
        case 'push':
          success = await this.sendPushNotification(recipient, title, message);
          break;
        case 'in_app':
          success = true; // Las notificaciones in-app se almacenan en la BD
          break;
        default:
          throw new Error(`Canal de notificación no soportado: ${channel}`);
      }

      // Actualizar estado
      await db.query(
        'UPDATE notifications SET status = $1, sent_at = NOW(), updated_at = NOW() WHERE id = $2',
        [success ? 'sent' : 'failed', id]
      );

    } catch (error) {
      console.error(`❌ Error al enviar notificación ${id}:`, error);
      await db.query(
        'UPDATE notifications SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['failed', error.message, id]
      );
    }
  }

  /**
   * Envía un email (requiere configurar provider)
   */
  async sendEmail(to, subject, body) {
    try {
      if (!this.emailProvider) {
        console.log(`📧 [SIMULADO] Email enviado a ${to}: ${subject}`);
        return true; // Simulado por ahora
      }
      
      // Aquí integrarías con tu proveedor de email (SendGrid, Nodemailer, etc.)
      // await this.emailProvider.send({ to, subject, body });
      return true;
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      return false;
    }
  }

  /**
   * Envía un SMS (requiere configurar provider)
   */
  async sendSMS(to, message) {
    try {
      if (!this.smsProvider) {
        console.log(`📱 [SIMULADO] SMS enviado a ${to}: ${message}`);
        return true; // Simulado por ahora
      }
      
      // Aquí integrarías con tu proveedor de SMS (Twilio, etc.)
      // await this.smsProvider.send({ to, message });
      return true;
    } catch (error) {
      console.error('❌ Error al enviar SMS:', error);
      return false;
    }
  }

  /**
   * Envía notificación push
   */
  async sendPushNotification(to, title, message) {
    try {
      console.log(`🔔 [SIMULADO] Push enviada: ${title} - ${message}`);
      return true; // Simulado por ahora
    } catch (error) {
      console.error('❌ Error al enviar push:', error);
      return false;
    }
  }

  /**
   * Cancela recordatorios de una clase
   */
  async cancelClassReminders(bookingId, reason = 'Clase cancelada') {
    try {
      // Obtener información de la reserva
      const bookingResult = await db.query(
        `SELECT b.*, k.name as student_name, k.parent_id,
                u.name as parent_name, u.email as parent_email,
                c.name as course_name, s.schedule_date, s.start_time
         FROM Booking b
         JOIN Kid k ON b.kid_id = k.id
         JOIN "User" u ON k.parent_id = u.id
         JOIN Course c ON b.course_id = c.id
         JOIN Schedule s ON b.schedule_id = s.id
         WHERE b.id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        throw new Error(`No se encontró la reserva ${bookingId}`);
      }

      const booking = bookingResult.rows[0];

      // Cancelar recordatorios pendientes
      await db.query(
        `UPDATE notifications SET status = 'failed', error_message = $1, updated_at = NOW()
         WHERE booking_id = $2 AND type = 'class_reminder' AND status = 'pending'`,
        ['Clase cancelada', bookingId]
      );

      // Crear notificación de cancelación
      await this.createNotification({
        user_id: booking.parent_id,
        booking_id: bookingId,
        schedule_id: booking.schedule_id,
        type: 'class_cancellation',
        channel: 'email',
        recipient: booking.parent_email,
        scheduled_for: new Date(),
        template_vars: {
          parent_name: booking.parent_name,
          student_name: booking.student_name,
          course_name: booking.course_name,
          class_date: this.formatDate(booking.schedule_date),
          class_time: this.formatTime(booking.start_time),
          cancellation_reason: reason
        }
      });

      console.log(`❌ Cancelados recordatorios para booking ${bookingId}`);
    } catch (error) {
      console.error('❌ Error al cancelar recordatorios:', error);
      throw error;
    }
  }

  /**
   * Limpia notificaciones antiguas (más de 30 días)
   */
  async cleanupOldNotifications() {
    try {
      const result = await db.query(
        `DELETE FROM notifications 
         WHERE created_at < NOW() - INTERVAL '30 days' 
           AND status IN ('sent', 'failed')`
      );

      console.log(`🧹 Limpiadas ${result.rowCount} notificaciones antiguas`);
    } catch (error) {
      console.error('❌ Error al limpiar notificaciones antiguas:', error);
    }
  }

  /**
   * Obtiene las preferencias de notificación de un usuario
   */
  async getUserPreferences(userId) {
    try {
      const result = await db.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Crear preferencias por defecto
        const defaultPrefs = await db.query(
          `INSERT INTO notification_preferences (user_id) 
           VALUES ($1) RETURNING *`,
          [userId]
        );
        return defaultPrefs.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error al obtener preferencias:', error);
      throw error;
    }
  }

  /**
   * Actualiza las preferencias de notificación de un usuario
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const {
        class_reminder = true,
        reminder_time = 60,
        email_enabled = true,
        sms_enabled = false,
        push_enabled = true
      } = preferences;

      const result = await db.query(
        `UPDATE notification_preferences 
         SET class_reminder = $1, reminder_time = $2, email_enabled = $3, 
             sms_enabled = $4, push_enabled = $5, updated_at = NOW()
         WHERE user_id = $6
         RETURNING *`,
        [class_reminder, reminder_time, email_enabled, sms_enabled, push_enabled, userId]
      );

      if (result.rows.length === 0) {
        // Crear si no existe
        return await db.query(
          `INSERT INTO notification_preferences 
           (user_id, class_reminder, reminder_time, email_enabled, sms_enabled, push_enabled)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [userId, class_reminder, reminder_time, email_enabled, sms_enabled, push_enabled]
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error al actualizar preferencias:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de notificaciones de un usuario
   */
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        `SELECT n.*, b.id as booking_id, k.name as student_name, c.name as course_name
         FROM notifications n
         LEFT JOIN Booking b ON n.booking_id = b.id
         LEFT JOIN Kid k ON b.kid_id = k.id
         LEFT JOIN Course c ON b.course_id = c.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Error al obtener notificaciones del usuario:', error);
      throw error;
    }
  }

  // =================== UTILIDADES ===================

  /**
   * Reemplaza variables en plantillas
   */
  replaceTemplateVars(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatea una hora
   */
  formatTime(timeString) {
    return timeString.substring(0, 5); // HH:MM
  }

  /**
   * Detiene el servicio
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Servicio de notificaciones detenido');
  }
}

// Exportar instancia singleton
const notificationService = new NotificationService();
export default notificationService;