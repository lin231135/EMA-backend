-- ============================================================================
-- 03_indexes.sql  |  Índices para consultas comunes
-- ============================================================================
-- Users
CREATE INDEX IF NOT EXISTS ix_user_is_active ON "User" (is_active);

CREATE INDEX IF NOT EXISTS ix_user_created_at ON "User" (created_at);

-- Address / Kid
CREATE INDEX IF NOT EXISTS ix_address_user ON Address (user_id);

CREATE INDEX IF NOT EXISTS ix_kid_parent ON Kid (parent_id);

-- Course / Schedule
CREATE INDEX IF NOT EXISTS ix_course_teacher ON Course (teacher_id);

CREATE INDEX IF NOT EXISTS ix_schedule_course ON Schedule (course_id);

CREATE INDEX IF NOT EXISTS ix_schedule_teacher ON Schedule (teacher_id);

CREATE INDEX IF NOT EXISTS ix_schedule_date_teacher ON Schedule (schedule_date, teacher_id);

-- Booking
CREATE INDEX IF NOT EXISTS ix_booking_kid ON Booking (kid_id);

CREATE INDEX IF NOT EXISTS ix_booking_status ON Booking (status);

CREATE INDEX IF NOT EXISTS ix_booking_kid_status ON Booking (kid_id, status);

CREATE INDEX IF NOT EXISTS ix_booking_course_date ON Booking (course_id, booked_at DESC);

CREATE INDEX IF NOT EXISTS ix_booking_schedule ON Booking (schedule_id);

CREATE INDEX IF NOT EXISTS ix_booking_teacher ON Booking (teacher_id);

-- Feedback
CREATE INDEX IF NOT EXISTS ix_feedback_booking ON Feedback (booking_id);

-- Payment / Payment_item
CREATE INDEX IF NOT EXISTS ix_payment_payer ON Payment (payer_id);

CREATE INDEX IF NOT EXISTS ix_payment_state ON Payment (state);

CREATE INDEX IF NOT EXISTS ix_payment_state_date ON Payment (state, payment_date DESC);

CREATE INDEX IF NOT EXISTS ix_pi_payment ON Payment_item (payment_id);

CREATE INDEX IF NOT EXISTS ix_pi_booking ON Payment_item (booking_id);

CREATE INDEX IF NOT EXISTS ix_pi_payment_booking ON Payment_item (payment_id, booking_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications (status);

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications (scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications (booking_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences (user_id);