-- Migration: Add facial_routine column to medical_history table
-- Date: 2025-12-24

ALTER TABLE medical_history 
ADD COLUMN IF NOT EXISTS facial_routine TEXT;

COMMENT ON COLUMN medical_history.facial_routine IS 'Rutina diaria de cuidado facial del paciente';
