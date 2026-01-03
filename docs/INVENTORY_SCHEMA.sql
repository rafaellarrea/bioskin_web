-- Schema for Medical Aesthetic Inventory Management - Neon PostgreSQL

-- 1. Categories (Categorías)
-- Groups items like "Injectables", "Consumables", "Retail", "Equipment"
CREATE TABLE IF NOT EXISTS inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Suppliers (Proveedores)
-- Vendors who supply the products
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50), -- RUT/NIT/VAT ID
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Inventory Items (Artículos/Productos)
-- Master data for products. Does NOT hold quantity directly if using batch tracking.
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES inventory_categories(id),
    sku VARCHAR(50) UNIQUE NOT NULL, -- Internal code
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL, -- e.g., 'Vial', 'Box', 'Unit', 'mL'
    min_stock_level INTEGER DEFAULT 5, -- Reorder point
    is_prescription_required BOOLEAN DEFAULT FALSE, -- For controlled substances
    requires_cold_chain BOOLEAN DEFAULT FALSE, -- For items needing refrigeration (Botox)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Batches (Lotes)
-- Critical for medical aesthetics. Tracks specific production runs and expiry.
-- Stock is calculated by summing quantity_current in this table.
CREATE TABLE IF NOT EXISTS inventory_batches (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL, -- Lote provided by manufacturer
    expiration_date DATE NOT NULL,
    quantity_initial INTEGER NOT NULL, -- How many were bought
    quantity_current INTEGER NOT NULL, -- How many remain
    cost_per_unit DECIMAL(10, 2), -- Purchase cost
    supplier_id INTEGER REFERENCES suppliers(id),
    received_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, depleted, expired, quarantined
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(item_id, batch_number) -- Prevent duplicate batches for same item
);

-- 5. Inventory Movements (Movimientos)
-- Audit trail for every change in stock
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES inventory_batches(id),
    movement_type VARCHAR(50) NOT NULL, 
    -- Types: 'PURCHASE', 'CONSUMPTION_TREATMENT', 'SALE_RETAIL', 'ADJUSTMENT_LOSS', 'ADJUSTMENT_GAIN', 'RETURN'
    quantity_change INTEGER NOT NULL, -- Negative for consumption, Positive for purchase
    reference_id VARCHAR(100), -- Link to Treatment ID or Invoice ID
    performed_by VARCHAR(100), -- User who did the action
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Treatment Usage Link (Consumo por Tratamiento)
-- Links specific inventory usage to a patient's clinical record
CREATE TABLE IF NOT EXISTS treatment_inventory_usage (
    id SERIAL PRIMARY KEY,
    treatment_id INTEGER, -- References treatments(id) from CLINICAL_RECORDS_SCHEMA
    batch_id INTEGER REFERENCES inventory_batches(id),
    quantity_used DECIMAL(10, 2) NOT NULL, -- Allows partial usage (e.g., 0.5 mL) if tracking volume
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_batches_expiration ON inventory_batches(expiration_date);
CREATE INDEX idx_batches_item ON inventory_batches(item_id);
CREATE INDEX idx_movements_type ON inventory_movements(movement_type);
